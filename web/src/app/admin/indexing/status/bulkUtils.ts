import type {
  BulkCCPairManageAction,
  BulkCCPairStatusAction,
} from "@/lib/types";

export function formatSkippedReasons(
  skippedReasons: Record<string, number>
): string {
  const labels: Record<string, string> = {
    forbidden: "not editable",
    already_in_target_state: "already in target state",
    missing_cc_pair_status: "missing status",
    indexing_in_progress: "already indexing",
    not_eligible_for_action: "not eligible",
    missing_cc_pair: "missing connector pair",
    update_failed: "update failed",
  };

  return Object.entries(skippedReasons)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => `${count} ${labels[key] ?? key}`)
    .join(", ");
}

export function buildBulkStatusConfirmationMessage(
  action: BulkCCPairStatusAction
): string {
  return `Are you sure you want to bulk ${action} all editable connectors matching the current search and filters?`;
}

export function buildBulkManageConfirmationMessage(
  action: BulkCCPairManageAction
): string {
  return `Are you sure you want to bulk ${action} all editable connectors matching the current search and filters?`;
}
