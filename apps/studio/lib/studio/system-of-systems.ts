export type UraiSystemStatus =
  | 'live'
  | 'demo'
  | 'internal'
  | 'prototype'
  | 'planned'
  | 'fallback'
  | 'operational'
  | 'limited'
  | 'degraded';

export type UraiSystemNode = {
  id: string;
  title: string;
  status: UraiSystemStatus;
  route: string;
  apiRoute?: string;
  description: string;
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  ctaLabel: string;
};

export type StudioAnalyticsEvent = {
  id?: string;
  eventName: string;
  route?: string;
  label?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  userId?: string;
};

export type ContactRequest = {
  id?: string;
  name: string;
  email: string;
  company?: string;
  useCase?: string;
  budgetRange?: string;
  timeline?: string;
  interestedSystems?: string[];
  message?: string;
  source?: string;
  createdAt: string;
  status: 'new' | 'reviewing' | 'contacted' | 'closed';
};

export type WaitlistSignup = {
  id?: string;
  email: string;
  name?: string;
  interest?: string;
  createdAt: string;
  source?: string;
};

export type ProjectRequest = {
  id?: string;
  name: string;
  email: string;
  company?: string;
  useCase: string;
  desiredSystems: string[];
  budgetRange?: string;
  timeline?: string;
  createdAt: string;
  status: 'new' | 'qualified' | 'in_progress' | 'closed';
};

export const uraiSystemNodes: UraiSystemNode[] = [
  {
    id: 'urai-app',
    title: 'URAI App',
    status: 'planned',
    route: '/demo',
    description: 'The passive capture layer for life signals, mood, memory, relationships, rituals, and timeline context.',
    inputs: ['audio', 'location', 'device context', 'relationship signals', 'memory events'],
    outputs: ['life signals', 'timeline context', 'personal data streams'],
    dependencies: ['URAI Privacy', 'URAI Admin'],
    ctaLabel: 'View Demo',
  },
  {
    id: 'emotional-os',
    title: 'URAI Symbolic Emotional OS',
    status: 'prototype',
    route: '/systems',
    description: 'The interpretation layer that converts passive signals into emotional weather, memory stars, narrator states, and symbolic fields.',
    inputs: ['life signals', 'mood context', 'relationship patterns', 'ritual events'],
    outputs: ['emotional weather', 'memory stars', 'narrator states', 'symbolic fields'],
    dependencies: ['URAI App', 'URAI Privacy'],
    ctaLabel: 'Explore Systems',
  },
  {
    id: 'studio',
    title: 'URAI Studio',
    status: 'live',
    route: '/studio',
    apiRoute: '/api/system/manifest',
    description: 'The creative command layer that turns interpreted intelligence into projects, scenes, scripts, scrolls, and export packages.',
    inputs: ['signals', 'prompts', 'scenes', 'memory context', 'brand systems'],
    outputs: ['projects', 'scripts', 'scrolls', 'exports', 'creative operations'],
    dependencies: ['Asset Factory', 'Motion', 'Cinema', 'Privacy'],
    ctaLabel: 'Open Studio',
  },
  {
    id: 'asset-factory',
    title: 'URAI Asset Factory',
    status: 'internal',
    route: '/assets',
    apiRoute: '/api/integrations/asset-factory/manifest',
    description: 'Generates the artifacts of the URAI universe: visuals, manifests, previews, subtitles, scripts, and production packages.',
    inputs: ['prompts', 'scene specs', 'mood direction', 'brand rules'],
    outputs: ['images', 'manifests', 'previews', 'asset jobs'],
    dependencies: ['URAI Studio', 'Storage'],
    ctaLabel: 'Open Asset Factory',
  },
  {
    id: 'motion',
    title: 'URAI Motion',
    status: 'demo',
    route: '/motion',
    description: 'Gives memory a movement language through scroll transitions, aura movement, constellation reveals, and cinematic state changes.',
    inputs: ['scene timing', 'visual states', 'aura parameters'],
    outputs: ['motion packs', 'transition specs', 'animation language'],
    dependencies: ['Visuals', 'Cinema'],
    ctaLabel: 'View Motion',
  },
  {
    id: 'cinema',
    title: 'URAI Cinema',
    status: 'demo',
    route: '/cinema',
    description: 'Turns life signals into cinematic replay, weekly films, storyboard exports, and memory-bloom video systems.',
    inputs: ['scripts', 'scenes', 'motion', 'music'],
    outputs: ['replays', 'storyboards', 'scroll films'],
    dependencies: ['Studio', 'Motion', 'Music'],
    ctaLabel: 'View Cinema',
  },
  {
    id: 'music',
    title: 'URAI Music',
    status: 'prototype',
    route: '/music',
    description: 'Scores the emotional atmosphere of the system with narrator tone, ambient identity, sonic rituals, and mood-linked scoring.',
    inputs: ['mood state', 'scene tone', 'narrator style'],
    outputs: ['sound identity', 'ambient score', 'voice direction'],
    dependencies: ['Cinema', 'Emotional OS'],
    ctaLabel: 'View Music',
  },
  {
    id: 'visuals',
    title: 'URAI Visuals',
    status: 'live',
    route: '/visuals',
    description: 'Renders the symbolic language of URAI through glyphs, aura fields, sky systems, life-map visuals, and export-ready art direction.',
    inputs: ['aura state', 'memory type', 'symbolic direction'],
    outputs: ['glyphs', 'visual systems', 'sky layers', 'export packs'],
    dependencies: ['Studio', 'Asset Factory'],
    ctaLabel: 'View Visuals',
  },
  {
    id: 'spatial',
    title: 'URAI Spatial',
    status: 'prototype',
    route: '/spatial',
    description: 'Moves memory from screen into world through AR, VR, WebXR, spatial rooms, ritual environments, and immersive replay.',
    inputs: ['scene graphs', 'spatial anchors', 'memory rooms'],
    outputs: ['AR/VR worlds', 'WebXR scenes', 'spatial rituals'],
    dependencies: ['Studio', 'Visuals'],
    ctaLabel: 'View Spatial',
  },
  {
    id: 'privacy',
    title: 'URAI Privacy',
    status: 'live',
    route: '/privacy',
    description: 'The consent and trust layer for user ownership, export control, private-by-design workflows, and feature-gated transparency.',
    inputs: ['consent choices', 'tenant rules', 'export permissions'],
    outputs: ['trust posture', 'privacy controls', 'policy contracts'],
    dependencies: [],
    ctaLabel: 'Read Privacy',
  },
  {
    id: 'admin',
    title: 'URAI Admin',
    status: 'internal',
    route: '/studio/admin',
    description: 'Operates diagnostics, jobs, analytics, dead letters, system health, launch checks, and callable verification.',
    inputs: ['health data', 'events', 'jobs', 'callable tests'],
    outputs: ['diagnostics', 'audit states', 'operator decisions'],
    dependencies: ['Firebase', 'Studio'],
    ctaLabel: 'Admin Status',
  },
  {
    id: 'foundation',
    title: 'URAI Foundation',
    status: 'planned',
    route: '/about',
    description: 'The mission layer for accessibility, mental health, deaf community support, research, governance, and public benefit.',
    inputs: ['mission programs', 'research', 'accessibility requirements'],
    outputs: ['impact programs', 'governance', 'public benefit'],
    dependencies: ['URAI Labs'],
    ctaLabel: 'Explore Foundation',
  },
  {
    id: 'labs',
    title: 'URAI Labs LLC',
    status: 'live',
    route: '/contact',
    description: 'The commercial, partnership, investor, licensing, and product stewardship layer for the URAI ecosystem.',
    inputs: ['partnerships', 'client requests', 'investor interest'],
    outputs: ['deals', 'roadmaps', 'licensing', 'implementation plans'],
    dependencies: ['Studio', 'Foundation'],
    ctaLabel: 'Contact URAI Labs',
  },
];

export const proofPoints = [
  'Core website live',
  'System contracts available',
  'Firebase connected',
  'Privacy contract available',
  'Export formats ready',
  'Studio actions partially enabled',
];
