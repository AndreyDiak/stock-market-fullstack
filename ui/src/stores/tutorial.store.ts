import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type GuideSectionKey =
  | 'overview'
  | 'quick-start'
  | 'dream'
  | 'turn-economy'
  | 'skills'
  | 'stocks'
  | 'real-estate-bank'
  | 'news'
  | 'deals'
  | 'ui-tips'

interface TutorialStoreState {
  isOnboardingOpen: boolean
  hasCompletedOnboarding: boolean
  activeGuideSection: GuideSectionKey
  seenGuideSections: string[]

  openOnboarding: () => void
  closeOnboarding: () => void
  completeOnboarding: () => void
  skipOnboarding: () => void
  openGuideSection: (key: GuideSectionKey) => void
  markGuideSectionSeen: (key: GuideSectionKey) => void
  resetOnboarding: () => void
}

const initialState = {
  isOnboardingOpen: false,
  hasCompletedOnboarding: false,
  activeGuideSection: 'quick-start' as GuideSectionKey,
  seenGuideSections: [],
}

export const useTutorialStore = create<TutorialStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      openOnboarding: () => set({ isOnboardingOpen: true }),
      closeOnboarding: () => set({ isOnboardingOpen: false }),

      completeOnboarding: () =>
        set({
          isOnboardingOpen: false,
          hasCompletedOnboarding: true,
        }),

      skipOnboarding: () =>
        set({
          isOnboardingOpen: false,
          hasCompletedOnboarding: true,
        }),

      openGuideSection: (key) =>
        set({
          activeGuideSection: key,
          isOnboardingOpen: false,
        }),

      markGuideSectionSeen: (key) => {
        const { seenGuideSections } = get()
        if (!seenGuideSections.includes(key)) {
          set({ seenGuideSections: [...seenGuideSections, key] })
        }
      },

      resetOnboarding: () =>
        set({
          ...initialState,
        }),
    }),
    {
      name: 'stock-market-tutorial-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        seenGuideSections: state.seenGuideSections,
        activeGuideSection: state.activeGuideSection,
      }),
    },
  ),
)