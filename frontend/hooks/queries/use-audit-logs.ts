"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AuditService } from "@/services/audit-service";
import type { AuditListParams } from "@/services/audit-service";

export const auditKeys = {
    list: (params: AuditListParams) => ["audit-logs", "list", params] as const,
};

export function useAuditLogs(params: AuditListParams) {
    return useQuery({
        queryKey: auditKeys.list(params),
        queryFn: () => AuditService.list(params),
        placeholderData: keepPreviousData,
    });
}
