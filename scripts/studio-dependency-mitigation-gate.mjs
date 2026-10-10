import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const blocking = new Set(['HIGH','CRITICAL','UNKNOWN']);

export async function verifyDependencyMitigation({report,runtimeReceipt,provenance,sourceSha,workflowRunId,patchBytes}) {
  if (!/^[0-9a-f]{40}$/.test(sourceSha)) throw new Error('exact source SHA required');
  if (!/^[0-9]+$/.test(String(workflowRunId))) throw new Error('workflow run id required');
  if (report?.schemaVersion !== 'urai-studio-offline-dependency-check-v1') throw new Error('unsupported dependency report');
  if (report.sourceSha !== sourceSha || report.lockSourceSha !== sourceSha) throw new Error('dependency report source mismatch');
  if (runtimeReceipt?.schemaVersion !== 'urai-studio-braces-installed-binding-v1') throw new Error('unsupported installed mitigation receipt');
  if (runtimeReceipt.sourceSha !== sourceSha) throw new Error('mitigation receipt source mismatch');
  if (String(runtimeReceipt.workflowRunId) !== String(workflowRunId)) throw new Error('mitigation receipt run mismatch');
  if (runtimeReceipt.installedBodyVerified !== true || runtimeReceipt.rawUpstreamAdvisoryRetained !== true || runtimeReceipt.upstreamFixed !== false) throw new Error('installed mitigation proof incomplete');
  if (provenance?.schemaVersion !== 'urai-studio-braces-local-mitigation-v1') throw new Error('unsupported mitigation provenance');
  if (provenance.advisoryId !== 'GHSA-vfj7-8cjw-p6xm' || provenance.upstreamPackage !== 'braces' || provenance.upstreamVersion !== '3.0.3') throw new Error('unexpected mitigation identity');
  if (runtimeReceipt.advisoryId !== provenance.advisoryId || runtimeReceipt.upstreamVersion !== provenance.upstreamVersion) throw new Error('mitigation receipt identity mismatch');
  const patchSha256=createHash('sha256').update(patchBytes).digest('hex');
  if (patchSha256 !== provenance.patchSha256 || runtimeReceipt.patchSha256 !== provenance.patchSha256) throw new Error('mitigation patch hash mismatch');
  const findings=Array.isArray(report.findings)?report.findings:[];
  const accepted=[], unmitigated=[];
  for (const finding of findings) {
    const exact = finding?.id===provenance.advisoryId && finding?.name===provenance.upstreamPackage && finding?.version===provenance.upstreamVersion;
    if (exact) accepted.push(finding);
    else if (blocking.has(String(finding?.severity||'UNKNOWN').toUpperCase())) unmitigated.push(finding);
  }
  if (!accepted.length) throw new Error('expected patched braces advisory absent from raw findings');
  if (unmitigated.length) throw new Error('unmitigated blocking dependency findings remain: '+unmitigated.map(x=>String(x.id||x.name||'unknown')).join(','));
  return {schemaVersion:'urai-studio-local-dependency-mitigation-acceptance-v1',sourceSha,workflowRunId:String(workflowRunId),rawUpstreamFindingsRetained:true,acceptedLocalMitigation:{advisoryId:provenance.advisoryId,package:provenance.upstreamPackage,version:provenance.upstreamVersion,patchSha256,installedBodyVerified:true,occurrenceCount:accepted.length},unresolvedBlockingFindingCount:0,productionAcceptance:false};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args={};
  for (const arg of process.argv.slice(2)) { const at=arg.indexOf('='); if(at<1) throw new Error('named arguments required'); args[arg.slice(0,at)]=arg.slice(at+1); }
  for (const key of ['--report','--runtime-receipt','--provenance','--output','--source-sha','--workflow-run-id']) if(!args[key]) throw new Error('missing '+key);
  const provenance=JSON.parse(await readFile(args['--provenance'],'utf8'));
  const [report,runtimeReceipt,patchBytes]=await Promise.all([readFile(args['--report'],'utf8').then(JSON.parse),readFile(args['--runtime-receipt'],'utf8').then(JSON.parse),readFile(provenance.patchPath)]);
  const receipt=await verifyDependencyMitigation({report,runtimeReceipt,provenance,sourceSha:args['--source-sha'],workflowRunId:args['--workflow-run-id'],patchBytes});
  await writeFile(args['--output'],JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify(receipt));
}
