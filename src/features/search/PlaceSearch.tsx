import { useId, useState, type KeyboardEvent, type Ref } from "react";

import { TOP_BAR } from "@/content/copyV8";
import { Icon } from "@/features/case-panel/icons";
import type { Case } from "@/features/cases/cases";
import { coordinatePlace, parseLatLon } from "@/features/search/coordinates";
import {
  MIN_QUERY_LENGTH,
  placeSearchMessage,
  searchPlaces,
  type Place,
} from "@/features/search/placesApi";
import { caseHits, searchRows, type SearchRow } from "@/features/search/searchRows";
import { useAsync } from "@/lib/useAsync";

const OSM_COPYRIGHT = "https://www.openstreetmap.org/copyright";

type PlaceSearchProps = {
  cases: readonly Case[];
  // Whether the result list may show; the top bar closes it on a click outside or Esc.
  open: boolean;
  onOpen: (open: boolean) => void;
  onPick: (place: Place) => void;
  onOpenCase: (item: Case) => void;
  inputRef?: Ref<HTMLInputElement>;
};

const tidy = (text: string): string => text.trim().replace(/\s+/g, " ");

/*
 * The top bar's search pill: a combobox that searches only when the text is submitted, because
 * the geocoder forbids type-ahead. Pasted `lat, lon` resolves on the spot without a request, and
 * the known cases the query names join the list as INSTANT rows.
 */
export const PlaceSearch = ({
  cases,
  open,
  onOpen,
  onPick,
  onOpenCase,
  inputRef,
}: PlaceSearchProps) => {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState<string>();
  const [active, setActive] = useState(-1);
  const listId = useId();
  const { state, retry } = useAsync((signal) => searchPlaces(submitted ?? "", signal), submitted);
  const places = state?.status === "success" ? state.data.places : [];
  const hits = submitted === undefined ? [] : caseHits(submitted, cases);
  const rows = searchRows(places, hits);
  const shown = open && submitted !== undefined;
  const canSubmit = tidy(text).length >= MIN_QUERY_LENGTH;

  const choose = (row: SearchRow) => {
    if (row.kind === "case") onOpenCase(row.item);
    else onPick(row.place);
  };

  const submit = () => {
    const next = tidy(text);
    const point = parseLatLon(next);
    if (point !== undefined) {
      onPick(coordinatePlace(point));
      return;
    }
    if (next.length < MIN_QUERY_LENGTH) return;
    setActive(-1);
    onOpen(true);
    if (next !== submitted) setSubmitted(next);
    else if (state?.status === "error") retry();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!shown || rows.length === 0) return;
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((index) => (index + step + rows.length) % rows.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const chosen = shown ? rows[active] : undefined;
      if (chosen !== undefined) choose(chosen);
      else submit();
    }
  };

  const optionId = (index: number) => `${listId}-${index}`;
  const expanded = shown && rows.length > 0;
  return (
    <div className="x-searchpill" data-testid="place-search">
      <div className="x-searchpill__field">
        <Icon name="search" size={16} />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Search a place"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-activedescendant={expanded && active >= 0 ? optionId(active) : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          maxLength={100}
          enterKeyHint="search"
          placeholder={TOP_BAR.searchPlaceholder}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onFocus={() => onOpen(true)}
          onKeyDown={onKeyDown}
          data-testid="place-input"
        />
        <button
          type="button"
          className="x-search__go"
          aria-label="Search"
          disabled={!canSubmit}
          onClick={submit}
          data-testid="place-submit"
        >
          <Icon name="arrow" size={14} />
        </button>
      </div>
      {shown && (
        <div className="x-menu x-menu--search" data-testid="search-menu">
          <div aria-live="polite" className="x-search__status" data-testid="place-status">
            {state?.status === "loading" && <p>Searching…</p>}
            {state?.status === "success" && rows.length === 0 && (
              <p data-testid="place-empty">No place found for “{submitted}”.</p>
            )}
          </div>
          {state?.status === "error" && (
            <div className="x-problem" role="alert" data-testid="place-error">
              <p>{placeSearchMessage(state.error)}</p>
              <div className="x-problem__actions">
                <button type="button" className="x-primary x-primary--small" onClick={retry}>
                  Try again
                </button>
              </div>
            </div>
          )}
          <div
            id={listId}
            role="listbox"
            aria-label="Places"
            className="x-search__list"
            hidden={rows.length === 0}
          >
            {rows.map((row, index) => (
              <div key={row.id} role="presentation">
                <button
                  type="button"
                  id={optionId(index)}
                  role="option"
                  tabIndex={-1}
                  aria-selected={index === active}
                  className="x-search__option"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(row)}
                  data-testid={`place-option-${index}`}
                  data-kind={row.kind}
                >
                  <span className="x-search__name">{row.name}</span>
                  <span
                    className={`x-search__tag x-search__tag--${row.kind}`}
                    data-testid={`place-tag-${index}`}
                  >
                    {row.tag}
                  </span>
                  <span className="x-search__sub">{row.sub}</span>
                  {row.where !== undefined && <span className="x-search__where">{row.where}</span>}
                </button>
              </div>
            ))}
          </div>
          {state?.status === "success" && places.length > 0 && (
            <p className="x-search__credit">
              <a href={OSM_COPYRIGHT} target="_blank" rel="noopener">
                {state.data.attribution}
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
