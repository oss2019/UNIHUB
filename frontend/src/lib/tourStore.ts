import { create } from "zustand";

interface TourState {
  isActive: boolean;
  stepIndex: number;
  startTour: () => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
}

export const useTourStore = create<TourState>((set) => ({
  isActive: false,
  stepIndex: 0,
  startTour: () => set({ isActive: true, stepIndex: 0 }),
  stopTour: () => set({ isActive: false, stepIndex: 0 }),
  nextStep: () => set((state) => ({ stepIndex: state.stepIndex + 1 })),
  prevStep: () =>
    set((state) => ({ stepIndex: Math.max(0, state.stepIndex - 1) })),
  setStep: (step: number) => set({ stepIndex: step }),
}));
