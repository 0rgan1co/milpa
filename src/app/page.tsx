import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Network,
  BookOpenText,
  Share2,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 sm:px-10 lg:py-24">
        <div className="inline-flex w-fit items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
          Milpa Platform
        </div>

        <div className="max-w-3xl space-y-5">
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-6xl">
            AI discovery dashboard for organizational interviews.
          </h1>
          <p className="text-lg text-slate-300">
            Milpa centralizes interviews, narrative extraction, semantic
            clustering, and insight sharing in one workflow.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex items-center rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Open Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/narratives"
            className="inline-flex items-center rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
          >
            View Narratives
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<BarChart3 className="h-5 w-5" />}
            title="Dashboard"
            description="Track participation, sentiment, and activity trends."
            href="/dashboard"
          />
          <FeatureCard
            icon={<BookOpenText className="h-5 w-5" />}
            title="Narratives"
            description="Extract and explore narrative fragments by context."
            href="/narratives"
          />
          <FeatureCard
            icon={<Network className="h-5 w-5" />}
            title="Clustering"
            description="Map semantic groups and discover emergent themes."
            href="/clustering"
          />
          <FeatureCard
            icon={<Share2 className="h-5 w-5" />}
            title="Shared Views"
            description="Open read-only share links for collaborative review."
            href="/dashboard"
          />
        </div>

        <p className="text-sm text-slate-400">
          Note: sign in first to access protected dashboards.
        </p>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-slate-600 hover:bg-slate-900"
    >
      <div className="mb-3 inline-flex rounded-lg border border-slate-700 p-2 text-emerald-300">
        {icon}
      </div>
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        {description}
      </p>
      <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-300">
        Open
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
