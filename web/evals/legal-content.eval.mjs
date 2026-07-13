import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const documentsSource = readFileSync(new URL("../lib/legal/documents.ts", import.meta.url), "utf8");
const privacySource = readFileSync(new URL("../lib/legal/privacy.ts", import.meta.url), "utf8");
const landingSource = readFileSync(new URL("../app/landing/page.tsx", import.meta.url), "utf8");
const allCopy = `${documentsSource}\n${privacySource}`;

test("public document content is complete, dated, and truthful", () => {
  assert.doesNotMatch(allCopy, /\[DATE\]/);
  assert.doesNotMatch(allCopy, /19 agents|all 19|unlimited inbound|autonomous publishing/i);
  assert.match(allCopy, /Milo for marketing, Sleyz for sales, and Vea for video/);
  assert.match(allCopy, /staged for your review before anything is sent/);
  assert.match(allCopy, /Republic of Uzbekistan/);
  assert.match(allCopy, /\+998 77 177 78 10/);
  assert.match(allCopy, /https:\/\/t\.me\/converza_ai/);
  assert.match(allCopy, /https:\/\/instagram\.com\/converza\.ai/);
  assert.match(allCopy, /https:\/\/x\.com\/getconverza/);
  assert.match(landingSource, /href=\{getFooterLinkHref\(link\)\}/);
});
