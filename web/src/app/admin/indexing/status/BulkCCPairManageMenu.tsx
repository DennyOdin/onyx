"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@opal/components";
import { SvgSettings } from "@opal/icons";
import { toast } from "@/hooks/useToast";
import { bulkManageCCPairs, bulkUpdateCCPairStatus } from "@/lib/connector";
import type {
  BulkCCPairAction,
  BulkCCPairStatusAction,
  IndexingStatusRequest,
} from "@/lib/types";
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
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

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

      if (action === "delete") {
        const confirmed = window.confirm(
          buildBulkManageConfirmationMessage(action)
        );

        if (!confirmed) {
          return;
        }
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
    <div ref={menuRef} className="relative">
      <div className={isDisabled ? "pointer-events-none opacity-50" : ""}>
        <Button
          icon={SvgSettings}
          onClick={() => {
            if (isDisabled) return;
            setIsOpen((prev) => !prev);
          }}
        >
          Bulk Manage
        </Button>
      </div>

      {isOpen && !isDisabled && (
        <div className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-border bg-background shadow-lg">
          <button
            className="block w-full px-4 py-2 text-left text-sm hover:bg-accent-background"
            onClick={() => void runBulkAction("pause")}
          >
            Pause
          </button>

          <button
            className="block w-full px-4 py-2 text-left text-sm hover:bg-accent-background"
            onClick={() => void runBulkAction("resume")}
          >
            Resume
          </button>

          <button
            className="block w-full px-4 py-2 text-left text-sm hover:bg-accent-background"
            onClick={() => void runBulkAction("reindex")}
          >
            Re-Index
          </button>

          <button
            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-accent-background dark:text-red-400"
            onClick={() => void runBulkAction("delete")}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}