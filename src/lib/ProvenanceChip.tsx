import "@/features/charts/charts.css";

export type Provenance = "real" | "demo" | "todo";

const LABEL: Record<Provenance, string> = { real: "Real", demo: "Demo", todo: "To fill" };

type ProvenanceChipProps = {
  kind: Provenance;
  // Where the value comes from; shown on hover so anyone can check it.
  source?: string;
  // REAL chips can be hidden for a cleaner video; DEMO and TO FILL always show.
  hideReal?: boolean;
};

export const ProvenanceChip = ({ kind, source, hideReal = false }: ProvenanceChipProps) => {
  if (kind === "real" && hideReal) return null;
  return (
    <span className={`c-prov c-prov--${kind}`} title={source} data-testid={`prov-${kind}`}>
      {kind === "demo" ? "Demo data" : LABEL[kind]}
    </span>
  );
};
