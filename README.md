# Dematic Diagram Key Language (DDKL)

## Overview
DDKL is a lightweight, web-based parsing engine and visualizer that converts a human-readable, domain-specific syntax into perfectly styled, interactive flowcharts. It automatically maps generated outputs to strict KION Group Standards and ISO 9001 process standards.

*(Note: For syntax and usage instructions, please open the application and click the **Help / Documentation** button).*

## Architecture & Integration

DDKL operates as a pure client-side application (Vanilla HTML/CSS/JS) and heavily relies on orchestrating several external libraries to achieve its rendering and export capabilities.

### 1. Mermaid.js (Core Rendering)
DDKL acts as a pre-processor for [Mermaid](https://mermaid.js.org/). 
- The custom `parser.js` script sweeps through the DDKL input, builds an intermediate AST, and compiles a raw Mermaid syntax string.
- During compilation, DDKL actively injects Mermaid YAML frontmatter (`--- config: ... ---`) to globally enforce KION brand colors (e.g., `#6E0F4B`) across nodes, edges, subgraphs, and text.
- The compiled string is then passed to `mermaid.render()` asynchronously to generate an SVG object injected directly into the DOM.

### 2. ELK Layout Engine
By default, Mermaid utilizes the Dagre layout algorithm, which can result in messy overlaps for complex process flows.
- DDKL forces the use of the Eclipse Layout Kernel (ELK) for vastly superior orthogonal routing.
- Because the standard CDN build of Mermaid does not bundle ELK, `index.html` utilizes modern ES Modules (`<script type="module">`) to explicitly import both `mermaid` and `@mermaid-js/layout-elk`.
- DDKL registers the ELK loader natively (`mermaid.registerLayoutLoaders`) before the application initializes.

### 3. SVG-Pan-Zoom (Interactivity)
To make massive process flows navigable in the browser, DDKL wraps the raw Mermaid SVG output with [svg-pan-zoom](https://github.com/bumbu/svg-pan-zoom).
- DDKL actively strips Mermaid's hardcoded inline dimensions (`max-width`, `height`) so the SVG can scale boundlessly.
- The UI listens to split-panel resizer dragging and CSS transition completion (`transitionend` / timeouts) to trigger `panZoomInstance.resize()`, guaranteeing that the bounding boxes and control icons remain perfectly synced to the DOM container.

### 4. Draw.io (Diagrams.net) Integration
DDKL provides a seamless, one-click export to Draw.io for whiteboarding and further collaboration without manual importing.
- **Payload Construction**: The app packages the DDKL-generated Mermaid string into a JSON payload. Crucially, it attaches an explicit `{ "layout": "elkLayered" }` command, forcing Draw.io's internal layout engine to match the website's ELK rendering.
- **Custom Libraries**: When spawning the Draw.io window, the app appends the `clibs` URL query parameter pointing to the raw GitHub URL of `dematic_library.xml`. This automatically populates the user's Draw.io workspace with custom Dematic shapes.
- **Secure Handoff**: The app waits for Draw.io to broadcast a `ready` event via the Window API, and then securely fires the JSON payload across tabs using `window.postMessage`.