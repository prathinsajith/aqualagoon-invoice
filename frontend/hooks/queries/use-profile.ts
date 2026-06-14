"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProfileService } from "@/services/profile-service";
import type { ProfilePayload } from "@/services/profile-service";

const profileKeys = { me: ["profile", "me"] as const };

export function useProfile() {
    return useQuery({ queryKey: profileKeys.me, queryFn: ProfileService.get });
}

export function useProfileMutations() {
    const qc = useQueryClient();

    const update = useMutation({
        mutationFn: (payload: ProfilePayload) => ProfileService.update(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: profileKeys.me }),
    });
    const uploadPhoto = useMutation({
        mutationFn: (file: File) => ProfileService.uploadPhoto(file),
        onSuccess: () => qc.invalidateQueries({ queryKey: profileKeys.me }),
    });

    return { update, uploadPhoto };
}
