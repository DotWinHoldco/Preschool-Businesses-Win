import Image from 'next/image'
import { ScrollReveal } from './ScrollReveal'

interface StaffCardProps {
  name: string
  title: string
  bio?: string
  headshotPath: string
  index: number
}

export function StaffCard({ name, title, headshotPath, index }: StaffCardProps) {
  return (
    <ScrollReveal delay={index * 0.08}>
      <div className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
        <div className="relative aspect-[3/4] overflow-hidden">
          <Image
            src={headshotPath}
            alt={`${name} — ${title}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="p-4 text-center">
          <h3 className="font-kollektif text-lg">{name}</h3>
          <p className="font-questrial text-sm text-cca-ink/60">{title}</p>
        </div>
      </div>
    </ScrollReveal>
  )
}
