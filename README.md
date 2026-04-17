# All Access Agency

> Production and talent partner for live streamers. We turn streams into shows.

A single-page marketing site for **All Access Agency** — the production, talent management and brand-partnership operation built for live streamers.

## Voice

Direct. Confident. Slightly elevated. Executive creative, not ad copy.
No exclamation marks. No filler adjectives. Short sentences. Positioning does the work.

## Visual system

| Token       | Value     |
|-------------|-----------|
| `--white`   | `#FFFFFF` |
| `--silver`  | `#D9D9D9` |
| `--mute`    | `#7A7A7A` |
| `--line`    | `#262626` |
| `--gray`    | `#1C1C1C` |
| `--ink`     | `#131313` |
| `--black`   | `#0A0A0A` |

- **Display:** Bebas Neue
- **Body / UI:** DM Mono
- **Accent:** live-red `#E11D26` (status dot only)

The brand mark — the filled "A" inside an outlined "A" plus a `+` — appears in the nav and footer wordmark.

## Sections

1. **Hero** — `All Access Agency` + production/talent positioning + `Get in Touch` CTA
2. **What We Do** — Production · Talent Management · Brand Partnerships
3. **Approach** — positioning quote: *"The live streaming space has the audience but not the infrastructure. We're the infrastructure."*
4. **Credibility strip** — concurrent-viewer line (placeholder `2.4M+`)
5. **Let's Build** — contact CTA, email, Instagram
6. **Footer** — wordmark, copyright, NYC clock

## Files

```
.
├── index.html
├── styles.css
├── script.js
├── assets/logos/
│   ├── mark.svg
│   ├── wordmark.svg
│   └── favicon.svg
└── README.md
```

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Zero build step, zero dependencies.

## Placeholders to replace before launch

- `2.4M+` concurrent-viewer figure in the credibility strip (`index.html`)
- `hello@all-access.agency` and `@allaccess.agency` Instagram handle (`index.html`)
- Optionally swap the wordmark for a final master file in `assets/logos/`
