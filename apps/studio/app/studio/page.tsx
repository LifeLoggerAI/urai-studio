import { SystemCard } from '@/components/site/SystemCard';
import { systems } from '@/lib/studio/systems';

export default function StudioPage() {
  const studioSystems = systems.filter((system) =>
    ['studio', 'motion', 'cinema', 'music', 'visuals', 'spatial'].includes(system.slug),
  );

  return (
    <section>
      <h1>URAI Studio</h1>
      <p>
        URAI Studio is the cinematic creative arm of URAI: memory, media, and spatial storytelling systems,
        from signals to story.
      </p>

      <div className="grid">
        {studioSystems.map((system) => (
          <SystemCard key={system.id} s={system} />
        ))}
      </div>
    </section>
  );
}