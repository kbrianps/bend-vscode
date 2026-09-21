# Bend 2 for VS Code

Syntax highlighting for [Bend 2](https://github.com/bendlang/bend), plus live
diagnostics, hover and formatting through
[bend2-lsp](https://github.com/don2e4/bend2-lsp), which ships inside the
extension. Nothing else to install.

## Install

Search for **Bend 2** in the extensions view, or:

```sh
code --install-extension kbrianps.bend2
```

It is on the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=kbrianps.bend2)
and on [Open VSX](https://open-vsx.org/extension/kbrianps/bend2) (VSCodium,
Cursor and friends). Each [release](https://github.com/kbrianps/bend-vscode/releases/latest)
also carries the `.vsix`.

## What you get

- **Highlighting.** The grammar carries the scopes of
  `bend2/docs/bend.sublime-syntax`, the syntax the Bend papers use for their
  code blocks, so a `.bend` file looks the way the papers do. It adds three
  things the sublime syntax leaves out: `~` (the template sigil) is an
  operator, `.|.` `.^.` `.&.` are one operator each, and a `0x` package hash
  is a number.
- **Errors as you type.** bend2-lsp runs the Bend checker 250 ms after an
  edit, on the buffer rather than the file on disk, and rechecks the files
  that import it.
- **Hover** on definitions and syntax.
- **Formatting**, the whole document. To format on save:

  ```json
  "[bend]": { "editor.formatOnSave": true }
  ```

- **Editing basics:** `#` comments with `Ctrl+/`, bracket pairs, indent after
  a line ending in `:`, dedent on `case`, and `U32.show` selects as one word.

## Settings

| Setting | Default | |
|---|---|---|
| `bend.server.path` | empty | A `bend2-lsp` executable or its `server.js`. Empty uses the bundled one, then `bend2-lsp` on the PATH. |

`Bend: Restart Language Server` restarts it, which picks up a new
`bend.server.path` too.

## Building

```sh
npm ci
npm test          # the grammar, and the bundled server over stdio
npm run package   # bend2-<version>.vsix
```

## Releasing

Dependabot opens a PR when bend2-lsp publishes a new version; merge it once
CI is green. Then:

```sh
npm version patch   # bumps package.json, commits, tags vX.Y.Z
git push --follow-tags
```

The tag builds the `.vsix` and publishes it as a release, with the bundled
bend2-lsp version in its notes.

## Credits

The language server is [bend2-lsp](https://github.com/don2e4/bend2-lsp) by
don2e4, which bundles the Bend compiler; both are Apache-2.0, like this
extension.
