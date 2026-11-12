// Nova's radar-ring mark: gold rings on the dark disc (v7 prototype `NOVA_D`).
export const NOVA_PATH =
  "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM8.5 15.5a5 5 0 0 1 0-7M15.5 8.5a5 5 0 0 1 0 7M5.6 18.4a9 9 0 0 1 0-12.8M18.4 5.6a9 9 0 0 1 0 12.8";

export const NovaGlyph = ({ size = 32 }: { size?: number }) => (
  <span className="x-nova-glyph" style={{ width: size, height: size }} aria-hidden="true">
    <svg
      width={size / 2}
      height={size / 2}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
    >
      <path d={NOVA_PATH} />
    </svg>
  </span>
);
