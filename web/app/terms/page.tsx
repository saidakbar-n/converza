import type { Metadata } from "next";
import PublicDocumentPage from "@/components/legal/PublicDocumentPage";
import { publicDocuments } from "@/lib/legal/documents";

export const metadata: Metadata = {
  title: "Terms of Service | Converza",
  description: "The terms that govern use of the Converza service.",
};

export default function TermsOfServicePage() {
  return <PublicDocumentPage document={publicDocuments.terms} />;
}
