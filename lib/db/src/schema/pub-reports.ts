import { sql } from "drizzle-orm";
import {
  boolean, check, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export type PubReportPerson = {
  name: string;
  affiliation: string;
  role: "committee" | "speaker" | "responsible";
  topic: string;
  hours: number | null;
};

export type PubReportAgendaItem = {
  startsAt: string;
  endsAt: string;
  activity: string;
  speaker: string;
  notes: string;
};

export const pubReportUnits = pgTable("pub_report_units", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  unitType: text("unit_type").notNull(),
  parentUnitId: uuid("parent_unit_id").references((): AnyPgColumn => pubReportUnits.id, { onDelete: "restrict" }),
  active: boolean("active").notNull().default(true),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  check("pub_report_units_type_check", sql`${table.unitType} IN ('central', 'branch')`),
  check("pub_report_units_parent_check", sql`(${table.unitType} = 'central' AND ${table.parentUnitId} IS NULL) OR (${table.unitType} = 'branch' AND ${table.parentUnitId} IS NOT NULL)`),
  uniqueIndex("pub_report_one_central_unit").on(table.unitType).where(sql`${table.unitType} = 'central'`),
  index("pub_report_units_parent_idx").on(table.parentUnitId),
]);

export const pubReportMemberships = pgTable("pub_report_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  unitId: uuid("unit_id").notNull().references(() => pubReportUnits.id, { onDelete: "restrict" }),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
  active: boolean("active").notNull().default(true),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  check("pub_report_memberships_role_check", sql`${table.role} IN ('branch_operator', 'central_reviewer')`),
  uniqueIndex("pub_report_memberships_user_unit_unique").on(table.unitId, table.userId, table.role),
  index("pub_report_memberships_user_active_idx").on(table.userId, table.active),
]);

export const pubActivityReports = pgTable("pub_activity_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  unitId: uuid("unit_id").notNull().references(() => pubReportUnits.id, { onDelete: "restrict" }),
  sourceActivityId: text("source_activity_id"),
  title: text("title").notNull(),
  activityType: text("activity_type").notNull(),
  classification: text("classification").notNull(),
  eventForm: text("event_form").notNull(),
  deliveryMode: text("delivery_mode").notNull(),
  level: text("level").notNull(),
  background: text("background").notNull().default(""),
  legalBasis: text("legal_basis").notNull().default(""),
  purpose: text("purpose").notNull().default(""),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  location: text("location").notNull().default(""),
  targetAudience: text("target_audience").notNull().default(""),
  targetQualification: text("target_qualification").notNull().default(""),
  targetPerformanceGrade: text("target_performance_grade"),
  responsibleName: text("responsible_name").notNull().default(""),
  recommendations: text("recommendations").notNull().default(""),
  followUp: text("follow_up").notNull().default(""),
  closing: text("closing").notNull().default(""),
  committee: jsonb("committee").$type<PubReportPerson[]>().notNull().default([]),
  rundown: jsonb("rundown").$type<PubReportAgendaItem[]>().notNull().default([]),
  status: text("status").notNull().default("draft"),
  revision: integer("revision").notNull().default(0),
  creatorId: text("creator_id").notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: text("reviewed_by"),
  reviewNote: text("review_note").notNull().default(""),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }),
  uploadReference: text("upload_reference").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  check("pub_activity_reports_classification_check", sql`${table.classification} IN ('general', 'special')`),
  check("pub_activity_reports_delivery_check", sql`${table.deliveryMode} IN ('online', 'offline', 'hybrid')`),
  check("pub_activity_reports_level_check", sql`${table.level} IN ('national', 'international')`),
  check("pub_activity_reports_status_check", sql`${table.status} IN ('draft', 'submitted', 'needs_revision', 'ready_to_upload', 'uploaded')`),
  check("pub_activity_reports_dates_check", sql`${table.endsAt} IS NULL OR ${table.endsAt} >= ${table.startsAt}`),
  index("pub_activity_reports_unit_status_idx").on(table.unitId, table.status, table.updatedAt),
  index("pub_activity_reports_updated_idx").on(table.updatedAt),
  uniqueIndex("pub_activity_reports_source_activity_unique").on(table.sourceActivityId).where(sql`${table.sourceActivityId} IS NOT NULL`),
]);

export const pubReportParticipants = pgTable("pub_report_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  reportId: uuid("report_id").notNull().references(() => pubActivityReports.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  companyName: text("company_name").notNull().default(""),
  qualification: text("qualification").notNull().default(""),
  performanceGrade: text("performance_grade"),
  participantRole: text("participant_role").notNull(),
  attendanceStatus: text("attendance_status").notNull().default("pending"),
  attendanceNote: text("attendance_note").notNull().default(""),
  verifiedBy: text("verified_by"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  revision: integer("revision").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  check("pub_report_participants_role_check", sql`${table.participantRole} IN ('bujk', 'association', 'speaker', 'organizer', 'other')`),
  check("pub_report_participants_attendance_check", sql`${table.attendanceStatus} IN ('pending', 'verified', 'needs_correction')`),
  index("pub_report_participants_report_idx").on(table.reportId),
]);

export const pubReportAttachments = pgTable("pub_report_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  reportId: uuid("report_id").notNull().references(() => pubActivityReports.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  vaultDocumentId: text("vault_document_id").notNull(),
  vaultOwnerId: text("vault_owner_id").notNull(),
  fileName: text("file_name").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  check("pub_report_attachments_category_check", sql`${table.category} IN ('invitation', 'kak', 'attendance_list', 'documentation', 'recording', 'materials', 'upload_proof', 'other')`),
  uniqueIndex("pub_report_attachments_report_document_unique").on(table.reportId, table.vaultOwnerId, table.vaultDocumentId),
  index("pub_report_attachments_report_idx").on(table.reportId),
]);

export const pubReportEvents = pgTable("pub_report_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  reportId: uuid("report_id").notNull().references(() => pubActivityReports.id, { onDelete: "cascade" }),
  actorId: text("actor_id").notNull(),
  action: text("action").notNull(),
  detail: jsonb("detail").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index("pub_report_events_report_idx").on(table.reportId, table.createdAt),
]);
