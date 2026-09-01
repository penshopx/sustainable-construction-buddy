import assert from "node:assert/strict";
import test from "node:test";
import {
  CompetencyInsightError,
  ENGINE_SCHEMA_VERSION,
  deterministicKeys,
  healthRequestStatus,
  parseRecommendationKeys,
  requestRecommendationKeys,
  resolveInsight,
  toInsightHealth,
} from "../supabase/functions/competency-insight/contract.js";

test("success sends only bounded recommendation keys and accepts allowlisted output", async () => {
  const availableKeys = [
    "tender-risk",
    "legalitas-pancek",
    "proyek-controls",
    "sertifikasi-lms",
  ];
  let request;
  const fakeFetch = async (input, init) => {
    request = { input: String(input), init };
    return new Response(JSON.stringify({
      recommendationKeys: [
        "sertifikasi-lms",
        "unknown-key",
        "sertifikasi-lms",
        "tender-risk",
      ],
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const keys = await requestRecommendationKeys(
    "https://insight.example.test/v1/recommendations",
    "test-api-key",
    availableKeys,
    fakeFetch,
  );

  assert.deepEqual(keys, ["sertifikasi-lms", "tender-risk"]);
  assert.equal(request.input, "https://insight.example.test/v1/recommendations");
  assert.deepEqual(JSON.parse(request.init.body), {
    schemaVersion: ENGINE_SCHEMA_VERSION,
    availableRecommendationKeys: [
      "legalitas-pancek",
      "sertifikasi-lms",
      "tender-risk",
    ],
  });
  assert.deepEqual(Object.keys(JSON.parse(request.init.body)).sort(), [
    "availableRecommendationKeys",
    "schemaVersion",
  ]);
  assert.equal(request.init.headers.Authorization, "Bearer test-api-key");
});

test("timeout rejects and lets the function use deterministic fallback", async () => {
  const neverResolvingFetch = (_input, init) =>
    new Promise((_resolve, reject) => {
      const keepEventLoopAlive = setTimeout(() => {
        reject(new Error("Timeout signal did not fire"));
      }, 100);
      init.signal.addEventListener(
        "abort",
        () => {
          clearTimeout(keepEventLoopAlive);
          reject(init.signal.reason);
        },
        { once: true },
      );
    });

  await assert.rejects(
    requestRecommendationKeys(
      "https://insight.example.test/v1/recommendations",
      "test-api-key",
      ["legalitas-pancek"],
      neverResolvingFetch,
      10,
    ),
    (error) => error instanceof CompetencyInsightError && error.code === "timeout",
  );
  assert.deepEqual(deterministicKeys(["legalitas-pancek"]), ["legalitas-pancek"]);
});

test("invalid, unknown, and excessive output is bounded to the internal catalog", () => {
  const availableKeys = [
    "legalitas-member",
    "sertifikasi-assessment",
    "tender-risk",
    "proyek-workspace",
  ];

  assert.deepEqual(parseRecommendationKeys(null, availableKeys), []);
  assert.deepEqual(parseRecommendationKeys({ recommendationKeys: "tender-risk" }, availableKeys), []);
  assert.deepEqual(
    parseRecommendationKeys({
      recommendationKeys: [
        "unknown-key",
        "proyek-workspace",
        "tender-risk",
        "sertifikasi-assessment",
        "legalitas-member",
      ],
    }, availableKeys),
    ["proyek-workspace", "tender-risk", "sertifikasi-assessment"],
  );
});

test("authentication failures and invalid contracts are classified safely", async () => {
  const responseFor = (body, status = 200) => async () => new Response(
    body === undefined ? "" : JSON.stringify(body),
    { status, headers: { "Content-Type": "application/json" } },
  );

  await assert.rejects(
    requestRecommendationKeys(
      "https://insight.example.test/recommendations",
      "test-api-key",
      ["legalitas-pancek"],
      responseFor({ error: "unauthorized" }, 401),
    ),
    (error) => error instanceof CompetencyInsightError && error.code === "authentication",
  );
  await assert.rejects(
    requestRecommendationKeys(
      "https://insight.example.test/recommendations",
      "test-api-key",
      ["legalitas-pancek"],
      responseFor({ recommendationKeys: "not-an-array" }),
    ),
    (error) => error instanceof CompetencyInsightError && error.code === "invalid_contract",
  );
  await assert.rejects(
    requestRecommendationKeys(
      "https://insight.example.test/recommendations",
      "test-api-key",
      ["legalitas-pancek"],
      async () => new Response("{not-json", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ),
    (error) => error instanceof CompetencyInsightError && error.code === "invalid_contract",
  );
  await assert.rejects(
    requestRecommendationKeys(
      "https://insight.example.test/recommendations",
      "test-api-key",
      ["legalitas-pancek"],
      responseFor({ recommendationKeys: [] }),
    ),
    (error) => error instanceof CompetencyInsightError && error.code === "invalid_contract",
  );
  await assert.rejects(
    requestRecommendationKeys(
      "https://insight.example.test/recommendations",
      "test-api-key",
      ["legalitas-pancek"],
      responseFor({ recommendationKeys: ["unknown-key"] }),
    ),
    (error) => error instanceof CompetencyInsightError && error.code === "invalid_contract",
  );
});

test("health status remains admin-only without calling the insight service", () => {
  assert.equal(healthRequestStatus(false), 403);
  assert.equal(healthRequestStatus(undefined), 403);
  assert.equal(healthRequestStatus(true), 200);
});

test("member source and admin health stay aligned for every insight outcome", async () => {
  const availableKeys = ["legalitas-pancek", "tender-risk"];
  const scenarios = [
    {
      name: "connected",
      engineUrl: "https://insight.example.test/recommendations",
      engineApiKey: "test-api-key",
      requestKeys: async () => ["tender-risk"],
      expected: { source: "connected", failureReason: "none", recommendationKeys: ["tender-risk"] },
    },
    {
      name: "authentication",
      engineUrl: "https://insight.example.test/recommendations",
      engineApiKey: "test-api-key",
      requestKeys: async () => {
        throw new CompetencyInsightError("authentication", "denied");
      },
      expected: { source: "deterministic", failureReason: "authentication", recommendationKeys: ["legalitas-pancek", "tender-risk"] },
    },
    {
      name: "timeout",
      engineUrl: "https://insight.example.test/recommendations",
      engineApiKey: "test-api-key",
      requestKeys: async () => {
        throw new CompetencyInsightError("timeout", "timed out");
      },
      expected: { source: "deterministic", failureReason: "timeout", recommendationKeys: ["legalitas-pancek", "tender-risk"] },
    },
    {
      name: "invalid json",
      engineUrl: "https://insight.example.test/recommendations",
      engineApiKey: "test-api-key",
      requestKeys: async () => {
        throw new CompetencyInsightError("invalid_contract", "invalid json");
      },
      expected: { source: "deterministic", failureReason: "invalid_contract", recommendationKeys: ["legalitas-pancek", "tender-risk"] },
    },
    {
      name: "empty or unknown keys",
      engineUrl: "https://insight.example.test/recommendations",
      engineApiKey: "test-api-key",
      requestKeys: async () => {
        throw new CompetencyInsightError("invalid_contract", "no usable keys");
      },
      expected: { source: "deterministic", failureReason: "invalid_contract", recommendationKeys: ["legalitas-pancek", "tender-risk"] },
    },
    {
      name: "configuration missing",
      engineUrl: "",
      engineApiKey: "",
      expected: { source: "deterministic", failureReason: "not_configured", recommendationKeys: ["legalitas-pancek", "tender-risk"] },
    },
    {
      name: "no missing recommendations",
      engineUrl: "https://insight.example.test/recommendations",
      engineApiKey: "test-api-key",
      expected: { source: "deterministic", failureReason: "none", recommendationKeys: [] },
      missingKeys: [],
    },
  ];

  for (const scenario of scenarios) {
    const outcome = await resolveInsight({
      missingKeys: scenario.missingKeys ?? availableKeys,
      engineUrl: scenario.engineUrl,
      engineApiKey: scenario.engineApiKey,
      requestKeys: scenario.requestKeys,
    });
    assert.deepEqual(outcome, scenario.expected, scenario.name);
    assert.deepEqual(toInsightHealth(outcome), {
      status: outcome.source,
      failureReason: outcome.failureReason,
    }, scenario.name);
  }
});