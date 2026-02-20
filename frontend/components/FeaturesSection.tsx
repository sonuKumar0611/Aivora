'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, BookOpen, Code2 } from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'Bot Builder',
    description: 'Create bots with custom names, business descriptions, and tone. Full control over personality.',
    details: [
      'Custom name & avatar',
      'Business context & tone',
      'Personality tuning',
    ],
  },
  {
    icon: BookOpen,
    title: 'Knowledge Base',
    description: 'Upload PDFs, text, or URLs. We chunk, embed, and index so your bot answers from your content.',
    details: [
      'PDF, text & URL support',
      'Smart chunking & embeddings',
      'Always up-to-date answers',
    ],
  },
  {
    icon: Code2,
    title: 'Embed Anywhere',
    description: 'One script tag to add a chat widget to any website. Works with your existing stack.',
    details: [
      'Single script embed',
      'Any framework or CMS',
      'Customizable widget',
    ],
  },
];

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [sectionInView, setSectionInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setSectionInView(entry.isIntersecting),
      { rootMargin: '0px 0px -60px 0px', threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-semibold text-brand-textHeading text-center mb-4">
          Features
        </h2>
        <p className="text-brand-textMuted text-center max-w-xl mx-auto mb-14">
          Everything you need to launch an AI support assistant in minutes—no code required.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`
                  feature-card-reveal rounded-2xl border border-brand-border p-6 sm:p-8
                  bg-brand-bgCard/80 backdrop-blur-sm
                  transition-all duration-300
                  hover:border-brand-primary/40 hover:shadow-glow-primary/25 hover:bg-brand-bgCardHover
                  ${sectionInView ? 'in-view' : ''}
                `}
                style={{ transitionDelay: sectionInView ? `${i * 120}ms` : '0ms' }}
              >
                <div className="mb-5">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-primary/15 text-brand-primary border border-brand-primary/20">
                    <Icon className="w-6 h-6" strokeWidth={1.8} />
                  </div>
                </div>
                <h3 className="font-semibold text-lg text-brand-textHeading mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-brand-textMuted mb-5 leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.details.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-brand-text"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
