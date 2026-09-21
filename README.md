# Bend 2 for VS Code

Syntax highlighting for [Bend 2](https://github.com/bendlang/bend), plus live
diagnostics, hover and formatting through
[bend2-lsp](https://github.com/don2e4/bend2-lsp), which ships inside the
extension. Nothing else to install.

## Install

Grab the `.vsix` from the [latest release](https://github.com/kbrianps/bend-vscode/releases/latest), then:

```sh
code --install-extension bend-0.1.0.vsix
```

A Marketplace listing is on the way.

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
npm run package   # bend-<version>.vsix
```

## Credits

The language server is [bend2-lsp](https://github.com/don2e4/bend2-lsp) by
don2e4, which bundles the Bend compiler; both are Apache-2.0, like this
extension.
