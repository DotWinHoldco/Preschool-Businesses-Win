# CCA Marketing Site — Visual Parity Punchlist

## @anchor cca-marketing-punchlist-v1

**Purpose:** Close the visual and interaction gaps between the replica at `crandallchristian.cc` and the original at `crandallchristianacademy.com`. The replica has the right content and structure but is missing the signature animations, sticky scroll-over sections, the spinning enrollment CTA, and the overall visual energy that makes the Wix original feel alive.

**Read ONLY:** this file. Do NOT read other docs. Log progress to `BUILD_LOG.md` after each section. On completion, move this file to `docs/build-archives/`.

**Reference the live original** at `crandallchristianacademy.com` for any visual questions. The goal: identical layout and feel, better code.

---

## GAP 1: Sticky Scroll-Over Program Sections (HIGHEST PRIORITY)

**What the original does:** The "Programs by Age" section uses 3 full-viewport sticky sections (`position: sticky; top: 0`) that stack on the page. Each section is ~944px tall (full viewport). As you scroll, the NEXT section scrolls UP and OVER the current one, creating a dramatic page-peel effect. The sections are:

- Sticky section 1: **Infants** (left) + **Toddlers** (right) — split-screen layout with bg images
- Sticky section 2: **Twos** (left) + **Threes** (right) — scrolls over section 1
- Sticky section 3: **Pre-K** (left) + **Private Kinder** (right) — scrolls over section 2

Each half has a full-bleed background image, an age-group heading, description text, and "Learn More" / "Apply Now" buttons.

**What the replica does:** Static cards listed vertically in a grid. No sticky behavior, no scroll-over, no full-bleed images. Completely different feel.

**Implementation:**

```
Container: relative, enough height to allow all 3 sticky sections to scroll through
Each program section:
  - position: sticky
  - top: 0
  - height: 100vh
  - z-index: auto (natural stacking — later DOM elements paint on top)
  - display: grid, grid-cols-2
  - Each half: full background image, overlay, centered text content
  - Responsive: on mobile, stack vertically (still sticky, 100vh per section)
```

Use the existing program images from `public/cca-assets/marketing/about/`:
- `program-infants.jpg`, `program-toddlers.jpg`, `program-twos.jpg`, `program-threes.jpg`, `program-preschool-kinder.jpg`

If a threes image doesn't exist, use a placeholder or duplicate the twos image.

**Acceptance:** Scrolling through the programs section should feel like flipping through pages — each age group slides over the previous one.

---

## GAP 2: Spinning Enrollment CTA ("Where Little Minds Shine")

**What the original does:** A showstopper section with:
- Full-width **video background** (the preschool classroom video, looping, muted)
- A **spinning sunshine face** image (`Yellow Black Cute Sunshine Face Positivity Mug (3).png`) — 290px wide, CSS `animation: spin 7s linear infinite`
- The **girl mascot** (`girl.png`) positioned on top of the spinning sunshine — she stays still while the sun rotates behind her
- "Where Little Minds Shine" heading in large playful font
- "Lighting the Way for Lifelong Learning." subtitle
- Big "APPLY NOW" pill button (blue, rounded-full)
- The spinning element is ALSO a clickable link to the enrollment form

**What the replica does:** Has a "Where Little Minds Shine" heading with an "APPLY NOW" link but NO spinning element, NO video background, NO girl mascot. It's flat and lifeless.

**Implementation:**

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

```
Section: relative, overflow-hidden, min-h-[80vh]
  - VideoBackground component (reuse existing) with classroom video
  - Dark overlay (bg-black/50)
  - Content centered:
    - Link wrapper (to /enroll)
      - Container: relative, w-[280px] h-[280px], mx-auto
        - Spinning sunshine: absolute, inset-0, animate-spin with duration 7s
        - Girl mascot: absolute, centered, z-10, w-[120px] (does NOT spin)
    - h2: "Where Little Minds Shine" — font-display (Coming Soon), text-white, text-5xl
    - p: "Lighting the Way for Lifelong Learning." — text-white/80
    - CTA button: "APPLY NOW" — bg-cca-blue, text-white, rounded-full, px-10 py-4
```

Assets already in `public/cca-assets/`:
- Look for `Sunshine Smiles.svg` or `Yellow Black Cute Sunshine Face Positivity Mug (3).png` — if not in `public/cca-assets/marketing/`, check `public/cca-assets/` root
- `girl.png` — same locations

Add the spin keyframe to globals.css or as a Tailwind extend. Use `animation: spin 7s linear infinite` (Tailwind: `animate-[spin_7s_linear_infinite]`).

**Acceptance:** The sunshine face spins continuously. The girl sits still on top. Clicking the whole element goes to `/enroll`. Video plays behind everything.

---

## GAP 3: "A Parent's Dream Come True" Marquee/Ticker

**What the original does:** The text "A Parent's Dream Come True" appears as a large, bold, repeating horizontal scrolling ticker/marquee. It's used TWICE on the page — once near the top (after the hero) and once near the bottom (before the final CTA). The text repeats and scrolls continuously left-to-right, creating movement and energy. Green background (`#5CBA60`).

**What the replica does:** Static text "A Parent's Dream Come True" displayed as a plain heading. No motion, no ticker, no repetition.

**Implementation:**

Create a `MarqueeBanner` component:
```
- Full-width container, overflow-hidden, bg-cca-green, py-4
- Inner: flex, whitespace-nowrap, animate-marquee
- Content: repeat the text 6-8 times with decorative separators (stars, sunshine icons, or bullet dots)
- CSS animation: translateX(0) to translateX(-50%) over ~20s, linear, infinite
- Text: uppercase, font-bold, text-2xl md:text-4xl, text-white, font-display (Coming Soon)
```

```css
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
```

Use this component in two places on the homepage:
1. After the hero/intro section (before "Today's Learners")
2. After the "CCA Difference" / Ingredients section (before the final CTA)

**Acceptance:** Smooth continuous horizontal scroll of the repeating text. Feels fun and energetic.

---

## GAP 4: Hero Image Slideshow

**What the original does:** The hero section has a multi-image slideshow/carousel cycling through 3-5 images with the heading "A Place To Shine Bright" overlaid. Images crossfade or slide. Large full-viewport hero.

**What the replica does:** Static video background hero. The video approach is actually fine and arguably better — but the original also had more visual depth with the crossfade.

**Implementation (choose one):**

Option A (recommended): Keep the video hero but add a crossfading image slideshow BELOW the fold as a secondary hero element. This preserves what's working.

Option B: Replace video with crossfading image slideshow. Use Framer Motion `AnimatePresence` with opacity transitions (duration 1s, interval 5s). Overlay the heading and CTA on top.

**Acceptance:** Hero feels dynamic, not static.

---

## GAP 5: Color and Section Energy

**What the original does:** Bold, saturated section backgrounds that alternate:
- Bright green (`#5CBA60`) for CTA sections and marquee
- Deep blue (`#3A71B0`) for the "Today's Learners" video section
- Warm cream (`#F8F6E0`) for content sections
- White for card sections
- Black/dark overlays on video sections

Buttons are rounded-full pills with bold colors. The overall palette is BRIGHT and PLAYFUL.

**What the replica does:** Alternates between `bg-white` and `bg-cca-cream` for almost every section. Very muted. The green, blue, coral, and yellow from the design system are barely used in section backgrounds. Buttons exist but don't pop.

**Fix:**
- The "Today's Learners" section: give it a blue gradient overlay on the video (`bg-cca-blue/80`)
- The "Why Choose Us" section: use `bg-cca-green` with white text instead of cream
- The newsletter section: keep the video bg but add a stronger blue overlay
- All "Apply Now" buttons: `bg-cca-blue hover:bg-cca-blue/90 text-white rounded-full px-8 py-3 text-lg font-bold shadow-lg`
- Add accent color blocks — small colored bars above section headers (like a 4px top border in green or coral)

**Acceptance:** The page should feel COLORFUL and PLAYFUL, like a children's school — not like a corporate SaaS.

---

## GAP 6: CSS Animations and Micro-interactions

**What the original does:** 14 CSS animations running at any given time. Scroll-triggered reveals, hover transforms, entrance animations.

**What the replica does:** Framer Motion `ScrollReveal` component exists but with subtle, conservative settings (32px offset, 0.6s duration). No CSS keyframe animations at all. No entrance animations on cards or headings.

**Fix:**
- Add a gentle `float` animation to decorative elements (sunshine icons, the girl mascot when not in the spinning CTA):
```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
```
- Increase ScrollReveal offset to 48-64px and stagger delay to 0.15s for card grids
- Add scale-in animation for curriculum pillar cards (start at scale 0.9, animate to 1.0 on scroll)
- Add a subtle parallax effect on section background images (CSS `background-attachment: fixed` or Framer Motion `useScroll` + `useTransform`)
- Hover effects on program cards: lift + shadow + slight scale (`hover:-translate-y-2 hover:shadow-2xl hover:scale-[1.02]`)

**Acceptance:** The page should have constant subtle motion — things floating, revealing, lifting. It should feel ALIVE.

---

## GAP 7: "CCA Difference" / Ingredients Section

**What the original does:** Large section (1431px tall) with "The Ingredients Of A Perfect Pre-School For Your Child" heading and 4 feature cards with detailed descriptions. Uses bold typography and generous spacing.

**What the replica does:** Has the content but review the visual treatment — it should use larger type, more whitespace, and colored accent elements (icons or colored borders on each card).

**Fix:**
- Each ingredient card should have a colored left border (rotating through cca-green, cca-blue, cca-coral, cca-yellow)
- Heading should be `text-4xl md:text-5xl` in the display font
- Add numbered badges or icons to each card
- Generous padding: `py-24 md:py-32`

---

## GAP 8: Section Ordering

**Original section order (top to bottom):**
1. Header/Nav
2. Hero (slideshow + "A Place To Shine Bright")
3. "A Parent's Dream Come True" marquee ticker
4. "Today's Learners, Tomorrow's Leaders" (video bg, blue overlay)
5. Curriculum 4-pillar cards (Creative Arts, Curiosity, Literacy, Physical)
6. Sticky Programs (Infants/Toddlers → Twos/Threes → Pre-K/Kinder)
7. "Why Choose Us" 
8. Sticky Programs continued (Pre-K/Kinder)
9. "Where Little Minds Shine" CTA (video bg, spinning girl, APPLY NOW)
10. Newsletter subscribe (green bg)
11. "CCA Difference" / Ingredients
12. "Where Little Minds Shine" CTA (repeated)
13. "A Parent's Dream Come True" marquee ticker (repeated)
14. Final enrollment CTA ("Crandall's New Pre-School Gem")
15. Footer

**Compare against replica and reorder to match.** The replica may have sections in different order or be missing the repeated elements (marquee appears twice, CTA appears twice).

---

## IMPLEMENTATION ORDER

1. **Sticky scroll-over programs** (GAP 1) — this is the biggest wow factor
2. **Spinning enrollment CTA** (GAP 2) — signature element
3. **Marquee ticker** (GAP 3) — adds energy throughout
4. **Color and energy** (GAP 5) — transforms the mood
5. **CSS animations** (GAP 6) — brings it to life
6. **Section reordering** (GAP 8) — match the original flow
7. **Ingredients section** (GAP 7) — polish
8. **Hero slideshow** (GAP 4) — nice-to-have, video is fine

After each gap is closed, verify by scrolling through the page top-to-bottom and comparing against `crandallchristianacademy.com`. Log progress in `BUILD_LOG.md`.

---

## ASSETS REFERENCE

All marketing assets are at `public/cca-assets/marketing/` organized by page:
- `home/` — hero images, curriculum pillar images, mascots, videos
- `about/` — program age-group images
- `contact/` — contact page hero
- `team/` — staff headshots
- `shared/` — logos, favicons, fonts
- `home/videos/` — hero video, newsletter bg video, classroom video

Root `public/cca-assets/` may also contain: `girl.png`, `Sunshine Smiles.svg`, `Yellow Black Cute Sunshine Face Positivity Mug (3).png`

## TECHNICAL NOTES

- Use CSS `@keyframes` for continuous animations (spin, marquee, float). Framer Motion is overkill for infinite loops.
- Sticky scroll-over uses pure CSS `position: sticky; top: 0` — no JS needed.
- Respect `prefers-reduced-motion` — wrap all continuous animations in a media query.
- Keep all components in `src/components/marketing/`.
- Do NOT touch portal code, API routes, or migrations. This is purely frontend.
