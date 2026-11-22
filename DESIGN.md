# Design constraints

Non-obvious decisions behind the visual system — read this before touching
colors, layout breakpoints, or the header. The "why" here isn't derivable
from the CSS alone.

## Color palette

**⚠️ Verify a color change actually renders before calling it done.** This
palette went through two rounds where a new palette/color request was
implemented, compiled cleanly, passed `tsc`, and the page 200'd — and still
looked completely unchanged (white/gray/black) when actually viewed. "It
compiles" is not "it renders." Concretely, for any future color change:
1. Fetch the actual compiled CSS the browser receives (in dev:
   `curl http://localhost:3000/_next/static/css/app/layout.css`) and grep for
   the variable you changed — confirm the real value is there, not just in
   the source file.
2. If a value is still wrong/missing at that point, suspect the authoring
   technique (see the `color-mix()` note below) before suspecting anything
   else.
3. If the compiled CSS is correct and the user still reports no visible
   change, the likely causes are outside the code: a stale browser cache
   (hard refresh), a stale/orphaned dev server on a different port from an
   earlier session, or — specifically for "everything is white/gray/black
   no matter what I set" — Windows/OS forced-colors ("High Contrast") mode,
   which overrides author CSS colors entirely at the OS level.

**Don't use `color-mix()` for the core palette — hardcode the result.**
Every root-level color token is a plain hex/rgba value, computed from the
formula noted in its comment, not a live `color-mix()` expression. An
earlier version used `color-mix()` directly in `:root` (including nested
`color-mix(color-mix(...))` for a couple of category colors) and it silently
had zero visible effect — the whole site stayed white/gray/black despite the
values being "correct" in source. Root cause was never fully confirmed
(suspects: Lightning CSS's handling of chained custom-property-based
`color-mix()`, or a browser/environment quirk), but the fix — precompute the
final hex once and hardcode it — is strictly safer regardless of cause, so
don't revert to live `color-mix()` for `:root` tokens even if you figure out
why it failed. (Smaller, one-off `color-mix()` calls elsewhere in the
codebase — nav backdrop tint, category badge backgrounds — predate this
incident and haven't shown the same issue, so they're left alone; the risk
seems specific to chained/nested use at the `:root` variable level.)

Brand palette (coolors.co), defined once in `app/globals.css` and never
hardcoded elsewhere:

| Name | Hex | CSS variable |
|---|---|---|
| Tomato Jam | `#bb4430` | `--pal-tomato` |
| Twilight Indigo | `#38405f` | `--pal-indigo` |
| Icy Blue | `#add9f4` | `--pal-icyblue` |
| Tea Green | `#c6dea6` | `--pal-teagreen` |
| Pacific Cyan | `#468c98` | `--pal-cyan` |

**Neutrals are Twilight-Indigo-tinted, not pure gray.** v1 of this doc said
neutrals should stay grayscale "per the brief" — that was wrong in practice:
a near-neutral gray with only buttons/badges carrying the palette reads as
"no palette at all" once actually on screen, which is exactly the feedback
that reversed this. `--paper`/`--surface`/`--surface-sunken`/`--ink`/
`--border` are all precomputed tints/shades of `--pal-indigo` toward white
(light mode) or black (dark mode) — every neutral in the system visibly
carries the brand hue, not just accent/pour/contre/category colors.

**Update — that tint still wasn't enough; stop defaulting to "tasteful and
muted."** Even with the indigo-tinted neutrals above, repeated feedback
across features (podium cards, hero, cards in general) was that the site
still reads as flat/pale — a surface tinted 2-9% toward indigo is
indistinguishable from plain gray to the eye, so "technically on-palette" is
not the same as "visibly colorful." The neutral-first, accent-as-a-tiny-detail
instinct from earlier in this doc was itself the problem, not just the gray
neutrals. Going forward: when doing visual/color work on this project, default
to bolder, more saturated, more frequent use of the raw palette hexes —
solid fills and real color blocks, not just soft tints reserved for small
accent moments — and treat the muted option as the one that needs
justification, not the other way around. The hard constraints above still
apply unchanged (hardcode hex, no `color-mix()` in `:root`, pour/contre never
red/green) — only the *degree of restraint* changes. If unsure how far to
push a given change, ask rather than quietly picking the safe/subtle version.

**Headings (`h1`/`h2` only) use `--heading` = pure `--pal-indigo`, not
`--ink`.** This is the one place a fully-saturated palette color (not a
tinted neutral) is used for text, because headings are the most visible
place to "show the palette" in body copy. Deliberately **not** applied to
`h3` or smaller: pure indigo (`#38405f`, light mode) clears WCAG AA contrast
at heading sizes (≥21px, "large text" 3:1 threshold) but fails it at
body-text sizes (needs 4.5:1). If you introduce a new heading-ish element
under ~20px, style it with `--ink`, not `--heading`.

**Every functional color is the raw hex above or a precomputed tint/shade/
blend of them** — never a hand-picked, unrelated hex. Each one's derivation
is noted as a comment next to its value in `globals.css` (e.g. "color-mix
(indigo 82%, black)") so the relationship stays traceable even though the
CSS itself is now a static value, not a live formula (see the ⚠️ note
above for why). This is also why dark mode reuses the exact same 5 base
hues instead of a second, drifting set of colors — only the mix ratio
toward white/black changes.

**Pour/Contre avoids literal red/green on purpose.** This mirrors a choice
already made before this palette existed: `--pour` (favorable) and `--contre`
(against) must never be a red/green pair — that's the one colorblind
confusion (protanopia/deuteranopia) that's both common and easy to avoid.
`--pour` is Pacific Cyan, `--contre` is Tomato Jam — a blue-vs-warm-red axis,
which is safe. Don't "fix" this to Tea Green vs Tomato Jam even though it'd
look thematically nicer (green=for, red=against) — that's exactly the
pairing to avoid.

**8 category colors from 5 hues.** `econ`/`secu`/`just` use the palette's
mid-dark colors as-is (cyan/tomato/indigo — all legible on their own light
tint background). The remaining 5 (`trav`, `sante`, `intl`, `edu`, `eco`) are
`color-mix()` blends specifically chosen to (a) stay dark enough to read as
an icon color against a 16%-tinted-of-itself background — a pure light color
like raw Icy Blue or Tea Green fails this contrast check, hence they're never
used undiluted — and (b) sit far enough apart in hue from their nearest
sibling to stay distinguishable. See the formulas directly in
`app/globals.css` (`:root` and the `prefers-color-scheme: dark` block) — they
're the source of truth, don't duplicate the hex here or this doc will drift.

## Responsive breakpoints

Mobile-first: base (unprefixed) rules target mobile, `min-width` media
queries progressively enhance for larger screens. Three tiers:

| Tier | Range | Media query |
|---|---|---|
| Mobile | `0–639px` | *(base styles, no query)* |
| Tablet | `640–1023px` | `@media (min-width: 640px)` |
| Desktop | `≥1024px` | `@media (min-width: 1024px)` |

`640px` and `1024px` match Tailwind's `sm`/`lg` steps (this project already
pulls in `@import "tailwindcss"`), so they're not arbitrary — reuse those two
numbers for any new breakpoint rather than picking a third value.

**Known inconsistency, not yet reconciled:** most of the existing CSS
(written before this doc existed) uses desktop-first `max-width` queries at
assorted values — `560px`, `760px`, `900px` (nav links, subject page
two-column layout, poll rows, source grid). These aren't wrong per se, just
inconsistent with the mobile-first convention above. Don't mix the two
approaches in the *same* component when you touch it next — migrate that
component's breakpoint(s) to the `min-width` scale above rather than adding
a fourth one-off value. No need to do a blanket rewrite outside of code
you're already touching.

**Horizontal-scroll rule of thumb:** anything that can hold user-controlled-
length content (an email address, a long category name) needs an explicit
`max-width` + `text-overflow: ellipsis`, not an assumption that it'll always
be short. Anything laid out with `display: flex` and no `flex-wrap: wrap`
needs either a `min-width: 0` escape hatch on its shrinkable children or a
mobile-width budget actually checked against real content — "it has a gap
and no wrap" is how the header nav (brand + auth buttons) overflowed on
narrow phones before this pass.
