import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="font-semibold text-lg">Aivora</span>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:opacity-90 transition-all hover:scale-[1.02]"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="max-w-4xl mx-auto px-4 py-24 text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Build AI Customer Support in Minutes
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto">
            Create, test, and deploy AI chatbots using your own knowledge base. No code required.
          </p>
          <Link
            href="/signup"
            className="inline-flex rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 text-base font-medium hover:opacity-90 transition-all hover:scale-[1.02]"
          >
            Get Started
          </Link>
        </section>

        <section className="border-t border-zinc-200 dark:border-zinc-800 py-24">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-semibold text-center mb-12">Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 bg-zinc-50/50 dark:bg-zinc-900/50 transition-shadow hover:shadow-md">
                <h3 className="font-semibold mb-2">Bot Builder</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Create bots with custom names, business descriptions, and tone. Full control over personality.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 bg-zinc-50/50 dark:bg-zinc-900/50 transition-shadow hover:shadow-md">
                <h3 className="font-semibold mb-2">Knowledge Base</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Upload PDFs, text, or URLs. We chunk, embed, and index so your bot answers from your content.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 bg-zinc-50/50 dark:bg-zinc-900/50 transition-shadow hover:shadow-md">
                <h3 className="font-semibold mb-2">Embed Anywhere</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  One script tag to add a chat widget to any website. Works with your existing stack.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-200 dark:border-zinc-800 py-24">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-semibold mb-8">How it works</h2>
            <ol className="space-y-6 text-left">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-medium">1</span>
                <div>
                  <strong>Create a bot</strong> – Set name, description, and tone for your support assistant.
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-medium">2</span>
                <div>
                  <strong>Add knowledge</strong> – Upload PDFs, paste text, or add URLs. We process and index everything.
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-medium">3</span>
                <div>
                  <strong>Deploy</strong> – Test in the dashboard, then embed the widget on your site.
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className="border-t border-zinc-200 dark:border-zinc-800 py-24">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-semibold mb-8">Pricing</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-8">
                <h3 className="font-semibold text-lg mb-2">Free</h3>
                <p className="text-3xl font-bold mb-4">$0</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">Get started with one bot and limited messages.</p>
                <Link href="/signup" className="text-sm font-medium text-zinc-900 dark:text-zinc-100 underline">
                  Get Started
                </Link>
              </div>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-8">
                <h3 className="font-semibold text-lg mb-2">Pro</h3>
                <p className="text-3xl font-bold mb-4">Coming soon</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">More bots, higher limits, and priority support.</p>
                <span className="text-sm text-zinc-500">—</span>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-200 dark:border-zinc-800 py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-semibold mb-4">Ready to automate support?</h2>
            <Link
              href="/signup"
              className="inline-flex rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 text-base font-medium hover:opacity-90"
            >
              Get Started
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-zinc-500">
          Aivora – AI Customer Support Automation
        </div>
      </footer>
    </div>
  );
}
