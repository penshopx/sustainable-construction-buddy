export const SOURCE_UNAVAILABLE_OUTCOME = Object.freeze({
  httpStatus: 500,
  response: Object.freeze({ error: "Unable to read competency sources" }),
  health: Object.freeze({
    status: "deterministic",
    failureReason: "source_unavailable",
  }),
});

export function sourceUnavailableOutcome() {
  return {
    httpStatus: SOURCE_UNAVAILABLE_OUTCOME.httpStatus,
    response: { ...SOURCE_UNAVAILABLE_OUTCOME.response },
    health: { ...SOURCE_UNAVAILABLE_OUTCOME.health },
  };
}