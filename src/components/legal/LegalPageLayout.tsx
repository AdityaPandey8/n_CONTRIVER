import { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

interface LegalPageLayoutProps {
  title: string;
  description: string;
  canonical: string;
  heading: string;
  eyebrow?: string;
  lastUpdated?: string;
  children: ReactNode;
}

export function LegalPageLayout({
  title,
  description,
  canonical,
  heading,
  eyebrow,
  lastUpdated,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
      </Helmet>
      <Header />
      <main className="relative pt-32 pb-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] -z-10 opacity-60"
          style={{ background: "var(--gradient-hero)" }}
        />
        <article className="container mx-auto max-w-3xl px-4 sm:px-6">
          <header className="mb-10 border-b border-border pb-8">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3">
                {eyebrow}
              </p>
            )}
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              {heading}
            </h1>
            {lastUpdated && (
              <p className="mt-4 text-sm text-muted-foreground">
                Last updated: {lastUpdated}
              </p>
            )}
          </header>
          <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-headings:text-foreground prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-3 prose-h3:text-lg prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-a:no-underline hover:prose-a:underline">
            {children}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}