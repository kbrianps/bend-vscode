import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

// the server this extension ships, spoken to as the extension does
function connect() {
  const child = spawn(process.execPath, [
    require.resolve("bend2-lsp/dist/server.js"), "--stdio"]);
  let buf = Buffer.alloc(0);
  const waiting = [];
  const seen = [];
  child.stdout.on("data", (d) => {
    buf = Buffer.concat([buf, d]);
    for (;;) {
      const head = buf.indexOf("\r\n\r\n");
      if (head < 0) return;
      const len = Number(/Content-Length: (\d+)/.exec(buf.subarray(0, head))[1]);
      if (buf.length < head + 4 + len) return;
      const msg = JSON.parse(buf.subarray(head + 4, head + 4 + len).toString());
      buf = buf.subarray(head + 4 + len);
      seen.push(msg);
      for (const w of waiting.splice(0)) w();
    }
  });
  let id = 0;
  const send = (method, params, ask) => {
    const msg = { jsonrpc: "2.0", method, params, ...(ask ? { id: ++id } : {}) };
    const body = Buffer.from(JSON.stringify(msg));
    child.stdin.write("Content-Length: " + body.length + "\r\n\r\n");
    child.stdin.write(body);
    return msg.id;
  };
  const until = (ok, ms = 15000) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timed out")), ms);
    const look = () => {
      const got = seen.find(ok);
      if (got) { clearTimeout(timer); resolve(got); } else waiting.push(look);
    };
    look();
  });
  return { child, send, until };
}

test("the shipped server reports an error and formats", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bend-vscode-"));
  const file = path.join(dir, "t.bend");
  const text = "import Base\n\ndef  f( x:U32 )->String:\n  x\n";
  fs.writeFileSync(file, text);
  const uri = pathToFileURL(file).href;
  const lsp = connect();
  try {
    const init = lsp.send("initialize", { processId: process.pid, rootUri: null,
      capabilities: {} }, true);
    await lsp.until((m) => m.id === init);
    lsp.send("initialized", {});
    lsp.send("textDocument/didOpen", { textDocument: { uri, languageId: "bend",
      version: 1, text } });
    const diag = await lsp.until((m) => m.method === "textDocument/publishDiagnostics"
      && m.params.uri === uri && m.params.diagnostics.length > 0);
    assert.equal(diag.params.diagnostics[0].range.start.line, 3);
    const fmt = lsp.send("textDocument/formatting", { textDocument: { uri },
      options: { tabSize: 2, insertSpaces: true } }, true);
    const edits = (await lsp.until((m) => m.id === fmt)).result;
    assert.match(edits[0].newText, /def f\(x: U32\) -> String:/);
  } finally {
    lsp.child.kill();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
