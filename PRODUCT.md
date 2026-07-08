# Product

## Register

product

## Users

People who need to send a file to someone else, fast. The context is casual and spontaneous — a quick transfer to a friend, a colleague, or their own second device. They don't want to create an account, install software, or upload to a cloud service that retains their data. They arrive with a link (or generate one), drop a file, and the recipient picks it up. Sessions are short-lived and ephemeral; the relationship between sender and receiver is established by sharing a room link, the same trust model as AirDrop or a one-time magic link. The job to be done: "get this file to that person without friction, without a middleman, and without it lingering anywhere."

## Product Purpose

A peer-to-peer file sharing app built on WebRTC. Files transfer directly between browsers — no server storage, no cloud intermediary, no account. The server exists only as a signaling layer to help peers find each other and establish a direct connection. Once connected, data flows peer-to-peer. The product succeeds when a user can go from "I have a file" to "they have the file" in under a minute, with confidence that the file passed through no third party. Success looks like: open the app, see your room, share the link, drop the file, done.

## Brand Personality

Simple, trustworthy, calm. The tool gets out of the way — it's a utility, not a showcase. Trust is earned through clarity (you can see who's connected, what's transferring, that nothing is stored) rather than through polish or personality. The feeling should be closer to a well-made hand tool than to a consumer app: reliable, quiet, ready when you need it, invisible when you don't. Three words: **honest, effortless, dependable**.

## Anti-references

- **Overdesigned / flashy interfaces.** Gradient heroes, parallax scroll, decorative animations, style-over-substance landing pages. This is a tool; theatrics erode trust.
- **Clunky upload sites.** WeTransfer-style walls of progress bars, account prompts, ad-bloated surfaces, multi-step upload wizards. The friction is the anti-pattern.
- **Generic SaaS dashboards.** Sidebars, card grids, muted-gray data UIs with no identity. The tool should feel purpose-built, not scaffolded from a template.

## Design Principles

1. **Get out of the way.** The shortest path from landing to transfer wins. Every element on screen must justify its presence against the user's single intent: send or receive a file. Decorative scaffolding (eyebrows, stat grids, filler sections) has no place here.
2. **Trust through clarity.** Show what's happening, not what's possible. Connection state, peer identity, transfer progress, and the absence of storage are all visible. Honesty is the design language — no hidden states, no mystery spinners without context.
3. **Calm over clever.** Motion and interaction inform (progress fills, connection establishes, peers appear) rather than decorate. Reduced motion is a first-class state, not an afterthought. Nothing bounces, nothing auto-rotates, nothing competes with the file transfer for attention.
4. **The link is the product.** The room link is the primary affordance — creating it, sharing it, joining through it. It should be effortless to generate, effortless to copy, and effortless to open. The link-sharing moment is the core interaction; design around it.

## Accessibility & Inclusion

Target WCAG 2.1 AA compliance: body text contrast ≥4.5:1, large text ≥3:1, keyboard-navigable throughout, visible focus states, semantic landmarks. `prefers-reduced-motion` is respected on every animated element — transitions degrade to instant or crossfade, never to a frozen or janky state. Drag-and-drop interfaces must have accessible keyboard/file-picker alternatives. Color is never the sole carrier of state (connection status, transfer progress) — pair it with an icon or text label.
