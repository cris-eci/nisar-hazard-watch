import { useId } from "react";

type BrandMarkProps = {
  size?: number;
};

// The Meridian mark (Earth with one tilted orbit). Inline so it needs no request; the mask id is
// unique per instance because the landing and the explorer can both render one.
export const BrandMark = ({ size = 22 }: BrandMarkProps) => {
  const maskId = `brand-mark-${useId()}`;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className="brand-mark"
    >
      <mask id={maskId}>
        <rect width="64" height="64" fill="#fff" />
        <path d="M6.6 43.8A28 9 -25 0 0 57.4 20.2" fill="none" stroke="#000" strokeWidth="8" />
      </mask>
      <ellipse
        cx="32"
        cy="32"
        rx="28"
        ry="9"
        transform="rotate(-25 32 32)"
        fill="none"
        stroke="#c9b48b"
        strokeWidth="3.5"
      />
      <circle cx="32" cy="32" r="19" fill="#ebe9e4" mask={`url(#${maskId})`} />
      <path
        d="M6.6 43.8A28 9 -25 0 0 57.4 20.2"
        fill="none"
        stroke="#c9b48b"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
};
