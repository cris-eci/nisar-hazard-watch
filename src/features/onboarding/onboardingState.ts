/*
 * Quick onboarding: four spotlight steps, shown once per browser. The "seen" flag lives in
 * localStorage, which can throw (private mode, blocked storage), so every access is guarded.
 */

export type OnboardingTarget = "cases" | "panel" | "dock" | "timeline";

export type OnboardingStep = { target: OnboardingTarget; title: string; text: string };

export const ONBOARDING_KEY = "nhw-onboarding-seen";

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    target: "cases",
    title: "Start from a measured case",
    text: "Each marker is a place where our pipeline already compared real NISAR passes. Solid rings are measured; dashed ones wait for data.",
  },
  {
    target: "panel",
    title: "Five facts, then more",
    text: "The panel shows the question, the verdict, a small chart and the inside-versus-nearby bars. “More information” opens everything.",
  },
  {
    target: "dock",
    title: "The radar on the globe",
    text: "Switch between the change map and the baseline, and set its opacity. White means no change; grey means no measurement.",
  },
  {
    target: "timeline",
    title: "Every pass in time",
    text: "Dots are passes. Gold rings are the two sides of the comparison. Dashed circles are planned passes: a promise, not data.",
  },
];

export const hasSeenOnboarding = (): boolean => {
  try {
    return window.localStorage.getItem(ONBOARDING_KEY) === "1";
  } catch {
    // No storage: better to show the tour every visit than never.
    return false;
  }
};

export const markOnboardingSeen = (): void => {
  try {
    window.localStorage.setItem(ONBOARDING_KEY, "1");
  } catch {
    // Nothing to do: the tour simply shows again next time.
  }
};
