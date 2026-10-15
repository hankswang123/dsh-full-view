# dsh-full-view

A [DeepSeek Harness](https://github.com/nicepkg/deepseek-harness) plugin that adds a **Full View** button to every assistant reply.

Click it to open the complete response in a clean, full-screen overlay — wider layout, comfortable line height, distraction-free reading.

![Full View button](https://img.shields.io/badge/DSH-Plugin-blue)

## Features

- 🔍 **Full View button** added to every assistant message action bar (next to Copy / 👍👎 / Usage)
- 📖 **Full-screen overlay** with centered card layout, 860px max-width, 1.7 line-height
- 🎨 **Theme-aware** — adapts to both light and dark themes using DSH theme tokens
- ⌨️ **Keyboard support** — press `Esc` to close; click backdrop to dismiss
- 🪶 **Lightweight** — zero dependencies, pure vanilla JS + React.createElement

## Install

### From npm (after publishing)

In the DSH Settings → Plugins page, install the package:

```
dsh-full-view
```

Or via the CLI:

```bash
dsh plugin install dsh-full-view
```

### From GitHub

```bash
dsh plugin install github:hankswang123/dsh-full-view
```

### From local directory

```bash
dsh plugin install /path/to/dsh-full-view
```

## How it works

The plugin registers two slot entries:

1. **`conversation.chat.assistant-actions`** — the Full View expand button (order: 50)
2. **`shell.overlay`** — the full-screen overlay component

When clicked, the button locates the current turn's assistant-step DOM nodes, clones their rendered content, and displays it in the overlay — preserving the original markdown styling.

## Development

```bash
# Clone and link for development
git clone https://github.com/hankswang123/dsh-full-view.git
cd dsh-full-view
dsh plugin install .
```

## License

MIT
