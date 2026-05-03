import { studioModules } from './modules';
export function statusWarnings(){
  const warnings:string[]=[];
  if(!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) warnings.push('firebase_project_unconfigured');
  if(!process.env.NEXT_PUBLIC_ASSET_FACTORY_URL && !process.env.ASSET_FACTORY_INTERNAL_URL) warnings.push('asset_factory_unconfigured');
  return warnings;
}
export const moduleStatuses=()=>studioModules.map(m=>({id:m.id,status:m.status,route:m.route}));
