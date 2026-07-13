import type { Metadata } from "next";
import PublicDocumentPage from "@/components/legal/PublicDocumentPage";
import { publicDocuments } from "@/lib/legal/documents";

export const metadata: Metadata = {
  title: "Socials | Converza",
  description: "Follow Converza on Telegram, Instagram, and X.",
};

export default function SocialsPage() {
  return <PublicDocumentPage document={publicDocuments.socials} />;
}
