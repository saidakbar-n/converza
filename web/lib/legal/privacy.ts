export interface PrivacyPolicySection {
  title: string;
  content: string[];
  list?: boolean;
}

export const privacyPolicy: {
  lastUpdated: string;
  introduction: string;
  sections: PrivacyPolicySection[];
  disclaimer: string;
} = {
  lastUpdated: "13.07.2026",
  introduction:
    'Converza ("we," "us," "our") provides an AI-powered marketing, sales, and content platform for businesses. This policy explains what information we collect, how we use it, and the choices you have.',
  sections: [
    {
      title: "Information We Collect",
      content: [
        "Account information: name, email, business name, and contact details you provide when you register.",
        "Business information (Brand Passport): the details you provide during onboarding - your industry, offer, target audience, pricing, tone of voice, and related business context - which our AI agents use to generate work on your behalf.",
        "Usage data: messages you send to your agents, content you approve, reject, or edit, and general activity on the platform.",
        "Communications data: if you connect a messaging channel (such as Telegram) to Sleyz, we process the messages exchanged with your customers in order to draft and send responses on your behalf.",
      ],
    },
    {
      title: "How We Use Information",
      list: true,
      content: [
        "To operate the platform and power your AI agents (Milo, Sleyz, Vea)",
        "To generate, store, and present content and recommendations specific to your business",
        "To process payments and manage your subscription",
        "To provide customer support",
        "To improve and maintain the reliability of the service",
      ],
    },
    {
      title: "Third-Party Processors",
      content: [
        "We use third-party services to deliver Converza, including infrastructure providers for hosting and data storage, AI model providers for generating content and responses, and video rendering services for content creation. When you connect a social or messaging channel, we also interact with that platform's own systems on your behalf. We do not sell your data to third parties for advertising purposes.",
      ],
    },
    {
      title: "Data Retention",
      content: [
        "We retain your business information and usage data for as long as your account is active, and for a reasonable period afterward as needed for legal, accounting, or legitimate business purposes. You may request deletion of your data at any time (see Section 7).",
      ],
    },
    {
      title: "Security",
      content: [
        "We apply reasonable technical and organizational safeguards to protect your information, including access controls and encrypted credential storage. No system is completely secure, and we cannot guarantee absolute security.",
      ],
    },
    {
      title: "International Data Transfers",
      content: [
        "Converza is based in Tashkent, Uzbekistan. If you are located outside Uzbekistan, your information may be processed in Uzbekistan or in other countries where our service providers operate.",
      ],
    },
    {
      title: "Your Rights",
      content: [
        "You may request access to, correction of, or deletion of your personal and business data by contacting us at the details below.",
      ],
    },
    {
      title: "Cookies",
      content: [
        "We use basic cookies and similar technologies to keep you signed in and to understand general usage of the platform.",
      ],
    },
    {
      title: "Changes to This Policy",
      content: [
        "We may update this policy from time to time. We will post the updated version on this page with a revised date.",
      ],
    },
    {
      title: "Contact",
      content: [
        "Questions about this policy can be sent to the contact details listed on our Contact page.",
      ],
    },
  ],
  disclaimer:
    "This document is a starting template appropriate for an early-stage product. It has not been reviewed by a lawyer. Before processing real customer payments at scale or expanding into new jurisdictions, have this reviewed by qualified legal counsel familiar with data protection requirements in the regions you operate in.",
};
