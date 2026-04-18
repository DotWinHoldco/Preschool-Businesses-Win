import type { Metadata } from 'next';
import '@/app/marketing/fonts.css';

export const metadata: Metadata = {
  title: 'Apply — Crandall Christian Academy',
  description:
    'Apply to Crandall Christian Academy. Faith-based preschool in Crandall, TX with small class sizes and certified staff.',
  icons: {
    icon: '/marketing/shared/favicon.png',
    apple: '/marketing/shared/favicon.png',
  },
};

export default function EnrollLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      {children}
    </div>
  );
}
