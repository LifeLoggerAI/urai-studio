export const URAI_STUDIO_DOMAIN = 'uraistudio.com';
export const URAI_STUDIO_SYSTEM = 'URAI Studio';
export const URAI_STUDIO_ACCESS_CLASS = 'public';

export const URAI_STUDIO_BOUNDARY_RULE =
  'uraistudio.com is the URAI Studio commercial creative/media arm: AI campaigns, cinematic ads, viral shorts, music visuals, product launches, and brand worlds.';

export const URAI_STUDIO_PUBLIC_ROUTES = [
  { path: '/', label: 'Home', purpose: 'Studio homepage and client conversion entry', primary: true },
  { path: '/start', label: 'Start', purpose: 'High-intent studio funnel and project path', primary: true },
  { path: '/work', label: 'Work', purpose: 'Portfolio, showreel, and proof surface', primary: true },
  { path: '/services', label: 'Services', purpose: 'Studio service categories', primary: true },
  { path: '/packages', label: 'Packages', purpose: 'Commercial packages and retainers', primary: true },
  { path: '/case-studies', label: 'Case Studies', purpose: 'Verified performance and project proof' },
  { path: '/submit-project', label: 'Submit Project', purpose: 'Project intake form', primary: true },
  { path: '/contact', label: 'Contact', purpose: 'General studio contact' },
  { path: '/privacy', label: 'Privacy', purpose: 'Studio-specific privacy path' },
  { path: '/terms', label: 'Terms', purpose: 'Studio terms and usage-rights notes' },
];

export const URAI_STUDIO_HERO = {
  eyebrow: 'URAI Studio',
  headline: 'AI campaigns built to stop the scroll.',
  subheadline:
    'URAI Studio creates cinematic AI videos, brand worlds, music visuals, launch campaigns, and social content systems.',
  primaryCta: 'Start a Project',
  secondaryCta: 'Watch the Reel',
};

export const URAI_STUDIO_SERVICES = [
  'Viral AI shorts',
  'Cinematic AI ads',
  'Music visuals',
  'Launch campaigns',
  'Product visuals',
  'Brand worlds',
  'Social content systems',
  'AI character campaigns',
];

export const URAI_STUDIO_PACKAGES = [
  'Starter Sprint',
  'Growth Sprint',
  'Launch Campaign',
  'Monthly Retainer',
  'Custom Brand World',
];

export const URAI_STUDIO_PROJECT_FORM = {
  formType: 'project',
  destinationCollection: 'projectRequests',
  sourceDomain: URAI_STUDIO_DOMAIN,
  requiredFields: ['name', 'email', 'companyOrBrand', 'projectType', 'message'],
  optionalFields: ['websiteOrSocial', 'budgetRange', 'timeline', 'platforms'],
};

export const URAI_STUDIO_ANALYTICS_EVENTS = [
  'urai_studio_hero_cta_click',
  'urai_studio_reel_click',
  'urai_studio_package_click',
  'urai_studio_project_submit',
  'urai_studio_contact_click',
  'urai_studio_privacy_click',
];

export const URAI_STUDIO_PRIVACY_LINKS = {
  ecosystemPrivacyCenter: 'https://uraiprivacy.com',
  studioPrivacy: '/privacy',
};

export function getUraiStudioLaunchChecklist() {
  return [
    'Studio/client conversion boundary preserved',
    'No app/investor/general Labs confusion above the fold',
    'Services, packages, proof, and intake flows are visible',
    'Project form captures attribution',
    'No unsupported guaranteed-views or guaranteed-revenue claims',
    'Privacy links visible on every public route',
    'Metadata and OpenGraph complete',
    'Mobile CTA visibility reviewed',
    'No placeholder clients, logos, debug text, or fake proof',
  ];
}
