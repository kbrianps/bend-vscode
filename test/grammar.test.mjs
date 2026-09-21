import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const oniguruma = require("vscode-oniguruma");
const textmate = require("vscode-textmate");

const wasm = fs.readFileSync(require.resolve("vscode-oniguruma/release/onig.wasm"));
await oniguruma.loadWASM(wasm.buffer);
const registry = new textmate.Registry({
  onigLib: Promise.resolve({
    createOnigScanner: (s) => new oniguruma.OnigScanner(s),
    createOnigString: (s) => new oniguruma.OnigString(s),
  }),
  loadGrammar: async () => textmate.parseRawGrammar(
    fs.readFileSync("syntaxes/bend.tmLanguage.json", "utf8"), "bend.json"),
});
const grammar = await registry.loadGrammar("source.bend");

// the innermost scope of every token of a line, by its text
function scopes(line) {
  const out = new Map();
  for (const t of grammar.tokenizeLine(line, textmate.INITIAL).tokens) {
    const text = line.slice(t.startIndex, t.endIndex).trim();
    if (text !== "") out.set(text, t.scopes.at(-1));
  }
  return out;
}

test("a definition names its function, its kinds and its quantities", () => {
  const s = scopes("def length(a, -A: Kind(a), xs: List<&2, A>) -> Nat:");
  assert.equal(s.get("def"), "keyword.control.bend");
  assert.equal(s.get("length"), "entity.name.function.bend");
  assert.equal(s.get("Kind"), "storage.type.bend");
  assert.equal(s.get("&2"), "constant.numeric.bend");
  assert.equal(s.get("->"), "keyword.operator.bend");
});

test("laws, holes and rewrites", () => {
  assert.equal(scopes("law add_zero:").get("add_zero"), "entity.name.function.bend");
  assert.equal(scopes("  ?TODO").get("?TODO"), "variable.other.hole.bend");
  assert.equal(scopes("  %e : {a == _ : Nat}").get("=="), "keyword.operator.bend");
});

test("the additions over the sublime syntax", () => {
  assert.equal(scopes("twice(~f, 1)").get("~"), "keyword.operator.bend");
  assert.equal(scopes("(a .|. b : U32)").get(".|."), "keyword.operator.bend");
  assert.equal(scopes("import 0xdeadbeef/x.bend as X").get("0xdeadbeef"),
    "constant.numeric.bend");
});

test("literals and comments", () => {
  const s = scopes("x = \"a\\n\" ++ 'c' # note");
  assert.equal(s.get("\\n"), "constant.character.escape.bend");
  assert.equal(s.get("'c'"), "string.quoted.single.bend");
  assert.equal(s.get("# note"), "comment.line.number-sign.bend");
  assert.equal(scopes("[1.5, 3n, 42]").get("3n"), "constant.numeric.bend");
});
