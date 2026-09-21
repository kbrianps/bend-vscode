import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import {
  LanguageClient,
  TransportKind,
  type LanguageClientOptions,
  type ServerOptions,
} from "vscode-languageclient/node";

const BIN = "bend2-lsp";

let client: LanguageClient | undefined;

// a .js file is forked as a node module; anything else is run as is. The
// client adds --stdio itself.
function runs(target: string): ServerOptions {
  return target.endsWith(".js")
    ? { module: target, transport: TransportKind.stdio }
    : { command: target, transport: TransportKind.stdio };
}

function bundled(): string | undefined {
  try {
    return require.resolve("bend2-lsp/dist/server.js");
  } catch {
    return undefined;
  }
}

function onPath(): string | undefined {
  const dirs = (process.env.PATH ?? "").split(path.delimiter);
  return dirs.map((dir) => path.join(dir, BIN)).find((at) => fs.existsSync(at));
}

// the setting, then the server this extension ships with, then the PATH
function server(): string | undefined {
  const set = vscode.workspace.getConfiguration("bend")
    .get<string>("server.path", "").trim();
  return set !== "" ? set : bundled() ?? onPath();
}

async function start(log: vscode.OutputChannel): Promise<void> {
  const found = server();
  if (found === undefined) {
    log.appendLine("no " + BIN + " found: highlighting only. Set"
      + " bend.server.path, or run npm install -g " + BIN + ".");
    return;
  }
  log.appendLine("server: " + found);
  const options: LanguageClientOptions = {
    documentSelector: [{ language: "bend" }],
    outputChannel: log,
  };
  client = new LanguageClient(BIN, "Bend", runs(found), options);
  await client.start();
}

export async function activate(context: vscode.ExtensionContext):
  Promise<void> {
  const log = vscode.window.createOutputChannel("Bend");
  context.subscriptions.push(log,
    vscode.commands.registerCommand("bend.restart", async () => {
      await client?.stop();
      client = undefined;
      await start(log);
    }));
  await start(log);
}

export function deactivate(): Thenable<void> | undefined {
  return client?.stop();
}
