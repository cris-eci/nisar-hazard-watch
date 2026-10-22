import { lazy, Suspense } from "react";

import { usePathname } from "@/lib/navigation";

// Pages load on demand: the landing page must not pull in Cesium (the explorer) or vice versa.
const ExplorerPage = lazy(async () => ({
  default: (await import("@/pages/explorer/ExplorerPage")).ExplorerPage,
}));
const LandingPage = lazy(async () => ({
  default: (await import("@/pages/landing/LandingPage")).LandingPage,
}));
const MethodPage = lazy(async () => ({
  default: (await import("@/pages/method/MethodPage")).MethodPage,
}));

// Links shared before the landing page existed point at /?frame=..., so they still open the explorer.
const isLegacyExplorerLink = (): boolean =>
  new URLSearchParams(window.location.search).has("frame");

const CurrentPage = ({ pathname }: { pathname: string }) => {
  if (pathname === "/explore" || isLegacyExplorerLink()) return <ExplorerPage />;
  if (pathname === "/method") return <MethodPage />;
  return <LandingPage />;
};

export const App = () => {
  const pathname = usePathname();
  return (
    <Suspense fallback={<div className="h-dvh bg-[#04070e]" aria-busy="true" />}>
      <CurrentPage pathname={pathname} />
    </Suspense>
  );
};
