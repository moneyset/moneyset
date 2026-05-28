import { create } from "zustand";

export type ProfileCenterSection =
  | "overview"
  | "access"
  | "billing"
  | "founder"
  | "connections"
  | "session";

type ProfileCenterState = {
  open: boolean;
  section: ProfileCenterSection;
  openProfileCenter: (section?: ProfileCenterSection) => void;
  closeProfileCenter: () => void;
  setSection: (section: ProfileCenterSection) => void;
};

export const useProfileCenterStore = create<ProfileCenterState>((set) => ({
  open: false,
  section: "overview",
  openProfileCenter: (section = "overview") => set({ open: true, section }),
  closeProfileCenter: () => set({ open: false }),
  setSection: (section) => set({ section }),
}));
