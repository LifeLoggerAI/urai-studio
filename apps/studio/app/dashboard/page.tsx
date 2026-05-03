import { SystemCard } from '@/components/site/SystemCard';
import { systems } from '@/lib/studio/systems';

export default function Page() {
  return (
    <section>
      <h1>Studio Dashboard</h1>
      <p>System health overview and module quick actions.</p>

      <div className="grid">
        {systems.map((s) => (
          <SystemCard key={s.id} s={s} />
        ))}
      </div>
    </section>
  );
}