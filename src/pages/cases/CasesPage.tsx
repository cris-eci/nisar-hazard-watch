import "@/pages/site/site.css";
import "@/pages/cases/cases.css";

import { useEffect, useRef, useState } from "react";

import { CASES, findLens, type Case, type Verdict } from "@/features/cases/cases";
import { HazardIcon } from "@/features/cases/HazardIcon";
import { ContrastBars } from "@/features/charts/ContrastBars";
import { Link } from "@/lib/Link";
import { ProvenanceChip } from "@/lib/ProvenanceChip";
import {
  caseHref,
  filterCases,
  filterOptions,
  HAZARD_ROW,
  statSource,
  VERDICT_LABEL,
  type CaseFilter,
} from "@/pages/cases/casesView";
import { useCasesMotion } from "@/pages/cases/useCasesMotion";
import { SiteFooter } from "@/pages/site/SiteFooter";
import { SiteNav } from "@/pages/site/SiteNav";

const TITLE = "Measured cases · NISAR Hazard Watch";

const OPTIONS = filterOptions();

const VerdictGlyph = ({ verdict }: { verdict: Verdict }) => (
  <span className={`k-glyph k-glyph--${verdict}`} aria-hidden="true" />
);

const CaseCard = ({ item }: { item: Case }) => {
  const pending = item.pending === true;
  const source = item.sources[0];
  const group = item.groups?.[0];
  return (
    <article
      className={pending ? "k-card k-card--pending" : "k-card"}
      data-card
      data-testid={`case-card-${item.id}`}
    >
      <div className="k-card__head">
        <span className={pending ? "k-icon k-icon--dashed" : "k-icon"}>
          <HazardIcon id={item.hazard} size={18} />
        </span>
        <div className="k-card__titles">
          <p className="k-card__kicker">
            {item.region} · {item.when}
          </p>
          <h2 className="k-card__title">
            {item.name}, {item.place}
          </h2>
        </div>
      </div>

      <div className="k-card__chips">
        <span className="k-chip">{findLens(item.lens)?.chip}</span>
        <span className="k-chip k-chip--verdict">
          <VerdictGlyph verdict={item.verdict} />
          {VERDICT_LABEL[item.verdict]}
        </span>
        {pending ? (
          // Same dashed look as TO FILL: nothing is measured, and it can never be hidden.
          <span
            className="c-prov c-prov--todo"
            title="Event context only. The SGC facts and the NISAR frame are still to fill."
            data-testid="prov-pending"
          >
            Pending
          </span>
        ) : (
          <ProvenanceChip kind="real" source={statSource(item)} />
        )}
      </div>

      <div className="k-card__stat">
        <div>
          <p className="k-card__value">{item.stat}</p>
          <p className="k-card__line">{item.statLine}</p>
        </div>
        {item.crops !== undefined && (
          <img
            className="k-card__thumb"
            src={item.crops.change}
            alt={`Radar change map over ${item.name}, from the science team's report`}
            title="Radar change crop from the NISAR-Modeling report"
            width={72}
            height={72}
            loading="lazy"
          />
        )}
      </div>

      {group !== undefined && <ContrastBars group={group} mode="plain" compact />}

      <p className="k-card__limit">{item.plainLimit}</p>

      <div className="k-card__foot">
        {source !== undefined && (
          <a href={source.href} className="k-card__source" target="_blank" rel="noopener">
            {source.label}
          </a>
        )}
        <Link
          to={caseHref(item)}
          className={pending ? "k-card__cta k-card__cta--ghost" : "k-card__cta"}
          testId={`case-open-${item.id}`}
        >
          {pending ? "See the event" : "Open on the globe"}
        </Link>
      </div>
    </article>
  );
};

export const CasesPage = () => {
  const root = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<CaseFilter>("all");
  useCasesMotion(root, filter);

  useEffect(() => {
    const previous = document.title;
    document.title = TITLE;
    return () => {
      document.title = previous;
    };
  }, []);

  const shown = filterCases(CASES, filter);

  return (
    <div ref={root} className="site cases">
      <a href="#main" className="s-skip">
        Skip to content
      </a>
      <SiteNav page="cases" />

      <main id="main" className="k-main">
        <header className="k-intro" data-intro>
          <p className="k-intro__kicker">MEASURED CASES · REAL NISAR PASSES, PRECOMPUTED</p>
          <h1 className="k-intro__title">Four places, measured honestly.</h1>
          <p className="k-intro__lead">
            Each case compares real radar passes with the place&apos;s own history and, where it
            exists, a second witness. Numbers come from the science team&apos;s published reports.
            Open any case to see it on the globe.
          </p>
        </header>

        <div className="k-filters" role="group" aria-label="Filter by question">
          {OPTIONS.map(({ id, label, icon, count }) => (
            <button
              key={id}
              type="button"
              className="k-filter"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              data-testid={`cases-filter-${id}`}
            >
              {icon !== undefined && <HazardIcon id={icon} size={15} />}
              {label}
              <span className="k-filter__count">{count}</span>
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <p className="k-empty" data-testid="cases-empty">
            No measured case asks this question yet. The lens works on any point in the explorer.
          </p>
        ) : (
          <div className="k-grid" data-testid="cases-grid">
            {shown.map((item) => (
              <CaseCard key={item.id} item={item} />
            ))}
          </div>
        )}

        <section className="k-hazards" data-card aria-labelledby="hazards-heading">
          <div className="k-hazards__copy">
            <p className="k-hazards__kicker">FIVE HAZARDS · ONE ICON SET</p>
            <h2 id="hazards-heading" className="k-hazards__title">
              Landslides are next.
            </h2>
            <p className="k-hazards__body">
              The backend already asks the landslide question: do real passes bracket the event, and
              can the radar see the slope at all? We&apos;ll add a measured case once one passes
              those checks.
            </p>
          </div>
          <ul className="k-hazards__row">
            {HAZARD_ROW.map(({ id, label, hasLens }) => (
              <li key={id} className="k-hazard" data-testid={`hazard-${id}`}>
                <span
                  className={
                    hasLens ? "k-icon k-icon--large" : "k-icon k-icon--large k-icon--dashed"
                  }
                >
                  <HazardIcon id={id} size={22} />
                </span>
                <span>{label}</span>
                {!hasLens && <span className="k-hazard__note">No measured case yet</span>}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <SiteFooter
        lon={73.713}
        lat={32.329}
        coordLabel="QADIRABAD · 32.33° N, 73.71° E"
        kicker="HECHO EN COLOMBIA · MADE IN COLOMBIA"
        headline="Every number here links back to the report it came from."
      />
    </div>
  );
};
