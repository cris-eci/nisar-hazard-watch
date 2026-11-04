import { Link } from "@/lib/Link";
import { mapOffset } from "@/pages/site/footerMap";

type FooterLink = { label: string; href: string };

export type FooterColumn = { title: string; items: FooterLink[] };

export type FooterPhoto = {
  src: string;
  tag: string;
  title: string;
  sub: string;
  credit: string;
  creditHref: string;
};

type SiteFooterProps = {
  lon: number;
  lat: number;
  coordLabel: string;
  kicker: string;
  headline: string;
  photo: FooterPhoto;
  columns: FooterColumn[];
  note?: string;
  flagStripe?: boolean;
};

const PROJECT: FooterLink[] = [
  { label: "Home", href: "/" },
  { label: "Method", href: "/method" },
  { label: "Explorer", href: "/explore" },
  { label: "About us", href: "/about" },
];

const isInternal = (href: string): boolean => href.startsWith("/");

const FooterAnchor = ({ label, href }: FooterLink) =>
  isInternal(href) ? <Link to={href}>{label}</Link> : <a href={href}>{label}</a>;

export const SiteFooter = ({
  lon,
  lat,
  coordLabel,
  kicker,
  headline,
  photo,
  columns,
  note,
  flagStripe = false,
}: SiteFooterProps) => {
  const { x, y } = mapOffset(lon, lat);
  return (
    <footer className="s-foot" data-testid="site-footer">
      {flagStripe && <div className="s-foot__flag" aria-hidden="true" />}

      <div className="s-foot__orbit" aria-hidden="true">
        <div
          className="s-foot__earth"
          style={{ left: `calc(72% - ${x}px)`, top: `calc(36% - ${y}px)` }}
        />
        <div className="s-foot__scrim" />
        <div className="s-foot__marker" />
        <p className="s-foot__coord">{coordLabel}</p>
      </div>

      <div className="s-foot__body">
        <div className="s-foot__lead">
          <div className="s-foot__intro">
            <p className="s-foot__kicker">{kicker}</p>
            <p className="s-foot__headline">{headline}</p>
            <div className="s-foot__actions">
              <Link to="/explore" className="s-foot__button">
                Open the globe
              </Link>
              <a
                href="https://github.com/cris-eci/nisar-hazard-watch"
                className="s-foot__button s-foot__button--ghost"
              >
                GitHub
              </a>
            </div>
            <div className="s-foot__signature">
              <Link to="/about" className="s-foot__team">
                <img src="/team/nova-frontier-logo.png" alt="" width={44} height={44} />
                <span>Built by Nova Frontier</span>
              </Link>
              <span className="s-foot__divider" aria-hidden="true" />
              <a
                href="https://www.spaceappschallenge.org/"
                className="s-foot__spaceapps"
                aria-label="NASA Space Apps Challenge"
              >
                <img
                  src="/brand/space-apps-horizontal.png"
                  alt="NASA Space Apps Challenge"
                  width={87}
                  height={34}
                />
              </a>
              <span>2026 · Chía</span>
            </div>
          </div>

          <figure className="s-foot__place">
            <img src={photo.src} alt="" width={80} height={80} loading="lazy" />
            <figcaption>
              <span className="s-foot__place-tag">{photo.tag}</span>
              <span className="s-foot__place-title">{photo.title}</span>
              <span className="s-foot__place-sub">{photo.sub}</span>
              <a href={photo.creditHref} className="s-foot__place-credit">
                {photo.credit}
              </a>
            </figcaption>
          </figure>
        </div>

        <div className="s-foot__cols">
          {[{ title: "PROJECT", items: PROJECT }, ...columns].map(({ title, items }) => (
            <nav key={title} className="s-foot__col" aria-label={title}>
              <p className="s-foot__col-title">{title}</p>
              {items.map((item) => (
                <FooterAnchor key={item.label} {...item} />
              ))}
            </nav>
          ))}
        </div>

        {note !== undefined && <p className="s-foot__note">{note}</p>}
      </div>

      <p className="s-foot__wordmark" aria-hidden="true">
        NOVA FRONTIER
      </p>

      <div className="s-foot__base">
        <span>Team Nova Frontier · NASA Space Apps 2026 · Chía</span>
        <span className="s-foot__disclaimer">
          Earth: NASA Blue Marble. NISAR is a joint mission of NASA and ISRO; this project is not
          affiliated with either agency.
        </span>
      </div>
    </footer>
  );
};
