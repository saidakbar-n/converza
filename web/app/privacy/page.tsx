import type { Metadata } from "next";
import PublicDocumentPage from "@/components/legal/PublicDocumentPage";
import { privacyPolicy } from "@/lib/legal/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy | Converza",
  description: "How Converza collects, uses, retains, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <PublicDocumentPage
      document={{
        eyebrow: "Legal",
        title: "Privacy Policy",
        lastUpdated: privacyPolicy.lastUpdated,
        introduction: privacyPolicy.introduction,
        sections: privacyPolicy.sections,
        closing: privacyPolicy.disclaimer,
      }}
    />
  );
}
