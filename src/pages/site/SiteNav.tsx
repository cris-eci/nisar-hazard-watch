import { APP_NAME } from "@/lib/appName";
import { Link } from "@/lib/Link";

type SiteNavProps = {
  page: "landing" | "method";
};

// Over the landing's planet the bar is clear; on text pages it is glass so copy can scroll under it.
export const SiteNav = ({ page }: SiteNavProps) => (
  <nav className={page === "landing" ? "s-nav" : "s-nav s-nav--glass"} aria-label="Main">
    <Link to="/" className="s-nav__mark">
      {APP_NAME}
    </Link>
    <div className="s-nav__links">
      {/* From the method page a full load, on purpose: the events sit below the pinned story. */}
      <a
        href={page === "landing" ? "#events" : "/#events"}
        className="s-nav__link s-nav__link--events"
      >
        Events
      </a>
      {page === "method" ? (
        <a href="/method" className="s-nav__link" aria-current="page">
          Method
        </a>
      ) : (
        <Link to="/method" className="s-nav__link">
          Method
        </Link>
      )}
      <Link to="/explore" className="s-nav__pill" testId="nav-explore">
        Open the globe
      </Link>
    </div>
  </nav>
);
