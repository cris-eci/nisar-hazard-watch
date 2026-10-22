type MapLegendProps = { bar: string; scale: string[]; text: string };

// A colour ramp, its tick labels and one line on how to read it.
export const MapLegend = ({ bar, scale, text }: MapLegendProps) => (
  <>
    <div className="x-legend__bar" style={{ background: bar }} aria-hidden="true" />
    <div className="x-legend__scale">
      {scale.map((tick, i) => (
        <span key={i}>{tick}</span>
      ))}
    </div>
    <p className="x-legend__text">{text}</p>
  </>
);
