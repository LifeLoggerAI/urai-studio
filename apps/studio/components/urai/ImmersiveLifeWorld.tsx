'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ImmersiveState = 'home' | 'ascendingToLifeMap' | 'lifeMap' | 'memoryFocus' | 'orbChat' | 'groundZoom' | 'unwinding';

type MemoryNode = {
  id: string;
  title: string;
  archetype: string;
  tone: string;
  x: number;
  y: number;
  size: number;
  color: string;
  body: string;
};

const MOTION = {
  ascentMs: 1900,
  unwindMs: 1300,
  focusMs: 620,
  orbMs: 680,
  groundMs: 760,
};

const memories: MemoryNode[] = [
  {
    id: 'blue-fog-memory',
    title: 'Blue Fog Memory',
    archetype: 'The Witness',
    tone: 'quiet grief',
    x: 22,
    y: 40,
    size: 1.35,
    color: '#c7efff',
    body: 'This memory carried weight, so URAI rendered it softly: audio, mood, timeline, private.',
  },
  {
    id: 'threshold-before-clarity',
    title: 'Threshold Before Clarity',
    archetype: 'Threshold Keeper',
    tone: 'crossing',
    x: 39,
    y: 63,
    size: 0.82,
    color: '#d5e7ff',
    body: 'The life map recognized a quiet crossing point and softened the path forward.',
  },
  {
    id: 'social-weather',
    title: 'Social Weather',
    archetype: 'Relational Field',
    tone: 'trust',
    x: 53,
    y: 33,
    size: 0.7,
    color: '#f3d887',
    body: 'A relationship weather system appears as warm orbit lines and slow-moving emotional gravity.',
  },
  {
    id: 'winter-becoming',
    title: 'Winter Becoming',
    archetype: 'Witness',
    tone: 'quiet grief',
    x: 64,
    y: 47,
    size: 0.95,
    color: '#d9d6ff',
    body: 'A calm chapter cluster: private, protective, and held inside a blue atmospheric bloom.',
  },
  {
    id: 'dream-field',
    title: 'Dream Field',
    archetype: 'Weather Seer',
    tone: 'symbolic wonder',
    x: 77,
    y: 24,
    size: 0.72,
    color: '#9df5ff',
    body: 'Dream fragments and passive signals bend into a small constellation of possible meaning.',
  },
  {
    id: 'legacy-arc',
    title: 'Legacy Arc',
    archetype: 'Ancestor Thread',
    tone: 'gold continuity',
    x: 85,
    y: 67,
    size: 1.0,
    color: '#f0d6a8',
    body: 'The map traces continuity instead of metrics: what endured, what softened, and what became wisdom.',
  },
  {
    id: 'future-forecast',
    title: 'Future Forecast',
    archetype: 'Weather Seer',
    tone: 'emerging clarity',
    x: 14,
    y: 72,
    size: 0.66,
    color: '#9befff',
    body: 'URAI forecasts the emotional sky without forcing action: a gentle next direction, not a command.',
  },
];

const constellationLines = [
  ['blue-fog-memory', 'threshold-before-clarity'],
  ['threshold-before-clarity', 'social-weather'],
  ['social-weather', 'winter-becoming'],
  ['winter-becoming', 'dream-field'],
  ['dream-field', 'legacy-arc'],
  ['blue-fog-memory', 'future-forecast'],
  ['future-forecast', 'threshold-before-clarity'],
];

export function ImmersiveLifeWorld() {
  const [state, setState] = useState<ImmersiveState>('home');
  const [previousState, setPreviousState] = useState<ImmersiveState>('home');
  const [selectedMemoryId, setSelectedMemoryId] = useState('blue-fog-memory');
  const [mapTransform, setMapTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ pointerId: 0, x: 0, y: 0, tx: 0, ty: 0 });
  const transitionTimer = useRef<number | null>(null);

  const selectedMemory = useMemo(
    () => memories.find((memory) => memory.id === selectedMemoryId) ?? memories[0],
    [selectedMemoryId],
  );

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimer.current) {
      window.clearTimeout(transitionTimer.current);
      transitionTimer.current = null;
    }
  }, []);

  const enterLifeMap = useCallback(() => {
    clearTransitionTimer();
    setPreviousState('home');
    setState('ascendingToLifeMap');
    window.history.pushState({ uraiState: 'lifeMap' }, '', '#life-map');
    transitionTimer.current = window.setTimeout(() => {
      setState('lifeMap');
      transitionTimer.current = null;
    }, MOTION.ascentMs);
  }, [clearTransitionTimer]);

  const openOrbChat = useCallback(() => {
    clearTransitionTimer();
    setPreviousState('home');
    setState('orbChat');
    window.history.pushState({ uraiState: 'orbChat' }, '', '#orb-chat');
  }, [clearTransitionTimer]);

  const openGroundZoom = useCallback(() => {
    clearTransitionTimer();
    setPreviousState('home');
    setState('groundZoom');
    window.history.pushState({ uraiState: 'groundZoom' }, '', '#foundation');
  }, [clearTransitionTimer]);

  const focusMemory = useCallback((id: string) => {
    clearTransitionTimer();
    setSelectedMemoryId(id);
    setPreviousState('lifeMap');
    setState('memoryFocus');
    window.history.pushState({ uraiState: 'memoryFocus', id }, '', `#memory-${id}`);
  }, [clearTransitionTimer]);

  const unwind = useCallback(() => {
    clearTransitionTimer();

    if (state === 'memoryFocus') {
      setState('lifeMap');
      window.history.replaceState({ uraiState: 'lifeMap' }, '', '#life-map');
      return;
    }

    if (state === 'lifeMap' || state === 'ascendingToLifeMap') {
      setPreviousState('lifeMap');
      setState('unwinding');
      transitionTimer.current = window.setTimeout(() => {
        setState('home');
        setMapTransform({ x: 0, y: 0, scale: 1 });
        window.history.replaceState({ uraiState: 'home' }, '', window.location.pathname);
        transitionTimer.current = null;
      }, MOTION.unwindMs);
      return;
    }

    if (state === 'orbChat' || state === 'groundZoom' || state === 'unwinding') {
      setState('home');
      window.history.replaceState({ uraiState: 'home' }, '', window.location.pathname);
      return;
    }
  }, [clearTransitionTimer, state]);

  useEffect(() => {
    window.history.replaceState({ uraiState: 'home' }, '', window.location.pathname);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        unwind();
      }
    };
    const onPopState = () => unwind();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('popstate', onPopState);
    return () => {
      clearTransitionTimer();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('popstate', onPopState);
    };
  }, [clearTransitionTimer, unwind]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (state !== 'lifeMap') return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    dragStart.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      tx: mapTransform.x,
      ty: mapTransform.y,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || dragStart.current.pointerId !== event.pointerId) return;
    const nextX = dragStart.current.tx + (event.clientX - dragStart.current.x) * 0.72;
    const nextY = dragStart.current.ty + (event.clientY - dragStart.current.y) * 0.72;
    setMapTransform((current) => ({ ...current, x: nextX, y: nextY }));
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStart.current.pointerId === event.pointerId) setIsDragging(false);
  };

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (state !== 'lifeMap') return;
    event.preventDefault();
    const direction = event.deltaY > 0 ? -0.08 : 0.08;
    setMapTransform((current) => ({ ...current, scale: Math.min(1.62, Math.max(0.72, current.scale + direction)) }));
  };

  const sceneClass = `urai-world urai-state-${state} ${previousState === 'lifeMap' ? 'from-life-map' : ''}`;

  return (
    <section className={sceneClass} aria-label="URAI cinematic symbolic life interface">
      <div className="urai-atmosphere" aria-hidden="true">
        {Array.from({ length: 46 }).map((_, index) => (
          <span key={index} style={{ '--i': index } as React.CSSProperties} />
        ))}
      </div>

      <div className="urai-home-scene" aria-hidden={state !== 'home' && state !== 'orbChat' && state !== 'groundZoom'}>
        <button className="world-zone sky-zone" type="button" onClick={enterLifeMap} aria-label="Ascend into the URAI Memory Galaxy" />
        <button className="world-zone orb-zone" type="button" onClick={openOrbChat} aria-label="Open the URAI companion orb chat" />
        <button className="world-zone ground-zone" type="button" onClick={openGroundZoom} aria-label="Enter the URAI foundation layer" />

        <div className="home-copy home-copy-left">
          <span>URAI</span>
          <strong>Inner Sky Shrine</strong>
          <small>stable · quiet sky · memory gateway ready</small>
        </div>
        <div className="home-copy home-copy-right">
          <span>Companion</span>
          <strong>Your sky is quiet, but awake.</strong>
          <small>Tap the orb or sky to open the Memory Galaxy.</small>
        </div>

        <div className="horizon-layer horizon-back" />
        <div className="horizon-layer horizon-mid" />
        <div className="horizon-layer horizon-front" />
        <div className="orb-body">
          <div className="orb-highlight" />
        </div>
        <div className="orb-ring ring-one" />
        <div className="orb-ring ring-two" />
        <div className="body-witness" />
        <div className="ground-ellipse" />
        <div className="nav-compass" aria-hidden="true">N</div>
      </div>

      <div className="ascent-field" aria-hidden="true">
        <div className="ascent-cloud ascent-cloud-a" />
        <div className="ascent-cloud ascent-cloud-b" />
        <div className="ascent-cloud ascent-cloud-c" />
        <div className="ascent-tunnel" />
      </div>

      <div
        className="urai-life-map"
        aria-hidden={state === 'home' || state === 'orbChat' || state === 'groundZoom'}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <div className="life-map-title">
          <span>URAI Spatial Life Map</span>
          <h1>Memory Galaxy</h1>
          <p>12 active stars · 6 constellations · drag, wheel, tap</p>
        </div>

        <div
          className="galaxy-stage"
          style={{
            transform: `translate3d(${mapTransform.x}px, ${mapTransform.y}px, 0) scale(${mapTransform.scale})`,
          }}
        >
          <svg className="constellation-lines" viewBox="0 0 100 100" aria-hidden="true">
            {constellationLines.map(([from, to]) => {
              const a = memories.find((memory) => memory.id === from)!;
              const b = memories.find((memory) => memory.id === to)!;
              return <line key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
            })}
          </svg>
          <div className="memory-bloom bloom-a" />
          <div className="memory-bloom bloom-b" />
          <div className="memory-bloom bloom-c" />
          {memories.map((memory) => (
            <button
              key={memory.id}
              className={`memory-star ${memory.id === selectedMemoryId ? 'is-selected' : ''}`}
              style={{
                left: `${memory.x}%`,
                top: `${memory.y}%`,
                '--star-size': memory.size,
                '--star-color': memory.color,
              } as React.CSSProperties}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                focusMemory(memory.id);
              }}
            >
              <span className="star-core" />
              <span className="star-label">
                <strong>{memory.title}</strong>
                <small>{memory.tone}</small>
              </span>
            </button>
          ))}
        </div>

        <aside className="memory-witness-card" aria-live="polite">
          <span className="witness-orb" />
          <p>{selectedMemory.archetype}</p>
          <h2>{selectedMemory.title}</h2>
          <strong>{selectedMemory.tone}</strong>
          <small>{selectedMemory.body}</small>
        </aside>

        <div className="life-map-dock" aria-label="Life map quick navigation">
          <button type="button" onClick={() => setMapTransform((value) => ({ ...value, scale: Math.max(0.72, value.scale - 0.12) }))}>
            Zoom out
          </button>
          <button type="button" onClick={() => setMapTransform({ x: 0, y: 0, scale: 1 })}>Full galaxy</button>
          <button type="button" onClick={() => setMapTransform((value) => ({ ...value, scale: Math.min(1.62, value.scale + 0.12) }))}>
            Zoom in
          </button>
          <button type="button" onClick={() => focusMemory(selectedMemory.id)}>Open bloom</button>
        </div>
      </div>

      {state === 'memoryFocus' && (
        <div className="memory-focus" role="dialog" aria-modal="true" aria-label={`${selectedMemory.title} memory bloom`}>
          <button className="close-world" type="button" onClick={unwind} aria-label="Return to Memory Galaxy">×</button>
          <div className="focus-orb" style={{ '--star-color': selectedMemory.color } as React.CSSProperties} />
          <p>{selectedMemory.archetype}</p>
          <h2>{selectedMemory.title}</h2>
          <strong>{selectedMemory.tone}</strong>
          <span>{selectedMemory.body}</span>
        </div>
      )}

      {state === 'orbChat' && (
        <div className="orb-chat" role="dialog" aria-modal="true" aria-label="URAI companion chat">
          <button className="close-world" type="button" onClick={unwind} aria-label="Close companion chat">×</button>
          <div className="chat-orb" />
          <p>URAI Companion</p>
          <h2>I am listening from the center of the sky.</h2>
          <div className="chat-message from-urai">Your world is calm. Tell me where you want the next bloom to open, or simply rest here.</div>
          <label>
            <span>Speak into the orb</span>
            <textarea placeholder="Share a thought, memory, question, or feeling…" />
          </label>
          <button className="world-action" type="button">Send to companion</button>
        </div>
      )}

      {state === 'groundZoom' && (
        <div className="ground-focus" role="dialog" aria-modal="true" aria-label="URAI foundation layer">
          <button className="close-world" type="button" onClick={unwind} aria-label="Return home">×</button>
          <p>Foundation Layer</p>
          <h2>Roots, recovery, and body-memory signals.</h2>
          <div className="root-field" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <strong>Ground is stable · sleep rhythm softening · recovery field rebuilding</strong>
          <small>URAI keeps this layer quiet until the body needs guidance. It is not a dashboard; it is the foundation under the sky.</small>
        </div>
      )}

      <button className="unwind-button" type="button" onClick={unwind} aria-label="Unwind current URAI state">
        ↶
      </button>
    </section>
  );
}
