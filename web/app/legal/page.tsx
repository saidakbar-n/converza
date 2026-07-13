import type { Metadata } from "next";
import PublicDocumentPage from "@/components/legal/PublicDocumentPage";
import { publicDocuments } from "@/lib/legal/documents";

export const metadata: Metadata = {
  title: "Legal | Converza",
  description: "Converza company information, copyright, governing law, and related notices.",
};

export default function LegalPage() {
  return <PublicDocumentPage document={publicDocuments.legal} />;
}
