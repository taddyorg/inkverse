import { Link, type MetaFunction } from "react-router";
import { getMetaTags } from "@/lib/seo";

/* ---------------------------------------------------------------------------
 * EDIT THIS SECTION TO UPDATE THE PAGE (then redeploy)
 * ------------------------------------------------------------------------- */

// 'before' = challenge hasn't started, 'current' = accepting entries, 'after' = winners announced
type ContestState = 'before' | 'current' | 'after';
const CONTEST_STATE: ContestState = 'before';

const DISCORD_INVITE_URL = 'https://discord.com/invite/SNZUHpkpQn';
const SUBMISSION_CHANNEL_URL = 'https://discord.gg/75XPumH4Fx';
const DISCORD_EVENT_LINK = 'https://discord.com/events/1172669177593606196/1524574918585618512';
const WORKSHOP_APPLICATION_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfu2YunhUes_nbId-h7Y18NO9qu9JI5dj4xe33jVVdUGIoyLA/viewform';
const WISE_COUNTRIES_URL = 'https://wise.com/help/articles/2978049/where-can-i-use-wise';

const TADDY_URL = 'https://taddy.org';
const TADDY_LOGO_URL = 'https://ax0.taddy.org/general/Taddy-Logo-Circle-v2.png';
const INKVERSE_LOGO_URL = 'https://ax0.taddy.org/inkverse/inkverse-square-transparent.png';

type Winner = 'grand-best-art' | 'grand-most-original' | 'winner';

interface ContestEntry {
  imageUrl: string;          // the 1080x1350 poster
  creatorName: string;
  inkverseComicUrl?: string; // link to the creator's comic on Inkverse
  description?: string;      // optional adventure description (up to 500 chars)
  winner?: Winner;           // set after the contest; leave undefined otherwise
}

const ENTRIES: ContestEntry[] = [
  // Example entry — copy this shape:
  // {
  //   imageUrl: 'https://ax0.taddy.org/general/testy.jpg',
  //   creatorName: 'Jane Doe',
  //   inkverseComicUrl: 'https://inkverse.co/comics/janes-comic',
  //   description: 'Blinky visited the Jellyfish Planet, where the locals helped light up a path for Blinky.',
  //   winner: 'grand-best-art',
  // },
];

/* ---------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

export const meta: MetaFunction = () => {
  return getMetaTags({
    title: "The Adventures of Blinky - $1,500 Art Challenge",
    description: "Draw a page from Blinky's notebook and win up to $250. A $1,500 USD art challenge for the Webcomic Creator Hub Discord, sponsored by Taddy & Inkverse. Aug 1 - Aug 31, 2026.",
    url: "https://inkverse.co/discord-art-challenge-2026",
    imageURL: "https://inkverse.co/blinky-art-challenge/blinky.png",
  });
}

const SPACE_NAVY = '#231F31';
const STAR_YELLOW = '#F5CE55';

const BLINKY_PALETTE: { name: string; hex: string }[] = [
  { name: 'Inkverse Black', hex: '#403B51' },
  { name: 'Star Yellow', hex: '#F5CE55' },
  { name: 'Paper Pink', hex: '#FFE9E4' },
  { name: 'Brand Pink', hex: '#ED5959' },
  { name: 'Brand Purple', hex: '#A372F2' },
  { name: 'Action Green', hex: '#55BC31' },
];

const SECTIONS = [
  ...(CONTEST_STATE === 'before' ? [] : [{ href: '#entries', label: 'Entries' }]),
  { href: '#theme', label: 'Theme' },
  { href: '#what-to-submit', label: 'What to Submit' },
  { href: '#prizes', label: 'Prizes' },
  { href: '#how-to-enter', label: 'How to Enter' },
  { href: '#key-dates', label: 'Key Dates' },
  { href: '#colour-palette', label: 'Colour Palette' },
  { href: '#faqs', label: 'FAQs' },
];

// Deterministic starfield (SSR-safe — no Math.random, or hydration would mismatch)
const STARS = [
  { top: '4%', left: '8%', size: 14, delay: '0s', dur: '3.2s' },
  { top: '11%', left: '78%', size: 18, delay: '0.7s', dur: '4.1s' },
  { top: '7%', left: '46%', size: 9, delay: '1.4s', dur: '2.8s' },
  { top: '16%', left: '24%', size: 11, delay: '2.1s', dur: '3.6s' },
  { top: '22%', left: '91%', size: 8, delay: '0.3s', dur: '3.9s' },
  { top: '19%', left: '62%', size: 15, delay: '1.8s', dur: '4.4s' },
  { top: '28%', left: '5%', size: 10, delay: '1.1s', dur: '3.1s' },
  { top: '33%', left: '38%', size: 8, delay: '2.6s', dur: '4.0s' },
  { top: '31%', left: '82%', size: 12, delay: '0.5s', dur: '3.4s' },
  { top: '41%', left: '14%', size: 16, delay: '1.9s', dur: '4.6s' },
  { top: '44%', left: '69%', size: 9, delay: '0.9s', dur: '2.9s' },
  { top: '39%', left: '52%', size: 7, delay: '2.3s', dur: '3.7s' },
  { top: '52%', left: '88%', size: 13, delay: '1.5s', dur: '4.2s' },
  { top: '55%', left: '30%', size: 8, delay: '0.2s', dur: '3.3s' },
  { top: '58%', left: '58%', size: 11, delay: '2.8s', dur: '3.8s' },
  { top: '63%', left: '9%', size: 9, delay: '1.2s', dur: '4.5s' },
  { top: '67%', left: '76%', size: 15, delay: '0.6s', dur: '3.0s' },
  { top: '71%', left: '44%', size: 8, delay: '2.0s', dur: '4.3s' },
  { top: '76%', left: '20%', size: 12, delay: '1.6s', dur: '3.5s' },
  { top: '79%', left: '93%', size: 9, delay: '0.4s', dur: '4.0s' },
  { top: '84%', left: '64%', size: 14, delay: '2.4s', dur: '3.2s' },
  { top: '88%', left: '35%', size: 8, delay: '1.0s', dur: '4.1s' },
  { top: '92%', left: '81%', size: 10, delay: '0.8s', dur: '3.6s' },
  { top: '95%', left: '12%', size: 12, delay: '2.2s', dur: '4.4s' },
];

const pageStyles = `
  @keyframes blinky-twinkle {
    0%, 100% { opacity: 0.25; transform: scale(0.7); }
    50% { opacity: 1; transform: scale(1.1); }
  }
  @keyframes blinky-float-rotate {
    0%, 100% { transform: translateY(-10px) rotate(-8deg); }
    50% { transform: translateY(-20px) rotate(8deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    .blinky-star, .blinky-float-rotate { animation: none !important; }
  }
`;

function Starfield() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {STARS.map((star, i) => (
        <span
          key={i}
          className="blinky-star absolute"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            backgroundColor: STAR_YELLOW,
            clipPath: 'polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)',
            animation: `blinky-twinkle ${star.dur} ease-in-out ${star.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}

function SectionHeading({ eyebrow, subtitle }: { eyebrow: string; subtitle?: string }) {
  return (
    <div className="mb-8 text-center">
      <div className="inline-block">
        <span className="text-[#F5CE55]/70" aria-hidden="true">✦</span>
        <h2 className="mt-2 -mr-[0.18em] text-2xl sm:text-3xl font-extrabold uppercase tracking-[0.18em] text-[#F5CE55]">
          {eyebrow}
        </h2>
        <div className="mt-3 h-0.5 w-full rounded-full bg-[#F5CE55]/60" aria-hidden="true" />
      </div>
      {subtitle && <p className="mt-3 text-lg sm:text-xl font-semibold text-[#FFF4E8]">{subtitle}</p>}
    </div>
  );
}

function TableOfContents() {
  return (
    <nav
      aria-label="Page sections"
      className="mx-auto mt-8 max-w-2xl rounded-3xl border-2 border-[#F5CE55]/40 bg-[#FFF4E8]/5 p-6 shadow-[0_0_40px_rgba(245,206,85,0.15)] sm:p-8"
    >
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {SECTIONS.map((section) => (
          <a
            key={section.href}
            href={section.href}
            className="inline-block rounded-full bg-[#F5CE55] px-6 py-3 font-bold text-[#231F31] shadow-[0_0_20px_rgba(245,206,85,0.25)] transition-transform hover:scale-105 hover:shadow-[0_0_30px_rgba(245,206,85,0.5)]"
          >
            {section.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function SponsoredBy() {
  return (
    <div className="mt-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-[#FFF4E8]/50">
        Sponsored by
      </p>
      <div className="mt-3 flex items-center justify-center gap-6">
        <a
          href={TADDY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-opacity hover:opacity-80"
        >
          <img src={TADDY_LOGO_URL} alt="Taddy" className="h-12 w-auto sm:h-20" />
        </a>
        <Link to="/" className="transition-opacity hover:opacity-80">
          <img src={INKVERSE_LOGO_URL} alt="Inkverse" className="h-12 w-auto sm:h-20" />
        </Link>
      </div>
    </div>
  );
}

function Hero() {
  const statusLine = {
    before: 'Starts August 1st, 2026',
    current: 'Deadline: August 31st, 2026 at Midnight PST',
    after: 'The challenge has ended. Winners were announced on September 10th, 2026',
  }[CONTEST_STATE];

  return (
    <section className="relative px-4 pt-16 pb-10 sm:pt-24 text-center">
      <div className="mx-auto max-w-3xl">
        <h1 className="my-4 text-5xl sm:text-7xl font-black leading-none text-[#FFF4E8]">
          The Adventures<br />
          <span className="text-[#F5CE55]">of Blinky</span>
        </h1>
        <img
          src="https://ink0.inkverse.co/general/blinky.png"
          alt="Blinky, the Inkverse mascot"
          className="blinky-float-rotate mx-auto w-44 sm:w-56"
          style={{ animation: 'blinky-float-rotate 6s ease-in-out infinite' }}
        />
        <p className="mx-auto mt-2 max-w-xl text-lg text-[#FFF4E8]/80">
          Draw a page from Blinky's  notebook, and win a share of{' '}
          <span className="font-bold text-[#F5CE55]">$1,500 USD</span> in cash prizes.
        </p>
        <SponsoredBy />
        <p className="mt-8 text-lg font-bold text-[#FFF4E8]">{statusLine} on <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-[#F5CE55] underline underline-offset-4">the Webcomic Creator Hub Discord</a></p>
        <TableOfContents />
      </div>
    </section>
  );
}

function ColourPalette() {
  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {BLINKY_PALETTE.map((colour) => (
          <div key={colour.hex} className="text-center">
            <div
              className="aspect-square w-full rounded-xl border border-[#FFF4E8]/15"
              style={{ backgroundColor: colour.hex }}
              aria-hidden="true"
            />
            <p className="mt-1.5 text-xs font-bold text-[#FFF4E8]">{colour.name}</p>
            <p className="text-xs text-[#FFF4E8]/60">{colour.hex}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThemeSection() {
  return (
    <section id="theme" className="relative px-4 py-8 scroll-mt-24">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="Theme" />
        <img
          src="https://ink0.inkverse.co/general/blinky.png"
          alt="Blinky, the Inkverse mascot"
          loading="lazy"
          className="mx-auto mb-8 w-40 sm:w-48"
        />
        <div className="space-y-4 text-lg leading-relaxed text-[#FFF4E8]/85">
          <p>
            Blinky is Inkverse's mascot. They've learnt to be diligent about sketching every interplanetary adventure in their notebook, called <em className="font-semibold not-italic text-[#F5CE55]">"The Adventures of Blinky"</em>.
          </p>
          <p>
            Your entry is one page from that notebook.
          </p>
          <p>
            It could answer:
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li className="font-semibold">What planet did they visit?</li>
              <li className="font-semibold">What did they see?</li>
              <li className="font-semibold">What happened there?</li>
            </ul>
          </p>
        </div>
      </div>
    </section>
  );
}

function ColourPaletteSection() {
  return (
    <section id="colour-palette" className="relative px-4 py-8 scroll-mt-24">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="Inkverse Colour Palette"
        />
        <p className="mx-auto max-w-xl text-center text-lg leading-relaxed text-[#FFF4E8]/85">
          Inkverse's colour palette is shared to be a helpful reference. Feel free to use whichever colours you like, using these colours is optional and will have no impact on your score.
        </p>
        <div className="mx-auto mt-8 w-full max-w-sm sm:max-w-md">
          <ColourPalette />
        </div>
      </div>
    </section>
  );
}

function WhatToSubmit() {
  const items = [
    { title: '1 finished poster / illustration', },
    { title: 'Any art style or medium (But no AI-generated artwork)', },
    { title: 'File dimensions: 1080 × 1350 px' },
    { title: 'Optional short description', detail: 'Up to 500 characters about the adventure, e.g. "Blinky visited the Jellyfish Planet, where the locals helped light up a path for Blinky." Judges read it when scoring Originality & Creativity.' },
    { title: 'Optional link to socials + link to your comic on Inkverse', detail: 'If you\'d like to be tagged on Instagram + Bluesky, include a link to your profile. If you have a comic on Inkverse, include a link to it.' },
  ];
  return (
    <section id="what-to-submit" className="relative px-4 py-8 scroll-mt-24">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="What to submit" />
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.title} className="flex gap-4 rounded-2xl border border-[#FFF4E8]/10 bg-[#FFF4E8]/5 p-5">
              <span className="mt-1 text-[#F5CE55]" aria-hidden="true">✦</span>
              <div>
                <p className="font-bold text-[#FFF4E8]">{item.title}</p>
                {item.detail && <p className="mt-1 text-[#FFF4E8]/70">{item.detail}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const SCORING_RUBRIC: { criterion: string; accent: { heading: string; card: string; badge: string }; bands: { score: string; desc: string }[] }[] = [
  {
    criterion: 'Art',
    accent: {
      heading: 'text-[#F5CE55]',
      card: 'border-[#F5CE55]/40 bg-[#F5CE55]/5',
      badge: 'bg-[#F5CE55]/15 text-[#F5CE55]',
    },
    bands: [
      { score: '5', desc: 'Polished, confident, good use of colours, unique style' },
      { score: '3-4', desc: 'Solid, some rough spots' },
      { score: '1-2', desc: 'Unfinished or hard to understand' },
      { score: '0.5', desc: 'Minimal effort' },
    ],
  },
  {
    criterion: 'Originality & Creativity',
    accent: {
      heading: 'text-[#A372F2]',
      card: 'border-[#A372F2]/40 bg-[#A372F2]/5',
      badge: 'bg-[#A372F2]/15 text-[#A372F2]',
    },
    bands: [
      { score: '5', desc: 'An inventive world' },
      { score: '3-4', desc: 'Solid but familiar' },
      { score: '1-2', desc: "Blinky is present, but minimal concept" },
      { score: '0.5', desc: 'Minimal effort' },
    ],
  },
];

function Prizes() {
  return (
    <section id="prizes" className="relative px-4 py-8 scroll-mt-24">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="Prizes" subtitle="12 winners · $1,500 total" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border-2 border-[#F5CE55]/60 bg-[#F5CE55]/10 p-6">
            <p className="text-4xl font-black text-[#F5CE55]">$250</p>
            <p className="mt-2 font-bold text-[#FFF4E8]">Grand Prize — Best Art</p>
            <p className="mt-1 text-sm text-[#FFF4E8]/70">Chosen by a panel of judges.</p>
          </div>
          <div className="rounded-2xl border-2 border-[#A372F2]/60 bg-[#A372F2]/10 p-6">
            <p className="text-4xl font-black text-[#A372F2]">$250</p>
            <p className="mt-2 font-bold text-[#FFF4E8]">Grand Prize — Most Original / Creative</p>
            <p className="mt-1 text-sm text-[#FFF4E8]/70">Chosen by a panel of judges.</p>
          </div>
          <div className="rounded-2xl border border-[#FFF4E8]/10 bg-[#FFF4E8]/5 p-6 sm:col-span-2">
            <p className="text-4xl font-black text-[#FFF4E8]">10 × $100</p>
            <p className="mt-2 font-bold text-[#FFF4E8]">Ten more winners</p>
            <p className="mt-1 text-sm text-[#FFF4E8]/70">All winners are chosen by a panel of judges.</p>
          </div>
        </div>
        <div className="mt-8 rounded-2xl border border-[#FFF4E8]/10 bg-[#FFF4E8]/5 p-6">
          <p className="font-bold uppercase tracking-widest text-sm text-[#F5CE55]">Scoring rubric</p>
          <p className="mt-2 text-base text-[#FFF4E8]">Your poster will be scored on 2 criteria: <span className="font-semibold">Art</span> and <span className="font-semibold">Originality & Creativity</span>.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {SCORING_RUBRIC.map((item) => (
              <div key={item.criterion} className={`rounded-xl border p-5 ${item.accent.card}`}>
                <p className={`font-bold text-lg ${item.accent.heading}`}>{item.criterion}</p>
                <ul className="mt-3 space-y-2">
                  {item.bands.map((band) => (
                    <li key={band.score} className="flex items-start gap-3 text-[#FFF4E8]/85">
                      <span className={`inline-flex w-12 shrink-0 items-center justify-center rounded-full py-0.5 text-sm font-bold ${item.accent.badge}`}>{band.score}</span>
                      <span>{band.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowToEnter() {
  const steps = [
    <>Join the <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-[#F5CE55] underline underline-offset-4">Webcomic Creator Hub Discord</a>. You must be a member to participate.</>,
    <>Post your finished poster in the <a href={SUBMISSION_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-[#F5CE55] underline underline-offset-4">#art-challenge</a> channel. Optionally include your social handles if you'd like to be tagged on Instagram + Bluesky.</>,
    <><a href={WORKSHOP_APPLICATION_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-[#F5CE55] underline underline-offset-4">Apply to give one of the workshops</a> on announcement day. (Optional)</>,
  ];
  return (
    <section id="how-to-enter" className="relative px-4 py-8 scroll-mt-24">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="How to enter" />
        <ol className="space-y-4">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-4 rounded-2xl border border-[#FFF4E8]/10 bg-[#FFF4E8]/5 p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5CE55] font-black text-[#231F31]">{i + 1}</span>
              <p className="text-[#FFF4E8]/85 leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function KeyDates() {
  const dates: { title: string; detail: React.ReactNode }[] = [
    { title: 'Starts', detail: 'August 1st, 2026' },
    { title: 'Deadline', detail: 'August 31st, 2026 — Midnight PST' },
    {
      title: 'Winners announced',
      detail: (
        <>
          <p>On September 10th, 2026, we will host a couple of events on the <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-[#F5CE55] underline underline-offset-4">Webcomic Creator Hub Discord</a>:</p>
          <ul className="mt-3 space-y-1 list-disc pl-5">
            <li>Workshop #1 — 4:00 PM PST</li>
            <li>Drawing Games — 4:45 PM PST</li>
            <li>Workshop #2 — 5:15 PM PST</li>
            <li>Prize winners revealed on Discord Live Stream — 6:00 PM PST</li>
          </ul>
          <p className="mt-3">
            Want to give one of those workshops?{' '}
            <a
              href={WORKSHOP_APPLICATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#F5CE55] underline underline-offset-4"
            >
              Apply here
            </a>.
          </p>
          {/* <p className="mt-3">
            Coming to the event?{' '}
            <a
              href={DISCORD_EVENT_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#F5CE55] underline underline-offset-4"
            >
              RSVP on Discord →
            </a>
          </p> */}
        </>
      ),
    },
  ];
  return (
    <section id="key-dates" className="relative px-4 py-8 scroll-mt-24">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="Key dates" />
        <ul className="space-y-4">
          {dates.map((date) => (
            <li key={date.title} className="flex gap-4 rounded-2xl border border-[#FFF4E8]/10 bg-[#FFF4E8]/5 p-5">
              <span className="mt-1 text-[#F5CE55]" aria-hidden="true">✦</span>
              <div>
                <p className="font-bold text-[#FFF4E8]">{date.title}</p>
                <div className="mt-1 text-[#FFF4E8]/70">{date.detail}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const WINNER_BADGES: Record<Winner, { label: string; className: string }> = {
  'grand-best-art': { label: '🏆 Grand Prize — Best Art', className: 'bg-[#F5CE55] text-[#231F31]' },
  'grand-most-original': { label: '🏆 Grand Prize — Most Original', className: 'bg-[#A372F2] text-[#231F31]' },
  'winner': { label: '⭐ Winner', className: 'bg-[#FFF4E8] text-[#231F31]' },
};

const WINNER_SORT_ORDER: Record<Winner, number> = {
  'grand-best-art': 0,
  'grand-most-original': 1,
  'winner': 2,
};

function EntryCard({ entry }: { entry: ContestEntry }) {
  const showBadge = CONTEST_STATE === 'after' && entry.winner;
  return (
    <figure className="flex flex-col overflow-hidden rounded-2xl border border-[#FFF4E8]/10 bg-[#FFF4E8]/5">
      <div className="relative aspect-[4/5]">
        <img
          src={entry.imageUrl}
          alt={`Art challenge entry by ${entry.creatorName}`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {showBadge && entry.winner && (
          <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-sm font-bold ${WINNER_BADGES[entry.winner].className}`}>
            {WINNER_BADGES[entry.winner].label}
          </span>
        )}
      </div>
      <figcaption className="flex flex-1 flex-col gap-2 p-5">
        <p className="font-bold text-[#FFF4E8]">{entry.creatorName}</p>
        {entry.description && <p className="text-sm leading-relaxed text-[#FFF4E8]/70">{entry.description}</p>}
        {entry.inkverseComicUrl && (
          <a
            href={entry.inkverseComicUrl}
            className="mt-auto pt-1 text-sm font-bold text-[#F5CE55] hover:underline underline-offset-4"
          >
            Read their comic on Inkverse →
          </a>
        )}
      </figcaption>
    </figure>
  );
}

function EntriesGallery() {
  if (CONTEST_STATE === 'before') return null;

  const entries = CONTEST_STATE === 'after'
    ? [...ENTRIES].sort((a, b) => (a.winner ? WINNER_SORT_ORDER[a.winner] : 3) - (b.winner ? WINNER_SORT_ORDER[b.winner] : 3))
    : ENTRIES;

  return (
    <section id="entries" className="relative px-4 py-8 scroll-mt-24">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-3xl">
          <SectionHeading eyebrow="Entries" />
        </div>
        <div className="mx-auto max-w-3xl">
          {entries.length === 0 ? (
            <div className="mx-auto max-w-3xl rounded-2xl border-2 border-dashed border-[#FFF4E8]/20 p-12 text-center">
              <p className="text-4xl" aria-hidden="true">🔭</p>
              <p className="mt-4 text-lg font-bold text-[#FFF4E8]">
                No entries yet. Be the first to post in #art-challenge!
              </p>
            </div>
          ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {entries.map((entry, i) => (
                  <EntryCard key={`${entry.creatorName}-${i}`} entry={entry} />
                ))}
              </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const faqs: { q: string; a: React.ReactNode }[] = [
    {
      q: 'Who can enter?',
      a: <>Anyone who is a member of the <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-[#F5CE55] underline underline-offset-4">Webcomic Creator Hub Discord</a> and is 13 years or older. If you're under 18, you'll need a guardian to create a Wise account for you to receive prize funds.</>,
    },
    {
      q: 'How do winners get paid?',
      a: <>We send winners payment via Wise (similar to PayPal). Wise is accepted in most countries, but excludes some (Afghanistan, Iran, Venezuela, etc.). <a href={WISE_COUNTRIES_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-[#F5CE55] underline underline-offset-4">Check that your country is not on the excluded list</a>.</>,
    },
    {
      q: 'Is AI-generated artwork allowed?',
      a: <>No. All entries must be made by you and not be AI-generated.</>,
    },
    {
      q: 'Can Webcomic Creator Hub Discord mods enter?',
      a: <>Yes. Mods are allowed to take part, but any mod who enters is recused from judging, winner selection, and any discussion on those matters.</>,
    },
    {
      q: 'Do I keep ownership of my work?',
      a: <>Yes. You will forever be the owner of your work! And if, for any reason, you no longer want your entry showcased, it will be removed.</>,
    },
    {
      q: 'When and how are winners announced?',
      a: (
        <>
          <p>Winners are announced on September 10th, 2026, during a day of events on Discord:</p>
          <ul className="mt-3 space-y-1 list-disc pl-5">
            <li>Workshop #1 — 4:00 PM PST</li>
            <li>Drawing Games — 4:45 PM PST</li>
            <li>Workshop #2 — 5:15 PM PST</li>
            <li>Prize winners revealed on Discord Live Stream — 6:00 PM PST</li>
          </ul>
        </>
      ),
    },
    {
      q: "I posted my entry but it isn't on this page yet?",
      a: <>There may be a delay of a couple of hours between posting in #art-challenge and your entry appearing in the gallery here. (It is manually being updated) </>,
    },
  ];

  return (
    <section id="faqs" className="relative px-4 py-8 scroll-mt-24">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="FAQs" />
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details key={faq.q} className="group rounded-2xl border border-[#FFF4E8]/10 bg-[#FFF4E8]/5 open:bg-[#FFF4E8]/10">
              <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 font-bold text-[#FFF4E8] [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span className="text-[#F5CE55] transition-transform group-open:rotate-45" aria-hidden="true">✦</span>
              </summary>
              <div className="px-5 pb-5 leading-relaxed text-[#FFF4E8]/80">{faq.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function DiscordArtChallenge2026() {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: SPACE_NAVY }}>
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      <Starfield />
      <main className="relative">
        <Hero />
        <EntriesGallery />
        <ThemeSection />
        <WhatToSubmit />
        <Prizes />
        <HowToEnter />
        <KeyDates />
        <ColourPaletteSection />
        <Faq />
      </main>
    </div>
  );
}
