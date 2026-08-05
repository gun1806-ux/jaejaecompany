# CLAUDE.md

Guidance for Claude Code (and other AI assistants) working in this repository.

## What this is

The marketing website for **재재컴퍼니 (JaeJae Company)** — a small Korean dev studio
selling four services: mobile apps (Flutter), websites, short-form ad video, and AI
work automation. Live at `jaejaecompany.kr`.

Contact details baked into the page: 대표 박근욱 · 010-2183-0312 · gun1806@gmail.com.

## Architecture — read this before editing

**The entire site is one file: `index.html`.** ~300 lines containing HTML, CSS
(`<style>` in `<head>`), and JS (`<script>` before `</body>`). There is no build step,
no package manager, no framework, no bundler, no tests, no CI. `assets/` holds only PNG
images and a favicon.

```
index.html      # the whole site: markup + CSS + JS
assets/         # bus mascot + expression PNGs, favicons
```

Do **not** introduce a build system, split the file into modules, add npm/`package.json`,
or convert to a framework unless the user explicitly asks. The single-file design is
deliberate — the owner edits and uploads this file directly through the GitHub web UI
(see the commit history: "Add files via upload").

### Client-side routing

Four "pages" are four `<main>` elements — `#v-home`, `#v-services`, `#v-portfolio`,
`#v-contact` — all present in the DOM. Only the one with class `.on` is displayed
(`.view{display:none} .view.on{display:block}`).

Navigation is driven by the `data-go` attribute, not by `href`:

```html
<a class="btn btn-main" data-go="contact">프로젝트 문의하기</a>
```

A single delegated listener wires every `[data-go]` element to `go(page)`, which swaps
the `.on` class, updates the nav underline, and scrolls to top. Consequences to keep in
mind:

- There are **no URLs per page** — no hash, no History API. Deep links, back-button
  navigation, and per-page SEO do not work. Don't claim otherwise.
- Any new page needs three things: a `<main id="v-NAME" class="view">`, a nav
  `<a data-go="NAME">`, and nothing else — `go()` is generic.
- `data-type` on a `[data-go="contact"]` element additionally preselects the inquiry
  type in the contact form. It matches by **substring of the option label**
  (`options[i].text.indexOf(el.dataset.type)`), so `data-type="앱 개발"` matches the
  `📱 앱 개발` option. If you rename a `<select id="type">` option, re-check every
  `data-type` value on the services page.

### Contact form

`sendInq()` does **not** post anywhere. It validates that name/phone/message are
non-empty, then builds a `mailto:` URL with an encoded subject and body and sets
`location.href`. No backend, no analytics, no third-party form service. If the user
wants real submissions, that is a new integration decision — ask before adding one.

## Conventions

- **All user-facing copy is Korean.** Match the existing tone: warm, plain-spoken,
  addressed to 소상공인/창업자, with the 버스(bus)/정류장 metaphor running through it
  ("아이디어에서 출시까지, 한 번에 갑니다", "프로젝트, 태워드릴까요?"). Never replace
  Korean copy with English.
- **CSS lives in the one `<style>` block** and is written compactly — one rule per line,
  no spaces after colons in most declarations. Match that density; don't reformat
  existing rules.
- **Design tokens are CSS custom properties on `:root`**: `--paper` (background
  `#FAF6EC`), `--ink` (`#22262A`), `--sun` (accent yellow `#FFC53D`), `--sun-deep`,
  `--asphalt`, `--stone`, `--line`, `--sky`. Use these, never raw hex, for anything
  themeable.
- **Two fonts, both from CDNs**: Pretendard Variable (body, via jsDelivr) and GmarketSans
  (display, via `webfontworld.github.io`). Headings and the logo use `.disp`.
- **Reusable classes** already exist — prefer them over new ones: `.wrap` (1040px
  centered container), `.card` / `.link-card`, `.btn` + `.btn-main` / `.btn-sun` /
  `.btn-sub` / `.btn-sm`, `.grid2` / `.grid3` / `.grid4`, `.band` (dark CTA block),
  `.svc` (service row), `.meta` (spec list), `.eyebrow`, `.hl` (yellow highlighter
  underline), `.sec-head`.
- **Responsive breakpoints are 860px and 560px**, handled by two media queries at the end
  of the stylesheet. Add new grid collapses there rather than inventing a third
  breakpoint.
- **JS is plain ES5-style** — `var`, `function`, `querySelectorAll(...).forEach`. No
  modules, no libraries. Keep it that way so the file stays copy-pasteable.
- **Motion respects `prefers-reduced-motion`** — the hero van's `hop` animation is inside
  a `@media(prefers-reduced-motion:no-preference)` block. Wrap any new animation the same
  way.
- **Decorative images get `alt=""`** and decorative containers get `aria-hidden="true"`
  (see `.road-scene`). Meaningful images get real Korean alt text.

## Assets

`assets/` contains the bus mascot in two poses and four "expression" characters, each
exported at multiple sizes:

- `bus-front-{32,48,64,180,256,512}.png` — logo/favicon sizes; `bus-front-256.png` is the
  header logo, `bus-front-512.png` is the OG image.
- `bus-side.png` — the animated hero van (354 KB, the largest asset).
- `exp-{happy,wink,drive,kiss}-{160,256}.png` — 160 for card icons (`.ico-img`), 256 for
  portfolio thumbnails and the contact sidebar.
- `favicon.ico`, `apple-touch-icon.png`.

Pick the size that matches the render size; don't scale a 256 down to 60px when a 160
exists. These PNGs are unoptimized — if asked to improve load time, compressing them is
the highest-leverage change available.

## Editing checklist

Since there is nothing to run, verification is manual:

1. Open `index.html` in a browser (or `python3 -m http.server` from the repo root — the
   relative `assets/` paths need to resolve).
2. Click through all four nav items and every CTA button; confirm the right view shows
   and the nav underline follows.
3. From the services page, click a service's CTA and confirm the contact form's 의뢰 유형
   select is preselected correctly.
4. Submit the form with fields empty (expect the Korean alert) and filled (expect a
   `mailto:` with subject `[재재컴퍼니 문의] ...`).
5. Check at ≤560px, ~860px, and desktop widths.

If you change `<title>`, the meta description, or OG tags, keep the four together and
consistent — they're the only SEO surface this site has.

## Git

- The default branch is `main`. Push feature work to the branch you were assigned; never
  force-push `main`.
- History is mostly GitHub-web-UI uploads with generic messages. Write real messages for
  your own commits — that's an improvement, not a break with convention.
- There are no workflows in `.github/` and no CNAME file in the repo; hosting/DNS for
  `jaejaecompany.kr` is configured outside this repository. Don't assume a deploy
  pipeline exists — confirm with the user before touching anything deploy-related.
