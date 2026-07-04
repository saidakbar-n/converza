import { Suspense } from "react";
import LoginRedirectPage from "./LoginRedirectPage";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginRedirectPage />
    </Suspense>
  );
}
