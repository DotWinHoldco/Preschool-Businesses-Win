# CCA Marketing Site — Visual Parity Punchlist V2

> **Source of truth:** `crandallchristianacademy.com` (original Wix site)  
> **Target:** `crandallchristian.cc` (Next.js replica)  
> **Goal:** The replica must look identical to the original or better. Every section, every icon, every color.

**Read ONLY:** `CLAUDE.md` and this file. Execute fixes in numbered order. Log to `BUILD_LOG.md`. On completion move this file to `docs/build-archives/`.

---

## VERIFIED SECTION ORDER (DOM-inspected April 17 2026)

```
 1. HERO: "Where Little Minds Shine" — SpinningCTA, video bg, spinning sunshine top-right, girl mascot center
 2. CONTENT ZONE: "A Parent's Dream Come True" big heading + 3 COLUMNS with line-drawing SVG icons
 3. "Today's Learners. Tomorrow's Leaders. Together!" — WHITE bg, 2-column, blob-masked image left, text right
 4. CURRICULUM: "Our Curriculum" — 4 pillar cards
 5. STICKY: Infants / Toddlers
 6. STICKY: Twos / Threes
 7. WHY CHOOSE US: white bg, 2-col, pink heart icons, green value-prop headings
 8. STICKY: Pre-K / Private Kinder
 9. AMBIENT VIDEO: classroom footage, no text
10. NEWSLETTER: "Subscribe To Our Newsletter"
11. INGREDIENTS: "The Ingredients Of A Perfect Pre-School" — cream bg
12. FINAL CTA: "Crandall's New Pre-School Gem"
```

**Sticky programs are SPLIT:** pairs 1-2 come BEFORE "Why Choose Us", pair 3 comes AFTER.

---

## WHAT'S WRONG WITH THE REPLICA (EVERY GAP)

| # | What's wrong | Original | Replica |
|---|---|---|---|
| 1 | **Hero is wrong section** | SpinningCTA "Where Little Minds Shine" is the hero | "A Place To Shine Bright" video hero is position 1 |
| 2 | **MarqueeBanner exists** | No scrolling marquee on original | Two MarqueeBanner instances |
| 3 | **Content zone is 1 column** | 3 columns side-by-side with SVG line-drawing icons | Single centered column, no icons |
| 4 | **"Today's Learners" is video overlay** | White bg, 2-column, blob-masked photo left, text right | Full-width video bg with blue overlay, centered text |
| 5 | **Sticky programs have bg photos** | Clean text on solid cream/white backgrounds, NO photos | Full-bleed photos with dark overlays |
| 6 | **Why Choose Us has green bg** | WHITE bg, 2-column, pink heart SVGs, green headings | Bright green bg, 3-column glassmorphism cards, star icons |
| 7 | **Header utility bar is yellow** | CCA BLUE (`rgb(58,113,176)`) utility bar, 48px | Yellow/gold bg |
| 8 | **Logo too small** | 338×118px colorful handwritten logo | ~100px small logo |
| 9 | **"NOW HIRING" is red pill button** | Plain text nav item, same style as other links | Coral red pill button |
| 10 | **Section order is wrong** | See verified order above | Multiple sections in wrong positions |
| 11 | **Program heading colors missing** | Each program has unique color (blue, coral, yellow, green, pink) | All white text on dark photos |
| 12 | **No ambient video section** | 618px silent video section between Pre-K and Newsletter | Missing entirely |
| 13 | **Newsletter bg wrong** | Has green elements | Green bg (might be ok, verify) |
| 14 | **Value prop headings wrong color** | GREEN `rgb(92,185,97)` | White (on green bg) |
| 15 | **Curriculum heading wrong color** | "Our Curriculum" in GREEN, pillar titles in BLUE | Default dark colors |
| 16 | **No "Read More" / "Learn More" links** | Every section has navigation links | Many sections missing links |
| 17 | **"Email Us" missing from header** | Top bar: Tel + Email Us (mailto) + Location pin | Only phone number |
| 18 | **SpinningCTA appears twice** | Once (as hero) | Twice on page |
| 19 | **"More Than A Preschool" is standalone section** | Part of the 3-column content zone | Separate image+text section |

---

## FIX 1: HEADER — UTILITY BAR + LOGO + NAV

The header is the FIRST thing parents see. It's wrong in 4 ways.

**Original header structure (verified):**
```
┌─────────────────────────────────────────────────────────────────────┐
│ [UTILITY BAR — CCA BLUE bg, 48px, white text]                      │
│ Tel. (945) 226-6584    ✉ Email Us    📍 Premier Pre-School...      │
├─────────────────────────────────────────────────────────────────────┤
│ [LOGO ROW — white bg]                                               │
│ [CCA Logo 338×118]              Home  About  Contact  FAQ  NOW HIRING│
└─────────────────────────────────────────────────────────────────────┘
```

**Changes needed in `src/components/layout/` (Header component):**

1. **Utility bar background:** Change from yellow/gold to `bg-cca-blue` (rgb(58,113,176)). Text stays white.

2. **Add "Email Us" link:** Between phone and location text. Use `mailto:admin@crandallchristianacademy.com`. Add a mail/envelope icon (SVG or lucide `Mail` icon) before the text, and a pin/map-pin icon before the location text.

3. **Logo size:** The original logo displays at 338×118px. Make the logo MUCH larger. Use the `CCA Logo Full.png` image from `/public/cca-assets/` or `/public/marketing/`. Set width to ~300-340px.

4. **"NOW HIRING" nav item:** Remove the red/coral pill button styling. Make it a plain text nav link matching the other items (Home, About, Contact, FAQ). Same font, same size, same color. No background, no border-radius.

**Files to edit:** The Header/Nav component in `src/components/layout/`. Find the utility bar, logo image, and nav items.

---

## FIX 2: HERO — SPINNING CTA LAYOUT

SpinningCTA must be the FIRST section (position 1). Its internal layout is also wrong — the sunshine and girl are stacked on top of each other. They must be SEPARATE elements.

**Original layout (verified):**
- **Spinning sunshine:** 406×405px, positioned UPPER-RIGHT (x:1057 on 1728px viewport ≈ `right: ~15%`). Spins `7s linear infinite`. Links to enrollment form. The "Now Enrolling" text is BAKED INTO the image file — it's not CSS text.
- **Girl mascot:** 128×155px, positioned CENTER (x:623 on 1728px viewport). Does NOT spin. Standalone cartoon element. Not layered on the sunshine.
- **H1:** "Where Little Minds Shine" — ~109px white, Coming Soon (`font-coming-soon`) cursive font. Positioned bottom-center of section.
- **Subtitle:** "Lighting the Way for Lifelong Learning." — white, below heading.
- **APPLY NOW button:** Blue pill `rgb(58,113,176)`, ~420px wide, borderRadius 30px. Centered below subtitle.
- **Background:** Classroom video. LIGHT overlay only (bg-black/20 to bg-black/30 max). The original feels warm and bright, NOT dark and moody.

**ACTION — Rewrite `src/components/marketing/SpinningCTA.tsx`:**

```
Layout:
  <section className="relative min-h-screen overflow-hidden">
    <VideoBackground ... overlay="bg-black/25">  ← LIGHT overlay, keep it warm
      
      {/* Spinning sunshine — absolute, top-right, INDEPENDENT */}
      <Link href="/enroll" className="absolute top-[8%] right-[8%] lg:right-[15%] w-[250px] h-[250px] md:w-[340px] md:h-[340px] lg:w-[400px] lg:h-[400px] z-20">
        <Image src="/marketing/home/mascot-sunshine-face.png"
               className="animate-[spin_7s_linear_infinite] w-full h-full object-contain" />
      </Link>
      
      {/* Center content — girl + heading + subtitle + button */}
      <div className="relative z-10 flex flex-col items-center justify-end min-h-screen pb-20 px-6">
        
        {/* Girl mascot — standalone, centered, NOT near sunshine */}
        <Image src="/marketing/home/mascot-girl.png"
               width={128} height={155}
               className="mb-6" />
        
        {/* H1 — HUGE cursive */}
        <h1 className="font-coming-soon text-5xl md:text-7xl lg:text-[7rem] text-white text-center leading-tight">
          Where Little Minds Shine
        </h1>
        
        {/* Subtitle */}
        <p className="font-coming-soon text-lg md:text-xl text-white/80 mt-4 text-center">
          Lighting the Way for Lifelong Learning.
        </p>
        
        {/* APPLY NOW — blue pill, wide */}
        <Link href="/enroll"
              className="mt-8 bg-cca-blue text-white font-kollektif text-xl px-16 py-5 rounded-full 
                         min-w-[300px] md:min-w-[420px] text-center uppercase tracking-wider
                         hover:scale-105 transition-transform shadow-2xl">
          APPLY NOW
        </Link>
      </div>
    </VideoBackground>
  </section>
```

**CRITICAL:** Girl and sunshine are TWO INDEPENDENT elements in completely different screen positions. Do NOT stack or layer them.

---

## FIX 3: CONTENT ZONE — THREE COLUMNS WITH SVG ICONS

This is the biggest visual gap. The original has a beautiful 3-column layout with line-drawing icons. The replica has a boring single-column stack.

**Original layout (verified):**

```
┌──────────────────────────────────────────────────────────────────────┐
│              "A Parent's Dream Come True"                             │
│           (blue rgb(58,113,176), ~57px, centered, Coming Soon font)  │
│                                                                      │
│  🏫 A Place To Shine Bright  │  👥 More Than A Preschool  │  🛝 Play, Explore...  │
│  (yellow heading)             │  (yellow heading)           │  (yellow heading)      │
│  [body text left-aligned]     │  [body text left-aligned]   │  [body text left-align]│
│                               │                             │                        │
│  [Blue building SVG icon      │  [Coral people SVG icon     │  [Green slide SVG icon │
│   122×122, fill #1C31F4]      │   122×122, fill #F26656]    │   122×122, fill #266040│
└──────────────────────────────────────────────────────────────────────┘
```

**Verified icon details:**
- **Column 1 icon:** Building/school — viewBox "25 20.001 150 159.999", 17 paths, fill `#1C31F4` (blue). Shows a house/building with windows and a door.
- **Column 2 icon:** People group — viewBox "39.885 44.886 120.229 108.33", fill `#F26656` (coral). Shows a group of 3+ people figures.
- **Column 3 icon:** Playground/slide — viewBox "20 29.5 160.001 140.999", fill `#266040` (dark green). Shows a playground slide.

**Heading colors (verified):**
- "A Place To Shine Bright" — `rgb(242,176,32)` = `text-cca-yellow`
- "More Than A Preschool" — `rgb(242,176,32)` = `text-cca-yellow`
- "Play, Explore, Discover, Grow." — `rgb(242,176,32)` = `text-cca-yellow`
- "A Parent's Dream Come True" — `rgb(58,113,176)` = `text-cca-blue`, MUCH larger (~57px vs ~25px)

**ACTION — Create `src/components/marketing/ContentZone.tsx` or inline in page.tsx:**

Remove the standalone "A Place To Shine Bright" VideoBackground hero and the standalone "More Than A Preschool" section. Replace them with ONE section:

```tsx
<section className="py-16 md:py-24 px-6 bg-white">
  <div className="max-w-6xl mx-auto">
    
    {/* Big centered heading */}
    <h2 className="font-coming-soon text-4xl md:text-6xl text-cca-blue text-center mb-16">
      A Parent's Dream Come True
    </h2>
    
    {/* 3-column grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
      
      {/* Column 1 */}
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          {/* Blue building SVG icon, ~80-120px */}
          <BuildingIcon className="w-20 h-20 md:w-[100px] md:h-[100px] text-[#1C31F4]" />
        </div>
        <div>
          <h3 className="font-coming-soon text-2xl text-cca-yellow mb-3">
            A Place To Shine Bright
          </h3>
          <p className="font-questrial text-cca-ink/70 text-sm leading-relaxed">
            Crandall Christian Academy's preschool program in Crandall, Texas, provides a faith-based, nurturing environment where young minds flourish...
          </p>
        </div>
      </div>
      
      {/* Column 2 */}
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          {/* Coral people group SVG icon */}
          <PeopleGroupIcon className="w-20 h-20 md:w-[100px] md:h-[100px] text-[#F26656]" />
        </div>
        <div>
          <h3 className="font-coming-soon text-2xl text-cca-yellow mb-3">
            More Than A Preschool
          </h3>
          <p className="font-questrial text-cca-ink/70 text-sm leading-relaxed">
            At Crandall Christian Academy, we're more than a place for learning—we're a Christ-centered, close-knit community...
          </p>
        </div>
      </div>
      
      {/* Column 3 */}
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          {/* Dark green playground/slide SVG icon */}
          <PlaygroundIcon className="w-20 h-20 md:w-[100px] md:h-[100px] text-[#266040]" />
        </div>
        <div>
          <h3 className="font-coming-soon text-2xl text-cca-yellow mb-3">
            Play, Explore, Discover, Grow.
          </h3>
          <p className="font-questrial text-cca-ink/70 text-sm leading-relaxed">
            At Crandall Christian Academy, we create spaces for students to play freely, explore new ideas, and discover their unique potential...
          </p>
        </div>
      </div>
      
    </div>
  </div>
</section>
```

**SVG ICONS ARE ALREADY SAVED.** Use `<Image>` or `<img>` to render them from these paths:

- **Column 1:** `/marketing/home/icons/building.svg` — blue school building, fill `#1C31F4`
- **Column 2:** `/marketing/home/icons/people-group.svg` — coral people group, fill `#F26656`
- **Column 3:** `/marketing/home/icons/playground.svg` — dark green playground slide, fill `#266040`

Render at ~80-120px (e.g. `w-20 h-20 md:w-[100px] md:h-[100px]`). These are the EXACT SVGs extracted from the original Wix site.

**ALSO REMOVE:** 
- Both `<MarqueeBanner />` instances from page.tsx
- The standalone "A Place To Shine Bright" VideoBackground section
- The standalone "More Than A Preschool" two-column section
- The second `<SpinningCTA />` instance (only one, as hero)

---

## FIX 4: "TODAY'S LEARNERS" — 2-COLUMN WHITE LAYOUT WITH BLOB IMAGE

This section is COMPLETELY wrong. The replica uses a full-width video overlay with centered text. The original is a clean WHITE background 2-column layout with a blob-masked image.

**Original layout (verified):**
```
┌────────────────────────────────────────────────────────────────────────┐
│ WHITE BACKGROUND                                                       │
│                                                                        │
│  ┌─────────────────────┐    Peace of Mind for Parents (blue eyebrow)   │
│  │                     │                                               │
│  │  [CLASSROOM PHOTO   │    Today's Learners.                          │
│  │   in ORGANIC BLOB   │    Tomorrow's Leaders.                        │
│  │   SHAPE with SVG    │    Together!                                  │
│  │   mask-image, warm  │    (large dark heading, ~40-50px)             │
│  │   yellow accent     │                                               │
│  │   behind it]        │    At CCA, we believe in partnering with      │
│  │   757×700px         │    parents to create the best environment...  │
│  │                     │                                               │
│  └─────────────────────┘    ────────────────────────────────────       │
│                                                                        │
│  [Apply Now!] blue pill      Learn More →                              │
│  below the image                                         bottom-right  │
└────────────────────────────────────────────────────────────────────────┘
```

**Key details:**
- Background: WHITE (not video, not blue overlay)
- Left column: Classroom photo (757×700px) with an **SVG mask-image** creating an organic blob/circular shape. There's a warm yellow/golden accent shape visible behind/around the image.
- Right column: "Peace of Mind for Parents" eyebrow in blue, then the heading in dark navy (NOT white), then body text in dark text
- "Apply Now!" blue pill button positioned below the image on the left
- "Learn More →" text link positioned bottom-right with an arrow
- A subtle horizontal line divider between body text and "Learn More"

**ACTION — Replace the VideoBackground "Today's Learners" section entirely:**

```tsx
<section className="py-20 md:py-28 px-6 bg-white">
  <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
    
    {/* LEFT: Blob-masked classroom image */}
    <div className="relative">
      {/* Yellow accent shape behind the image */}
      <div className="absolute -top-8 -left-8 w-[80%] h-[80%] bg-cca-yellow/20 rounded-full blur-3xl" />
      
      {/* Image with organic blob mask */}
      <div className="relative" style={{
        maskImage: 'url("data:image/svg+xml,...")', /* Use a blob SVG path */
        WebkitMaskImage: '...',
        maskSize: 'contain',
        maskRepeat: 'no-repeat'
      }}>
        <Image
          src="/marketing/home/more-than-a-preschool.jpg"
          alt="Children learning together"
          width={757} height={700}
          className="w-full h-auto object-cover"
        />
      </div>
      
      {/* Apply Now button below image */}
      <div className="mt-8">
        <Link href="/enroll"
              className="bg-cca-blue text-white font-kollektif text-lg px-10 py-4 rounded-full 
                         hover:scale-105 transition-transform shadow-lg inline-block">
          Apply Now!
        </Link>
      </div>
    </div>
    
    {/* RIGHT: Text content */}
    <div>
      <p className="font-coming-soon text-base text-cca-blue mb-3">
        Peace of Mind for Parents
      </p>
      <h2 className="font-kollektif text-3xl md:text-5xl text-cca-ink leading-tight mb-6">
        Today's Learners.<br />
        Tomorrow's Leaders.<br />
        Together!
      </h2>
      <p className="font-questrial text-cca-ink/70 text-lg leading-relaxed mb-8">
        At Crandall Christian Academy, we believe in partnering with parents to create the best environment for their child's growth and success. Through open communication and collaboration, we ensure every child feels supported, nurtured, and inspired to learn.
      </p>
      <hr className="border-gray-200 mb-4" />
      <div className="flex justify-end">
        <Link href="/about" className="font-kollektif text-cca-ink flex items-center gap-2 hover:text-cca-blue transition-colors">
          Learn More
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
    
  </div>
</section>
```

**FOR THE BLOB MASK:** Use a CSS `mask-image` with an inline SVG blob shape. A simple approach:

```css
mask-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23000' d='M44.7,-76.4C58.8,-69.2,71.8,-58.7,79.6,-45.3C87.4,-31.9,89.9,-15.9,88.3,-0.9C86.7,14.1,80.9,28.3,73.1,41.4C65.3,54.6,55.4,66.7,42.8,74.4C30.2,82.1,15.1,85.3,0.2,85C-14.8,84.7,-29.5,80.9,-42.4,73.5C-55.3,66.1,-66.3,55.2,-73.6,42.1C-81,29.1,-84.6,14.5,-84.4,0.1C-84.2,-14.3,-80.1,-28.5,-72.5,-40.7C-64.9,-52.9,-53.8,-63,-41.1,-71C-28.4,-79,-14.2,-84.8,0.6,-85.8C15.4,-86.8,30.7,-83.1,44.7,-76.4Z' transform='translate(100 100)'/%3E%3C/svg%3E");
```

Or use `border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%` on the image container as a simpler alternative that still looks organic.

---

## FIX 5: STICKY PROGRAMS — REMOVE PHOTOS, USE SOLID COLORS

The original's sticky program sections use CLEAN TEXT on SOLID COLORED BACKGROUNDS with NO background images whatsoever. The replica's dramatic full-bleed photos are completely different from the original.

**Original layout (verified, each pair):**
```
┌────────────────────┬────────────────────┐
│  bg: cream/beige   │  bg: white         │  ← h-screen, sticky top-0
│  #FAF7F2           │  #FFFFFF           │
│                    │                    │
│  [Program Title]   │  [Program Title]   │  ← colored per program
│  in unique color   │  in unique color   │
│                    │                    │
│  Body text...      │  Body text...      │
│  dark ink          │  dark ink          │
│                    │                    │
│  Learn More  Apply │  Learn More  Apply │
└────────────────────┴────────────────────┘
```

**Program heading colors (verified from CSS):**

| Program | Heading Color | Hex |
|---------|--------------|-----|
| Infants | CCA Blue | `rgb(58,113,176)` |
| Toddlers | Coral/Red | `rgb(224,71,47)` |
| Twos | Golden Yellow | `rgb(242,176,32)` |
| Threes | Green | `rgb(92,186,96)` |
| Pre-K | CCA Blue | `rgb(58,113,176)` |
| Private Kinder | Pink | `rgb(248,120,175)` |

**ACTION — Rewrite `src/components/marketing/StickyPrograms.tsx`:**

1. **Remove ALL `<Image>` background fills and dark overlays.** No photos.
2. **Use solid backgrounds:** Left half = `bg-[#FAF7F2]` (warm cream), Right half = `bg-white`
3. **Color-code each heading** with its unique color
4. **Add `pair` prop** so each pair renders independently (needed for splitting around "Why Choose Us"):

```tsx
const PROGRAM_PAIRS = [
  {
    left: { title: 'Infants', titleColor: 'text-[#3A71B0]', body: '...', bg: 'bg-[#FAF7F2]' },
    right: { title: 'Toddlers', titleColor: 'text-[#E0472F]', body: '...', bg: 'bg-white' },
  },
  {
    left: { title: 'Twos', titleColor: 'text-[#F2B020]', body: '...', bg: 'bg-[#FAF7F2]' },
    right: { title: 'Threes', titleColor: 'text-[#5CBA60]', body: '...', bg: 'bg-white' },
  },
  {
    left: { title: 'Pre-K', titleColor: 'text-[#3A71B0]', body: '...', bg: 'bg-[#FAF7F2]' },
    right: { title: 'Private Kinder', titleColor: 'text-[#F878AF]', body: '...', bg: 'bg-white' },
  },
];

function ProgramHalf({ title, titleColor, body, bg }) {
  return (
    <div className={`${bg} flex items-center justify-center p-8 md:p-16`}>
      <div className="max-w-md text-center">
        <h3 className={`font-kollektif text-3xl md:text-5xl ${titleColor} mb-4`}>{title}</h3>
        <p className="font-questrial text-cca-ink/80 text-base md:text-lg leading-relaxed mb-6">{body}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/about" className="text-cca-blue font-kollektif hover:underline">Learn More</Link>
          <Link href="/enroll" className="bg-cca-blue text-white font-kollektif px-6 py-3 rounded-full">Apply Now</Link>
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

**In page.tsx:** Use `<StickyPrograms pair={0} />`, `<StickyPrograms pair={1} />`, then "Why Choose Us", then `<StickyPrograms pair={2} />`.

---

## FIX 6: WHY CHOOSE US — WHITE BG + PINK HEARTS + GREEN HEADINGS

The replica's bright green background with glassmorphism star-icon cards looks nothing like the original.

**Original layout (verified):**
- Background: **WHITE** (transparent/white, NOT green)
- 2-column layout:
  - Left: "Why Choose Us" heading (blue `rgb(59,112,176)`), "Every Child with Love & Safety" subtext, paragraph, "Apply Now!" button
  - Right: 3 value prop cards stacked vertically
- Each value prop has:
  - A **PINK HEART SVG** icon (`rgb(248,120,175)` = `#F878AF`)
  - Heading in **GREEN** (`rgb(92,185,97)` = `#5CB961`) — NOT white, NOT dark
  - Body text in dark ink
  - Separated by thin borders/lines

**ACTION:**

1. Section bg: `bg-white` (remove `bg-cca-green`)
2. Layout: 2-column grid (`md:grid-cols-2`)
3. Left column: heading + subtext + body + "Apply Now" button
4. Right column: 3 value props with pink heart icons and green headings

```tsx
{/* Left */}
<div>
  <h2 className="font-kollektif text-sm uppercase tracking-widest text-cca-blue mb-2">Why Choose Us</h2>
  <p className="font-kollektif text-3xl md:text-4xl text-cca-ink mb-4">Every Child with Love & Safety</p>
  <p className="font-questrial text-cca-ink/70 leading-relaxed mb-6">
    Crandall Christian Academy is dedicated to fostering academic excellence and Christian values...
  </p>
  <Link href="/enroll" className="bg-cca-blue text-white font-kollektif px-8 py-3 rounded-full">Apply Now!</Link>
</div>

{/* Right */}
<div className="space-y-6">
  {VALUE_PROPS.map(vp => (
    <div className="flex gap-4 items-start pb-6 border-b border-gray-100 last:border-b-0">
      {/* Pink heart SVG */}
      <svg className="w-8 h-8 flex-shrink-0 mt-1" viewBox="26.5 36 147 128" fill="#F878AF">
        <path d="M161.6 47.8c-15.8-15.7-41.5-15.7-57.3 0L100 52.1l-4.3-4.3c-15.8-15.7-41.5-15.7-57.3 0-15.8 15.7-15.8 41.1 0 56.7l61.6 61 61.6-61c15.8-15.6 15.8-41 0-56.7z"/>
      </svg>
      <div>
        <h3 className="font-kollektif text-lg text-[#5CB961] mb-1">{vp.title}</h3>
        <p className="font-questrial text-cca-ink/70 text-sm leading-relaxed">{vp.body}</p>
      </div>
    </div>
  ))}
</div>
```

---

## FIX 7: AMBIENT VIDEO SECTION (ADD — MISSING)

**Original has a 618px video section at position 9.** Silent classroom video, no text overlay. Visual breather between Pre-K sticky and Newsletter.

**ACTION — Add between `<StickyPrograms pair={2} />` and Newsletter:**

```tsx
<section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
  <VideoBackground
    src1080={`${VIDEO_BASE}/more-than-a-preschool-1080p.mp4`}
    src720={`${VIDEO_BASE}/more-than-a-preschool-720p.mp4`}
    poster="/marketing/home/more-than-a-preschool.jpg"
    className="h-full"
    overlay="bg-black/10"
  >
    <div /> {/* Empty child if required by component */}
  </VideoBackground>
</section>
```

---

## FIX 8: CURRICULUM — GREEN HEADING + BLUE PILLAR TITLES + READ MORE

**Verified colors:**
- "Learning Adventures" eyebrow — pink (existing, keep)
- "Our Curriculum" heading — **GREEN `rgb(92,185,97)`** → `text-cca-green`
- Individual pillar headings (Creative Arts, etc.) — **BLUE `rgb(59,112,176)`** → `text-cca-blue`
- Each pillar card has a "Read More" link → `/about`

**ACTION:**
1. Change SectionHeader: `headingColor="text-cca-green"`
2. In `PillarCard`, change heading: `className="font-kollektif text-xl mb-3 text-cca-blue"`
3. Add a "Read More" link to each PillarCard:
```tsx
<Link href="/about" className="text-cca-blue font-kollektif text-sm hover:underline mt-3 inline-block">
  Read More
</Link>
```

---

## FIX 9: INGREDIENTS — CREAM BACKGROUND

**Verified:** Background is cream `rgb(248,246,240)`.

**ACTION:** Change section bg from `bg-white` to `bg-cca-cream`:
```tsx
<section className="py-24 md:py-32 px-6 bg-cca-cream">
```

---

## FIX 10: PAGE REORDER — FINAL ASSEMBLY

**Rewrite `src/app/(marketing)/page.tsx` with this exact order:**

```tsx
export default function HomePage() {
  return (
    <>
      {/* 1. HERO */}
      <SpinningCTA />
      
      {/* 2. CONTENT ZONE — 3 columns with icons */}
      <ContentZone />  {/* or inline the 3-column section */}
      
      {/* 3. TODAY'S LEARNERS — white bg, 2-column, blob image */}
      {/* New component replacing the old VideoBackground version */}
      <TodaysLearners />
      
      {/* 4. CURRICULUM */}
      <CurriculumSection />
      
      {/* 5. STICKY: Infants / Toddlers */}
      <StickyPrograms pair={0} />
      
      {/* 6. STICKY: Twos / Threes */}
      <StickyPrograms pair={1} />
      
      {/* 7. WHY CHOOSE US — white bg, pink hearts */}
      <WhyChooseUs />
      
      {/* 8. STICKY: Pre-K / Kinder */}
      <StickyPrograms pair={2} />
      
      {/* 9. AMBIENT VIDEO */}
      <AmbientVideo />
      
      {/* 10. NEWSLETTER */}
      <Newsletter />
      
      {/* 11. INGREDIENTS — cream bg */}
      <Ingredients />
      
      {/* 12. FINAL CTA */}
      <FinalCTA />
    </>
  );
}
```

**REMOVE from page.tsx:**
- Both `<MarqueeBanner />` instances
- Second `<SpinningCTA />` instance
- Standalone "A Place To Shine Bright" VideoBackground hero section
- Standalone "More Than A Preschool" two-column section
- Old "Today's Learners" VideoBackground section

---

## IMPLEMENTATION ORDER

1. **FIX 5** — Rewrite StickyPrograms (remove photos, add colors, add `pair` prop)
2. **FIX 10** — Reorder page.tsx (depends on StickyPrograms refactor)
3. **FIX 2** — Hero SpinningCTA layout (sunshine top-right, girl center)
4. **FIX 3** — Content zone (3 columns + SVG icons)
5. **FIX 4** — "Today's Learners" (white bg, 2-column, blob image)
6. **FIX 6** — "Why Choose Us" (white bg, pink hearts, green headings)
7. **FIX 7** — Add ambient video section
8. **FIX 1** — Header (blue utility bar, bigger logo, plain NOW HIRING)
9. **FIX 8** — Curriculum colors (green heading, blue titles, Read More)
10. **FIX 9** — Ingredients cream bg

After ALL fixes: verify the page compiles, then scroll through top-to-bottom.

---

## COLOR REFERENCE TABLE

| Token | Hex | RGB | Use |
|-------|-----|-----|-----|
| CCA Blue | `#3A71B0` | `rgb(58,113,176)` | Primary brand, utility bar bg, headings, buttons |
| Golden Yellow | `#F2B020` | `rgb(242,176,32)` | Content zone headings, "Twos" program |
| Coral/Red | `#E0472F` | `rgb(224,71,47)` | "Toddlers" program heading |
| Green | `#5CBA60` | `rgb(92,186,96)` | "Our Curriculum" heading, value prop headings, "Threes" |
| Pink | `#F878AF` | `rgb(248,120,175)` | Heart icons, "Private Kinder" heading |
| Icon Blue | `#1C31F4` | | Building icon in content zone |
| Icon Coral | `#F26656` | | People icon in content zone |
| Icon Green | `#266040` | | Playground icon in content zone |
| Cream bg | `#F8F6F0` | `rgb(248,246,240)` | Ingredients bg, sticky program left half |
| White | `#FFFFFF` | | Default surface, Why Choose Us bg, Today's Learners bg |

## ASSETS

- `public/marketing/home/mascot-sunshine-face.png` — spinning enrollment CTA
- `public/marketing/home/mascot-girl.png` — girl mascot
- `public/marketing/home/more-than-a-preschool.jpg` — Today's Learners blob image + ambient video poster
- `public/marketing/home/pillar-*.jpg` — curriculum pillar images
- `public/marketing/about/program-*.jpg` — NOT used in sticky sections anymore (photos removed)
- `public/marketing/home/videos/` — video files
- `public/marketing/home/icons/building.svg` — blue school building icon (content zone col 1)
- `public/marketing/home/icons/people-group.svg` — coral people group icon (content zone col 2)
- `public/marketing/home/icons/playground.svg` — dark green playground/slide icon (content zone col 3)

## WHAT NOT TO TOUCH

- Portal code, API routes, migrations, supabase/
- The footer
- The about, contact, FAQ, team pages
- The enrollment form / enrollment wizard
- `src/components/ui/` primitives
