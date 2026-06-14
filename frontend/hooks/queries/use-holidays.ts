"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HolidayService } from "@/services/holiday-service";

const holidayKeys = {
    all: ["holidays"] as const,
};

export function useHolidays() {
    return useQuery({
        queryKey: holidayKeys.all,
        queryFn: HolidayService.list,
    });
}

export function useHolidayMutations() {
    const qc = useQueryClient();

    const create = useMutation({
        mutationFn: (payload: { date: string; name?: string | null }) =>
            HolidayService.create(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: holidayKeys.all }),
    });
    const remove = useMutation({
        mutationFn: (id: string) => HolidayService.remove(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: holidayKeys.all }),
    });

    return { create, remove };
}
