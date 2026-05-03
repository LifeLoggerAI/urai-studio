const t = 3000;
async function ping(path:string){const base=process.env.ASSET_FACTORY_INTERNAL_URL||process.env.NEXT_PUBLIC_ASSET_FACTORY_URL; if(!base) return {ok:false,status:'disconnected',reason:'url_unconfigured'}; try{const c=new AbortController(); const to=setTimeout(()=>c.abort(),t); const r=await fetch(`${base}${path}`,{signal:c.signal}); clearTimeout(to); const j=await r.json().catch(()=>null); return {ok:r.ok,status:r.ok?'live':'fallback',data:j,http:r.status};}catch(e){return {ok:false,status:'disconnected',reason:String(e)}}}
export const getAssetFactoryHealth=()=>ping('/api/system/health');
export const getAssetFactoryManifest=()=>ping('/api/system/manifest');
