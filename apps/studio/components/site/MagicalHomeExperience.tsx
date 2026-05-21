const homeLayers = [
  {
    title: 'Ground layer',
    body: 'A walkable symbolic world for personal places, routines, objects, and spatial memory anchors.',
    marker: 'ground-layer',
  },
  {
    title: 'Orb companion',
    body: 'A calm companion core that keeps chat, narration, and system state visible without pretending unsupported services are live.',
    marker: 'orb-companion',
  },
  {
    title: 'Memory stars',
    body: 'A symbolic timeline layer for emotional moments, recovery signals, relationship fields, and cinematic replay seeds.',
    marker: 'memory-stars',
  },
  {
    title: 'Emotional weather',
    body: 'A privacy-conscious atmosphere layer that visualizes mood, cognitive load, recovery, and field reconstruction as staged V1 signals.',
    marker: 'emotional-weather',
  },
];

const fieldSignals = [
  'emotional field reconstruction',
  'relationship fields',
  'recovery fields',
  'asset factory handoff',
  'cinematic generation direction',
  'Studio / Cinema / Motion / Visuals / Music lattice',
];

export function MagicalHomeExperience() {
  return (
    <section data-urai-v1-home-experience="true" className="section-panel magical-home-panel" aria-labelledby="magical-home-heading">
      <div className="section-heading">
        <p className="eyebrow">V1 magical home</p>
        <h2 id="magical-home-heading">Ground, orb, chat, memory, and weather are launch requirements.</h2>
        <p>
          URAI Studio V1 keeps the magical home experience visible now: the ground anchors spatial memory,
          the orb opens companion chat, and the sky becomes a symbolic timeline for reconstructed emotional fields.
        </p>
      </div>

      <div className="card elevated" data-urai-v1-home-shell="ground-orb-chat">
        <div
          aria-hidden="true"
          style={{
            position: 'relative',
            minHeight: 280,
            overflow: 'hidden',
            borderRadius: 28,
            border: '1px solid rgba(255,255,255,0.14)',
            background:
              'radial-gradient(circle at 50% 34%, rgba(147,197,253,0.3), transparent 24%), linear-gradient(180deg, rgba(11,18,32,0.95), rgba(20,32,24,0.92))',
          }}
        >
          <div
            data-urai-home-layer="sky-memory-stars"
            style={{
              position: 'absolute',
              inset: '22px 24px auto 24px',
              minHeight: 106,
              borderRadius: 24,
              background:
                'radial-gradient(circle at 15% 30%, rgba(255,255,255,0.95) 0 2px, transparent 3px), radial-gradient(circle at 50% 20%, rgba(255,255,255,0.85) 0 2px, transparent 3px), radial-gradient(circle at 75% 45%, rgba(255,255,255,0.75) 0 2px, transparent 3px), linear-gradient(135deg, rgba(37,99,235,0.18), rgba(168,85,247,0.12))',
            }}
          />
          <div
            data-urai-home-layer="orb-chat"
            style={{
              position: 'absolute',
              left: '50%',
              top: '44%',
              transform: 'translate(-50%, -50%)',
              width: 88,
              height: 88,
              borderRadius: 999,
              background: 'radial-gradient(circle, rgba(255,255,255,0.95), rgba(125,211,252,0.65), rgba(168,85,247,0.28))',
              boxShadow: '0 0 48px rgba(125,211,252,0.55)',
            }}
          />
          <div
            data-urai-home-layer="ground-world"
            style={{
              position: 'absolute',
              left: '8%',
              right: '8%',
              bottom: 26,
              height: 92,
              borderRadius: '50% 50% 44% 44%',
              background: 'linear-gradient(180deg, rgba(45,212,191,0.26), rgba(22,101,52,0.5))',
              boxShadow: '0 -18px 80px rgba(45,212,191,0.16)',
            }}
          />
          <div
            data-urai-home-layer="chat-interface"
            style={{
              position: 'absolute',
              right: 18,
              bottom: 18,
              width: 'min(240px, 58%)',
              borderRadius: 18,
              padding: 12,
              background: 'rgba(2,6,23,0.72)',
              border: '1px solid rgba(255,255,255,0.14)',
            }}
          >
            <strong>Orb chat</strong>
            <p style={{ margin: '6px 0 0', opacity: 0.74 }}>
              Ask what the field is showing. Live memory grounding stays gated until Firebase and consent pass.
            </p>
          </div>
        </div>
      </div>

      <div className="grid four">
        {homeLayers.map((layer) => (
          <article className="card" key={layer.marker} data-urai-v1-home-requirement={layer.marker}>
            <p className="eyebrow">Required</p>
            <h3>{layer.title}</h3>
            <p>{layer.body}</p>
          </article>
        ))}
      </div>

      <div className="card" data-urai-v1-field-reconstruction="true">
        <p className="eyebrow">Field reconstruction spine</p>
        <p>{fieldSignals.join(' · ')}</p>
      </div>
    </section>
  );
}
