import Image from 'next/image';
import Link from 'next/link';

const PHONE = '(945) 226-6584';
const PHONE_TEL = 'tel:+19452266584';
const EMAIL = 'admin@crandallchristianacademy.com';
const ENROLL_URL = '/enroll';
const HIRING_URL = 'https://portal.crandallchristianacademy.com/frm/2snH8oyrySKMYc58h';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-cca-ink text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <Image
              src="/marketing/shared/cca-logo-full.png"
              alt="Crandall Christian Academy"
              width={220}
              height={76}
              className="h-14 w-auto mb-4 brightness-0 invert"
            />
            <p className="font-questrial text-white/70 text-sm leading-relaxed max-w-sm">
              A premier, faith-based preschool in Crandall, Texas. Nurturing young minds
              through hands-on learning and character-building activities.
            </p>
          </div>

          <div>
            <h4 className="font-kollektif text-sm uppercase tracking-wider mb-4 text-cca-green">
              Quick Links
            </h4>
            <ul className="space-y-2 font-questrial text-sm text-white/70">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li>
                <Link href={ENROLL_URL} className="hover:text-white transition-colors">
                  Apply Now
                </Link>
              </li>
              <li>
                <a href={HIRING_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Now Hiring
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-kollektif text-sm uppercase tracking-wider mb-4 text-cca-green">
              Contact
            </h4>
            <ul className="space-y-2 font-questrial text-sm text-white/70">
              <li>Crandall, Texas</li>
              <li>
                <a href={PHONE_TEL} className="hover:text-white transition-colors">{PHONE}</a>
              </li>
              <li>
                <a href={`mailto:${EMAIL}`} className="hover:text-white transition-colors">{EMAIL}</a>
              </li>
              <li className="pt-2 text-white/50">
                Mon – Fri: 7:00 AM – 6:00 PM
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-questrial text-xs text-white/40">
            © {year} Crandall Christian Academy. All rights reserved.
          </p>
          <p className="font-questrial text-xs text-white/40">
            Powered by{' '}
            <a href="https://preschool.businesses.win" className="hover:text-white/60 transition-colors">
              Preschool Businesses Win
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
