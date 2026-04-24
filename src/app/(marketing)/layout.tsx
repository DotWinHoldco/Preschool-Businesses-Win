import type { Metadata } from 'next'
import { Header } from '@/components/marketing/Header'
import { Footer } from '@/components/marketing/Footer'
import '@/app/marketing/fonts.css'

export const metadata: Metadata = {
  title: {
    template: '%s | Crandall Christian Academy',
    default: 'Crandall Christian Academy — Premier Pre-School in Crandall, Texas',
  },
  description:
    'A premier, faith-based preschool in Crandall, Texas offering programs for infants through private kindergarten. Nurturing young minds through hands-on learning and character-building activities.',
  metadataBase: new URL('https://crandallchristianacademy.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Crandall Christian Academy',
    images: [{ url: '/marketing/shared/cca-logo-full.png', width: 338, height: 118 }],
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: '/marketing/shared/favicon.png',
    apple: '/marketing/shared/favicon.png',
  },
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 font-questrial"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main-content">{children}</main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': ['LocalBusiness', 'Preschool'],
            name: 'Crandall Christian Academy',
            description:
              'A premier, faith-based preschool in Crandall, Texas offering programs for infants through private kindergarten.',
            url: 'https://crandallchristianacademy.com',
            telephone: '+19452266584',
            email: 'admin@crandallchristianacademy.com',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Crandall',
              addressRegion: 'TX',
              addressCountry: 'US',
            },
            openingHoursSpecification: {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              opens: '07:00',
              closes: '18:00',
            },
            logo: 'https://crandallchristianacademy.com/marketing/shared/cca-logo-full.png',
            image: 'https://crandallchristianacademy.com/marketing/home/facility-hero-poster.jpg',
            priceRange: '$$',
          }),
        }}
      />
    </>
  )
}
