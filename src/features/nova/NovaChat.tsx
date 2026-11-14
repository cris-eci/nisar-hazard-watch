import { useEffect, useRef, useState, type FormEvent } from "react";

import { Icon } from "@/features/case-panel/icons";
import type { ChartMode } from "@/features/charts/chartTokens";
import { NovaGlyph } from "@/features/nova/NovaGlyph";
import { useBubbleLift } from "@/features/nova/useBubbleLift";
import {
  novaAnswer,
  suggestionsFor,
  type NovaContext,
  type NovaReply,
} from "@/features/nova/novaAnswer";
import { ProvenanceChip } from "@/lib/ProvenanceChip";

const THINK_MS = 650;
const REDUCED_THINK_MS = 100;
const NOVA_SOURCE =
  "Rule-based answers from the data on screen. Real version: a language model that cites the case sources";

type Message = { id: number; q: string; reply: NovaReply | undefined };

type NovaChatProps = {
  open: boolean;
  context: NovaContext;
  // What Nova is looking at, e.g. "Qadirabad · Did it flood? · Changed beyond its normal range".
  lookingAt: string;
  mode: ChartMode;
  reduceMotion: boolean;
  onMode: (mode: ChartMode) => void;
  onOpen: (open: boolean) => void;
};

// The bottom-right bubble and its 380 × 540 chat (SPECS §1, §3 "Nova no-data", §6; SPECS-v8 §10).
export const NovaChat = ({
  open,
  context,
  lookingAt,
  mode,
  reduceMotion,
  onMode,
  onOpen,
}: NovaChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const lift = useBubbleLift(bubbleRef);
  const nextId = useRef(0);
  // The reply reads what is on screen when it lands, not when the question was asked.
  const latest = useRef(context);
  useEffect(() => {
    latest.current = context;
  });
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const ask = (question: string) => {
    const q = question.trim();
    if (q === "") return;
    const id = nextId.current++;
    setDraft("");
    setMessages((list) => [...list, { id, q, reply: undefined }]);
    const timer = window.setTimeout(
      () => {
        const reply = novaAnswer(q, latest.current);
        setMessages((list) => list.map((item) => (item.id === id ? { ...item, reply } : item)));
      },
      reduceMotion ? REDUCED_THINK_MS : THINK_MS,
    );
    timers.current.push(timer);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    ask(draft);
  };

  const hasSelection =
    context.subject !== undefined || context.pending !== undefined || context.running;

  return (
    <>
      {open && (
        <div className="x-nova" role="dialog" aria-label="Ask Nova" data-testid="nova">
          <header className="x-nova__head">
            <NovaGlyph size={32} />
            <span className="x-nova__name">Nova</span>
            <ProvenanceChip kind="demo" source={NOVA_SOURCE} />
            <span className="x-top__fill" />
            <div role="group" aria-label="Answer style" className="x-switch x-switch--small">
              {(["plain", "technical"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={mode === value}
                  onClick={() => onMode(value)}
                  data-testid={`nova-${value}`}
                >
                  {value === "plain" ? "Plain" : "Technical"}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="x-round"
              onClick={() => onOpen(false)}
              aria-label="Close Nova"
              data-testid="nova-close"
            >
              <Icon name="close" size={13} />
            </button>
          </header>
          <p className="x-nova__rule" data-testid="nova-rule">
            Rule-based assistant · not an AI model yet
          </p>
          <p className="x-nova__context">Looking at · {lookingAt}</p>
          <div className="x-nova__list" ref={listRef} data-testid="nova-messages">
            {messages.length === 0 && (
              <p className="x-nova__empty">
                I know what's on screen: the place, the question, the passes and the result. I cite
                a source for every answer and say so when there's no data.
              </p>
            )}
            {messages.map((message) => (
              <div key={message.id} className="x-nova__turn">
                <p className="x-nova__q">{message.q}</p>
                <Reply reply={message.reply} />
              </div>
            ))}
          </div>
          <div className="x-nova__foot">
            <div className="x-nova__chips">
              {suggestionsFor(hasSelection, context.card !== undefined).map((label) => (
                <button
                  key={label}
                  type="button"
                  className="x-nova__chip"
                  onClick={() => ask(label)}
                  data-testid="nova-suggestion"
                >
                  {label}
                </button>
              ))}
            </div>
            <form className="x-nova__form" onSubmit={submit}>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about this place or result"
                aria-label="Ask Nova"
                data-testid="nova-input"
              />
              <button type="submit" aria-label="Send" data-testid="nova-send">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 19V5M6 11l6-6 6 6" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
      <button
        type="button"
        ref={bubbleRef}
        className="x-nova-bubble"
        style={lift === undefined ? undefined : { bottom: lift }}
        onClick={() => onOpen(!open)}
        aria-label={open ? "Close Nova" : "Ask Nova"}
        aria-expanded={open}
        data-testid="nova-bubble"
      >
        {open ? <Icon name="close" size={20} /> : <NovaGlyph size={56} />}
      </button>
    </>
  );
};

const Reply = ({ reply }: { reply: NovaReply | undefined }) => {
  if (reply === undefined)
    return (
      <p className="x-nova__thinking" role="status">
        Reading the result…
      </p>
    );
  if (reply.kind === "nodata")
    return (
      <div className="x-nova__nodata" data-testid="nova-nodata">
        <p className="x-kicker">No data</p>
        <p>{reply.text}</p>
      </div>
    );
  return (
    <div className="x-nova__answer" data-testid="nova-answer">
      <p>{reply.text}</p>
      {reply.fields.length > 0 && (
        <p className="x-nova__fields" data-testid="nova-fields">
          On screen · {reply.fields.join(" · ")}
        </p>
      )}
      <div className="x-nova__cites">
        {reply.cites.map((cite) => (
          <a key={cite.href} href={cite.href} target="_blank" rel="noopener">
            <span>{cite.n}</span>
            {cite.label}
          </a>
        ))}
      </div>
    </div>
  );
};
