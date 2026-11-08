import "@/pages/site/site.css";
import "@/pages/about/about.css";

import { useEffect, useRef } from "react";

import { firstName, initials, TEAM, type TeamMember } from "@/content/team";
import { Link } from "@/lib/Link";
import { useAboutMotion } from "@/pages/about/useAboutMotion";
import { SiteFooter, type FooterColumn } from "@/pages/site/SiteFooter";
import { SiteNav } from "@/pages/site/SiteNav";

const TITLE = "About · NISAR Hazard Watch by Nova Frontier";

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "DATA",
    items: [
      {
        label: "NISAR Observation Plan",
        href: "https://nisar.jpl.nasa.gov/mission/get-to-know-sar/observation-plan/",
      },
      { label: "ASF DAAC", href: "https://search.asf.alaska.edu/" },
      { label: "USGS", href: "https://earthquake.usgs.gov/earthquakes/search/" },
    ],
  },
  {
    title: "CHALLENGE",
    items: [
      { label: "NASA Space Apps 2026", href: "https://www.spaceappschallenge.org/" },
      { label: "Team Nova Frontier", href: "/about" },
    ],
  },
];

const PROJECT_LINKS: { tag: string; title: string; sub: string; href: string }[] = [
  {
    tag: "CODE",
    title: "GitHub repository",
    sub: "cris-eci/nisar-hazard-watch",
    href: "https://github.com/cris-eci/nisar-hazard-watch",
  },
  { tag: "CHALLENGE", title: "Space Apps project page", sub: "", href: "" },
  {
    tag: "HOW IT WORKS",
    title: "Method and validation",
    sub: "One honest question, asked of real radar",
    href: "/method",
  },
];

const degreeShort = (member: TeamMember): string =>
  member.degree === "Systems Engineering" ? "SYSTEMS" : "STATISTICS";

const countBy = (degree: TeamMember["degree"]): number =>
  TEAM.filter((member) => member.degree === degree).length;

const Avatar = ({ member, size }: { member: TeamMember; size: "node" | "card" }) =>
  member.photo === undefined ? (
    <span className={`a-avatar a-avatar--${size} a-avatar--initials`}>{initials(member.name)}</span>
  ) : (
    <img
      className={`a-avatar a-avatar--${size}`}
      src={member.photo}
      alt={size === "card" ? member.name : ""}
      width={size === "card" ? 80 : 56}
      height={size === "card" ? 80 : 56}
    />
  );

// A value the team still has to fill in renders as grey placeholder copy.
type DetailProps = { label: string; value: string | undefined; placeholder: string };

const Detail = ({ label, value, placeholder }: DetailProps) => (
  <div className="a-card__detail">
    <span className="a-card__detail-label">{label}</span>
    <span className={value === undefined ? "a-placeholder" : undefined}>
      {value ?? placeholder}
    </span>
  </div>
);

const ProfileLink = ({ label, href }: { label: string; href: string | undefined }) =>
  href === undefined ? (
    <span className="a-card__link a-card__link--todo">{label}</span>
  ) : (
    <a className="a-card__link" href={href}>
      {label}
    </a>
  );

const MemberCard = ({ member, index }: { member: TeamMember; index: number }) => (
  <article className="a-card" data-card data-testid={`member-${member.handle.slice(1)}`}>
    <span className="a-card__tick a-card__tick--tl" data-tick aria-hidden="true" />
    <span className="a-card__tick a-card__tick--tr" data-tick aria-hidden="true" />
    <span className="a-card__tick a-card__tick--bl" data-tick aria-hidden="true" />
    <span className="a-card__tick a-card__tick--br" data-tick aria-hidden="true" />
    <div className="a-card__top">
      <span>
        MEMBER 0{index + 1} · {degreeShort(member)}
      </span>
      <span className="a-card__status" data-status>
        ACQUIRED
      </span>
    </div>
    <div className="a-card__identity">
      <div className="a-card__avatar" data-avatar>
        <Avatar member={member} size="card" />
      </div>
      <div className="a-card__names" data-dim>
        {member.owner === true && <p className="a-card__owner">TEAM OWNER</p>}
        <h3 className="a-card__name">{member.name}</h3>
        <p className="a-card__handle">{member.handle}</p>
      </div>
    </div>
    <div className="a-card__details" data-dim>
      <Detail label="Degree" value={member.degree} placeholder="" />
      <Detail label="Role" value={member.role} placeholder="Role to fill" />
      <Detail label="Built" value={member.built} placeholder="What they built to fill" />
    </div>
    <div className="a-card__links" data-dim>
      <ProfileLink label="GitHub" href={member.github} />
      <ProfileLink label="LinkedIn" href={member.linkedin} />
    </div>
  </article>
);

const hasPlaceholders = TEAM.some(
  ({ role, built, github, linkedin }) =>
    role === undefined || built === undefined || github === undefined || linkedin === undefined,
);

export const AboutPage = () => {
  const root = useRef<HTMLDivElement>(null);
  useAboutMotion(root);

  useEffect(() => {
    const previous = document.title;
    document.title = TITLE;
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div ref={root} className="site about">
      <a href="#main" className="s-skip">
        Skip to content
      </a>
      <SiteNav page="about" />

      <main id="main">
        <header className="a-hero">
          <div className="a-hero__copy">
            <p className="s-mono-label" data-intro>
              ABOUT · TEAM NOVA FRONTIER
            </p>
            <h1 className="a-hero__title" data-intro>
              Six people, one orbit.
            </h1>
            <p className="a-hero__lead" data-intro>
              NISAR passes over the same ground every 12 days. We built a way to read what changed
              between passes, for the NASA Space Apps Challenge 2026 in Chía, Colombia.
            </p>
            <div className="a-hero__chips" data-intro>
              <span>NASA SPACE APPS 2026</span>
              <span>CHÍA · 4.86° N, 74.05° W</span>
            </div>
          </div>

          <div className="a-orbit" data-intro>
            <div className="a-orbit__ring" aria-hidden="true" />
            <div className="a-orbit__ring a-orbit__ring--inner" aria-hidden="true" />
            <div className="a-orbit__logo">
              <img
                src="/team/nova-frontier-logo.png"
                alt="Nova Frontier team logo"
                width={512}
                height={512}
              />
            </div>
            <div className="a-orbit__nodes" data-orbit aria-hidden="true">
              {TEAM.map((member, k) => {
                const angle = -Math.PI / 2 + (k * 2 * Math.PI) / TEAM.length;
                return (
                  <div
                    key={member.handle}
                    className="a-orbit__slot"
                    style={{
                      left: `${(50 + Math.cos(angle) * 50).toFixed(2)}%`,
                      top: `${(50 + Math.sin(angle) * 50).toFixed(2)}%`,
                    }}
                  >
                    <div className="a-orbit__node" data-node>
                      <Avatar member={member} size="node" />
                      <span>{firstName(member.name).toUpperCase()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </header>

        <section className="a-manifest" aria-labelledby="manifest-heading">
          <div className="a-manifest__head">
            <div>
              <p className="a-manifest__kicker">CREW MANIFEST</p>
              <h2 id="manifest-heading" className="a-manifest__title">
                Scroll to acquire the team.
              </h2>
            </div>
            <p className="a-manifest__count">
              {TEAM.length} MEMBERS · {countBy("Systems Engineering")} SYSTEMS ENGINEERING ·{" "}
              {countBy("Statistical Engineering")} STATISTICS
            </p>
          </div>
          <div className="a-manifest__grid" data-grid>
            <div className="a-sweep" data-scan aria-hidden="true">
              <div className="a-sweep__glow" />
              <div className="a-sweep__line" />
            </div>
            {TEAM.map((member, i) => (
              <MemberCard key={member.handle} member={member} index={i} />
            ))}
          </div>
          {hasPlaceholders && (
            <p className="a-manifest__note">
              Grey text and dashed links are placeholders for the team to fill in.
            </p>
          )}
        </section>

        <section className="a-project" aria-labelledby="project-heading">
          <div className="a-project__intro" data-rise>
            <h2 id="project-heading" className="a-manifest__title">
              The project
            </h2>
            <p>
              A map of surface change after earthquakes, fires, floods and forest loss, built on
              NISAR radar passes. The method and its validation are on their own page.
            </p>
          </div>
          {PROJECT_LINKS.map(({ tag, title, sub, href }) => {
            const body = (
              <>
                <span className="a-link__tag">{tag}</span>
                <span className="a-link__title">{title} ↗</span>
                <span className={sub === "" ? "a-link__sub a-placeholder" : "a-link__sub"}>
                  {sub === "" ? "Link to fill" : sub}
                </span>
              </>
            );
            return (
              <div key={tag} className="a-project__item" data-rise>
                {href === "" ? (
                  <div className="a-link a-link--todo">{body}</div>
                ) : href.startsWith("/") ? (
                  <Link to={href} className="a-link">
                    {body}
                  </Link>
                ) : (
                  <a href={href} className="a-link">
                    {body}
                  </a>
                )}
              </div>
            );
          })}
        </section>
      </main>

      <SiteFooter
        lon={-74.05}
        lat={4.86}
        coordLabel="CHÍA · 4.86° N, 74.05° W"
        kicker="HECHO EN COLOMBIA · MADE IN COLOMBIA"
        headline="From the Andes, reading the ground with NASA's newest radar."
        photo={{
          src: "/footer/cattleya-trianae.jpg",
          tag: "FLOR NACIONAL",
          title: "Cattleya trianae",
          sub: "Colombia's national orchid, found only in the Colombian Andes.",
          credit: "Photo: Mario Carvajal · CC BY 2.0",
          creditHref:
            "https://commons.wikimedia.org/wiki/File:Cattleya_trianae,_Flor_Nacional_de_Colombia.jpg",
        }}
        columns={FOOTER_COLUMNS}
      />
    </div>
  );
};
