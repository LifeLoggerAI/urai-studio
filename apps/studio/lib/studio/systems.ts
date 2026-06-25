export type SystemStatus = 'Live' | 'Demo' | 'Prototype' | 'Internal' | 'Planned';
export type SystemVisibility = 'public' | 'internal';

export interface SystemDef {
  id: string;
  name: string;
  slug: string;
  status: SystemStatus;
  description: string;
  capabilities: string[];
  dependencies: string[];
  route: string;
  cta: string;
  visibility: SystemVisibility;
  versionLane: string;
  relatedModule: string;
}

export const systems: SystemDef[] = [
  { id: 'studio', name: 'URAI Studio', slug: 'studio', status: 'Live', description: 'Cinematic life interface and creative control surface.', capabilities: ['module orchestration', 'life map storytelling'], dependencies: ['privacy', 'admin', 'asset-factory', 'spatial'], route: '/studio', cta: 'Explore Studio', visibility: 'public', versionLane: 'v1', relatedModule: 'studio' },
  { id: 'asset-factory', name: 'URAI Asset Factory', slug: 'asset-factory', status: 'Internal', description: 'Asset generation orchestration bridge for studio modules.', capabilities: ['job intake', 'manifest bridge'], dependencies: ['studio', 'content'], route: '/asset-factory', cta: 'Open Asset Factory', visibility: 'public', versionLane: 'v1', relatedModule: 'asset-factory' },
  { id: 'motion', name: 'URAI Motion', slug: 'motion', status: 'Demo', description: 'Motion language for memory bloom and scroll transitions.', capabilities: ['timeline animation', 'export motion packs'], dependencies: ['visuals'], route: '/motion', cta: 'View Motion', visibility: 'public', versionLane: 'v1', relatedModule: 'motion' },
  { id: 'cinema', name: 'URAI Cinema', slug: 'cinema', status: 'Demo', description: 'Cinematic replay and weekly scroll films.', capabilities: ['replay storyboards'], dependencies: ['motion', 'music', 'asset-factory'], route: '/cinema', cta: 'View Cinema', visibility: 'public', versionLane: 'v1', relatedModule: 'cinema' },
  { id: 'music', name: 'URAI Music', slug: 'music', status: 'Prototype', description: 'Narrator tone and ambient scoring system.', capabilities: ['voice palette', 'ambient identity'], dependencies: ['cinema'], route: '/music', cta: 'View Music', visibility: 'public', versionLane: 'v1', relatedModule: 'music' },
  { id: 'visuals', name: 'URAI Visuals', slug: 'visuals', status: 'Live', description: 'Symbolic visual system, sky layers, and export packs.', capabilities: ['brand lattice', 'asset exports'], dependencies: ['studio', 'asset-factory'], route: '/visuals', cta: 'View Visuals', visibility: 'public', versionLane: 'v1', relatedModule: 'visuals' },
  { id: 'spatial', name: 'URAI Spatial', slug: 'spatial', status: 'Live', description: 'Public spatial route spine and memory-world launch surface.', capabilities: ['public route spine', 'static export', 'live route smoke'], dependencies: ['studio', 'privacy', 'asset-factory'], route: '/spatial', cta: 'View Spatial', visibility: 'public', versionLane: 'v1', relatedModule: 'spatial' },
  { id: 'privacy', name: 'URAI Privacy', slug: 'privacy', status: 'Live', description: 'Private by design controls and consent tiers.', capabilities: ['consent controls', 'export/delete posture'], dependencies: [], route: '/privacy', cta: 'Read Privacy', visibility: 'public', versionLane: 'v1', relatedModule: 'privacy' },
  { id: 'admin', name: 'URAI Admin', slug: 'admin', status: 'Internal', description: 'Operational controls and governance.', capabilities: ['ops controls', 'release gates'], dependencies: ['privacy', 'analytics'], route: '/admin', cta: 'Admin Status', visibility: 'public', versionLane: 'v1', relatedModule: 'admin' },
  { id: 'analytics', name: 'URAI Analytics', slug: 'analytics', status: 'Internal', description: 'Product, route, and system health analytics layer.', capabilities: ['live smoke metrics', 'route evidence', 'event telemetry'], dependencies: ['spatial', 'admin'], route: '/analytics', cta: 'Analytics Status', visibility: 'public', versionLane: 'v1', relatedModule: 'analytics' },
  { id: 'jobs', name: 'URAI Jobs Runtime', slug: 'jobs', status: 'Internal', description: 'Worker and queue runtime for asynchronous system tasks.', capabilities: ['workers', 'queues', 'dead letter review'], dependencies: ['admin', 'analytics'], route: '/jobs', cta: 'Jobs Runtime', visibility: 'public', versionLane: 'v1', relatedModule: 'jobs' },
  { id: 'content', name: 'URAI Content', slug: 'content', status: 'Internal', description: 'Content pipeline, seed data, provider evidence, and public copy checks.', capabilities: ['content validation', 'seed checks', 'provider evidence'], dependencies: ['studio', 'asset-factory'], route: '/content', cta: 'Content Pipeline', visibility: 'public', versionLane: 'v1', relatedModule: 'content' },
  { id: 'marketing', name: 'URAI Marketing', slug: 'marketing', status: 'Demo', description: 'Public marketing, demo, and launch funnel surfaces.', capabilities: ['public pages', 'demo page', 'launch funnel'], dependencies: ['privacy', 'analytics'], route: '/marketing', cta: 'Marketing Status', visibility: 'public', versionLane: 'v1', relatedModule: 'marketing' },
  { id: 'investors', name: 'URAI Investors', slug: 'investors', status: 'Internal', description: 'Investor-facing narrative, evidence, and company materials.', capabilities: ['investor materials', 'launch evidence'], dependencies: ['labs', 'analytics'], route: '/investors', cta: 'Investor Materials', visibility: 'public', versionLane: 'v1', relatedModule: 'investors' },
  { id: 'b2b-portal', name: 'URAI B2B Portal', slug: 'b2b-portal', status: 'Internal', description: 'Partner and organization-facing portal surface.', capabilities: ['partner access', 'organization handoff'], dependencies: ['admin', 'analytics', 'privacy'], route: '/b2b', cta: 'B2B Portal', visibility: 'public', versionLane: 'v1', relatedModule: 'b2b-portal' },
  { id: 'foundation', name: 'URAI Foundation', slug: 'foundation', status: 'Planned', description: 'Research, governance, and long-horizon systems.', capabilities: ['roadmap strategy'], dependencies: ['labs'], route: '/systems', cta: 'Explore Foundation', visibility: 'public', versionLane: 'v1', relatedModule: 'foundation' },
  { id: 'labs', name: 'URAI Labs LLC', slug: 'labs', status: 'Live', description: 'Company and product stewardship.', capabilities: ['product stewardship'], dependencies: ['studio'], route: '/contact', cta: 'Contact URAI Labs', visibility: 'public', versionLane: 'v1', relatedModule: 'labs' },
];

export const systemBySlug: Record<string, SystemDef> = Object.fromEntries(systems.map((system) => [system.slug, system]));
export const systemByRoute: Record<string, SystemDef> = Object.fromEntries(systems.map((system) => [system.route, system]));

export function publicSystems(): SystemDef[] {
  return systems.filter((system) => system.visibility === 'public');
}
