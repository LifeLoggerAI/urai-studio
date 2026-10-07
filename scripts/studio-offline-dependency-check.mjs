
import { readFile, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const semver = createRequire(import.meta.url)('semver');
const args = {};
const allowed = new Set(['--pnpm-lock','--npm-lock','--catalog','--output','--source-sha','--diagnostic-only','--lock-source-sha']);
for (const arg of process.argv.slice(2)) {
  const at = arg.indexOf('='); if (at < 1) throw new Error('named arguments required');
  const key=arg.slice(0,at); if (!allowed.has(key)) throw new Error('unknown argument '+key);
  const name=key.slice(2); if (Object.hasOwn(args,name)) throw new Error('duplicate argument '+key);
  args[name]=arg.slice(at+1);
}
for (const key of ['pnpm-lock','npm-lock','catalog','output','source-sha']) if (!args[key]) throw new Error('missing ' + key);
if (!/^[0-9a-f]{40}$/.test(args['source-sha'])) throw new Error('exact source SHA required');
if (Object.hasOwn(args,'diagnostic-only') && !['true','false'].includes(args['diagnostic-only'])) throw new Error('diagnostic flag must be true or false');
if (args['lock-source-sha'] && !/^[0-9a-f]{40}$/.test(args['lock-source-sha'])) throw new Error('exact lock source SHA required');
const diagnosticOnly = args['diagnostic-only'] === 'true';
const packages = [];
let active = false;
const pnpmBytes=await readFile(args['pnpm-lock']);
for (const line of pnpmBytes.toString('utf8').split('\n')) {
  if (line === 'packages:') { active = true; continue; }
  if (active && /^\S/.test(line)) active = false;
  if (!active) continue;
  const match = /^ {2}(\S.+):\s*$/.exec(line); if (!match) continue;
  const key = match[1].replace(/^['"]|['"]$/g,'');
  const separator = key.lastIndexOf('@'); if (separator < 1) throw new Error('unsupported lock key ' + key);
  const name = key.slice(0,separator), version = key.slice(separator+1);
  if (!semver.valid(version)) throw new Error('unsupported resolved version ' + key);
  packages.push({lock:'pnpm',name,version,key});
}
const pnpmOccurrences=packages.length;
if (!pnpmOccurrences) throw new Error('pnpm resolved packages required');
const npmBytes=await readFile(args['npm-lock']);
const npm = JSON.parse(npmBytes.toString('utf8'));
if (!npm.packages || ![2,3].includes(npm.lockfileVersion)) throw new Error('supported npm lock required');
for (const [key,value] of Object.entries(npm.packages)) {
  if (!key.includes('node_modules/')) continue;
  const name = value.name || key.split('node_modules/').at(-1);
  if (!semver.valid(value.version)) throw new Error('unsupported npm resolved version ' + key);
  packages.push({lock:'npm-functions',name,version:value.version,key});
}
const npmOccurrences=packages.length-pnpmOccurrences;
if (!npmOccurrences) throw new Error('npm Functions resolved packages required');
const names = new Set(packages.map(p=>p.name));
function boundary(value, rangeType) {
  if (typeof value !== 'string') throw new Error('invalid advisory boundary');
  const complete = semver.valid(value);
  if (complete) return complete;
  // npm ECOSYSTEM records may use numeric shorthand such as GHSA-3h52-269p-cp9r's 13.0.
  // Only an entire major or major.minor value is padded; arbitrary strings are not coerced.
  if (rangeType === 'ECOSYSTEM' && /^(0|[1-9]\d*)(?:\.(0|[1-9]\d*))?$/.test(value)) {
    const parts=value.split('.'); while (parts.length<3) parts.push('0');
    const padded=semver.valid(parts.join('.')); if (padded) return padded;
  }
  throw new Error('invalid advisory boundary');
}
function affected(version, item) {
  if (item.versions?.includes(version)) return true;
  let supported = false;
  for (const range of item.ranges || []) {
    if (!['SEMVER','ECOSYSTEM'].includes(range.type)) throw new Error('unmatchable npm advisory range');
    supported = true;
    if (!Array.isArray(range.events) || !range.events.length) throw new Error('advisory events required');
    const events=range.events.map((event)=>{
      const keys=Object.keys(event);
      if (keys.length!==1 || !['introduced','fixed','last_affected','limit'].includes(keys[0])) throw new Error('unknown vulnerability range event');
      const kind=keys[0], raw=event[kind];
      return {kind,value:kind==='introduced'&&raw==='0'?'0':kind==='limit'&&raw==='*'?'*':boundary(raw,range.type)};
    });
    // OSV BeforeLimits is evaluated separately: any cap above the version admits evaluation.
    const limits=events.filter(e=>e.kind==='limit');
    if (limits.length && !limits.some(e=>e.value==='*'||semver.lt(version,e.value))) continue;
    const timeline=events.filter(e=>e.kind!=='limit').sort((a,b)=>
      a.kind==='introduced'&&a.value==='0' ? b.kind==='introduced'&&b.value==='0'?0:-1 :
      b.kind==='introduced'&&b.value==='0' ? 1 : semver.compare(a.value,b.value));
    if (!timeline.some(e=>e.kind==='introduced')) throw new Error('introduced event required');
    let vulnerable=false;
    for (const event of timeline) {
      if (event.kind==='introduced' && (event.value==='0'||semver.gte(version,event.value))) vulnerable=true;
      else if (event.kind==='fixed' && semver.gte(version,event.value)) vulnerable=false;
      else if (event.kind==='last_affected' && semver.gt(version,event.value)) vulnerable=false;
    }
    if (vulnerable) return true;
  }
  if (!supported && !(item.versions?.length)) throw new Error('unmatchable npm advisory range');
  return false;
}
const findings = [], matchedRecords = [], hash = createHash('sha256'); let catalogRecords = 0;
for await (const line of createInterface({input:createReadStream(args.catalog),crlfDelay:Infinity})) {
  hash.update(line+'\n'); if (!line) continue; const record = JSON.parse(line); catalogRecords++;
  if (record.withdrawn) continue;
  const relevant = (record.affected || []).filter(a=>a.package?.ecosystem==='npm' && names.has(a.package.name));
  if (!relevant.length) continue;
  matchedRecords.push(record);
  const rawSeverity=record.database_specific?.severity;
  const normalizedSeverity=typeof rawSeverity==='string' ? rawSeverity.trim().toUpperCase() : 'UNKNOWN';
  const severity=['LOW','MODERATE','MEDIUM','HIGH','CRITICAL'].includes(normalizedSeverity)
    ? normalizedSeverity==='MEDIUM' ? 'MODERATE' : normalizedSeverity : 'UNKNOWN';
  for (const item of relevant) for (const p of packages.filter(p=>p.name===item.package.name)) {
    let isAffected;
    try { isAffected = affected(p.version,item); }
    catch (error) {
      const context=JSON.stringify({advisoryId:record.id,package:item.package.name,ranges:item.ranges,versions:item.versions});
      throw new Error(error.message+'; public advisory context '+context.slice(0,8192));
    }
    if (isAffected) findings.push({...p,id:record.id,severity,summary:record.summary,fixedVersions:(item.ranges||[]).flatMap(r=>(r.events||[]).filter(e=>e.fixed).map(e=>e.fixed)),references:record.references});
  }
}
if (!catalogRecords) throw new Error('public advisory catalog required');
const severityCounts = findings.reduce((all,f)=>({...all,[f.severity]:(all[f.severity]||0)+1}),{});
const report = {schemaVersion:'urai-studio-offline-dependency-check-v1',sourceSha:args['source-sha'],lockSourceSha:args['lock-source-sha']||args['source-sha'],lockSha256:{pnpm:createHash('sha256').update(pnpmBytes).digest('hex'),npmFunctions:createHash('sha256').update(npmBytes).digest('hex')},measurement:'LOCAL_RESOLVED_LOCK_MATCH_AGAINST_PUBLIC_OSV_NPM_CATALOG',privateGraphTransmitted:false,catalogSha256:hash.digest('hex'),catalogRecords,resolvedLockOccurrences:packages.length,scopeOccurrences:{pnpm:pnpmOccurrences,npmFunctions:npmOccurrences},uniqueResolvedPackages:new Set(packages.map(p=>p.name+'@'+p.version)).size,matchedPublicAdvisoryRecords:matchedRecords.length,severityCounts,findings};
await writeFile(args.output,JSON.stringify(report,null,2)+'\n');
await writeFile(args.output+'.public-records.json',JSON.stringify(matchedRecords,null,2)+'\n');
console.log(JSON.stringify({sourceSha:report.sourceSha,catalogRecords,resolvedLockOccurrences:packages.length,severityCounts}));
if (!diagnosticOnly && findings.some(f=>['HIGH','CRITICAL','UNKNOWN'].includes(f.severity))) process.exitCode=1;
