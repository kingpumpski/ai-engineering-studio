export type ExecutionState =
  | "QUEUED"
  | "CONTEXT_BUILDING"
  | "PLANNING"
  | "AWAITING_APPROVAL"
  | "EXECUTING"
  | "VERIFYING"
  | "DIAGNOSING"
  | "REPAIRING"
  | "REVIEW"
  | "READY"
  | "DRAFT_PR"
  | "FAILED"
  | "CANCELLED";

export type ExecutionEvent =
  | "START"
  | "CONTEXT_READY"
  | "PLAN_READY"
  | "APPROVE"
  | "EXECUTION_COMPLETE"
  | "VERIFICATION_PASSED"
  | "VERIFICATION_FAILED"
  | "DIAGNOSIS_COMPLETE"
  | "REPAIR_READY"
  | "REPAIR_APPROVED"
  | "REVIEW_COMPLETE"
  | "CREATE_DRAFT_PR"
  | "FAIL"
  | "CANCEL";

const transitions: Record<ExecutionState, Partial<Record<ExecutionEvent, ExecutionState>>> = {
  QUEUED: { START: "CONTEXT_BUILDING", CANCEL: "CANCELLED" },
  CONTEXT_BUILDING: { CONTEXT_READY: "PLANNING", FAIL: "FAILED", CANCEL: "CANCELLED" },
  PLANNING: { PLAN_READY: "AWAITING_APPROVAL", FAIL: "FAILED", CANCEL: "CANCELLED" },
  AWAITING_APPROVAL: { APPROVE: "EXECUTING", CANCEL: "CANCELLED" },
  EXECUTING: { EXECUTION_COMPLETE: "VERIFYING", FAIL: "FAILED", CANCEL: "CANCELLED" },
  VERIFYING: { VERIFICATION_PASSED: "REVIEW", VERIFICATION_FAILED: "DIAGNOSING", FAIL: "FAILED", CANCEL: "CANCELLED" },
  DIAGNOSING: { DIAGNOSIS_COMPLETE: "REPAIRING", FAIL: "FAILED", CANCEL: "CANCELLED" },
  REPAIRING: { REPAIR_READY: "AWAITING_APPROVAL", FAIL: "FAILED", CANCEL: "CANCELLED" },
  REVIEW: { REVIEW_COMPLETE: "READY", FAIL: "FAILED", CANCEL: "CANCELLED" },
  READY: { CREATE_DRAFT_PR: "DRAFT_PR", CANCEL: "CANCELLED" },
  DRAFT_PR: {},
  FAILED: { START: "CONTEXT_BUILDING", CANCEL: "CANCELLED" },
  CANCELLED: {},
};

export function transition(state: ExecutionState, event: ExecutionEvent): ExecutionState {
  const next = transitions[state]?.[event];
  if (!next) throw new Error(`Invalid execution transition: ${state} + ${event}`);
  return next;
}

export function canTransition(state: ExecutionState, event: ExecutionEvent): boolean {
  return Boolean(transitions[state]?.[event]);
}

export const EXECUTION_STATES: readonly ExecutionState[] = Object.keys(transitions) as ExecutionState[];
