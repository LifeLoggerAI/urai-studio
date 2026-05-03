import { systems } from '@/lib/studio/systems';
import { SystemCard } from '@/components/site/SystemCard';

export default function StudioPage() {
  return (
    <section>
      <h1>URAI Studio</h1>
      <p>
        URAI Studio is the cinematic creative arm of URAI: memory, media, and spatial storytelling systems,
        from signals to story.
      </p>
      <div className="grid">
        {systems.filter((s) => ['studio', 'motion', 'cinema', 'music', 'visuals', 'spatial'].includes(s.slug)).map((s) => (
          <SystemCard key={s.id} s={s} />
        ))}
      </div>
    </section>
  );
}
