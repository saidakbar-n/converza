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
    note: "Best for testing the Brand Vault and one focused agent workflow.",
    features: ["Brand Vault starter setup", "Milo campaign hooks", "Manual approval queue"],
  },
  {
    id: "pilot",
    name: "Enterprise Pilot",
    price: "$500",
    amount: PLAN_PRICES.pilot,
    note: "A live pilot using Milo, Sleyz, and Vea on one real campaign.",
    featured: true,
    features: ["Campaign hooks and angles", "Vea video render workflow", "Sleyz DM reply drafts", "HITL approval queue"],
  },
  {
    id: "operating-system",
    name: "The AI Operating System",
    price: "$1,500/mo",
    amount: PLAN_PRICES.operatingSystem,
    note: "Ongoing access to the current three-agent workspace with manual rollout support.",
    features: ["Milo strategy and hooks", "Sleyz objection handling", "Vea video workflow", "Human-approved outputs"],
  },
];
