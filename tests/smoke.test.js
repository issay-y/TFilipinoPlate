import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("project has runnable npm scripts", () => {
  const pkg = JSON.parse(readText("package.json"));

  assert.equal(pkg.scripts.start, "node server.js");
  assert.equal(pkg.scripts.dev, "nodemon server.js");
  assert.match(pkg.scripts.test, /node --test/);
  assert.equal(pkg.scripts["seed:admin"], "node scripts/seedAdmin.js");
});

test("Mongo connection uses env URI without deprecated options", () => {
  const serverSource = readText("server.js");

  assert.match(serverSource, /connect\(process\.env\.MONGODB_URI\)/);
  assert.doesNotMatch(serverSource, /useNewUrlParser|useUnifiedTopology/);
});
