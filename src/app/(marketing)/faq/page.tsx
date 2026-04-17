import type { Metadata } from 'next';
import { ScrollReveal } from '@/components/marketing/ScrollReveal';
import { FAQAccordion } from '@/components/marketing/FAQAccordion';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about Crandall Christian Academy — ages served, hours, enrollment, meals, sibling discounts, and more.',
};

const FAQ_ITEMS = [
  {
    question: 'What ages does Crandall Christian Academy serve?',
    answer: 'Crandall Christian Academy serves children from 3 months through Kindergarten, providing nurturing care and Christ-centered education at every developmental stage.',
  },
  {
    question: 'What are your hours of operation?',
    answer: 'CCA is open Monday through Friday from 7:00 AM – 6:00 PM. Children must be picked up promptly by closing time.',
  },
  {
    question: 'Do you offer sibling discounts?',
    answer: 'Yes! The youngest sibling pays full tuition, and each additional sibling receives a $50 monthly discount.',
  },
  {
    question: 'What should my child bring each day?',
    answer: 'Families should provide a labeled change of clothes, diapers/wipes (if applicable), a water bottle, any required comfort items for rest time, and rain boots for outdoor play. Children should bring a labeled lunch and snack each day. Specific supply lists are provided by classroom.',
  },
  {
    question: 'Are meals or snacks provided?',
    answer: 'At this time, Crandall Christian Academy does not provide lunches or snacks. Families are responsible for sending a labeled lunch and snack each day for their child.',
  },
  {
    question: 'How do you communicate with parents?',
    answer: 'We believe in strong family partnerships and open communication. Crandall Christian Academy uses a secure communication software system to provide updates throughout the day, including daily reports and photos, activity and learning updates, messages from teachers and staff, and important announcements and reminders.',
  },
  {
    question: 'How do I schedule a tour or enroll?',
    answer: 'To begin the enrollment process, please complete the online application form. Our team will follow up with you regarding next steps and availability.',
  },
  {
    question: 'What makes CCA different?',
    answer: 'Crandall Christian Academy offers a warm, faith-filled environment where children grow academically, socially, and spiritually. We are committed to providing loving, experienced teachers, strong Christian values, developmentally appropriate learning, a supportive community atmosphere, and state-of-the-art security measures, including controlled building access and monitored systems, to ensure the safety and well-being of every child and staff member.',
  },
];

export default function FAQPage() {
  return (
    <>
      <section className="py-24 px-6 bg-cca-cream">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <h1 className="font-kollektif text-4xl md:text-5xl text-cca-ink mb-4">
              Frequently Asked Questions
            </h1>
            <p className="font-questrial text-lg text-cca-ink/70">
              Everything you need to know about Crandall Christian Academy.
            </p>
          </ScrollReveal>
        </div>
      </section>
      <section className="py-20 px-6 bg-white">
        <FAQAccordion items={FAQ_ITEMS} />
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ_ITEMS.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          }),
        }}
      />
    </>
  );
}
