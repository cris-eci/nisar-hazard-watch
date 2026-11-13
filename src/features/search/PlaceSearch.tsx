import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { Icon } from "@/features/case-panel/icons";
import {
  MIN_QUERY_LENGTH,
  placeSearchMessage,
  searchPlaces,
  type Place,
} from "@/features/search/placesApi";
import { useAsync } from "@/lib/useAsync";

const OSM_COPYRIGHT = "https://www.openstreetmap.org/copyright";

type PlaceSearchProps = { onPick: (place: Place) => void };

const tidy = (text: string): string => text.trim().replace(/\s+/g, " ");

// A combobox that searches when the text is submitted: the provider forbids type-ahead.
export const PlaceSearch = ({ onPick }: PlaceSearchProps) => {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState<string>();
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const { state, retry } = useAsync((signal) => searchPlaces(submitted ?? "", signal), submitted);
  const places = state?.status === "success" ? state.data.places : [];

  useEffect(() => inputRef.current?.focus(), []);

  const submit = () => {
    const next = tidy(text);
    if (next.length < MIN_QUERY_LENGTH) return;
    setActive(-1);
    if (next !== submitted) setSubmitted(next);
    else if (state?.status === "error") retry();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (places.length === 0) return;
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((index) => (index + step + places.length) % places.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const chosen = places[active];
      if (chosen !== undefined) onPick(chosen);
      else submit();
    }
  };

  const optionId = (index: number) => `${listId}-${index}`;
  return (
    <div className="x-search" data-testid="place-search">
      <div className="x-search__field">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Search a place"
          aria-expanded={places.length > 0}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? optionId(active) : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          maxLength={100}
          enterKeyHint="search"
          placeholder="Search a place, then press Enter"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
          data-testid="place-input"
        />
        <button
          type="button"
          className="x-search__go"
          aria-label="Search"
          disabled={tidy(text).length < MIN_QUERY_LENGTH}
          onClick={submit}
          data-testid="place-submit"
        >
          <Icon name="search" size={16} />
        </button>
      </div>
      <div aria-live="polite" className="x-search__status" data-testid="place-status">
        {state?.status === "loading" && <p>Searching…</p>}
        {state?.status === "success" && places.length === 0 && (
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
        hidden={places.length === 0}
      >
        {places.map((place, index) => (
          <div key={place.id} role="presentation">
            <button
              type="button"
              id={optionId(index)}
              role="option"
              tabIndex={-1}
              aria-selected={index === active}
              className="x-search__option"
              onMouseEnter={() => setActive(index)}
              onClick={() => onPick(place)}
              data-testid={`place-option-${index}`}
            >
              <span className="x-search__name">{place.name}</span>
              <span className="x-search__kind">{place.kind}</span>
              <span className="x-search__where">{place.displayName}</span>
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
  );
};
