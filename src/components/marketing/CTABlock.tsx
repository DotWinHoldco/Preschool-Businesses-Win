import Link from 'next/link';

interface CTABlockProps {
  heading: string;
  subheading?: string;
  buttonText: string;
  buttonHref: string;
  external?: boolean;
  bgClass?: string;
}

export function CTABlock({
  heading,
  subheading,
  buttonText,
  buttonHref,
  external = false,
  bgClass = 'bg-cca-blue',
}: CTABlockProps) {
  return (
    <div className={`${bgClass} text-white text-center py-20 px-6 rounded-2xl`}>
      <h2 className="font-kollektif text-3xl md:text-5xl mb-4">{heading}</h2>
      {subheading && (
        <p className="font-questrial text-lg text-white/80 mb-8 max-w-xl mx-auto">{subheading}</p>
      )}
      {external ? (
        <a
          href={buttonHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-white text-cca-blue font-kollektif text-lg px-8 py-4 rounded-full hover:bg-white/90 transition-colors shadow-lg hover:shadow-xl"
        >
          {buttonText}
        </a>
      ) : (
        <Link
          href={buttonHref}
          className="inline-block bg-white text-cca-blue font-kollektif text-lg px-8 py-4 rounded-full hover:bg-white/90 transition-colors shadow-lg hover:shadow-xl"
        >
          {buttonText}
        </Link>
      )}
    </div>
  );
}
