"use client";

import { useProfileCenterStore } from "@/store/profile-center-store";
import { ProfileCenterModal } from "@/components/profile/profile-center-modal";

export function GlobalProfileCenterModal() {
  const open = useProfileCenterStore((s) => s.open);
  const section = useProfileCenterStore((s) => s.section);
  const closeProfileCenter = useProfileCenterStore((s) => s.closeProfileCenter);

  return (
    <ProfileCenterModal
      open={open}
      initialSection={section}
      onClose={closeProfileCenter}
    />
  );
}
