import test from "node:test";
import assert from "node:assert/strict";
import { buildAnalysis } from "../lib/onboarding.ts";
import { getDashboardGateDestination } from "../lib/access.ts";

test("analysis uses real spend math against the Enterprise Pilot plan", () => {
  const analysis = buildAnalysis({
    business_name: "Branch A Brand",
    current_marketing_handler: "agency-freelancer",
    current_marketing_spend: 2000,
    weekly_message_volume: 37,
    primary_pain_point: "Agency is slow",
    primary_goal: "more content",
  });

  assert.equal(analysis.branch, "savings");
  assert.equal(analysis.monthlySavings, 1500);
  assert.match(analysis.headline, /\$2,000\/mo/);
  assert.match(analysis.headline, /\$500\/mo/);
  assert.match(analysis.detail, /\$1,500\/mo back/);
});

test("analysis uses volume framing and leaks no dollar figure when there is no spend", () => {
  const analysis = buildAnalysis({
    business_name: "Branch B Brand",
    current_marketing_handler: "nobody",
    weekly_message_volume: 58,
    primary_pain_point: "Leads wait until morning",
    primary_goal: "faster replies",
  });

  const visibleCopy = `${analysis.headline} ${analysis.detail} ${analysis.goalNote}`;

  assert.equal(analysis.branch, "volume");
  assert.match(analysis.headline, /58 messages a week/);
  assert.match(analysis.goalNote, /Leads wait until morning/);
  assert.match(analysis.goalNote, /faster replies/);
  assert.doesNotMatch(visibleCopy, /\$\d/);
  assert.doesNotMatch(visibleCopy, /\d+\/mo/);
});

test("dashboard gate redirects each Phase A state correctly", () => {
  assert.equal(getDashboardGateDestination(null, null), "/landing");
  assert.equal(
    getDashboardGateDestination("user-1", {
      id: "passport-1",
      org_id: "org-1",
      owner_user_id: "user-1",
      paywall_status: "pending",
      onboarding_completed_at: null,
    }),
    "/onboarding",
  );
  assert.equal(
    getDashboardGateDestination("user-1", {
      id: "passport-1",
      org_id: "org-1",
      owner_user_id: "user-1",
      paywall_status: "pending",
      onboarding_completed_at: "2026-07-08T00:00:00Z",
    }),
    "/onboarding/reveal",
  );
  assert.equal(
    getDashboardGateDestination("user-1", {
      id: "passport-1",
      org_id: "org-1",
      owner_user_id: "user-1",
      paywall_status: "stub_completed",
      onboarding_completed_at: "2026-07-08T00:00:00Z",
    }),
    "allow",
  );
});
