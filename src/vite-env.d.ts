/// <reference types="vite/client" />

// Vite's env typing is an interface, so augmenting it needs one too.
// oxlint-disable-next-line typescript/consistent-type-definitions
interface ImportMetaEnv {
  readonly VITE_ANALYSIS_API_URL?: string;
}
