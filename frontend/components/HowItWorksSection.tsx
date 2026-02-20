'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, FileStack, Rocket, ChevronDown } from 'lucide-react';

const steps = [
  {
    number: 1,
    icon: Bot,
    title: 'Create an agent',
    short: 'Set name, description, and tone for your support assistant.',
    detail:
      'Give your assistant a name and personality. Choose how formal or friendly it should be, and add your business context so every answer stays on-brand. No code—just a few fields in the dashboard.',
  },
  {
    number: 2,
    icon: FileStack,
    title: 'Add knowledge',
    short: 'Upload PDFs, paste text, or add URLs. We process and index everything.',
    detail:
      'Drop in PDFs, help docs, FAQs, or paste text directly. Add URLs and we’ll crawl and index them. Our pipeline chunks and embeds your content so the agent retrieves the right answers in real time. Re-upload anytime to keep answers fresh.',
  },
  {
    number: 3,
    icon: Rocket,
    title: 'Deploy',
    short: 'Test in the dashboard, then embed the widget on your site.',
    detail:
      'Try conversations in the built-in chat before going live. When you’re happy, copy one script tag and paste it into your site. The widget works on any website or app—no backend or engineering required.',
  },
];

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [sectionInView, setSectionInView] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setSectionInView(entry.isIntersecting),
      { rootMargin: '0px 0px -80px 0px', threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 relative">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-semibold text-brand-textHeading mb-4 text-center">
          How it works
        </h2>
        <p className="text-brand-textMuted text-center mb-14 max-w-xl mx-auto">
          Three steps from signup to a live support agent—no code required.
        </p>

        {/* Vertical stepper with laser line */}
        <div className="relative">
          {/* Track (subtle background line) */}
          <div
            className="absolute left-[19px] top-6 bottom-6 w-0.5 rounded-full bg-brand-border opacity-80"
            aria-hidden
          />
          {/* Animated "laser" line – fills as steps come into view / always animating */}
          <div
            className={`absolute left-[19px] top-6 w-0.5 rounded-full bg-gradient-to-b from-brand-primary via-brand-accent to-brand-primary origin-top transition-all duration-1000 ease-out ${
              sectionInView ? 'laser-line-visible' : 'laser-line-hidden'
            }`}
            style={{ height: 'calc(100% - 48px)' }}
            aria-hidden
          />

          <ol className="relative space-y-0">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isExpanded = expandedStep === step.number;
              const isRevealed = sectionInView;

              return (
                <li
                  key={step.number}
                  className={`flex gap-6 sm:gap-8 pb-12 last:pb-0 transition-all duration-500 ${
                    isRevealed ? 'opacity-100' : 'opacity-0 translate-x-4'
                  }`}
                  style={{
                    transitionDelay: isRevealed ? `${index * 120}ms` : '0ms',
                  }}
                >
                  {/* Step node on the line */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={`
                        w-10 h-10 rounded-full border-2 flex items-center justify-center
                        transition-all duration-300
                        ${
                          isExpanded
                            ? 'bg-brand-primary border-brand-primary text-white shadow-glow-primary scale-110'
                            : 'bg-brand-bgCard border-brand-borderLight text-brand-text hover:border-brand-primary/60'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </div>
                  </div>

                  {/* Content card */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedStep(isExpanded ? null : step.number)
                      }
                      className="w-full text-left rounded-xl border border-brand-border bg-brand-bgCard/80 hover:bg-brand-bgCard hover:border-brand-borderLight p-5 sm:p-6 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:ring-offset-2 focus:ring-offset-brand-bg"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="text-xs font-medium text-brand-primary uppercase tracking-wider">
                            Step {step.number}
                          </span>
                          <h3 className="text-lg font-semibold text-brand-textHeading mt-1">
                            {step.title}
                          </h3>
                          <p className="text-brand-textMuted text-sm mt-2 leading-relaxed">
                            {step.short}
                          </p>
                          <div
                            className={`overflow-hidden transition-all duration-300 ${
                              isExpanded ? 'max-h-48 opacity-100 mt-4' : 'max-h-0 opacity-0'
                            }`}
                          >
                            <p className="text-brand-text text-sm leading-relaxed">
                              {step.detail}
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`flex-shrink-0 w-5 h-5 text-brand-textMuted transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
