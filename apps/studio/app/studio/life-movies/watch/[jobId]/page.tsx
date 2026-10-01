import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { LifeMoviePlayer } from '@/components/studio/LifeMoviePlayer';
import { canExecuteStudioFeature } from '@/lib/studio/feature-policy';

export const metadata: Metadata = {
  title: 'Watch Life Movie — URAI Studio',
  description: 'Private playback for a completed URAI Life Movie.',
  robots: { index: false, follow: false },
};

export default async function LifeMovieWatchPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  if (!canExecuteStudioFeature('life-movies-render')) notFound();
  const { jobId } = await params;
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(jobId)) notFound();

  return (
    <section data-urai-studio-page="life-movie-watch" className="page-stack">
      <p className="eyebrow">URAI Life Movies</p>
      <h1>Watch your Life Movie.</h1>
      <p className="hero-lede">
        Playback is private and uses a short-lived viewing grant tied to your authenticated render job.
      </p>
      <LifeMoviePlayer jobId={jobId} />
      <div className="cta-row">
        <Link className="button button-secondary" href="/studio/life-movies">Back to Life Movies</Link>
        <Link className="button button-secondary" href="/studio">Back to Studio</Link>
      </div>
    </section>
  );
}
