import { studioModules } from '@/lib/studio/modules';
import { notFound } from 'next/navigation';
export function ModuleOverviewPage({route}:{route:string}){const m=studioModules.find(x=>x.route===route); if(!m) return notFound(); return <div><h1>{m.name}</h1><p>{m.description}</p><ul><li>Status: {m.status}</li><li>Integration: {m.integrationType}</li><li>Health: {m.healthEndpoint??'n/a'}</li><li>Inputs: {m.inputs.join(', ')}</li><li>Outputs: {m.outputs.join(', ')}</li><li>Capabilities: {m.capabilities.join(', ')}</li><li>Fallback: {m.fallbackBehavior}</li></ul></div>}
