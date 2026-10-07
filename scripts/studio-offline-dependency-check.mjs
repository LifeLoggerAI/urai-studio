
import { readFile, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const semver = createRequire(import.meta.url)('semver');
const args = {};
const allowed = new Set(['--pnpm-lock','--npm-lock','--catalog','--output','--source-sha','--diagnostic-only']);
for (const arg of process.argv.slice(2)) {
  const at = arg.indexOf('='); if (at < 1) throw new Error('named arguments required');
  const key=arg.slice(0,at); if (!allowed.has(key)) throw new Error('unknown argument '+key);
  const name=key.slice(2); if (Object.hasOwn(args,name)) throw new Error('duplicate argument '+key);
  args[name]=arg.slice(at+1);
}
for (const key of ['pnpm-lock','npm-lock','catalog','output','source-sha']) if (!args[key]) throw new Error('missing ' + key);
if (!/^[0-9a-f]{40}$/.test(args['source-sha'])) throw new Error('exact source SHA required');
if (Object.hasOwn(args,'diagnostic-only') && !['true','false'].includes(args['diagnostic-only'])) throw new Error('diagnostic flag must be true or false');
const diagnosticOnly = args['diagnostic-only'] === 'true';
const packages = [];
let active = false;
for (const line of (await readFile(args['pnpm-lock'],'utf8')).split('\n')) {
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
const npm = JSON.parse(await readFile(args['npm-lock'],'utf8'));
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
function affected(version, item) {
  if (item.versions?.includes(version)) return true;
  let supported = false;
  for (const range of item.ranges || []) {
    if (range.type !== 'SEMVER') continue;
    supported = true; let start = null;
    for (const event of range.events || []) {
      if ('introduced' in event) {
        start = event.introduced; if (start !== '0' && !semver.valid(start)) throw new Error('invalid introduced boundary');
      } else if ('fixed' in event || 'last_affected' in event || 'limit' in event) {
        const end = event.fixed || event.last_affected || event.limit;
        if (!semver.valid(end) || start === null) throw new Error('invalid closed range');
        const afterStart = start === '0' || semver.gte(version,start);
        if (afterStart && (event.last_affected ? semver.lte(version,end) : semver.lt(version,end))) return true;
        start = null;
      } else throw new Error('unknown vulnerability range event');
    }
    if (start !== null && (start === '0' || semver.gte(version,start))) return true;
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
    if (affected(p.version,item)) findings.push({...p,id:record.id,severity,summary:record.summary,fixedVersions:(item.ranges||[]).flatMap(r=>(r.events||[]).filter(e=>e.fixed).map(e=>e.fixed)),references:record.references});
  }
}
if (!catalogRecords) throw new Error('public advisory catalog required');
const severityCounts = findings.reduce((all,f)=>({...all,[f.severity]:(all[f.severity]||0)+1}),{});
const report = {schemaVersion:'urai-studio-offline-dependency-check-v1',sourceSha:args['source-sha'],measurement:'LOCAL_RESOLVED_LOCK_MATCH_AGAINST_PUBLIC_OSV_NPM_CATALOG',privateGraphTransmitted:false,catalogSha256:hash.digest('hex'),catalogRecords,resolvedLockOccurrences:packages.length,scopeOccurrences:{pnpm:pnpmOccurrences,npmFunctions:npmOccurrences},uniqueResolvedPackages:new Set(packages.map(p=>p.name+'@'+p.version)).size,matchedPublicAdvisoryRecords:matchedRecords.length,severityCounts,findings};
await writeFile(args.output,JSON.stringify(report,null,2)+'\n');
await writeFile(args.output+'.public-records.json',JSON.stringify(matchedRecords,null,2)+'\n');
console.log(JSON.stringify({sourceSha:report.sourceSha,catalogRecords,resolvedLockOccurrences:packages.length,severityCounts}));
if (!diagnosticOnly && findings.some(f=>['HIGH','CRITICAL','UNKNOWN'].includes(f.severity))) process.exitCode=1;
