import { redirect } from "next/navigation";

/** Legacy route — Master Feed is always visible in the Theater layout. */
export default function CopilotRedirectPage() {
  redirect("/");
}
