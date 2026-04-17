# CCA Marketing Site — Visual Parity Punchlist V2

## @anchor cca-marketing-punchlist-v2

**Purpose:** Close remaining visual gaps between `crandallchristian.cc` (replica) and `crandallchristianacademy.com` (original). The hero section is wrong, section order is wrong, colors are wrong, and several components need layout fixes.

**Read ONLY:** `CLAUDE.md` and this file. Do NOT read other docs. Execute fixes in the numbered order below. Log progress to `BUILD_LOG.md`. On completion, move this file to `docs/build-archives/` and update `CLAUDE.md`.

---

## VERIFIED ORIGINAL SECTION ORDER (from DOM inspection April 17 2026)

The original site's ACTUAL rendered section order, verified by JavaScript DOM inspection with `getBoundingClientRect()`:

```
 1. HERO: "Where Little Minds Shine" (SpinningCTA) — 1170px, video bg
 2. CONTENT ZONE: "A Place To Shine Bright" + "More Than A Preschool" + "Play, Explore, Discover, Grow" + "A Parent's Dream Come True" — 577px, NO marquee
 3. "Today's Learners. Tomorrow's Leaders. Together!" — 942px, video bg + blue overlay
 4. CURRICULUM: "Our Curriculum" — 4 pillar cards — 1184px
 5. STICKY: Infants / Toddlers — 996px
 6. STICKY: Twos / Threes — 996px
 7. "Why Choose Us" — 631px, WHITE bg, pink heart icons
 8. STICKY: Pre-K / Private Kinder — 985px
 9. AMBIENT VIDEO — 618px, classroom video, no text
10. NEWSLETTER: "Subscribe To Our Newsletter" — 467px
11. INGREDIENTS: "The Ingredients Of A Perfect Pre-School" — 1431px, cream bg
12. FINAL CTA: "Crandall's New Pre-School Gem" — 777px
```

**CRITICAL:** The sticky programs are SPLIT around "Why Choose Us" — Infants/Toddlers and Twos/Threes come BEFORE, Pre-K/Kinder comes AFTER. "Why Choose Us" is sandwiched between them. This is NOT how the replica has it.

---

## CURRENT REPLICA ORDER (WRONG)

```
 1. "A Place To Shine Bright" hero (WRONG — should be SpinningCTA)
 2. MarqueeBanner (WRONG — doesn't exist on original)
 3. "Today's Learners" (correct section, wrong position)
 4. "More Than A Preschool" (should be in content zone)
 5. Curriculum pillars (correct section, wrong position)
 6. ALL Sticky Programs together (WRONG — should be split around Why Choose Us)
 7. "Why Choose Us" on GREEN bg (WRONG bg color, WRONG position)
 8. SpinningCTA (WRONG position — should be hero #1)
 9. Newsletter on GREEN bg (WRONG position, WRONG bg)
10. Ingredients (correct section, wrong position)
11. SpinningCTA repeated (WRONG — only once on original)
12. MarqueeBanner repeated (WRONG — doesn't exist)
13. Final CTA (correct)
```

---

## FIX 1: REORDER THE ENTIRE PAGE (HIGHEST PRIORITY)

Rewrite `src/app/(marketing)/page.tsx` section order to match the original exactly:

```tsx
<main id="main-content">
  {/* 1. HERO — "Where Little Minds Shine" spinning CTA */}
  <SpinningCTA />

  {/* 2. CONTENT ZONE — 4 blocks in one continuous section */}
  {/* See FIX 3 for the content zone component */}
  <ContentZone />

  {/* 3. "Today's Learners. Tomorrow's Leaders. Together!" — video bg, blue overlay */}
  {/* (existing TodaysLearners section — keep as-is, just move here) */}

  {/* 4. Curriculum — 4 pillar cards */}
  {/* (existing curriculum section — move here) */}

  {/* 5. Sticky: Infants / Toddlers */}
  <StickyPrograms section="infants-toddlers" />

  {/* 6. Sticky: Twos / Threes */}
  <StickyPrograms section="twos-threes" />

  {/* 7. "Why Choose Us" — WHITE bg, pink heart icons */}
  {/* See FIX 7 for styling changes */}

  {/* 8. Sticky: Pre-K / Private Kinder */}
  <StickyPrograms section="prek-kinder" />

  {/* 9. Ambient video — classroom footage, no text */}
  {/* See FIX 6 */}

  {/* 10. Newsletter */}

  {/* 11. "The Ingredients Of A Perfect Pre-School" */}

  {/* 12. "Crandall's New Pre-School Gem" — final CTA */}
</main>
```

**Key changes from current replica:**
- SpinningCTA moves from position 8 → position 1 (THE HERO)
- Remove the SECOND SpinningCTA (only appears once on original)
- Remove BOTH MarqueeBanner instances (doesn't exist on original)
- "A Place To Shine Bright" is NOT a standalone hero — it becomes part of ContentZone
- "More Than A Preschool" moves from standalone section into ContentZone
- Sticky programs are SPLIT: 2 sections before "Why Choose Us", 1 after
- Newsletter moves from position 9 → position 10 (after ambient video)
- Add ambient video section (position 9)

**StickyPrograms refactor:** The current `StickyPrograms` component renders all 3 sticky sections as one component. It needs to be refactored so each pair can be placed independently in the page. Either:
- (A) Split into 3 separate components: `StickyInfantsToddlers`, `StickyTwosThrees`, `StickyPreKKinder`
- (B) Accept a `pair` prop that selects which pair to render
- (C) Keep all 3 in one `<StickyPrograms />` but use a wrapper approach with `<WhyChooseUs />` injected between via CSS order (NOT recommended — too fragile)

**Recommended: Option B.** Refactor `StickyPrograms` to accept a `pair` prop:

```tsx
// Usage in page.tsx:
<StickyPrograms pair={0} />  {/* Infants / Toddlers */}
<StickyPrograms pair={1} />  {/* Twos / Threes */}
{/* ... Why Choose Us section here ... */}
<StickyPrograms pair={2} />  {/* Pre-K / Private Kinder */}
```

Each `<StickyPrograms pair={N} />` renders ONE sticky `div` (h-screen, sticky top-0, grid-cols-2) with the left and right programs for that pair.

**IMPORTANT:** Each individual pair must still be `position: sticky; top: 0` so consecutive pairs create the scroll-over effect. But when "Why Choose Us" sits between pair 1 and pair 2, it naturally breaks the sticky chain — pair 2 (Pre-K/Kinder) scrolls up fresh after "Why Choose Us", which is exactly how the original works.

---

## FIX 2: HERO SECTION — SPINNING CTA LAYOUT

The SpinningCTA component exists but its LAYOUT is completely wrong. The spinning sunshine and girl mascot are STACKED ON TOP OF EACH OTHER in the CENTER. They should be separate elements in different positions.

**What the original actually does (verified from DOM inspection):**
- **Spinning sunshine:** `Yellow Black Cute Sunshine Face Positivity Mug (3).png` — 406x405px, positioned at x:1057 (RIGHT side of viewport on 1728px screen). This is roughly `right: 15%`. The image spins (7s linear infinite). It links to the enrollment form. The "Now Enrolling" text is BAKED INTO the image.
- **Girl mascot:** `girl.png` — 128x155px, positioned at x:623 (CENTER of viewport). She does NOT spin. She is NOT near the sunshine. She is a standalone element.
- **H1:** "Where Little Minds Shine" — 109px font size, white, Coming Soon font family. Centered below the girl.
- **Subtitle:** "Lighting the Way for Lifelong Learning." — white, centered below heading.
- **APPLY NOW button:** blue bg `rgb(58,113,176)`, 420px wide, borderRadius 30px (pill shape). Centered below subtitle.
- **Background:** Video of classroom scene (group-of-children-and-teacher-in-the-preschool-cca.mp4) with LIGHT overlay (not heavy dark). The video is warm and bright.
- **Section height:** 1170px (full viewport).

**ACTION:** Rewrite `src/components/marketing/SpinningCTA.tsx`:

```
Section: relative, min-h-screen, overflow-hidden
  Background: VideoBackground component (classroom video, muted, loop)
  Light overlay only (bg-black/20 max — keep it BRIGHT, original is warm)
  
  Content container: relative, z-10, w-full, min-h-screen, flex flex-col items-center justify-center

    // Spinning "Now Enrolling" sunshine — ABSOLUTE positioned TOP-RIGHT
    // This is a SINGLE image that already contains the "Now Enrolling" text
    Link to /enroll:
      div: absolute top-[10%] right-[10%] lg:right-[15%] w-[280px] h-[280px] md:w-[340px] md:h-[340px] lg:w-[400px] lg:h-[400px]
        img: mascot-sunshine-face.png (or the "Yellow Black Cute..." file)
          animate-[spin_7s_linear_infinite]
          w-full h-full object-contain
    
    // Centered content — vertically centered
    div: flex flex-col items-center text-center px-6
      
      // Girl mascot — centered, standalone, NOT near the spinner
      img: mascot-girl.png, w-[100px] md:w-[128px], mx-auto, mb-6
      
      // Heading — LARGE
      h1: "Where Little Minds Shine"
        font-coming-soon, text-5xl md:text-7xl lg:text-[7rem], text-white, text-center
      
      // Subtitle
      p: "Lighting the Way for Lifelong Learning."
        font-coming-soon, text-lg md:text-xl, text-white/80, text-center, mt-4
      
      // CTA button — blue pill, 420px wide
      Link to /enroll: "APPLY NOW"
        bg-cca-blue, text-white, text-xl md:text-2xl,
        rounded-full, px-12 py-5, font-bold, uppercase, tracking-wider,
        hover:scale-105 transition-transform, shadow-2xl,
        min-w-[300px] md:min-w-[420px], text-center, mt-8
```

**CRITICAL:** The girl mascot and the spinning sunshine are TWO INDEPENDENT elements in completely different positions. Do NOT stack them. Do NOT layer them on top of each other.

---

## FIX 3: CONTENT ZONE — COMBINE INTO ONE SECTION

On the original, position 2 is a SINGLE continuous section (577px) containing 4 blocks. The replica scatters these across separate sections.

**Original heading colors (verified):**
- "A Place To Shine Bright" — golden yellow `rgb(242,176,32)` = `text-cca-yellow`
- "More Than A Preschool" — golden yellow `rgb(242,176,32)` = `text-cca-yellow`
- "Play, Explore, Discover, Grow." — golden yellow `rgb(242,176,32)` = `text-cca-yellow`
- "A Parent's Dream Come True" — blue `rgb(58,113,176)` = `text-cca-blue`, MUCH LARGER (57px vs 25px)

**ACTION:** Create one unified section or inline these blocks in `page.tsx`:

```tsx
<section className="bg-white py-16 md:py-24 px-6">
  <div className="max-w-5xl mx-auto space-y-16">
    
    {/* Block 1: A Place To Shine Bright */}
    <div className="text-center">
      <h2 className="font-coming-soon text-3xl md:text-4xl text-cca-yellow">
        A Place To Shine Bright
      </h2>
      <p className="mt-4 text-lg text-cca-ink/70 max-w-2xl mx-auto font-questrial">
        Crandall Christian Academy's preschool program in Crandall, Texas offers a nurturing environment where young minds grow through hands-on learning and character-building activities.
      </p>
    </div>
    
    {/* Block 2: More Than A Preschool */}
    <div className="text-center">
      <h3 className="font-coming-soon text-3xl md:text-4xl text-cca-yellow">
        More Than A Preschool
      </h3>
      <p className="mt-4 text-cca-ink/70 font-questrial max-w-2xl mx-auto">
        At Crandall Christian Academy, we're more than a place for learning — we're a loving, close-knit community where children, teachers, and families build meaningful relationships.
      </p>
    </div>
    
    {/* Block 3: Play, Explore, Discover, Grow */}
    <div className="text-center">
      <h3 className="font-coming-soon text-3xl md:text-4xl text-cca-yellow">
        Play, Explore, Discover, Grow.
      </h3>
      <p className="mt-4 text-cca-ink/70 font-questrial max-w-2xl mx-auto">
        At Crandall Christian Academy, we create spaces for students to play freely, explore new ideas, and discover their unique abilities.
      </p>
    </div>
    
    {/* Block 4: A Parent's Dream Come True — BIG blue heading */}
    <div className="text-center pt-8">
      <h2 className="font-coming-soon text-4xl md:text-6xl text-cca-blue">
        A Parent's Dream Come True
      </h2>
    </div>
    
  </div>
</section>
```

**IMPORTANT:** 
- "A Parent's Dream Come True" is NOT a scrolling marquee ticker. It's a large styled heading.
- Remove ALL `<MarqueeBanner />` instances from the page. The component can stay in the components folder but must NOT appear on the homepage.
- The three smaller headings are golden YELLOW (`text-cca-yellow`), not blue.
- "A Parent's Dream Come True" is blue and significantly larger than the others.

---

## FIX 4: STICKY PROGRAMS — SPLIT INTO 3 + REMOVE FULL-BLEED PHOTOS + MATCH ORIGINAL

**Current problems:**
1. All 3 sticky pairs render as one `<StickyPrograms />` block — needs splitting so "Why Choose Us" can go between pairs 1-2 and pair 3
2. The replica uses FULL-BLEED BACKGROUND PHOTOS with dark overlays — the original does NOT. The original uses CLEAN TEXT on SOLID COLORED BACKGROUNDS with no images at all.

**What the original actually does (verified from DOM inspection):**
- Each sticky section is a split-screen (2 columns on desktop, stacked on mobile)
- LEFT column: solid colored background (cream/beige tones)
- RIGHT column: solid colored background (white/light tones)
- Program heading in a UNIQUE COLOR per age group (see color chart below)
- Body text in dark ink
- "Learn More" link (→ /about) and "Apply Now" link (→ /enroll) per half
- NO background images. NO dark overlays. NO full-bleed photos.
- Clean, text-focused, warm, easy to read

**Program heading colors (verified):**
| Program | Color | RGB |
|---------|-------|-----|
| Infants | CCA Blue | `rgb(58,113,176)` |
| Toddlers | Coral/Red | `rgb(224,71,47)` |
| Twos | Golden Yellow | `rgb(242,176,32)` |
| Threes | Green | `rgb(92,186,96)` |
| Pre-K | CCA Blue | `rgb(58,113,176)` |
| Private Kinder | Pink | `rgb(248,120,175)` |

**ACTION:** Completely rewrite `src/components/marketing/StickyPrograms.tsx`:

```tsx
const PROGRAM_PAIRS = [
  {
    left: {
      title: 'Infants',
      titleColor: 'text-cca-blue',
      body: 'Our infant program provides a safe, loving, and faith-filled environment where your baby is nurtured from the very beginning.',
      bg: 'bg-[#FAF7F2]',  // warm cream
    },
    right: {
      title: 'Toddlers',
      titleColor: 'text-[#E0472F]',
      body: 'Our toddler program nurtures curiosity and early exploration in a safe, loving environment, promoting developmental milestones through hands-on activities.',
      bg: 'bg-white',
    },
  },
  {
    left: {
      title: 'Twos',
      titleColor: 'text-[#F2B020]',
      body: 'The 2s program introduces structure and socialization, encouraging early learning through age-appropriate activities that build confidence and independence.',
      bg: 'bg-[#FAF7F2]',
    },
    right: {
      title: 'Threes',
      titleColor: 'text-[#5CBA60]',
      body: 'In our 3s program, children engage in creative learning experiences that develop early literacy, math, and social skills while fostering curiosity.',
      bg: 'bg-white',
    },
  },
  {
    left: {
      title: 'Pre-K',
      titleColor: 'text-cca-blue',
      body: 'The Pre-K program prepares children for kindergarten with a focus on academics, social-emotional growth, and faith-based learning.',
      bg: 'bg-[#FAF7F2]',
    },
    right: {
      title: 'Private Kinder',
      titleColor: 'text-[#F878AF]',
      body: 'Our private kindergarten offers a well-rounded education, blending academic excellence, spiritual growth, and individualized attention.',
      bg: 'bg-white',
    },
  },
];
```

Add a `pair` prop so each pair renders independently:

```tsx
function ProgramHalf({ title, titleColor, body, bg }: ProgramHalfProps) {
  return (
    <div className={`${bg} flex items-center justify-center p-8 md:p-16`}>
      <div className="max-w-md text-center">
        <h3 className={`font-kollektif text-3xl md:text-5xl ${titleColor} mb-4`}>{title}</h3>
        <p className="font-questrial text-cca-ink/80 text-base md:text-lg leading-relaxed mb-6">{body}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/about" className="text-cca-blue font-kollektif hover:underline">
            Learn More
          </Link>
          <Link href="/enroll" className="bg-cca-blue text-white font-kollektif px-6 py-3 rounded-full hover:bg-cca-blue/90 transition-colors">
            Apply Now
          </Link>
        </div>
      </div>
    </div>
  );
}

export function StickyPrograms({ pair }: { pair: number }) {
  const data = PROGRAM_PAIRS[pair];
  return (
    <div className="sticky top-0 h-screen grid grid-rows-2 md:grid-rows-1 md:grid-cols-2" style={{ zIndex: pair }}>
      <ProgramHalf {...data.left} />
      <ProgramHalf {...data.right} />
    </div>
  );
}
```

**CRITICAL:** Remove ALL background images, dark overlays, and `<Image>` fills from the sticky program sections. The original is clean text on solid colors. No photos.

---

## FIX 5: "TODAY'S LEARNERS" VIDEO SECTION

**Original:** 942px, video background, blue overlay `rgb(58,113,176)`. Heading "Today's Learners. Tomorrow's Leaders. Together!" in white. Has "Apply Now" and "Learn More" buttons.

**Replica current:** Already has this section with `bg-cca-blue/80` overlay. Mostly correct.

**Verify:**
- Video background is playing (the Supabase-hosted facility video)
- Blue overlay matches `rgb(58,113,176)` — use `bg-[rgb(58,113,176)]/80` or `bg-cca-blue/80`
- Heading uses line breaks between each sentence
- Has BOTH "Apply Now" (primary, goes to /enroll) AND "Learn More" (secondary, goes to /about) buttons
- "Peace of Mind for Parents" eyebrow text in yellow above the heading

**This section is mostly correct.** Just verify it's in the right position (#3) after the content zone.

---

## FIX 6: AMBIENT VIDEO SECTION (MISSING)

**Original has a 618px section at position 9** — just a full-width classroom video playing. "Hopscotch" video. No text overlay, no heading. Pure visual breather.

**Replica is missing this entirely.**

**ACTION:** Add after the Pre-K/Kinder sticky section and before Newsletter:

```tsx
<section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
  <VideoBackground
    src1080={`${VIDEO_BASE}/more-than-a-preschool-1080p.mp4`}
    src720={`${VIDEO_BASE}/more-than-a-preschool-720p.mp4`}
    poster="/marketing/home/more-than-a-preschool.jpg"
    className="h-full"
    overlay="bg-black/10"
  />
</section>
```

If the `VideoBackground` component doesn't support this usage pattern (it currently requires children), wrap it appropriately or pass an empty child. The point is: full-width video, no text, light overlay, acts as a visual breather.

---

## FIX 7: "WHY CHOOSE US" — WRONG BACKGROUND + MISSING HEART ICONS

**Original (verified):**
- Background: WHITE/transparent (NOT green)
- Left side: "Why Choose Us" heading + "Every Child with Love & Safety" subtext + paragraph + "Apply Now" button
- Right side: 3 value prop cards, each with a PINK HEART SVG icon `rgb(248,120,175)`
- The hearts are SVG with viewBox "26.5 36.011 147 127.998" — standard heart shape
- Layout is 2-column: text left, value props right (on desktop)

**Replica current:**
- Background: `bg-cca-green` (BRIGHT GREEN — completely wrong)
- Layout: 3-column grid of glassmorphism cards (wrong)
- Icons: white star SVGs (wrong — should be pink hearts)
- No left-side text column

**ACTION:**

1. Change the section background from `bg-cca-green` to `bg-white`:
```tsx
<section className="py-24 px-6 bg-white">
```

2. Change layout to 2-column (text left, cards right):
```tsx
<div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
  {/* Left: heading + description + CTA */}
  <div>
    <p className="font-coming-soon text-sm uppercase tracking-widest text-cca-green mb-2">Why Choose Us</p>
    <h2 className="font-kollektif text-3xl md:text-4xl text-cca-ink mb-2">
      Every Child with Love & Safety
    </h2>
    <p className="font-questrial text-cca-ink/70 leading-relaxed mb-4">
      Crandall Christian Academy is dedicated to fostering academic excellence and Christian values in a nurturing environment.
    </p>
    <p className="font-questrial text-cca-ink/70 leading-relaxed mb-6">
      Crandall Christian Academy prides itself on being a place of learning, development, and safety for children and families.
    </p>
    <Link href="/enroll" className="inline-block bg-cca-blue text-white font-kollektif px-8 py-3 rounded-full hover:scale-105 transition-transform">
      Apply Now!
    </Link>
  </div>

  {/* Right: 3 value props with pink heart icons */}
  <div className="space-y-6">
    {VALUE_PROPS.map((vp, i) => (
      <ValuePropCard key={vp.title} {...vp} index={i} />
    ))}
  </div>
</div>
```

3. Rewrite `ValuePropCard` for the new layout:
```tsx
export function ValuePropCard({ title, body, index }: ValuePropCardProps) {
  return (
    <ScrollReveal delay={index * 0.12}>
      <div className="flex gap-4 items-start p-4 border-b border-gray-100 last:border-b-0">
        {/* Pink heart icon */}
        <div className="flex-shrink-0 mt-1">
          <svg className="w-8 h-8" viewBox="26.5 36.011 147 127.998" fill="rgb(248,120,175)">
            <path d="M161.646 47.804l-.035-.035-.002-.002c-15.816-15.672-41.455-15.672-57.271 0l-4.338 4.3-4.338-4.3c-15.816-15.672-41.455-15.672-57.271 0-15.817 15.671-15.817 41.079 0 56.75l.035.036.002.002 61.572 61.034 61.572-61.034.002-.002.035-.036c15.817-15.671 15.817-41.079.037-56.713z" />
          </svg>
        </div>
        <div>
          <h3 className="font-kollektif text-lg text-cca-ink mb-1">{title}</h3>
          <p className="font-questrial text-cca-ink/70 text-sm leading-relaxed">{body}</p>
        </div>
      </div>
    </ScrollReveal>
  );
}
```

**NOTE:** The heart SVG path above is approximate. Use any standard heart path — the key is it must be pink `rgb(248,120,175)` / `fill-[#F878AF]`.

---

## FIX 8: NEWSLETTER — MOVE POSITION + FIX BACKGROUND

**Original:** Newsletter is at position 10 (after ambient video, before ingredients). 467px height.

**Replica current:** Newsletter is at position 9 (too early) with `bg-cca-green` background.

**ACTION:**
1. Move newsletter to position 10 in the page order (after ambient video, before ingredients)
2. Change background. The original newsletter section doesn't have a bright green bg. Use `bg-cca-cream` or `bg-white` to match the original's clean feel.

```tsx
<section className="py-16 px-6 bg-cca-cream">
  <div className="max-w-xl mx-auto">
    <NewsletterForm />
  </div>
</section>
```

---

## FIX 9: INGREDIENTS SECTION — CREAM BACKGROUND

**Original (verified):** The ingredients section uses a cream/warm background `rgb(248,246,240)`. Blue accent elements.

**Replica current:** Uses `bg-white`. This is close but the cream warmth is missing.

**ACTION:** Change the ingredients section background:
```tsx
<section className="py-24 md:py-32 px-6 bg-cca-cream">
```

This is a minor tweak — `bg-cca-cream` should map to the warm off-white the original uses.

---

## FIX 10: CURRICULUM SECTION — HEADING COLORS

**Original (verified):**
- "Learning Adventures" eyebrow — existing, keep as-is
- "Our Curriculum" heading — GREEN `rgb(92,185,97)` = `text-cca-green` (NOT default dark)
- Individual pillar headings — BLUE `rgb(59,112,176)` = `text-cca-blue`
- Each pillar has a "Read More" link (goes to /about)

**Replica current:**
- "Our Curriculum" heading color: default (likely `text-cca-ink`)
- Pillar headings: default dark
- No "Read More" links

**ACTION:**
1. Change the `SectionHeader` for curriculum: `headingColor="text-cca-green"`
2. In `PillarCard`, change the heading color: `<h3 className="font-kollektif text-xl mb-3 text-cca-blue">`
3. Add a "Read More" link at the bottom of each pillar card:
```tsx
<Link href="/about" className="text-cca-blue font-kollektif text-sm hover:underline mt-3 inline-block">
  Read More
</Link>
```

---

## IMPLEMENTATION ORDER

Execute in this exact sequence:

1. **FIX 4: Refactor StickyPrograms** — split into pair-based rendering so sections can be placed independently
2. **FIX 1: Page reorder** — rewrite page.tsx section order to match original (depends on FIX 4)
3. **FIX 2: Hero layout** — fix SpinningCTA (sunshine top-right, girl center, separated)
4. **FIX 3: Content zone** — combine blocks, correct heading colors to yellow, remove MarqueeBanner from page
5. **FIX 7: Why Choose Us** — white bg, 2-column layout, pink heart icons
6. **FIX 6: Ambient video** — add the missing breather section
7. **FIX 8: Newsletter** — move position, fix bg color
8. **FIX 5: Today's Learners** — verify video bg and blue overlay
9. **FIX 9: Ingredients** — cream background
10. **FIX 10: Curriculum** — green heading, blue pillar titles, add Read More links

After ALL fixes, scroll through the full page top-to-bottom and compare section flow against `crandallchristianacademy.com`.

---

## WHAT TO REMOVE FROM THE PAGE

- **Both `<MarqueeBanner />` instances** — remove from page.tsx (component file can stay). The original does NOT have a scrolling marquee ticker.
- **Second `<SpinningCTA />`** — only one instance, as the hero (#1)
- **Standalone "A Place To Shine Bright" VideoBackground hero** — this content moves into the ContentZone as text, not a video hero
- **`bg-cca-green` on Why Choose Us** — change to `bg-white`
- **`bg-cca-green` on Newsletter** — change to `bg-cca-cream`

## WHAT NOT TO TOUCH

- Portal code, API routes, migrations
- The VideoBackground component itself (it works)
- The about, contact, FAQ, team pages
- The footer and header
- The enrollment form / enrollment wizard

## COLOR REFERENCE (verified from original DOM)

| Element | Original Color | Tailwind Token |
|---------|---------------|----------------|
| CCA Blue | `rgb(58,113,176)` | `text-cca-blue` / `bg-cca-blue` |
| Golden Yellow | `rgb(242,176,32)` | `text-cca-yellow` |
| Coral/Red | `rgb(224,71,47)` | `text-cca-coral` |
| Green | `rgb(92,186,96)` | `text-cca-green` |
| Pink | `rgb(248,120,175)` | `text-[#F878AF]` or add `--color-cca-pink` |
| Cream bg | `rgb(248,246,240)` | `bg-cca-cream` |
| White bg | `rgb(255,255,255)` | `bg-white` |

## ASSETS REFERENCE

All at `public/marketing/`:
- `home/mascot-sunshine-face.png` — spinning enrollment CTA image
- `home/mascot-girl.png` — girl mascot
- `home/more-than-a-preschool.jpg` — ambient video poster
- `home/videos/` — classroom videos
- `home/pillar-*.jpg` — curriculum pillar images
- `about/program-*.jpg` — program background images for sticky sections
