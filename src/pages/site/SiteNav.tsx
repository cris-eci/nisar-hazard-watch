import { APP_NAME } from "@/lib/appName";
import { Link } from "@/lib/Link";

export type SitePage = "landing" | "cases" | "method" | "about";

type SiteNavProps = {
  page: SitePage;
};

const PAGE_LINKS: { page: SitePage; to: string; label: string; testId: string }[] = [
  { page: "cases", to: "/cases", label: "Cases", testId: "nav-cases" },
  { page: "method", to: "/method", label: "Method", testId: "nav-method" },
  { page: "about", to: "/about", label: "About", testId: "nav-about" },
];

// Over the landing's planet the bar is clear; on text pages it is glass so copy can scroll under it.
export const SiteNav = ({ page }: SiteNavProps) => (
  <nav className={page === "landing" ? "s-nav" : "s-nav s-nav--glass"} aria-label="Main">
    <Link to="/" className="s-nav__mark">
      {APP_NAME}
    </Link>
    <div className="s-nav__links">
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
        {/* Phones keep the short label so the three page links still fit at 390 px. */}
        <span className="s-nav__pill-long">Open the explorer</span>
        <span className="s-nav__pill-short">Explore</span>
      </Link>
    </div>
  </nav>
);
