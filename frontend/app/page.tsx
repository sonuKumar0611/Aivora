import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <header className="border-b border-brand-border sticky top-0 z-10 glass">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="font-semibold text-lg text-brand-textHeading">Aivora</span>
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
        <section className="relative max-w-4xl mx-auto px-4 py-24 text-center animate-fade-in overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero-glow pointer-events-none" aria-hidden />
          <h1 className="relative text-4xl md:text-5xl font-bold tracking-tight text-brand-textHeading mb-6">
            Build AI Customer Support in Minutes
          </h1>
          <p className="relative text-xl text-brand-textMuted mb-10 max-w-2xl mx-auto">
            Create, test, and deploy AI chatbots using your own knowledge base. No code required.
          </p>
          <Link
            href="/signup"
            className="relative inline-flex rounded-lg bg-gradient-primary text-white px-6 py-3 text-base font-medium hover:opacity-95 transition-all hover:shadow-glow-primary"
          >
            Get Started
          </Link>
        </section>

        <section className="border-t border-brand-border py-24">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-semibold text-brand-textHeading text-center mb-12">
              Features
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="rounded-xl border border-brand-border p-6 bg-brand-bgCard transition-shadow hover:bg-brand-bgCardHover hover:shadow-glow-primary/20">
                <h3 className="font-semibold text-brand-textHeading mb-2">Bot Builder</h3>
                <p className="text-sm text-brand-textMuted">
                  Create bots with custom names, business descriptions, and tone. Full control over
                  personality.
                </p>
              </div>
              <div className="rounded-xl border border-brand-border p-6 bg-brand-bgCard transition-shadow hover:bg-brand-bgCardHover hover:shadow-glow-primary/20">
                <h3 className="font-semibold text-brand-textHeading mb-2">Knowledge Base</h3>
                <p className="text-sm text-brand-textMuted">
                  Upload PDFs, text, or URLs. We chunk, embed, and index so your bot answers from
                  your content.
                </p>
              </div>
              <div className="rounded-xl border border-brand-border p-6 bg-brand-bgCard transition-shadow hover:bg-brand-bgCardHover hover:shadow-glow-primary/20">
                <h3 className="font-semibold text-brand-textHeading mb-2">Embed Anywhere</h3>
                <p className="text-sm text-brand-textMuted">
                  One script tag to add a chat widget to any website. Works with your existing
                  stack.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-brand-border py-24">
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

        <section className="border-t border-brand-border py-24">
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

        <section className="border-t border-brand-border py-16">
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

      <footer className="border-t border-brand-border py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-brand-textMuted">
          Aivora – AI Customer Support Automation
        </div>
      </footer>
    </div>
  );
}
