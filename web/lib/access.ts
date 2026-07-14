export type DashboardGateDestination = "allow" | "/landing" | "/onboarding" | "/onboarding/reveal";

interface GatePassport {
  onboarding_completed_at?: string | null;
  paywall_status?: "pending" | "stub_completed" | "paid";
}

export function isPublicAppRoute(pathname: string | null) {
  const publicDocumentRoutes = ["/privacy", "/terms", "/legal", "/contact", "/socials"];
  return Boolean(
    pathname?.startsWith("/landing") ||
      pathname?.startsWith("/onboarding") ||
      (pathname ? publicDocumentRoutes.includes(pathname) : false),
  );
}

export function getDashboardGateDestination(ownerUserId: string | null, passport: GatePassport | null) {
  if (!ownerUserId) return "/landing";
  if (!passport?.onboarding_completed_at) return "/onboarding";
  if (passport.paywall_status !== "stub_completed" && passport.paywall_status !== "paid") {
    return "/onboarding/reveal";
  }
  return "allow";
}
