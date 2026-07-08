export const PLAN_PRICES = {
  basic: 200,
  pilot: 500,
  operatingSystem: 1500,
};

export const PRICING_TIERS = [
  {
    id: "basic",
    name: "Basic",
    price: "$200",
    amount: PLAN_PRICES.basic,
    note: "Best for small businesses testing the concept.",
    features: ["Brand Vault starter setup", "Core copy generation", "Manual approval queue"],
  },
  {
    id: "pilot",
    name: "Enterprise Pilot",
    price: "$500",
    amount: PLAN_PRICES.pilot,
    note: "Full campaign. Prove the ROI before going deeper.",
    featured: true,
    features: ["Campaign buildout", "Video workflow", "DM response simulation", "ROI report"],
  },
  {
    id: "operating-system",
    name: "The AI Operating System",
    price: "$1,500/mo",
    amount: PLAN_PRICES.operatingSystem,
    note: "All 19 agents, unlimited DM closing, and dedicated processing.",
    features: ["All 19 agents", "Unlimited inbound DM closing", "Dedicated processing", "Weekly review"],
  },
];
