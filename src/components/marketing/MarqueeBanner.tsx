const SEPARATOR = '\u00A0\u00A0\u2606\u00A0\u00A0';

export function MarqueeBanner() {
  const text = `A Parent's Dream Come True${SEPARATOR}`.repeat(8);

  return (
    <section className="bg-cca-green py-4 md:py-5 overflow-hidden" aria-label="A Parent's Dream Come True">
      <div className="flex whitespace-nowrap animate-[marquee_20s_linear_infinite] motion-reduce:animate-none">
        <span className="font-coming-soon text-2xl md:text-4xl text-white uppercase font-bold tracking-wide">
          {text}
        </span>
        <span className="font-coming-soon text-2xl md:text-4xl text-white uppercase font-bold tracking-wide" aria-hidden="true">
          {text}
        </span>
      </div>
    </section>
  );
}
