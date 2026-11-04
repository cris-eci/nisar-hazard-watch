import { APP_NAME } from "@/lib/appName";
import { Link } from "@/lib/Link";

type SitePage = "landing" | "method" | "about";

type SiteNavProps = {
  page: SitePage;
};

const PAGE_LINKS: { page: SitePage; to: string; label: string; testId?: string }[] = [
  { page: "method", to: "/method", label: "Method" },
  { page: "about", to: "/about", label: "About", testId: "nav-about" },
];

// Over the landing's planet the bar is clear; on text pages it is glass so copy can scroll under it.
export const SiteNav = ({ page }: SiteNavProps) => (
  <nav className={page === "landing" ? "s-nav" : "s-nav s-nav--glass"} aria-label="Main">
    <Link to="/" className="s-nav__mark">
      {APP_NAME}
    </Link>
    <div className="s-nav__links">
      {/* From another page a full load, on purpose: the events sit below the pinned story. */}
      {page !== "about" && (
        <a
          href={page === "landing" ? "#events" : "/#events"}
          className="s-nav__link s-nav__link--events"
        >
          Events
        </a>
      )}
      {PAGE_LINKS.map(({ page: target, to, label, testId }) =>
        target === page ? (
          <a key={to} href={to} className="s-nav__link" aria-current="page" data-testid={testId}>
            {label}
          </a>
        ) : (
          <Link key={to} to={to} className="s-nav__link" testId={testId}>
            {label}
          </Link>
        ),
      )}
      <Link to="/explore" className="s-nav__pill" testId="nav-explore">
        Open the globe
      </Link>
    </div>
  </nav>
);
