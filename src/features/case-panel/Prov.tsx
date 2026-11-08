import { useContext } from "react";

import { ShowRealContext } from "@/features/case-panel/showReal";
import { ProvenanceChip, type Provenance } from "@/lib/ProvenanceChip";

type ProvProps = { kind: Provenance; source: string };

export const Prov = ({ kind, source }: ProvProps) => (
  <ProvenanceChip kind={kind} source={source} hideReal={!useContext(ShowRealContext)} />
);
