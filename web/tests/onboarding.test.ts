import test from "node:test";
import assert from "node:assert/strict";
import { buildAnalysis } from "../lib/onboarding.ts";
import { getDashboardGateDestination } from "../lib/access.ts";

test("branch A ghost town handles zero volume without lead-loss copy", () => {
  const analysis = buildAnalysis({
    business_name: "Ghost Town Brand",
    current_marketing_handler: "nobody",
    current_reply_handler: "me",
    weekly_message_volume: 0,
    primary_pain_point: "Nobody knows we exist yet",
    primary_goal: "more leads",
  });

  const visibleCopy = renderAnalysisCopy(analysis);

  assert.equal(analysis.branch, "ghost-town");
  assert.match(analysis.headline, /nothing is creating demand yet/);
  assert.match(analysis.detail, /Nobody knows we exist yet/);
  assert.match(analysis.before, /No content going out, no leads coming in/);
  assert.match(analysis.after, /Milo drafts real marketing content/);
  assert.match(analysis.after, /Vea turns your best ideas into real video ads/);
  assert.match(analysis.after, /nothing publishes without your click/);
  assert.equal(analysis.cta, "See plans built for getting your first leads");
  assert.doesNotMatch(visibleCopy, /Every one of those is a lead/);
  assert.doesNotMatch(visibleCopy, /21x/);
});

test("branch B founder trap uses only the permitted 21x research stat", () => {
  const analysis = buildAnalysis({
    business_name: "Founder Trap Brand",
    current_marketing_handler: "me",
    current_reply_handler: "me",
    weekly_message_volume: 58,
    primary_pain_point: "Leads wait until morning",
    primary_goal: "faster replies",
  });

  const visibleCopy = renderAnalysisCopy(analysis);

  assert.equal(analysis.branch, "founder-trap");
  assert.match(analysis.headline, /58 messages a week/);
  assert.match(analysis.detail, /Harvard Business Review and MIT research/);
  assert.match(analysis.detail, /21x more likely to qualify/);
  assert.match(analysis.after, /Sleyz drafts a reply/);
  assert.match(analysis.after, /You review and approve it before it sends/);
  assert.equal(analysis.cta, "See plans built for faster replies");
  assert.doesNotMatch(visibleCopy, /autonomous publishing/i);
  assert.doesNotMatch(visibleCopy, /checkout link/i);
  assert.doesNotMatch(visibleCopy, /sub-second/i);
});

test("branch C bleeding cash uses real spend math against the Enterprise Pilot plan", () => {
  const analysis = buildAnalysis({
    business_name: "Bleeding Cash Brand",
    current_marketing_handler: "agency-freelancer",
    current_reply_handler: "someone else",
    current_marketing_spend: 2000,
    weekly_message_volume: 37,
    primary_pain_point: "Agency is slow",
    primary_goal: "more content",
  });

  assert.equal(analysis.branch, "bleeding-cash");
  assert.equal(analysis.monthlySavings, 1500);
  assert.match(analysis.headline, /\$2,000\/month/);
  assert.match(analysis.detail, /\$500\/month/);
  assert.match(analysis.detail, /\$1,500\/month back/);
  assert.match(analysis.after, /Milo, Sleyz, and Vea produce your hooks, replies, and videos directly/);
  assert.match(analysis.after, /You review and approve/);
  assert.equal(analysis.cta, "See plans that cost less than what you're paying now");
});

test("branch D fallback reflects user answers and leaks no dollar figure", () => {
  const analysis = buildAnalysis({
    business_name: "Fallback Brand",
    current_marketing_handler: "nobody",
    current_reply_handler: "someone else",
    weekly_message_volume: 7,
    primary_pain_point: "We need more consistent content",
    primary_goal: "more content",
  });

  const visibleCopy = renderAnalysisCopy(analysis);

  assert.equal(analysis.branch, "fallback");
  assert.match(analysis.headline, /We need more consistent content/);
  assert.match(analysis.detail, /more content/);
  assert.match(analysis.after, /Milo drafts real marketing hooks/);
  assert.match(analysis.after, /Sleyz drafts real DM replies/);
  assert.match(analysis.after, /Vea renders real video/);
  assert.match(analysis.after, /You review and approve/);
  assert.equal(analysis.cta, "See plans");
  assert.doesNotMatch(visibleCopy, /\$\d/);
  assert.doesNotMatch(visibleCopy, /\d+\/month/);
  assert.doesNotMatch(visibleCopy, /90%|300%|400%/);
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

function renderAnalysisCopy(analysis: ReturnType<typeof buildAnalysis>) {
  return [
    analysis.headline,
    analysis.detail,
    analysis.goalNote,
    analysis.before,
    analysis.after,
    analysis.cta,
  ].join(" ");
}
