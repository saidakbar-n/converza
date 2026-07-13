import type { Metadata } from "next";
import PublicDocumentPage from "@/components/legal/PublicDocumentPage";
import { publicDocuments } from "@/lib/legal/documents";

export const metadata: Metadata = {
  title: "Contact | Converza",
  description: "Contact Converza in Tashkent by phone or Telegram.",
};

export default function ContactPage() {
  return <PublicDocumentPage document={publicDocuments.contact} />;
}
