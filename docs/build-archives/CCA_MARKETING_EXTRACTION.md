# CCA Marketing Site — Wix Extraction

**Purpose:** Complete, self-contained capture of the Wix-hosted `crandallchristianacademy.com` marketing site as of 2026-04-17. This is the input artifact for the Next.js replica build (see `CCA_MARKETING_REPLICA.md` once written). Every string, section, component, color, font, form, and media asset on the live site is documented here so the replica can be rebuilt without ever hitting the Wix source again.

**Source of truth at extraction time:** Wix Thunderbolt render, site revision 216. The extraction used Chrome + rendered-DOM scraping because Wix is client-side rendered — a plain fetch returns only a React shell.

**Status:** Extraction complete. Assets downloaded (44 files, 222 MB). Replica build doc not yet written.

---

## @anchor marketing-extraction-v1

Grep anchor for orientation. Other anchors used below: `@brand`, `@nav`, `@home`, `@about`, `@team`, `@contact`, `@faq`, `@book-online`, `@blog`, `@forms`, `@assets`, `@parity-notes`.

---

## @brand — Brand, typography, palette

**Name:** Crandall Christian Academy
**Short name:** CCA
**Tagline (appears in header strip):** Premier Pre-School in Crandall, Texas
**Phone:** (945) 226-6584 · tel: `+19452266584`
**Email:** `admin@crandallchristianacademy.com`
**Location:** Crandall, Texas
**Portal:** `portal.crandallchristianacademy.com` (SuiteDash — treat as **read-only**; never write to SuiteDash)

### Palette

| Token | Hex | Used for |
|---|---|---|
| green | `#5CB961` | "Shine Bright" accent, pillar card |
| blue | `#3B70B0` | "More Than a Preschool" heading, primary CTA |
| coral | `#F15A50` | "Play, Explore" accent |
| pink | `#F878AF` | Pillar card accents |
| yellow | `#F2B020` | Subhead accents, "A Parent's Dream" |
| teal | `#4ABDAC` | Secondary accent |
| ink | `#141413` | Near-black body text |
| cream | `#FAF9F5` | Section wash |
| white | `#FFFFFF` | Default background |

### Typography

| Role | Family | Weight | Notes |
|---|---|---|---|
| Display / H1–H2 | **Kollektif Bold** | 700 | Downloaded woff2/woff/ttf under `public/marketing/shared/fonts/` |
| Heading alt | Kollektif Regular | 400 | Also downloaded |
| Body | **Questrial** | 400 | Google Fonts — `https://fonts.googleapis.com/css2?family=Questrial&display=swap` |
| Accent / hand-drawn | Coming Soon | 400 | Sparingly — banners, labels |

Observed type scale on live site (1728px viewport):

- h1 — 46 / 69 line-height (Kollektif Bold)
- h2 — 56.7 / 73.7 (Kollektif Bold)
- h3 — 24.6 / 34.4 weight 700
- Body paragraph — 21.9 / 35 weight 700 (heavy body is a deliberate Wix choice — on the replica, consider softening to 400/500 with 18px size for better legibility)

**Font license note:** Kollektif is a free font by Oleg Stepanov, Coming Soon is Apache/OFL via Google. Questrial is OFL via Google. All safe to self-host.

### Logo

- Full logo: `public/marketing/shared/cca-logo-full.png` (1920×667 original crop, sunshine character + "Crandall Christian Academy" wordmark)
- Small logo: `public/marketing/shared/cca-logo-small.png`
- Favicon: `public/marketing/shared/favicon.png`

---

## @nav — Global navigation

The live site uses a single **slim header** (no traditional content-heavy footer). Order:

| Item | Label | Href |
|---|---|---|
| 1 | Home | `/` |
| 2 | About | `/about` |
| 3 | Contact | `/contact` |
| 4 | FAQ | `/faq` |
| 5 | **NOW HIRING** (emphasized button) | `https://portal.crandallchristianacademy.com/frm/2snH8oyrySKMYc58h` |
| 6 | Email Us (icon) | `mailto:admin@crandallchristianacademy.com` |

Phone number `Tel. (945) 226-6584` renders in the top-left of the header on desktop.

**Apply Now** button is repeated throughout pages (not a nav item itself) and links to:
`https://portal.crandallchristianacademy.com/frm/21SsD4XPAgP8cJ3jt`

**Footer:** The live site has NO traditional footer with address/hours/social. This is a gap the replica should fix — add a full footer with address block, hours (Mon–Fri 7 AM – 6 PM per FAQ), phone, email, portal CTAs, and legal links.

---

## @home — Home page (`/`)

Page title on Wix: **Home | Crandall Christian Academy**

Sections, in render order. Copy is captured verbatim. Section headings double as component boundaries.

### 1. Hero — "A Place To Shine Bright"

- Eyebrow icon: small sun/shine icon, fill `#5CB961`
- **H1:** A Place To Shine Bright
- **Body:** Crandall Christian Academy's preschool program in Crandall, Texas offers a nurturing environment where young minds grow through hands-on learning and character-building activities. Our curriculum fosters creativity, social development, and foundational academic skills, preparing children for a bright future.
- Primary CTA: *Apply Now!* → `https://portal.crandallchristianacademy.com/frm/21SsD4XPAgP8cJ3jt`
- **Asset:** Hero video background (currently paired with a static poster image on load). Use `public/marketing/home/videos/facility-hero-1080p.mp4` (with 720p fallback) and poster `public/marketing/home/facility-hero-poster.jpg`.

### 2. "More Than A Preschool"

Icon accents: white/blue sparkle — `#3B70B0` accent

- **H2:** More Than A Preschool
- **Body:** At Crandall Christian Academy, we're more than a place for learning—we're a loving, close-knit community where children, teachers, and families build meaningful relationships. We celebrate each child's unique gifts, encourage their growth, and surround them with warmth, care, and connection. Together, we create a joyful environment where every child feels valued, supported, and inspired to thrive in every way.
- **Asset:** Paired image `public/marketing/home/more-than-a-preschool.jpg` (756×700 rendered). Optional looping video variant at `public/marketing/home/videos/more-than-a-preschool-1080p.mp4`.

### 3. "Play, Explore, Discover, Grow."

Icon accent: `#F15A50` coral

- **H2:** Play, Explore, Discover, Grow.
- **Body:** At Crandall Christian Academy, we create spaces for students to play freely, explore new ideas, and discover their unique potential. Every day offers opportunities for active learning, fostering growth in mind, body and spirit. We nurture curiosity, creativity, and a sense of wonder as little ones thrive.

### 4. "A Parent's Dream Come True" / Apply CTA

- **Eyebrow:** A Parent's Dream Come True
- **Button:** *Apply Now!* → portal apply URL
- Background: video — `facility-hero-*.mp4` (focal point x:17 y:10)

### 5. "Peace of Mind for Parents"

- **Eyebrow:** Peace of Mind for Parents
- **H2:** Today's Learners. Tomorrow's Leaders. Together!
- **Button:** *Learn More* → `/about`
- **Body:** At Crandall Christian Academy, we believe in partnering with parents to create the best environment for their child's growth and success. Through open communication and collaboration, we ensure every child feels supported, nurtured, and inspired to learn. Together, we build a foundation of trust and shared goals, giving parents peace of mind and children the tools they need to thrive. By working hand-in-hand, we help today's little learners grow into tomorrow's confident leaders.

### 6. Learning Adventures (Four pillars)

- **Eyebrow:** Learning Adventures
- **H2:** Our Curriculum (note: label used twice on the page — here and on the age-program block below)

Four pillar cards. Each has a color accent, title, body, and *Read More* link (live site currently has no detail pages for these — linking them to `/about` or removing the CTA is acceptable on the replica).

| # | Title | Color | Body | Image |
|---|---|---|---|---|
| 1 | **Creative Arts** | pink `#F878AF` | From painting and crafting to music and imaginative play, our creative arts program inspires self-expression, builds confidence, and nurtures a love for the arts. By engaging their imaginations and developing fine motor skills, children discover the joy of creating while growing in their ability to think critically and solve problems. | `public/marketing/home/pillar-creative-arts.jpg` |
| 2 | **Curiosity and Discovery** | pink `#F878AF` | At Crandall Christian Academy, we nurture a sense of wonder by encouraging children to explore, question, and discover the world around them. Through hands-on activities and interactive learning experiences, young minds develop problem-solving skills, creativity, and a lifelong love for discovery. Our program inspires curiosity and equips children with the tools to think critically and innovate with confidence. | `public/marketing/home/pillar-curiosity-discovery.jpg` |
| 3 | **Language and Literacy** | pink `#F878AF` | Students develop the foundation for strong communication skills through engaging language and literacy activities. From storytime and early writing exercises to phonics and vocabulary building, children develop the tools they need to express themselves and connect with the world. Our program fosters a love for reading, enhances comprehension, and builds confidence in young learners as they discover the power of words and storytelling. in every way. | `public/marketing/home/pillar-language-literacy.jpg` |
| 4 | **Physical Development** | pink `#F878AF` | Together, we support your child's growth through activities that promote strength, coordination, and overall wellness. From active play and movement exercises to fine and gross motor skill development, our program helps our students build healthy habits and confidence in their abilities. By staying active and engaged, children develop the physical foundation they need to thrive in learning and in life! | `public/marketing/home/pillar-physical-development.jpg` |

> Note: All four pillars currently share a pink accent on live Wix. The site design clearly *intended* color variation (per distinct fills observed: green `#5CB961`, blue `#3B70B0`, coral `#F15A50`, yellow `#F2B020`). Replica: assign green → Creative Arts, blue → Curiosity, coral → Language, yellow → Physical. This is an improvement on live, not a parity break.

### 7. Our Curriculum — Age programs

Cards for each age band, each with *Learn More* → `/about#<slug>` and *Apply Now!* → portal apply URL.

| # | Age | Body | Image |
|---|---|---|---|
| 1 | **Infants** | Our infant program provides a safe, loving, and faith-filled environment where your baby is nurtured from the very beginning. With attentive caregivers, low ratios, and individualized care, we focus on building trust, comfort, and early developmental milestones while partnering closely with parents every step of the way. | `public/marketing/home/curriculum-infants.jpg` |
| 2 | **Toddlers** | Our toddler program nurtures curiosity and early exploration in a safe, loving environment, promoting developmental milestones through hands-on activities and play. | `public/marketing/home/curriculum-toddlers.jpg` |
| 3 | **Twos** | The 2s program introduces structure and socialization, encouraging early learning through age-appropriate activities that build confidence, independence, and foundational skills. | `public/marketing/home/curriculum-twos.jpg` |
| 4 | **Threes** | In our 3s program, children engage in creative learning experiences that develop early literacy, math, and social skills while fostering curiosity and a love for discovery. | (no dedicated image on live — reuse the About `program-threes.jpg` or source a new one) |
| 5 | **Pre-K** | The Pre-K program prepares children for kindergarten with a focus on academics, social-emotional growth, and faith-based learning in a supportive and engaging environment. | (no dedicated image on live) |
| 6 | **Private Kinder** | Our private kindergarten offers a well-rounded education, blending academic excellence, spiritual growth, and individualized attention to ensure children thrive in their first formal year of school. | (no dedicated image on live) |

### 8. Why Choose Us

- **Eyebrow:** Why Choose Us
- **H2:** Every Child with Love & Safety
- **Body:** Crandall Christian Academy is dedicated to fostering academic excellence and Christian values in a nurturing environment. We strive to develop respectful, compassionate leaders who positively impact the world. Crandall Christian Academy prides itself on being a place of learning, development, and safety for childcare-age children. Our mission is to provide the best childcare services in the area.
- **Button:** *Apply Now!* → portal apply URL

Three value-prop cards (each with a pink `#F878AF` icon):

1. **Faith-Centered Education** — We integrate Christian values into every aspect of learning, fostering spiritual growth alongside academic success for a well-rounded foundation.
2. **Exceptional Teachers & Curriculum** — Our experienced educators and age-appropriate curriculum ensure your child receives personalized attention and the tools they need to thrive.
3. **Safe & Nurturing Environment** — CCA provides a loving, secure space where children feel supported as they explore, grow, and develop their God-given potential.

### 9. Newsletter

- **H3:** Subscribe To Our Newsletter
- Field: Email* (placeholder: "Email*")
- Checkbox label: Yes, subscribe me to your newsletter.
- **Button:** Submit
- **Background:** looping video — `public/marketing/home/videos/newsletter-bg-1080p.mp4`
- **Rebuild behavior:** POST email to Supabase `newsletter_subscribers` (tenant_id='cca') + send confirmation via Resend.

### 10. The CCA Difference

- **Eyebrow:** The CCA Difference
- **H2:** The Ingredients Of A Perfect Pre-School For Your Child

Four feature rows (alternating text/image):

1. **Highly Experienced Leadership & Highly Trained Staff** — Our leadership team brings years of early childhood and Christian education experience, and our teachers are highly trained, caring, and consistent, creating a safe, structured, and loving environment for every child.
2. **A Premier Preschool, Right Here in Crandall** — Crandall finally has a premier local preschool families can be proud of. Our brand new, state-of-the-art 8,000 SF facility gives your child a beautiful place to learn and grow, right here in the community.
3. **A Curriculum That Prepares Your Child** — Our preschool curriculum blends joyful, play-based learning with the structure kids thrive on, building early literacy, math readiness, and social-emotional skills through hands-on activities, guided discovery, and purposeful daily routines.
4. **Safety You Can Feel** — Your child's safety is our highest priority, and it's built into everything we do. Our state-of-the-art campus features 24/7 gated and controlled access, advanced facial recognition, and layered security measures, all working quietly in the background so kids can focus on what they do best: learning, playing, and being cared for. From drop-off to pick-up, families get real peace of mind in a warm, joyful environment.

### 11. "Where Little Minds Shine" — closing CTA

- Aspect: ~1.018 (near square)
- **H2:** Where Little Minds Shine
- **Subhead:** Lighting the Way for Lifelong Learning.
- **Button:** APPLY NOW → portal apply URL
- **Background:** `facility-hero-*.mp4` (same asset as section 4)

### 12. (Duplicate-feeling) Christ-centered variant

This block appears AFTER the primary hero sequence and re-states sections 1–3 with slightly more Christ-centered language. It's likely a holdover from an earlier draft or an A/B variant. **Recommendation for replica: cut this block.** If Skylar wants the more explicitly faith-forward variant, replace the top-of-page hero with this version instead of stacking both.

- Repeats "A Place To Shine Bright", "More Than A Preschool", "Play, Explore, Discover, Grow." with Christ-centered phrasing — e.g., "faith-based, nurturing environment where young minds flourish" and "Christ-centered, close-knit community where children, teachers, and families grow together in faith and love".

### 13. "Our Facility Is Almost Complete!" — final closer

- **Eyebrow:** Our Facility Is Almost Complete! NOW ENROLLING
- **H2:** Crandall's New Pre-School Gem
- **Body:** Located in the heart of Crandall, Texas, our new facility is designed to provide a warm and welcoming environment where children can learn, grow, and thrive. With state-of-the-art classrooms, engaging activity spaces, and a nurturing atmosphere, we focus on creating a home away from home for our students. Every detail of our facility reflects our commitment to fostering curiosity, creativity, and a sense of community, ensuring every child feels safe, supported, and inspired each day.
- Two CTAs: *Apply Now!* (buttons, both linking to portal apply URL)

> **Content freshness flag:** "Almost complete" was written pre-opening; the academy's launch date per blog post is **August 2025**. Update copy accordingly on the replica (e.g., "Open Now — Enrolling for Fall 2026" or whatever is current at cutover).

---

## @about — About page (`/about`)

Page title: **About | Crandall Christian Academy**

- Hero eyebrow: About
- Hero H1: Where Learning and Fun Come Together
- Hero image: `public/marketing/about/hero-playing-toddlers.jpg`

### Our Mission

- **H2:** Our Mission
- **Subhead:** We support the growth and development of every child through personalized care.
- **Body:** At Crandall Christian Academy, our mission is to provide a safe, loving, and educational environment where children can thrive. We believe in nurturing each child's unique abilities and fostering a lifelong love of learning.
- **CTA:** *Meet Our Educators* → `/our-team`

Three value-prop bullets (each with a blue `#3B70B0` icon):

1. Encouraging curiosity and creativity.
2. Supporting emotional, social, and spiritual development.
3. Building strong partnerships with families.

### Our Programs

- **H2:** Our Programs
- **Body:** At Crandall Christian Academy, our programs are thoughtfully designed to nurture children's growth from toddlers to private kindergarten. Each program focuses on age-appropriate learning, fostering curiosity, independence, and a love for God in a safe and supportive environment. From their first steps in exploration to building strong academic foundations, we're here to guide your child every step of the way.

Program cards. Each has an *Apply Now!* CTA linking to the portal apply URL. **These are expanded versions of the home-page age cards — treat `/about#programs` as the canonical program detail, and link age cards on home to `/about#<slug>`.**

| Slug | Title | Body | Image |
|---|---|---|---|
| `infants` | **Our Infant Classes** | From their very first days, your child is lovingly cared for in a Christ-centered environment designed for comfort, safety, and growth. Our infant program focuses on nurturing each baby with patience, prayer, and individualized care, creating a strong foundation for lifelong learning. | `public/marketing/about/program-infants.jpg` |
| `toddlers` | **Our Toddlers Classes** | Our toddler program provides a nurturing and stimulating environment designed to support your child's early developmental milestones. Through age-appropriate activities, sensory play, and loving care, toddlers explore the world around them while building a foundation for lifelong learning. | `public/marketing/about/program-toddlers.jpg` |
| `twos` | **Our 2s Classes** | In our 2s program, children take their first steps into a structured learning environment, separate from the toddler space. With a focus on fostering independence, socialization, and early academic skills, our 2s classroom encourages curiosity and confidence through guided play and hands-on exploration. | `public/marketing/about/program-twos.jpg` |
| `threes` | **Our 3s Class** | Our 3s program is designed to ignite curiosity and foster a love for learning in a warm, supportive environment. Through engaging activities, creative play, and age-appropriate lessons, children develop essential skills in literacy, math, and problem-solving while building social connections and confidence. This class provides the perfect balance of structure and exploration to help your child thrive. | `public/marketing/about/program-threes.jpg` |
| `preschool-kinder` | **Preschool & Private Kindergarden** *(typo on live — fix to "Kindergarten" on replica)* | Our Preschool and Private Kindergarten programs provide a strong foundation for lifelong learning in a nurturing, faith-based environment. Preschool focuses on building essential skills in literacy, math, and social-emotional development through engaging, hands-on activities that foster curiosity and independence. Private Kindergarten offers a comprehensive, well-rounded curriculum with personalized attention to ensure your child is prepared for future academic success while growing in confidence and character. | `public/marketing/about/program-preschool-kinder.jpg` |

> **Typo flag:** Live site reads "Private Kindergarden" (one instance) — correct to "Kindergarten" across the replica.

---

## @team — Our Team (`/our-team`)

Page title on Wix: **Our Team | KiddoCare** — *Wix template title not rebranded. Fix on replica.*

- Hero label: Our Team
- Hero subhead: Dedicated Educators Committed to Your Child's Growth
- Hero image: `public/marketing/team/hero-art-class.jpg`

### Staff — ⚠️ VERIFY WITH SKYLAR

The 8 staff listed below appear to be **Wix template placeholders**, not real CCA staff. Images are stock headshots. Do not ship these to production. Options:

1. Replace with real CCA staff on the replica before cutover (collect names, titles, bios, headshots from Skylar).
2. Temporarily hide the team page until content is real (redirect `/our-team` → `/about#mission`).

Current live roster (for reference only):

| # | Name | Title | Image |
|---|---|---|---|
| 1 | Jesse Austin | Lead Preschool Teacher | `public/marketing/team/staff-01-jesse-austin.jpg` |
| 2 | Chloe Wilson | Assistant Preschool Teacher | `public/marketing/team/staff-02-chloe-wilson.jpg` |
| 3 | Julie Williams | Early Learning Specialist | `public/marketing/team/staff-03-julie-williams.jpg` |
| 4 | Jessica Davis | Creative Arts Instructor | `public/marketing/team/staff-04-jessica-davis.jpg` |
| 5 | Cynthia James | Child Development Specialist | `public/marketing/team/staff-05-cynthia-james.jpg` |
| 6 | Andrew Edwards | Physical Education Teacher | `public/marketing/team/staff-06-andrew-edwards.jpg` |
| 7 | Angela Simms | Assistant Principal | `public/marketing/team/staff-07-angela-simms.jpg` |
| 8 | Matthew Heart | Principal | `public/marketing/team/staff-08-matthew-heart.jpg` |

### Data model for /our-team

Use a tenant-scoped `staff` table (`tenants.id = cca`), columns: `id, tenant_id, name, title, bio, headshot_path, sort_order, is_published`. Render cards in grid (3 or 4 col on desktop, 2 on tablet, 1 on mobile) with hover lift + name/title reveal.

---

## @contact — Contact page (`/contact`)

Page title on Wix: **Contact | KiddoCare** — *same branding issue, fix on replica.*

- Hero label: Get In Touch
- Hero subhead: Connect with Us for More Information and Enrollment
- Hero image: `public/marketing/contact/hero-painting-class.jpg`

### Body

- **H2:** We're Here to Answer Your Questions and Help Your Child Thrive
- **Body paragraph 1:** Thank you for your interest in Crandall Christian Academy. As we prepare to open our doors, we are excited to connect with families who are seeking a nurturing, faith-based learning environment for their children.
- **Body paragraph 2:** Whether you have questions about enrollment, programs, our upcoming opening, or employment opportunities, our team is here to help.

> Copy is pre-opening tense. Update to current state at cutover.

### Contact form — "Contact us" (see @forms below for full spec)

Fields: First name · Last name · Email\* · Message\*
Submit label: Submit

---

## @faq — FAQ page (`/faq`)

Page title: **FAQ | Crandall Christian**

- **H1:** Frequently asked questions

Accordion of 8 Q&A items, rendered in this order. On the replica, implement with proper ARIA, keyboard nav, `<details>/<summary>` or a Radix Accordion.

1. **What ages does Crandall Christian Academy serve?**
   Crandall Christian Academy serves children from 3 months through Kindergarten, providing nurturing care and Christ-centered education at every developmental stage.

2. **What are your hours of operation?**
   CCA is open Monday through Friday from 7:00 AM – 6:00 PM. Children must be picked up promptly by closing time.

3. **Do you offer sibling discounts?**
   Discount Policies:
   • The youngest sibling pays full tuition
   • Each additional sibling receives a $50 monthly discount

4. **What should my child bring each day?**
   Families should provide:
   • A labeled change of clothes
   • Diapers/wipes (if applicable)
   • A water bottle
   • Any required comfort items for rest time
   • Rain boots for outdoor play
   • Children should bring a labeled lunch and snack each day.
   Specific supply lists are provided by classroom.

5. **Are meals or snacks provided?**
   No. At this time, Crandall Christian Academy does not provide lunches or snacks. Families are responsible for sending a labeled lunch and snack each day for their child.

6. **How do you communicate with parents?**
   We believe in strong family partnerships and open communication. Crandall Christian Academy uses a secure communication software system to provide updates throughout the day, including daily reports and photos, activity and learning updates, messages from teachers and staff, and important announcements and reminders.

7. **How do I schedule a tour or enroll?**
   To begin the enrollment process, please complete the online application form. Our team will follow up with you regarding next steps and availability.

8. **What makes CCA different?**
   Crandall Christian Academy offers a warm, faith-filled environment where children grow academically, socially, and spiritually. We are committed to providing loving, experienced teachers, strong Christian values, developmentally appropriate learning, a supportive community atmosphere, and state-of-the-art security measures, including controlled building access and monitored systems, to ensure the safety and well-being of every child and staff member.

**SEO bonus:** Wrap FAQ in `FAQPage` JSON-LD schema so Google shows the rich accordion in search.

---

## @book-online — Book Online (`/book-online`)

- Page is **essentially empty** — a Wix booking widget with only a "Test Service One, 1 hr, Book Now" placeholder.
- **Recommendation:** Remove this route entirely on the replica. Redirect `/book-online → /contact` (or to a SuiteDash scheduling URL if Skylar has one set up for tours). Confirm with Skylar before cutover.

---

## @blog — Blog (`/blog`)

- Page title: **Blog | Crandall Christian**
- Index style: card grid, 4:3 covers, 32px gap, vertical layout, titlePlacement SHOW_BELOW
- Card anatomy: cover image (4:3), H3 title linking to post, 1-line snippet from body, author "Crandall Christian Academy", formatted date, read time ("3 min read"), view count, comment count, likes.
- **63 existing posts** — see appendix A for full slug/date list.

### Replica strategy — do NOT hand-port 63 posts

1. Build Supabase schema: `blog_posts(id, tenant_id, slug, title, excerpt, body_html, cover_path, author, published_at, read_time_minutes, is_published, meta_title, meta_description)` with tenant_id RLS.
2. Write a one-time migration script (`scripts/migrate-cca-blog.ts`) that for each slug in appendix A:
   - Fetches `https://www.crandallchristianacademy.com/post/<slug>` with a rendered-DOM scraper (Playwright or Puppeteer — Wix is client-rendered like the rest of the site).
   - Extracts title, published date, body HTML (sanitize with DOMPurify), cover image URL.
   - Downloads cover to `public/marketing/blog/<slug>.jpg` (and responsive variants).
   - Inserts row into `blog_posts`.
3. Next.js routes: `/blog` (index, paginated, 12 per page) and `/blog/[slug]` (detail) — both statically generated with ISR.
4. Add `BlogPosting` JSON-LD per post; sitemap generation.

---

## @forms — Form integrations

Three forms on the live site. Rebuild spec:

### 1. Newsletter (home page)

- Fields: `email` (required, email validation), `consent` (checkbox — "Yes, subscribe me to your newsletter.")
- Submit label: Submit
- Backend: Supabase `newsletter_subscribers(email, tenant_id, consent_at, source_page, ip)`, upsert on email+tenant.
- Notification: Resend send → admin@crandallchristianacademy.com + optional double opt-in confirmation email.
- Honeypot + hCaptcha/Cloudflare Turnstile to block spam.

### 2. Contact form (`/contact`)

- Fields: `first_name`, `last_name`, `email`* (required), `message`* (required)
- Submit label: Submit
- Backend: Supabase `leads(id, tenant_id, first_name, last_name, email, message, source_page, created_at, status)` — status defaults to 'new'.
- Notification: Resend → admin@crandallchristianacademy.com with reply-to set to submitter's email. Also auto-reply to submitter: "Thanks for reaching out — we'll be in touch within one business day."
- Honeypot + Turnstile.

### 3. Apply Now / Now Hiring (SuiteDash portal forms)

These two CTAs currently point to external SuiteDash forms:

- Apply Now → `https://portal.crandallchristianacademy.com/frm/21SsD4XPAgP8cJ3jt`
- Now Hiring → `https://portal.crandallchristianacademy.com/frm/2snH8oyrySKMYc58h`

**Recommendation: do not rebuild these.** Keep them as external links. SuiteDash is the system of record for applications and hires (and is read-only from our side per memory). If iframe embedding is desired for better UX, test whether SuiteDash sets `X-Frame-Options` / `frame-ancestors`; if blocked, open in a new tab with a slight interstitial ("You're heading to our secure family portal") so the context switch doesn't feel jarring.

---

## @assets — Downloaded media manifest

All assets live under `CCA/public/marketing/`. Downloaded 2026-04-17, 44 files, ~222 MB total.

```
public/marketing/
├── shared/
│   ├── cca-logo-full.png              (376 KB)
│   ├── cca-logo-small.png             (160 KB)
│   ├── favicon.png                    (391 KB — needs downsizing to 512/256/32)
│   └── fonts/
│       ├── kollektif-bold.woff2       (25 KB)
│       ├── kollektif-bold.woff        (36 KB)
│       ├── kollektif-bold.ttf         (77 KB)
│       ├── kollektif-regular.woff2    (17 KB)
│       ├── kollektif-regular.woff     (23 KB)
│       ├── kollektif-regular.ttf      (50 KB)
│       ├── coming-soon.woff2          (22 KB)
│       └── coming-soon.woff           (27 KB)
├── home/
│   ├── more-than-a-preschool.jpg      (286 KB)
│   ├── facility-hero-poster.jpg       (157 KB)
│   ├── pillar-creative-arts.jpg       (18.2 MB — 4433×4295 orig, optimize)
│   ├── pillar-curiosity-discovery.jpg (17.0 MB — optimize)
│   ├── pillar-language-literacy.jpg   (297 KB)
│   ├── pillar-physical-development.jpg (13.9 MB — optimize)
│   ├── curriculum-infants.jpg         (7.3 MB)
│   ├── curriculum-toddlers.jpg        (3.1 MB)
│   ├── curriculum-twos.jpg            (3.9 MB — 5760×3840)
│   ├── mascot-sunshine-face.png       (38 KB)
│   ├── mascot-girl.png                (31 KB)
│   └── videos/
│       ├── more-than-a-preschool-1080p.mp4  (7.5 MB)
│       ├── more-than-a-preschool-720p.mp4   (3.7 MB)
│       ├── newsletter-bg-1080p.mp4          (9.1 MB)
│       ├── newsletter-bg-720p.mp4           (4.2 MB)
│       ├── facility-hero-1080p.mp4          (11.8 MB)
│       └── facility-hero-720p.mp4           (5.7 MB)
├── about/
│   ├── hero-playing-toddlers.jpg      (1.7 MB)
│   ├── program-infants.jpg            (4.6 MB)
│   ├── program-toddlers.jpg           (20.4 MB — 7000×4646, optimize)
│   ├── program-twos.jpg               (7.8 MB)
│   ├── program-threes.jpg             (3.5 MB)
│   └── program-preschool-kinder.jpg   (2.3 MB)
├── team/
│   ├── hero-art-class.jpg             (8.2 MB)
│   ├── staff-01-jesse-austin.jpg      (8.5 MB)
│   ├── staff-02-chloe-wilson.jpg      (5.2 MB)
│   ├── staff-03-julie-williams.jpg    (5.3 MB)
│   ├── staff-04-jessica-davis.jpg     (296 KB)
│   ├── staff-05-cynthia-james.jpg     (8.1 MB)
│   ├── staff-06-andrew-edwards.jpg    (4.5 MB)
│   ├── staff-07-angela-simms.jpg      (16.7 MB)
│   └── staff-08-matthew-heart.jpg     (12.4 MB)
└── contact/
    └── hero-painting-class.jpg        (4.1 MB)
```

Full URL→local-path manifest: `extraction/download_manifest.tsv` (status\tsize\tsrc\tdest).

### Post-download processing (do before shipping)

1. **Convert every JPG/PNG** to AVIF + WebP via `sharp` or `@vercel/og-image` build step. Generate 320w, 640w, 960w, 1280w, 1920w variants. Wire up Next.js `<Image>` to serve responsive sources.
2. **Strip video audio** if not needed (these are background loops — muting + trimming silent track saves bandwidth) and produce WebM + MP4 pairs.
3. **Re-encode videos at lower bitrate** with ffmpeg (current 1080p files are 7–12 MB — target ≤ 3 MB for hero loops).
4. **Favicon**: take `shared/favicon.png` → generate favicon.ico, apple-touch-icon.png (180×180), and PWA icons (192, 512).

---

## @parity-notes — Parity and upgrade notes for replica build

Things the live Wix site does that the replica must preserve:

- Playful multi-accent color system — every section picks a color, don't collapse to one accent.
- Kollektif Bold for headings, Questrial for body — do NOT swap to a generic font stack.
- Looping background videos on hero sections (subtle, never loud).
- Section-by-section vertical rhythm — generous whitespace.
- Christian values integrated throughout without being heavy-handed.

Things the live site does **poorly** that the replica should fix:

1. Two page titles still read "KiddoCare" — Wix template never fully rebranded (`/our-team` and `/contact`).
2. One H2 typo: "Kindergarden" → "Kindergarten".
3. Duplicate hero block on home — trim.
4. "Almost complete" copy is stale; update to reflect current operating state.
5. No real footer — add one with address, hours, phone, email, portal links, social (once provided), and legal.
6. Staff page is likely template placeholders — replace or hide until real.
7. Book Online page is a Wix placeholder — redirect or remove.
8. Massive unoptimized images (some > 18 MB) — convert to AVIF/WebP with responsive sources.
9. No JSON-LD / structured data — add `LocalBusiness`, `Preschool` (schema.org EducationalOrganization), `FAQPage`, `BlogPosting`.
10. No Open Graph / Twitter meta per page — add.

Things to ADD that Wix can't easily do:

- Framer Motion scroll-reveal on section entrances (gated by `prefers-reduced-motion`).
- Proper Next.js `<Image>` for responsive, auto-format, lazy-loaded images.
- Lighthouse target ≥ 95 for performance and accessibility.
- Native embedded contact/newsletter forms with Supabase + Resend (not Wix-native).
- Real analytics — Plausible or PostHog with tenant tagging.
- Sitemap.xml and robots.txt auto-generated from routes.
- A11y: keyboard focus rings, skip-to-main link, semantic landmarks, aria-labels on icon-only buttons.

---

## Appendix A — Full blog post slug list (63 posts)

Target URL on replica: `/blog/<slug>`. Source URL on Wix: `https://www.crandallchristianacademy.com/post/<slug>`.

```
free-activities-for-kids-in-dallas-this-spring                                               2025-01-20
5-fun-springtime-activities-for-preschoolers                                                 2025-01-14
crandall-christian-academy-opening-august-2025                                               2025-01-14
the-role-of-play-in-child-development-1                                                      2024-12-31
10-creative-ways-to-display-your-child-s-artwork-and-why-it-s-important                      2024-12-24
the-importance-of-early-childhood-education                                                  2025-01-14
how-to-teach-gratitude-to-young-children-and-why-it-s-important                              2024-11-26
innovative-parenting-strategies-for-high-energy-families-how-crandall-christian-academy-can-help  2025-01-14
building-a-foundation-the-impact-of-early-childhood-education                                2024-11-07
teaching-christian-values-through-early-education                                            2025-01-14
7-bible-verses-every-preschooler-should-learn                                                2025-01-14
the-importance-of-early-childhood-education-for-future-success                               2024-10-18
how-faith-and-education-go-hand-in-hand                                                      2025-01-14
10-best-books-for-preschoolers-educational-and-faith-based-favorites                         2025-01-14
tips-for-preparing-your-family-for-preschool                                                 2024-09-03
the-benefits-of-storytelling-for-early-learners                                              2024-08-20
5-questions-to-ask-when-touring-a-preschool                                                  2024-08-06
how-to-choose-the-right-preschool-for-your-child-1                                           2024-07-31
the-benefits-of-faith-based-early-learning-programs                                          2024-07-30
5-fun-outdoor-activities-for-preschool-aged-kids                                             2024-07-18
how-to-choose-the-right-preschool-for-your-child                                             2024-07-02
how-to-create-a-routine-that-works-for-your-family                                           2024-06-25
preparing-your-child-emotionally-for-preschool                                               2024-06-11
preparing-the-next-generation-with-faith-based-learning                                      2024-06-04
storytelling-in-early-childhood-development-unleashing-imagination-and-learning              2024-05-31
tips-for-building-a-strong-parent-child-bond                                                 2024-05-16
why-play-is-an-essential-part-of-learning                                                    2024-05-14
how-our-values-shape-the-future-of-education-at-crandall-christian-academy                   2024-05-07
how-to-prepare-your-child-for-their-first-day-of-preschool                                   2024-04-12
how-to-encourage-curiosity-and-learning-at-home                                              2024-04-09
the-mission-of-crandall-christian-academy                                                    2024-04-02
navigating-the-playful-energy-strategies-for-managing-high-energy-kids                       2024-03-14
the-role-of-preschool-in-a-child-s-social-development                                        2024-03-14
bible-stories-that-inspire-preschoolers                                                      2024-03-12
why-crandall-needs-a-christian-preschool                                                     2024-03-05
fun-learning-activities-you-can-do-at-home-with-your-preschooler                             2024-02-20
preparing-your-home-for-crandall-preschool-creating-a-sensory-friendly-environment-for-your-prescho  2024-02-13
understanding-the-needs-of-preschool-aged-children                                           2024-02-10
what-sets-crandall-christian-academy-apart                                                   2024-02-04
the-symphony-of-sensory-play-in-early-childhood-education                                    2024-01-06
the-symphony-of-learning-and-imagination-understanding-the-symbiosis-between-learning-and-creative  2024-01-05
the-role-of-play-in-child-development                                                        2024-01-05
the-benefits-of-a-christian-preschool-environment-a-look-inside-crandall-christian-academy   2024-01-05
5-essential-tips-for-choosing-the-right-private-preschool-for-your-child                     2024-01-04
preparing-your-toddler-for-preschool-a-parent-s-guide                                        2024-01-04
preparing-your-preschooler-for-preschool-a-guide-from-crandall-christian-academy             2024-01-03
choosing-the-right-childcare-center-for-your-family-insights-from-crandall-christian-academy 2024-01-02
nurturing-early-learners-a-comprehensive-guide-for-future-parents-of-crandall-christian-academy  2024-01-01
nourishing-young-minds-the-tapestry-of-early-childhood-education                             2023-12-31
building-emotional-intelligence-in-preschoolers-strategies-from-crandall-christian-academy   2023-12-30
the-art-of-storytelling-in-early-childhood-development-unleashing-imagination-and-learning   2023-12-29
engaging-young-minds-interactive-learning-at-crandall-christian-academyintroduction          2023-12-27
the-importance-of-faith-in-early-learning-insights-from-crandall-christian-academyintroduction  2023-12-24
outdoor-learning-and-play-the-benefits-of-nature-in-preschool-education                      2023-12-22
the-role-of-technology-in-preschool-education-what-parents-should-know                       2023-12-21
effective-parent-teacher-communication-building-a-partnership-for-your-child-s-success       2023-12-19
nutrition-for-preschoolers-healthy-eating-habits-start-early                                 2023-12-18
the-importance-of-play-in-preschool-learning                                                 2023-12-17
choosing-the-right-preschool-factors-to-consider                                             2023-12-16
understanding-early-childhood-development-what-to-expect-in-the-preschool-years-at-crandall-christi  2023-12-15
7-key-factors-to-consider-when-touring-crandall-christian-academy                            2023-12-04
building-a-foundation-the-impact-of-early-childhood-educationintroduction                    2025-01-20
title-managing-separation-anxiety-tips-for-a-tear-free-preschool-experience                  2025-01-20
```

---

## Appendix B — Next steps

Once Skylar signs off on this extraction, the replica build doc (`CCA_MARKETING_REPLICA.md`) should follow the Arkz pattern:

1. Front-load brand tokens, fonts, palette (already captured above — copy verbatim).
2. Component inventory with full JSX (Hero, SectionHeader, PillarCard, CurriculumCard, ValueProp, CTABlock, NewsletterForm, ContactForm, Accordion, StaffCard, Footer).
3. Page-by-page routes under the CCA tenant, with full copy inline (copy verbatim from this doc).
4. Full DDL for `newsletter_subscribers`, `leads`, `blog_posts`, `staff` with tenant_id columns and RLS policies.
5. Full TypeScript for form server actions (Supabase insert + Resend notify).
6. Framer Motion reveal spec + `prefers-reduced-motion` gate.
7. VERIFY queries: row count checks on inserted rows, Lighthouse audit script, screenshot diffs at 360/768/1440px.
8. BUILD_LOG entries at each anchor.
