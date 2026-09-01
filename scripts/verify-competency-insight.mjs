import assert from "node:assert/strict";
import crypto from "node:crypto";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

assert.ok(supabaseUrl, "SUPABASE_URL is required");
assert.ok(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY is required");
assert.ok(publishableKey, "VITE_SUPABASE_PUBLISHABLE_KEY is required");

const email = `competency-insight-probe-${crypto.randomUUID()}@example.test`;
const password = `Probe-${crypto.randomUUID()}-A1!`;
let userId;

async function request(path, init) {
  const response = await fetch(`${supabaseUrl}${path}`, init);
  const text = await response.text();
  let body = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // The assertions below report the relevant HTTP status without logging credentials.
  }

  return { response, body };
}

try {
  const unauthenticated = await request("/functions/v1/competency-insight", {
    method: "POST",
    headers: {
      apikey: publishableKey,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  assert.equal(unauthenticated.response.status, 401);

  const created = await request("/auth/v1/admin/users", {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
    }),
  });
  assert.equal(created.response.status, 200);
  assert.equal(typeof created.body?.id, "string");
  userId = created.body.id;

  const signedIn = await request("/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: {
      apikey: publishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(signedIn.response.status, 200);
  assert.equal(typeof signedIn.body?.access_token, "string");

  const insight = await request("/functions/v1/competency-insight", {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${signedIn.body.access_token}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  assert.equal(insight.response.status, 200);
  assert.equal(insight.body?.source, "connected");
  assert.ok(Array.isArray(insight.body?.recommendations));
  assert.ok(insight.body.recommendations.length > 0);
  assert.ok(insight.body.recommendations.length <= 3);
  assert.equal("health" in insight.body, false);
  assert.deepEqual(Object.keys(insight.body).sort(), ["generatedAt", "recommendations", "source"]);

  const memberHealth = await request("/functions/v1/competency-insight", {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${signedIn.body.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "health" }),
  });
  assert.equal(memberHealth.response.status, 403);

  const adminRole = await request("/rest/v1/user_roles", {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: userId, role: "admin" }),
  });
  assert.equal(adminRole.response.status, 201);

  const adminHealth = await request("/functions/v1/competency-insight", {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${signedIn.body.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "health" }),
  });
  assert.equal(adminHealth.response.status, 200);
  assert.ok(["connected", "deterministic"].includes(adminHealth.body?.health?.status));
  assert.equal(typeof adminHealth.body?.health?.failureReason, "string");
  assert.equal(typeof adminHealth.body?.health?.lastProbeAt, "string");
  assert.deepEqual(
    Object.keys(adminHealth.body.health).sort(),
    ["failureReason", "lastProbeAt", "status"],
  );

  console.log(JSON.stringify({
    unauthenticatedStatus: unauthenticated.response.status,
    authenticatedStatus: insight.response.status,
    memberHealthStatus: memberHealth.response.status,
    adminHealthStatus: adminHealth.response.status,
    source: insight.body.source,
    recommendationCount: insight.body.recommendations.length,
    healthStatus: adminHealth.body.health.status,
    healthFailureReason: adminHealth.body.health.failureReason,
  }));
} finally {
  if (userId) {
    await request(`/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });
  }
}