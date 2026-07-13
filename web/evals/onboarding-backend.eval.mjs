import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const proxySource = readFileSync(
  new URL("../app/api/backend/[...path]/route.ts", import.meta.url),
  "utf8",
);
const errorSource = readFileSync(new URL("../lib/api/errors.ts", import.meta.url), "utf8");

test("backend proxy turns connection failures into an actionable 503", () => {
  assert.match(proxySource, /catch \(error\)/);
  assert.match(proxySource, /status: 503/);
  assert.match(proxySource, /BACKEND_UNAVAILABLE_DETAIL/);
  assert.match(errorSource, /Backend service is offline/);
  assert.match(errorSource, /port 8000/);
});
