import type { MouseEvent, ReactNode } from "react";

import { navigate } from "@/lib/navigation";

type LinkProps = { to: string; className?: string; children: ReactNode; testId?: string };

export const Link = ({ to, className, children, testId }: LinkProps) => {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Let the browser handle new-tab and new-window clicks.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    navigate(to);
    window.scrollTo(0, 0);
  };
  return (
    <a href={to} onClick={onClick} className={className} data-testid={testId}>
      {children}
    </a>
  );
};
