import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { FeaturesSection } from '@/components/FeaturesSection';

const LiquidEther = dynamic(() => import('@/components/LiquidEther'), { ssr: false });

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <header className="absolute top-0 left-0 right-0 z-20 border-b border-white/10 glass">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/aivora.png"
              alt="Aivora"
              width={120}
              height={36}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-brand-link hover:text-brand-linkHover transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-brand-primary hover:bg-brand-primaryHover text-white px-4 py-2 text-sm font-medium transition-all hover:shadow-glow-primary"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero – full viewport cover */}
        <section className="relative min-h-screen h-screen flex flex-col items-center justify-center overflow-hidden">
          {/* Canvas layer: explicit z-0, contain paint so repaints don't distort text above */}
          <div className="absolute inset-0 w-full h-full z-0 [contain:paint]">
            <LiquidEther
              colors={['#5227FF', '#FF9FFC', '#B19EEF']}
              mouseForce={20}
              cursorSize={100}
              isViscous
              viscous={30}
              iterationsViscous={32}
              iterationsPoisson={32}
              resolution={0.5}
              isBounce={false}
              autoDemo
              autoSpeed={0.5}
              autoIntensity={2.2}
              takeoverDuration={0.25}
              autoResumeDelay={3000}
              autoRampDuration={0.6}
              className="absolute inset-0 w-full h-full"
            />
          </div>
          {/* Text on its own compositing layer; no box/glass so no visible container */}
          <div className="relative z-10 max-w-4xl mx-auto px-4 py-20 text-center pointer-events-auto isolate [transform:translateZ(0)] [backface-visibility:hidden]">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-bgCard/60 backdrop-blur-sm px-4 py-1.5 text-sm text-brand-textMuted mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-primary" />
              </span>
              No-code AI • Your knowledge, instant answers
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-brand-textHeading mb-6 animate-fade-in [animation-delay:0.05s] leading-[1.15] hero-headline">
              Support that scales.
              <br />
              <span className="text-brand-primary">Without the wait.</span>
            </h1>
            <p className="text-lg sm:text-xl text-brand-textMuted mb-12 max-w-2xl mx-auto animate-fade-in [animation-delay:0.1s] opacity-95 leading-relaxed">
              Train an AI chatbot on your docs, FAQs, and content. Deploy in minutes. Embed anywhere—no engineering required.
            </p>
            <div className="flex justify-center animate-fade-in [animation-delay:0.2s]">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-primary text-white px-8 py-4 text-base font-semibold hover:opacity-95 transition-all hover:shadow-glow-primary shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Started — It&apos;s free
              </Link>
            </div>
          </div>
        </section>

        <FeaturesSection />

        <section className="py-24">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-semibold text-brand-textHeading mb-8">How it works</h2>
            <ol className="space-y-6 text-left">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-divider border border-brand-borderLight flex items-center justify-center font-medium text-brand-text">
                  1
                </span>
                <div className="text-brand-text">
                  <strong className="text-brand-textHeading">Create a bot</strong> – Set name,
                  description, and tone for your support assistant.
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-divider border border-brand-borderLight flex items-center justify-center font-medium text-brand-text">
                  2
                </span>
                <div className="text-brand-text">
                  <strong className="text-brand-textHeading">Add knowledge</strong> – Upload PDFs,
                  paste text, or add URLs. We process and index everything.
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-divider border border-brand-borderLight flex items-center justify-center font-medium text-brand-text">
                  3
                </span>
                <div className="text-brand-text">
                  <strong className="text-brand-textHeading">Deploy</strong> – Test in the
                  dashboard, then embed the widget on your site.
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className="py-24">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-semibold text-brand-textHeading mb-8">Pricing</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <div className="rounded-xl border border-brand-border p-8 bg-brand-bgCard">
                <h3 className="font-semibold text-lg text-brand-textHeading mb-2">Free</h3>
                <p className="text-3xl font-bold text-brand-textHeading mb-4">$0</p>
                <p className="text-sm text-brand-textMuted mb-6">
                  Get started with one bot and limited messages.
                </p>
                <Link
                  href="/signup"
                  className="text-sm font-medium text-brand-link hover:text-brand-linkHover transition-colors"
                >
                  Get Started
                </Link>
              </div>
              <div className="rounded-xl border border-brand-border p-8 bg-brand-bgCard">
                <h3 className="font-semibold text-lg text-brand-textHeading mb-2">Pro</h3>
                <p className="text-3xl font-bold text-brand-textHeading mb-4">Coming soon</p>
                <p className="text-sm text-brand-textMuted mb-6">
                  More bots, higher limits, and priority support.
                </p>
                <span className="text-sm text-brand-textMuted">—</span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-semibold text-brand-textHeading mb-4">
              Ready to automate support?
            </h2>
            <Link
              href="/signup"
              className="inline-flex rounded-lg bg-brand-primary hover:bg-brand-primaryHover text-white px-6 py-3 text-base font-medium transition-all hover:shadow-glow-primary"
            >
              Get Started
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-brand-textMuted">
          Aivora – AI Customer Support Automation
        </div>
      </footer>
    </div>
  );
}
