import { ExplorerPage } from "@/pages/ExplorerPage";
import { LandingPage } from "@/pages/LandingPage";
import { MethodPage } from "@/pages/MethodPage";
import { usePathname } from "@/lib/navigation";

// Links shared before the landing page existed point at /?frame=..., so they still open the explorer.
const isLegacyExplorerLink = (): boolean =>
  new URLSearchParams(window.location.search).has("frame");

export const App = () => {
  const pathname = usePathname();
  if (pathname === "/explore" || isLegacyExplorerLink()) return <ExplorerPage />;
  if (pathname === "/method") return <MethodPage />;
  return <LandingPage />;
};
