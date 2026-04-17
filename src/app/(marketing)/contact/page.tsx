import type { Metadata } from 'next';
import Image from 'next/image';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';
import { ContactForm } from '@/components/marketing/ContactForm';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Crandall Christian Academy. Connect with us for more information about enrollment, programs, and employment opportunities.',
};

export default function ContactPage() {
  return (
    <>
      <section className="relative py-24 px-6 bg-cca-cream">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <ScrollReveal className="w-full md:w-1/2">
            <p className="font-coming-soon text-sm uppercase tracking-wider text-cca-green mb-3">Get In Touch</p>
            <h1 className="font-kollektif text-4xl md:text-5xl text-cca-ink">
              Connect with Us for More Information and Enrollment
            </h1>
          </ScrollReveal>
          <ScrollReveal className="w-full md:w-1/2" delay={0.15}>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/marketing/contact/hero-painting-class.jpg"
                alt="Painting class at CCA"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="font-kollektif text-3xl md:text-4xl text-cca-blue text-center mb-6">
              We&apos;re Here to Answer Your Questions and Help Your Child Thrive
            </h2>
            <div className="font-questrial text-lg text-cca-ink/80 leading-relaxed text-center space-y-4 mb-12">
              <p>
                Thank you for your interest in Crandall Christian Academy. We are excited to connect with families who are seeking a nurturing, faith-based learning environment for their children.
              </p>
              <p>
                Whether you have questions about enrollment, programs, or employment opportunities, our team is here to help.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <ContactForm />
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
