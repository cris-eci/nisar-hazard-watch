// Same key the welcome dialog used, so returning visitors still skip the intro.
const SEEN_KEY = "nisar-watch:welcome-dismissed";

// localStorage can throw (private mode, blocked storage); the intro then simply shows again.
export const wasIntroSeen = (): boolean => {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
};

export const rememberIntroSeen = (): void => {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Not critical: worst case the intro shows on the next visit.
  }
};
