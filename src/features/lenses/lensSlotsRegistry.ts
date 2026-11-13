import { agricultureSlots } from "@/features/lenses/agricultureSlots";
import { floodSlots } from "@/features/lenses/floodSlots";
import type { CardLens, LensSlotsOf } from "@/features/lenses/lensSlots";
import { vegetationSlots } from "@/features/lenses/vegetationSlots";
import { wildfireSlots } from "@/features/lenses/wildfireSlots";

export const LENS_SLOTS: Record<CardLens, LensSlotsOf> = {
  flood_wetland: floodSlots,
  vegetation_disturbance: vegetationSlots,
  wildfire: wildfireSlots,
  agriculture: agricultureSlots,
};
