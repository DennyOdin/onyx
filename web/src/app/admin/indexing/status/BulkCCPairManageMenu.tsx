"use client";

import { useState } from "react";
import { Button } from "@opal/components";
import { SvgSettings } from "@opal/icons";
import { toast } from "@/hooks/useToast";
import { bulkManageCCPairs, bulkUpdateCCPairStatus } from "@/lib/connector";
import type {
  BulkCCPairAction,
  BulkCCPairStatusAction,
  IndexingStatusRequest,
} from "@/lib/types";
import Popover from "@/refresh-components/Popover";
import LineItem from "@/refresh-components/buttons/LineItem";
import { Section } from "@/layouts/general-layouts";
import {
  buildBulkManageConfirmationMessage,
  buildBulkStatusConfirmationMessage,
  formatSkippedReasons,
} from "./bulkUtils";

interface BulkCCPairManageMenuProps {
  filters: IndexingStatusRequest;
  enabled: boolean;
  onSuccess: () => void;
}

function isStatusAction(
  action: BulkCCPairAction
): action is BulkCCPairStatusAction {
  return action === "pause" || action === "resume";
}

export function BulkCCPairManageMenu({
  filters,
  enabled,
  onSuccess,
}: BulkCCPairManageMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const isDisabled = !enabled || isRunning;

  const runBulkAction = async (action: BulkCCPairAction) => {
    try {
      setIsOpen(false);
      setIsRunning(true);

      if (isStatusAction(action)) {
        const confirmed = window.confirm(
          buildBulkStatusConfirmationMessage(action)
        );

        if (!confirmed) {
          return;
        }

        const result = await bulkUpdateCCPairStatus(action, filters);
        onSuccess();

        const skippedSummary = formatSkippedReasons(result.skipped_reasons);

        if (result.updated_count > 0) {
          toast.success(
            skippedSummary
              ? `Bulk ${action} complete: ${result.updated_count} updated, ${result.skipped_count} skipped (${skippedSummary}).`
              : `Bulk ${action} complete: ${result.updated_count} updated.`
          );
        } else {
          toast.error(
            skippedSummary
              ? `No connectors were updated for bulk ${action}. Skipped: ${skippedSummary}.`
              : `No connectors were updated for bulk ${action}.`
          );
        }

        return;
      }

      const confirmed = window.confirm(
        buildBulkManageConfirmationMessage(action)
      );

      if (!confirmed) {
        return;
      }

      const result = await bulkManageCCPairs(action, filters);
      onSuccess();

      const skippedSummary = formatSkippedReasons(result.skipped_reasons);
      const actionLabel = action === "reindex" ? "re-indexed" : "deleted";

      if (result.updated_count > 0) {
        toast.success(
          skippedSummary
            ? `Bulk ${action} complete: ${result.updated_count} ${actionLabel}, ${result.skipped_count} skipped (${skippedSummary}).`
            : `Bulk ${action} complete: ${result.updated_count} ${actionLabel}.`
        );
      } else {
        toast.error(
          skippedSummary
            ? `No connectors were ${actionLabel}. Skipped: ${skippedSummary}.`
            : `No connectors were ${actionLabel}.`
        );
      }
    } catch (error) {
      console.error(`Bulk action ${action} failed`, error);
      toast.error(
        error instanceof Error
          ? error.message
          : `Bulk ${action} failed unexpectedly`
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className={isDisabled ? "pointer-events-none opacity-50" : ""}>
      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(isDisabled ? false : open);
        }}
      >
        <Popover.Trigger asChild>
          <Button icon={SvgSettings}>Bulk Manage</Button>
        </Popover.Trigger>

        <Popover.Content align="end">
          <Section
            gap={0.5}
            height="auto"
            alignItems="stretch"
            justifyContent="start"
          >
            <LineItem onClick={() => void runBulkAction("pause")}>
              Pause
            </LineItem>

            <LineItem onClick={() => void runBulkAction("resume")}>
              Resume
            </LineItem>

            <LineItem onClick={() => void runBulkAction("reindex")}>
              Re-Index
            </LineItem>

            <LineItem danger onClick={() => void runBulkAction("delete")}>
              Delete
            </LineItem>
          </Section>
        </Popover.Content>
      </Popover>
    </div>
  );
}
