"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProfileService } from "@/services/profile-service";
import type { ProfilePayload } from "@/services/profile-service";

export const profileKeys = { me: ["profile", "me"] as const };

export function useProfile() {
    return useQuery({ queryKey: profileKeys.me, queryFn: ProfileService.get });
}

export function useProfileMutations() {
    const qc = useQueryClient();
    const invalidate = () => qc.invalidateQueries({ queryKey: profileKeys.me });

    const update = useMutation({
        mutationFn: (payload: ProfilePayload) => ProfileService.update(payload),
        onSuccess: invalidate,
    });
    const uploadPhoto = useMutation({
        mutationFn: (file: File) => ProfileService.uploadPhoto(file),
        onSuccess: invalidate,
    });

    return { update, uploadPhoto };
}
