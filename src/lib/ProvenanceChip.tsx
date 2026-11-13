import "@/features/charts/charts.css";

import { chipTitle, CHIPS, isChipHidden, type Provenance } from "@/lib/provenanceChips";

export type { Provenance } from "@/lib/provenanceChips";

type ProvenanceChipProps = {
  kind: Provenance;
  // Where the value comes from; shown on hover so anyone can check it.
  source?: string;
  // REAL chips can be hidden for a cleaner video; every other kind always shows.
  hideReal?: boolean;
};

export const ProvenanceChip = ({ kind, source, hideReal = false }: ProvenanceChipProps) => {
  if (isChipHidden(kind, hideReal)) return null;
  const chip = CHIPS[kind];
  return (
    <span
      className={`c-prov c-prov--${chip.look}`}
      title={chipTitle(kind, source)}
      data-testid={chip.testId}
    >
      {chip.text}
    </span>
  );
};
