import { randomUUID } from "node:crypto";
import { Router, type NextFunction, type Request, type Response } from "express";
import type { ZodType } from "zod";
import { pool } from "@workspace/db";
import {
  AddPubReportAttachmentBody, AddPubReportAttachmentParams, AddPubReportAttachmentResponse, AddPubReportParticipantBody,
  AddPubReportParticipantParams,
  AddPubReportParticipantResponse, AssignPubReportMembershipBody, AssignPubReportMembershipResponse,
  CreatePubReportBody, CreatePubReportResponse, CreatePubReportUnitBody, CreatePubReportUnitResponse,
  DeactivatePubReportMembershipParams, DownloadPubReportAttachmentParams, GetPubReportAccessResponse,
  GetPubReportParams, GetPubReportResponse, ListPubReportMembershipsQueryParams,
  ListPubReportMembershipsResponse, ListPubReportUnitsResponse, ListPubReportsResponse,
  MarkPubReportUploadedBody, MarkPubReportUploadedParams, MarkPubReportUploadedResponse, RemovePubReportAttachmentParams,
  RemovePubReportAttachmentResponse, RemovePubReportParticipantParams, RemovePubReportParticipantResponse,
  ReviewPubReportBody, ReviewPubReportParams, ReviewPubReportResponse, SubmitPubReportBody,
  SubmitPubReportParams, SubmitPubReportResponse, UpdatePubReportBody, UpdatePubReportParams,
  UpdatePubReportParticipantBody, UpdatePubReportParticipantParams, UpdatePubReportParticipantResponse,
  UpdatePubReportResponse,
} from "@workspace/api-zod";
import { clinicAdmin } from "../lib/clinic-admin";
import { verifyPub } from "../lib/vault-pub-auth";
import { fail, ownDocument, workspace, type StoredDocument, type VaultState } from "../lib/vault-store";
import { streamDocument } from "./vault-external";

type PoolClient = {
  query: (text: string, values?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }>;
  release: () => void;
};
type UnitRole = "branch_operator" | "central_reviewer";
type Access = {
  userId: string;
  authorization: string;
  isAdmin: boolean;
  canReviewAll: boolean;
  branchUnitIds: string[];
  units: Array<{ unitId: string; unitName: string; unitType: "central" | "branch"; role: UnitRole }>;
};

const router = Router();
const ACCESS_SELECT = `
  SELECT m.unit_id, u.name AS unit_name, u.unit_type, m.role
  FROM pub_report_memberships m
  JOIN pub_report_units u ON u.id=m.unit_id
  WHERE m.user_id=$1 AND m.active=true AND u.active=true
  ORDER BY u.unit_type, u.name`;

function parseBody<T>(schema: ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) fail(400, "Isian laporan tidak valid. Periksa kembali kolom yang wajib diisi.");
  return parsed.data;
}

function iso(value: Date | string | null | undefined) {
  if (value == null) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function reportRecord(row: any) {
  return {
    id: row.id,
    unitId: row.unit_id,
    unitName: row.unit_name ?? "",
    sourceActivityId: row.source_activity_id,
    title: row.title,
    activityType: row.activity_type,
    classification: row.classification,
    eventForm: row.event_form,
    deliveryMode: row.delivery_mode,
    level: row.level,
    background: row.background,
    legalBasis: row.legal_basis,
    purpose: row.purpose,
    startsAt: iso(row.starts_at),
    endsAt: iso(row.ends_at),
    location: row.location,
    targetAudience: row.target_audience,
    targetQualification: row.target_qualification,
    targetPerformanceGrade: row.target_performance_grade,
    responsibleName: row.responsible_name,
    recommendations: row.recommendations,
    followUp: row.follow_up,
    closing: row.closing,
    committee: row.committee ?? [],
    rundown: row.rundown ?? [],
    status: row.status,
    revision: row.revision,
    creatorId: row.creator_id,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    submittedAt: iso(row.submitted_at),
    reviewedAt: iso(row.reviewed_at),
    reviewedBy: row.reviewed_by,
    reviewNote: row.review_note,
    uploadedAt: iso(row.uploaded_at),
    uploadReference: row.upload_reference,
  };
}

function participantRecord(row: any) {
  return {
    id: row.id,
    reportId: row.report_id,
    fullName: row.full_name,
    companyName: row.company_name,
    qualification: row.qualification,
    performanceGrade: row.performance_grade,
    participantRole: row.participant_role,
    attendanceStatus: row.attendance_status,
    attendanceNote: row.attendance_note,
    verifiedBy: row.verified_by,
    verifiedAt: iso(row.verified_at),
    revision: row.revision,
    createdAt: iso(row.created_at),
  };
}

function attachmentRecord(row: any) {
  return {
    id: row.id,
    reportId: row.report_id,
    category: row.category,
    documentId: row.vault_document_id,
    fileName: row.file_name,
    createdBy: row.created_by,
    createdAt: iso(row.created_at),
  };
}

function eventRecord(row: any) {
  return {
    id: row.id,
    reportId: row.report_id,
    actorId: row.actor_id,
    action: row.action,
    detail: row.detail ?? {},
    createdAt: iso(row.created_at),
  };
}

function userAccess(req: Request): Access {
  return req.res!.locals.pubReportAccess as Access;
}

async function loadReport(id: string) {
  const { rows } = await pool.query(
    `SELECT r.*, u.name AS unit_name FROM pub_activity_reports r
     JOIN pub_report_units u ON u.id=r.unit_id WHERE r.id=$1`,
    [id],
  );
  return rows[0] as Record<string, any> | undefined;
}

async function authorizedReport(id: string, access: Access) {
  const row = await loadReport(id);
  if (!row) fail(404, "Laporan tidak ditemukan.");
  if (!access.isAdmin && !access.canReviewAll && !access.branchUnitIds.includes(row.unit_id)) {
    fail(404, "Laporan tidak ditemukan.");
  }
  return row;
}

function canEditReport(report: Record<string, any>, access: Access) {
  return access.isAdmin || access.branchUnitIds.includes(report.unit_id);
}

function assertEditable(report: Record<string, any>) {
  if (!["draft", "needs_revision"].includes(report.status)) {
    fail(409, "Laporan sudah dikirim untuk ditinjau dan tidak dapat diubah.");
  }
}

async function addEvent(client: PoolClient, reportId: string, actorId: string, action: string, detail: Record<string, unknown> = {}) {
  await client.query(
    "INSERT INTO pub_report_events (id,report_id,actor_id,action,detail) VALUES ($1,$2,$3,$4,$5::jsonb)",
    [randomUUID(), reportId, actorId, action, JSON.stringify(detail)],
  );
}

async function withTransaction<T>(run: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await (pool.connect() as unknown as Promise<PoolClient>);
  try {
    await client.query("BEGIN");
    const result = await run(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function lockedReport(client: PoolClient, id: string, access: Access) {
  const { rows } = await client.query(
    `SELECT r.*,u.name AS unit_name FROM pub_activity_reports r
     JOIN pub_report_units u ON u.id=r.unit_id WHERE r.id=$1 FOR UPDATE OF r`,
    [id],
  );
  const report = rows[0] as Record<string, any> | undefined;
  if (!report || (!access.isAdmin && !access.canReviewAll && !access.branchUnitIds.includes(report.unit_id))) {
    fail(404, "Laporan tidak ditemukan.");
  }
  return report;
}

function assertRevision(actual: number, expected: number) {
  if (actual !== expected) fail(409, "Laporan berubah sejak terakhir dibuka. Muat ulang sebelum menyimpan.");
}

async function assertSourceActivityVisible(activityId: string, access: Access) {
  let url: URL;
  try {
    url = new URL(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "");
  } catch {
    fail(503, "Sumber kegiatan LMS belum dapat diverifikasi.");
  }
  url.pathname = "/rest/v1/aspekindo_pub_activities";
  url.search = new URLSearchParams({ select: "id", id: `eq.${activityId}`, limit: "1" }).toString();
  let response: globalThis.Response;
  try {
    response = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        Authorization: access.authorization,
      },
      redirect: "error",
      signal: AbortSignal.timeout(7000),
    });
  } catch {
    fail(503, "Sumber kegiatan LMS belum dapat dihubungi.");
  }
  if (response.status === 401 || response.status === 403) fail(403, "Akun tidak memiliki akses ke kegiatan LMS yang dipilih.");
  if (!response.ok) fail(503, "Sumber kegiatan LMS belum dapat diverifikasi.");
  let rows: unknown;
  try { rows = await response.json(); }
  catch { fail(503, "Sumber kegiatan LMS mengembalikan respons yang tidak dapat dibaca."); }
  if (!Array.isArray(rows) || !rows.some(row => row && typeof row === "object" && row.id === activityId)) {
    fail(400, "Pilih kegiatan LMS yang masih tersedia untuk akun ini.");
  }
}

function validForSubmission(report: Record<string, any>) {
  const requiredText = [
    "title", "activity_type", "event_form", "background", "legal_basis", "purpose",
    "location", "target_audience", "target_qualification", "responsible_name",
    "recommendations", "follow_up", "closing",
  ];
  return requiredText.every(key => typeof report[key] === "string" && report[key].trim().length > 0)
    && Array.isArray(report.rundown) && report.rundown.length > 0;
}

router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "private, no-store");
  next();
});

router.use(async (req, res, next) => {
  try {
    const authorization = req.get("authorization") || "";
    let userId: string;
    try { userId = await verifyPub(authorization); }
    catch (error) {
      if (error && typeof error === "object" && "status" in error && error.status === 401) {
        fail(401, "Silakan login untuk mengakses pelaporan kegiatan PUB.");
      }
      throw error;
    }
    let isAdmin = false;
    try { isAdmin = await clinicAdmin(userId, authorization); }
    catch { fail(503, "Peran akun belum dapat diverifikasi. Coba lagi nanti."); }

    const membershipRows = (await pool.query(ACCESS_SELECT, [userId])).rows;
    const activeRows = membershipRows as Array<{ unit_id: string; unit_name: string; unit_type: "central" | "branch"; role: UnitRole }>;
    const canReviewAll = isAdmin || activeRows.some(row => row.role === "central_reviewer");
    const branchUnitIds = activeRows.filter(row => row.role === "branch_operator").map(row => row.unit_id);
    const unitRows = isAdmin
      ? (await pool.query("SELECT id AS unit_id,name AS unit_name,unit_type,CASE WHEN unit_type='central' THEN 'central_reviewer' ELSE 'branch_operator' END AS role FROM pub_report_units WHERE active=true ORDER BY unit_type,name")).rows
      : activeRows;
    const access = {
      userId,
      authorization,
      isAdmin,
      canReviewAll,
      branchUnitIds,
      units: unitRows.map(row => ({
        unitId: row.unit_id,
        unitName: row.unit_name,
        unitType: row.unit_type,
        role: row.role,
      })),
    } as Access;
    res.locals.pubReportUser = userId;
    res.locals.pubReportAccess = access;
    next();
  } catch (error) {
    next(error);
  }
});

router.get("/access", (req, res) => {
  const access = userAccess(req);
  const role = access.isAdmin ? "platform_admin" : access.canReviewAll ? "central_reviewer"
    : access.branchUnitIds.length ? "branch_operator" : "no_access";
  res.json(GetPubReportAccessResponse.parse({
    userId: access.userId,
    role,
    canManageUnits: access.isAdmin,
    canReviewAll: access.canReviewAll,
    units: access.units,
  }));
});

router.get("/units", async (req, res) => {
  const access = userAccess(req);
  let rows;
  if (access.isAdmin || access.canReviewAll) {
    rows = (await pool.query(
      `SELECT id,name,unit_type,parent_unit_id,active,created_at
       FROM pub_report_units WHERE active=true ORDER BY unit_type,name`,
    )).rows;
  } else if (access.branchUnitIds.length) {
    rows = (await pool.query(
      `SELECT id,name,unit_type,parent_unit_id,active,created_at
       FROM pub_report_units WHERE active=true AND id=ANY($1::uuid[]) ORDER BY name`,
      [access.branchUnitIds],
    )).rows;
  } else rows = [];
  res.json(ListPubReportUnitsResponse.parse(rows.map(row => ({
    id: row.id, name: row.name, unitType: row.unit_type, parentUnitId: row.parent_unit_id,
    active: row.active, createdAt: row.created_at,
  }))));
});

router.post("/units", async (req, res) => {
  const access = userAccess(req);
  if (!access.isAdmin) fail(403, "Hanya admin PUB yang dapat mengelola unit.");
  const input = parseBody(CreatePubReportUnitBody, req.body);
  if (input.unitType === "branch") {
    if (!input.parentUnitId) fail(400, "Unit cabang harus berada di bawah unit pusat.");
    const parent = await pool.query("SELECT id FROM pub_report_units WHERE id=$1 AND unit_type='central' AND active=true", [input.parentUnitId]);
    if (!parent.rowCount) fail(400, "Pilih unit pusat yang aktif.");
  } else if (input.parentUnitId) fail(400, "Unit pusat tidak boleh memiliki induk.");
  try {
    const { rows } = await pool.query(
      `INSERT INTO pub_report_units (name,unit_type,parent_unit_id,created_by)
       VALUES ($1,$2,$3,$4) RETURNING id,name,unit_type,parent_unit_id,active,created_at`,
      [input.name.trim(), input.unitType, input.unitType === "branch" ? input.parentUnitId : null, access.userId],
    );
    const row = rows[0];
    res.status(201).json(CreatePubReportUnitResponse.parse({
      id: row.id, name: row.name, unitType: row.unit_type, parentUnitId: row.parent_unit_id,
      active: row.active, createdAt: row.created_at,
    }));
  } catch (error) {
    if ((error as { code?: string }).code === "23505") fail(409, "Unit pusat sudah ada atau nama unit tidak dapat digunakan.");
    throw error;
  }
});

router.get("/memberships", async (req, res) => {
  const access = userAccess(req);
  const { unitId } = parseBody(ListPubReportMembershipsQueryParams, req.query);
  const unit = await pool.query("SELECT id,parent_unit_id,unit_type FROM pub_report_units WHERE id=$1 AND active=true", [unitId]);
  if (!unit.rowCount) fail(404, "Unit tidak ditemukan.");
  const row = unit.rows[0];
  const canSeeUnit = access.isAdmin || (access.canReviewAll && access.units.some(m =>
    m.unitType === "central" && (m.unitId === unitId || row.parent_unit_id === m.unitId)));
  if (!canSeeUnit) fail(403, "Anda tidak berwenang melihat anggota unit ini.");
  const { rows } = await pool.query(
    `SELECT id,unit_id,user_id,role,active,created_at FROM pub_report_memberships
     WHERE unit_id=$1 ORDER BY created_at DESC`,
    [unitId],
  );
  res.json(ListPubReportMembershipsResponse.parse(rows.map(m => ({
    id: m.id, unitId: m.unit_id, userId: m.user_id, role: m.role, active: m.active, createdAt: m.created_at,
  }))));
});

router.put("/memberships", async (req, res) => {
  const access = userAccess(req);
  if (!access.isAdmin) fail(403, "Hanya admin PUB yang dapat menetapkan anggota.");
  const input = parseBody(AssignPubReportMembershipBody, req.body);
  const { rows: units } = await pool.query("SELECT id,unit_type FROM pub_report_units WHERE id=$1 AND active=true", [input.unitId]);
  if (!units.length) fail(404, "Unit tidak ditemukan.");
  const expectedUnitType = input.role === "central_reviewer" ? "central" : "branch";
  if (units[0].unit_type !== expectedUnitType) fail(400, "Peran anggota tidak sesuai dengan jenis unit.");
  const { rows } = await pool.query(
    `INSERT INTO pub_report_memberships (unit_id,user_id,role,active,created_by)
     VALUES ($1,$2,$3,true,$4)
     ON CONFLICT (unit_id,user_id,role) DO UPDATE SET active=true,updated_at=now()
     RETURNING id,unit_id,user_id,role,active,created_at`,
    [input.unitId, input.userId, input.role, access.userId],
  );
  const row = rows[0];
  res.json(AssignPubReportMembershipResponse.parse({
    id: row.id, unitId: row.unit_id, userId: row.user_id, role: row.role, active: row.active, createdAt: row.created_at,
  }));
});

router.delete("/memberships/:id", async (req, res) => {
  const access = userAccess(req);
  if (!access.isAdmin) fail(403, "Hanya admin PUB yang dapat mengubah penugasan anggota.");
  const { id } = parseBody(DeactivatePubReportMembershipParams, req.params);
  const result = await pool.query(
    "UPDATE pub_report_memberships SET active=false,updated_at=now() WHERE id=$1 AND active=true",
    [id],
  );
  if (!result.rowCount) fail(404, "Penugasan aktif tidak ditemukan.");
  res.sendStatus(204);
});

router.get("/", async (req, res) => {
  const access = userAccess(req);
  let rows;
  if (access.isAdmin || access.canReviewAll) {
    rows = (await pool.query(
      `SELECT r.*,u.name AS unit_name FROM pub_activity_reports r
       JOIN pub_report_units u ON u.id=r.unit_id ORDER BY r.updated_at DESC`,
    )).rows;
  } else if (access.branchUnitIds.length) {
    rows = (await pool.query(
      `SELECT r.*,u.name AS unit_name FROM pub_activity_reports r
       JOIN pub_report_units u ON u.id=r.unit_id
       WHERE r.unit_id=ANY($1::uuid[]) ORDER BY r.updated_at DESC`,
      [access.branchUnitIds],
    )).rows;
  } else rows = [];
  res.json(ListPubReportsResponse.parse(rows.map(reportRecord)));
});

router.post("/", async (req, res) => {
  const access = userAccess(req);
  const input = parseBody(CreatePubReportBody, req.body);
  if (input.sourceActivityId) await assertSourceActivityVisible(input.sourceActivityId, access);
  if (!access.isAdmin && !access.branchUnitIds.includes(input.unitId)) {
    fail(403, "Anda hanya dapat membuat laporan untuk unit cabang yang ditugaskan kepada Anda.");
  }
  const { rows: units } = await pool.query("SELECT id FROM pub_report_units WHERE id=$1 AND unit_type='branch' AND active=true", [input.unitId]);
  if (!units.length) fail(400, "Pilih unit cabang yang aktif.");
  try {
    const row = await withTransaction(async client => {
      const { rows } = await client.query(
        `INSERT INTO pub_activity_reports
         (unit_id,source_activity_id,title,activity_type,classification,event_form,delivery_mode,level,
          background,legal_basis,purpose,starts_at,ends_at,location,target_audience,target_qualification,
          target_performance_grade,responsible_name,recommendations,follow_up,closing,committee,rundown,creator_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22::jsonb,$23::jsonb,$24)
         RETURNING id`,
        [input.unitId, input.sourceActivityId ?? null, input.title.trim(), input.activityType, input.classification,
          input.eventForm, input.deliveryMode, input.level, input.background, input.legalBasis, input.purpose,
          input.startsAt, input.endsAt ?? null, input.location, input.targetAudience, input.targetQualification,
          input.targetPerformanceGrade ?? null, input.responsibleName, input.recommendations, input.followUp,
          input.closing, JSON.stringify(input.committee), JSON.stringify(input.rundown), access.userId],
      );
      await addEvent(client, rows[0].id, access.userId, "created");
      return (await client.query(
        `SELECT r.*,u.name AS unit_name FROM pub_activity_reports r
         JOIN pub_report_units u ON u.id=r.unit_id WHERE r.id=$1`,
        [rows[0].id],
      )).rows[0];
    });
    res.status(201).json(CreatePubReportResponse.parse(reportRecord(row)));
  } catch (error) {
    if ((error as { code?: string }).code === "23505") fail(409, "Kegiatan ini sudah memiliki laporan.");
    throw error;
  }
});

router.get("/:id", async (req, res) => {
  const { id } = parseBody(GetPubReportParams, req.params);
  const access = userAccess(req);
  const report = await authorizedReport(id, access);
  const [participants, attachments, history] = await Promise.all([
    pool.query("SELECT * FROM pub_report_participants WHERE report_id=$1 ORDER BY created_at,full_name", [id]),
    pool.query("SELECT * FROM pub_report_attachments WHERE report_id=$1 ORDER BY created_at", [id]),
    pool.query("SELECT * FROM pub_report_events WHERE report_id=$1 ORDER BY created_at DESC LIMIT 100", [id]),
  ]);
  res.json(GetPubReportResponse.parse({
    report: reportRecord(report),
    participants: participants.rows.map(participantRecord),
    attachments: attachments.rows.map(attachmentRecord),
    history: history.rows.map(eventRecord),
  }));
});

router.patch("/:id", async (req, res) => {
  const { id } = parseBody(UpdatePubReportParams, req.params);
  const input = parseBody(UpdatePubReportBody, req.body);
  const access = userAccess(req);
  if (input.sourceActivityId) await assertSourceActivityVisible(input.sourceActivityId, access);
  try {
    const updated = await withTransaction(async client => {
      const current = await lockedReport(client, id, access);
      if (!canEditReport(current, access)) fail(403, "Hanya operator unit yang dapat mengubah laporan.");
      assertEditable(current);
      if (input.unitId !== current.unit_id) fail(400, "Unit pemilik laporan tidak dapat diubah.");
      assertRevision(current.revision, input.expectedRevision);
      const { rows } = await client.query(
        `UPDATE pub_activity_reports SET
         title=$3,activity_type=$4,classification=$5,event_form=$6,delivery_mode=$7,level=$8,
         background=$9,legal_basis=$10,purpose=$11,starts_at=$12,ends_at=$13,location=$14,
         target_audience=$15,target_qualification=$16,target_performance_grade=$17,responsible_name=$18,
         recommendations=$19,follow_up=$20,closing=$21,committee=$22::jsonb,rundown=$23::jsonb,
         source_activity_id=$24,revision=revision+1,updated_at=now()
         WHERE id=$1 AND unit_id=$2 AND revision=$25 RETURNING id`,
        [id, current.unit_id, input.title.trim(), input.activityType, input.classification, input.eventForm,
          input.deliveryMode, input.level, input.background, input.legalBasis, input.purpose, input.startsAt,
          input.endsAt ?? null, input.location, input.targetAudience, input.targetQualification,
          input.targetPerformanceGrade ?? null, input.responsibleName, input.recommendations, input.followUp,
          input.closing, JSON.stringify(input.committee), JSON.stringify(input.rundown),
          input.sourceActivityId ?? null, input.expectedRevision],
      );
      if (!rows.length) fail(409, "Laporan berubah sejak terakhir dibuka. Muat ulang sebelum menyimpan.");
      await addEvent(client, id, access.userId, "updated", { revision: input.expectedRevision + 1 });
      return (await client.query(
        `SELECT r.*,u.name AS unit_name FROM pub_activity_reports r
         JOIN pub_report_units u ON u.id=r.unit_id WHERE r.id=$1`,
        [id],
      )).rows[0];
    });
    res.json(UpdatePubReportResponse.parse(reportRecord(updated)));
  } catch (error) {
    if ((error as { code?: string }).code === "23505") fail(409, "ID aktivitas ini sudah digunakan oleh laporan lain.");
    throw error;
  }
});

router.post("/:id/submit", async (req, res) => {
  const { id } = parseBody(SubmitPubReportParams, req.params);
  const input = parseBody(SubmitPubReportBody, req.body);
  const access = userAccess(req);
  const updated = await withTransaction(async client => {
    const report = await lockedReport(client, id, access);
    if (!canEditReport(report, access)) fail(403, "Hanya operator unit yang dapat mengirim laporan.");
    if (!["draft", "needs_revision"].includes(report.status)) fail(409, "Status laporan belum dapat dikirim.");
    assertRevision(report.revision, input.expectedRevision);
    if (!validForSubmission(report)) fail(422, "Lengkapi bagian laporan dan agenda kegiatan sebelum mengirim.");
    const attendance = await client.query(
      `SELECT count(*)::int AS total,
       count(*) FILTER (WHERE attendance_status <> 'verified')::int AS unverified
       FROM pub_report_participants WHERE report_id=$1`,
      [id],
    );
    if (attendance.rows[0].total < 1 || attendance.rows[0].unverified > 0) {
      fail(422, "Tambahkan peserta dan verifikasi daftar hadir secara manual sebelum mengirim.");
    }
    const { rows } = await client.query(
      `UPDATE pub_activity_reports SET status='submitted',submitted_at=now(),review_note='',
       revision=revision+1,updated_at=now() WHERE id=$1 AND revision=$2 RETURNING id`,
      [id, input.expectedRevision],
    );
    if (!rows.length) fail(409, "Laporan berubah sejak terakhir dibuka. Muat ulang sebelum mengirim.");
    await addEvent(client, id, access.userId, "submitted");
    return (await client.query(
      `SELECT r.*,u.name AS unit_name FROM pub_activity_reports r
       JOIN pub_report_units u ON u.id=r.unit_id WHERE r.id=$1`,
      [id],
    )).rows[0];
  });
  res.json(SubmitPubReportResponse.parse(reportRecord(updated)));
});

router.post("/:id/review", async (req, res) => {
  const { id } = parseBody(ReviewPubReportParams, req.params);
  const input = parseBody(ReviewPubReportBody, req.body);
  const access = userAccess(req);
  if (!access.canReviewAll) fail(403, "Hanya peninjau pusat yang dapat memeriksa laporan.");
  if (input.action === "return" && !input.note.trim()) fail(400, "Tuliskan alasan pengembalian untuk operator cabang.");
  const updated = await withTransaction(async client => {
    const report = await lockedReport(client, id, access);
    if (report.status !== "submitted") fail(409, "Laporan tidak sedang menunggu pemeriksaan pusat.");
    assertRevision(report.revision, input.expectedRevision);
    const status = input.action === "approve" ? "ready_to_upload" : "needs_revision";
    const { rows } = await client.query(
      `UPDATE pub_activity_reports SET status=$2,review_note=$3,reviewed_at=now(),reviewed_by=$4,
       revision=revision+1,updated_at=now() WHERE id=$1 AND revision=$5 RETURNING id`,
      [id, status, input.note.trim(), access.userId, input.expectedRevision],
    );
    if (!rows.length) fail(409, "Laporan berubah sejak terakhir dibuka. Muat ulang sebelum meninjau.");
    await addEvent(client, id, access.userId, input.action === "approve" ? "marked_ready_to_upload" : "returned", {
      note: input.note.trim(),
    });
    return (await client.query(
      `SELECT r.*,u.name AS unit_name FROM pub_activity_reports r
       JOIN pub_report_units u ON u.id=r.unit_id WHERE r.id=$1`,
      [id],
    )).rows[0];
  });
  res.json(ReviewPubReportResponse.parse(reportRecord(updated)));
});

router.post("/:id/mark-uploaded", async (req, res) => {
  const { id } = parseBody(MarkPubReportUploadedParams, req.params);
  const input = parseBody(MarkPubReportUploadedBody, req.body);
  const access = userAccess(req);
  if (!access.canReviewAll) fail(403, "Hanya peninjau pusat yang dapat mencatat unggah manual.");
  const updated = await withTransaction(async client => {
    const report = await lockedReport(client, id, access);
    if (report.status !== "ready_to_upload") fail(409, "Laporan harus dinyatakan siap unggah secara internal terlebih dahulu.");
    assertRevision(report.revision, input.expectedRevision);
    const { rows } = await client.query(
      `UPDATE pub_activity_reports SET status='uploaded',uploaded_at=now(),upload_reference=$2,
       revision=revision+1,updated_at=now() WHERE id=$1 AND revision=$3 RETURNING id`,
      [id, input.reference.trim(), input.expectedRevision],
    );
    if (!rows.length) fail(409, "Laporan berubah sejak terakhir dibuka. Muat ulang sebelum mencatat.");
    await addEvent(client, id, access.userId, "manual_upload_recorded", { reference: input.reference.trim() });
    return (await client.query(
      `SELECT r.*,u.name AS unit_name FROM pub_activity_reports r
       JOIN pub_report_units u ON u.id=r.unit_id WHERE r.id=$1`,
      [id],
    )).rows[0];
  });
  res.json(MarkPubReportUploadedResponse.parse(reportRecord(updated)));
});

router.post("/:id/participants", async (req, res) => {
  const { id } = parseBody(AddPubReportParticipantParams, req.params);
  const input = parseBody(AddPubReportParticipantBody, req.body);
  const access = userAccess(req);
  const participant = await withTransaction(async client => {
    const report = await lockedReport(client, id, access);
    if (!canEditReport(report, access)) fail(403, "Hanya operator unit yang dapat mengelola peserta.");
    assertEditable(report);
    const { rows } = await client.query(
      `INSERT INTO pub_report_participants
       (report_id,full_name,company_name,qualification,performance_grade,participant_role)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [id, input.fullName.trim(), input.companyName.trim(), input.qualification.trim(),
        input.performanceGrade ?? null, input.participantRole],
    );
    await client.query("UPDATE pub_activity_reports SET revision=revision+1,updated_at=now() WHERE id=$1", [id]);
    await addEvent(client, id, access.userId, "participant_added", { participantId: rows[0].id });
    return rows[0];
  });
  res.status(201).json(AddPubReportParticipantResponse.parse(participantRecord(participant)));
});

router.patch("/:id/participants/:participantId", async (req, res) => {
  const { id, participantId } = parseBody(UpdatePubReportParticipantParams, req.params);
  const input = parseBody(UpdatePubReportParticipantBody, req.body);
  const access = userAccess(req);
  const participant = await withTransaction(async client => {
    const report = await lockedReport(client, id, access);
    if (!canEditReport(report, access)) fail(403, "Hanya operator unit yang dapat memverifikasi daftar hadir.");
    assertEditable(report);
    const { rows } = await client.query(
      `UPDATE pub_report_participants SET attendance_status=$3,attendance_note=$4,
       verified_by=$5,verified_at=now(),revision=revision+1
       WHERE id=$1 AND report_id=$2 AND revision=$6 RETURNING *`,
      [participantId, id, input.attendanceStatus, input.attendanceNote.trim(), access.userId, input.expectedRevision],
    );
    if (!rows.length) fail(409, "Data peserta berubah atau tidak ditemukan. Muat ulang sebelum menyimpan.");
    await client.query("UPDATE pub_activity_reports SET revision=revision+1,updated_at=now() WHERE id=$1", [id]);
    await addEvent(client, id, access.userId, "attendance_updated", {
      participantId, attendanceStatus: input.attendanceStatus,
    });
    return rows[0];
  });
  res.json(UpdatePubReportParticipantResponse.parse(participantRecord(participant)));
});

router.delete("/:id/participants/:participantId", async (req, res) => {
  const { id, participantId } = parseBody(RemovePubReportParticipantParams, req.params);
  const access = userAccess(req);
  await withTransaction(async client => {
    const report = await lockedReport(client, id, access);
    if (!canEditReport(report, access)) fail(403, "Hanya operator unit yang dapat mengelola peserta.");
    assertEditable(report);
    const { rows } = await client.query(
      `DELETE FROM pub_report_participants WHERE id=$1 AND report_id=$2
       AND attendance_status <> 'verified' RETURNING id`,
      [participantId, id],
    );
    if (!rows.length) fail(409, "Peserta tidak ditemukan atau sudah terverifikasi.");
    await client.query("UPDATE pub_activity_reports SET revision=revision+1,updated_at=now() WHERE id=$1", [id]);
    await addEvent(client, id, access.userId, "participant_removed", { participantId });
  });
  res.sendStatus(204);
});

router.post("/:id/attachments", async (req, res) => {
  const { id } = parseBody(AddPubReportAttachmentParams, req.params);
  const input = parseBody(AddPubReportAttachmentBody, req.body);
  const access = userAccess(req);
  const docName = await workspace<Pick<StoredDocument, "name">>(access.userId, state => {
    const document = ownDocument(state as VaultState, input.documentId);
    return { name: document.name };
  });
  try {
    const attachment = await withTransaction(async client => {
      const report = await lockedReport(client, id, access);
      if (!canEditReport(report, access)) fail(403, "Hanya operator unit yang dapat menambahkan dokumen.");
      assertEditable(report);
      const { rows } = await client.query(
        `INSERT INTO pub_report_attachments
         (report_id,category,vault_document_id,vault_owner_id,file_name,created_by)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [id, input.category, input.documentId, access.userId, docName.name, access.userId],
      );
      await client.query("UPDATE pub_activity_reports SET revision=revision+1,updated_at=now() WHERE id=$1", [id]);
      await addEvent(client, id, access.userId, "vault_document_linked", { attachmentId: rows[0].id, category: input.category });
      return rows[0];
    });
    res.status(201).json(AddPubReportAttachmentResponse.parse(attachmentRecord(attachment)));
  } catch (error) {
    if ((error as { code?: string }).code === "23505") fail(409, "Dokumen ini sudah dilampirkan.");
    throw error;
  }
});

router.delete("/:id/attachments/:attachmentId", async (req, res) => {
  const { id, attachmentId } = parseBody(RemovePubReportAttachmentParams, req.params);
  const access = userAccess(req);
  await withTransaction(async client => {
    const report = await lockedReport(client, id, access);
    if (!canEditReport(report, access)) fail(403, "Hanya operator unit yang dapat mengubah lampiran.");
    assertEditable(report);
    const { rows } = await client.query(
      "DELETE FROM pub_report_attachments WHERE id=$1 AND report_id=$2 RETURNING id",
      [attachmentId, id],
    );
    if (!rows.length) fail(404, "Lampiran laporan tidak ditemukan.");
    await client.query("UPDATE pub_activity_reports SET revision=revision+1,updated_at=now() WHERE id=$1", [id]);
    await addEvent(client, id, access.userId, "vault_document_unlinked", { attachmentId });
  });
  res.status(204).send();
});

router.get("/:id/attachments/:attachmentId/download", async (req, res) => {
  const { id, attachmentId } = parseBody(DownloadPubReportAttachmentParams, req.params);
  const access = userAccess(req);
  await authorizedReport(id, access);
  const { rows } = await pool.query(
    "SELECT vault_document_id,vault_owner_id FROM pub_report_attachments WHERE id=$1 AND report_id=$2",
    [attachmentId, id],
  );
  if (!rows.length) fail(404, "Lampiran laporan tidak ditemukan.");
  const link = rows[0] as { vault_document_id: string; vault_owner_id: string };
  const document = await workspace<StoredDocument>(link.vault_owner_id, state =>
    ownDocument(state as VaultState, link.vault_document_id));
  await streamDocument(document, res);
});

router.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (error && typeof error === "object" && "status" in error && "message" in error) {
    const status = Number((error as { status: unknown }).status);
    const message = (error as { message: unknown }).message;
    if (Number.isInteger(status) && status >= 400 && status < 600 && typeof message === "string") {
      res.status(status).json({ error: message });
      return;
    }
  }
  next(error);
});

export default router;
