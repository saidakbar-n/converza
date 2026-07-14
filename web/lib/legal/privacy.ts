export interface PrivacyPolicySection {
  title: string;
  content: string[];
  list?: boolean;
}

export const privacyPolicy: {
  lastUpdated: string;
  introduction: string;
  sections: PrivacyPolicySection[];
  disclaimer?: string;
} = {
  lastUpdated: "13.07.2026",
  introduction:
    'Converza ("we," "us," "our") provides an AI-powered marketing, sales, and content platform for businesses. This policy explains what information we collect, how we use it, and the choices you have.',
  sections: [
    {
      title: "Information We Collect",
      content: [
        "Business information you provide: business name, industry, offer description, target audience, location, brand tone and colors, pricing, and related details you submit during onboarding or account setup.",
        "Contact information: your name, email, phone number, and any messaging handles (e.g. Telegram) you provide to reach you.",
        "Usage data: how you interact with the platform, including messages sent to and from your AI agents, approval/edit/reject actions you take on generated content, and general activity logs.",
        "Payment information: when you subscribe to a paid plan, billing details are handled by our payment processor. We do not store full payment card numbers ourselves.",
        "Connected account data: if you connect third-party accounts (e.g. Instagram, Telegram, TikTok), we access only the data needed to provide the connected functionality, as permitted by that platform's own authorization scope.",
      ],
    },
    {
      title: "How We Use Information",
      list: true,
      content: [
        "To operate the platform and generate content, replies, and analysis personalized to your business",
        "To communicate with you about your account, invoices, and support",
        "To improve the reliability and quality of the service",
        "To comply with legal obligations",
      ],
    },
    {
      title: "Third-Party Services",
      content: [
        "We use third-party infrastructure providers to operate Converza, including database and authentication hosting, AI model providers for generating content and replies, and video rendering services. These providers process data only as needed to deliver the platform's functionality and are not permitted to use your data for their own purposes.",
      ],
    },
    {
      title: "Data Retention",
      content: [
        "We retain your business and usage data for as long as your account is active, and for a reasonable period afterward as needed for legal, billing, or support purposes. You may request deletion at any time (see Your Rights below).",
      ],
    },
    {
      title: "Your Rights",
      content: [
        "You may request access to, correction of, or deletion of your personal and business data by contacting us using the information on our Contact page. We will respond within a reasonable timeframe.",
      ],
    },
    {
      title: "International Data",
      content: [
        "Converza is operated from Uzbekistan and may use infrastructure providers located in other countries. By using Converza, you consent to your data being processed in these locations.",
      ],
    },
    {
      title: "Changes to This Policy",
      content: [
        "We may update this policy from time to time. Material changes will be communicated through the platform or by direct contact.",
      ],
    },
    {
      title: "Contact",
      content: [
        "Questions about this policy can be directed to the contact details on our Contact page.",
      ],
    },
  ],
};
