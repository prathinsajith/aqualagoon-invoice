"use client";

import { useQuery } from "@tanstack/react-query";
import { IconWallet } from "@tabler/icons-react";

import { Spinner } from "@/components/ui/spinner";
import { SectionCard } from "@/components/dashboard/section-card";
import { DashboardService } from "@/services/dashboard-service";
import { usePermissions } from "@/hooks/usePermissions";
import { formatMoney } from "@/lib/format";
import { rangeKey, type DashboardRangeProps } from "./dashboard-card-utils";

/** Amount received in the range, grouped by payment method. */
export function PaymentsReceivedCard({ range, periodLabel }: DashboardRangeProps) {
  const { can } = usePermissions();
  const enabled = can("billing.view");

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["dashboard", "payments-by-method", ...rangeKey(range)],
    queryFn: () => DashboardService.paymentsByMethod(range),
    enabled,
  });

  if (!enabled) return null;

  const payments = paymentsData ?? [];
  const paymentsTotal = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <SectionCard
      icon={IconWallet}
      iconClassName="bg-primary/10 text-primary"
      title="Payments received"
      caption={`${periodLabel.toLowerCase()} · by method`}
    >
      {paymentsLoading ? (
        <div className="grid h-24 place-items-center">
          <Spinner className="size-6" />
        </div>
      ) : payments.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No payments received in this period.
        </p>
      ) : (
        <>
          <div className="divide-y">
            {payments.map((p) => (
              <div key={p.paymentMethodId} className="flex items-center justify-between gap-3 py-2.5">
                <span className="truncate text-sm font-medium">{p.name}</span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatMoney(p.amount)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-1 flex items-center justify-between border-t pt-3">
            <span className="text-sm font-semibold">Total received</span>
            <span className="text-lg font-bold tabular-nums">{formatMoney(paymentsTotal)}</span>
          </div>
        </>
      )}
    </SectionCard>
  );
}
