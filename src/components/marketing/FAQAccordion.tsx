'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ScrollReveal } from './ScrollReveal';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="max-w-3xl mx-auto divide-y divide-gray-200">
      {items.map((item, i) => (
        <ScrollReveal key={i} delay={i * 0.05}>
          <div className="py-4">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between text-left py-2 group"
              aria-expanded={openIndex === i}
            >
              <h3 className="font-kollektif text-lg pr-8 group-hover:text-cca-blue transition-colors">
                {item.question}
              </h3>
              <span
                className={`text-2xl text-cca-blue transition-transform duration-200 ${
                  openIndex === i ? 'rotate-45' : ''
                }`}
              >
                +
              </span>
            </button>
            <AnimatePresence>
              {openIndex === i && (
                <motion.div
                  initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="font-questrial text-cca-ink/80 text-base leading-relaxed pb-2 pt-1">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
}
