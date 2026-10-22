import { ENABLED_HAZARDS } from "@/features/analysis/hazards";

// The name follows the feature flag: a fire-only build should not promise other hazards.
export const APP_NAME = ENABLED_HAZARDS.length > 1 ? "NISAR Hazard Watch" : "NISAR Fire Watch";
