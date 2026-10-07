
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const checker=fileURLToPath(new URL('../studio-offline-dependency-check.mjs',import.meta.url));
function run({version='1.0.0',events=[{introduced:'0'},{fixed:'1.0.1'}],severity='HIGH',withdrawn=false,extra=[],ranges=true,pnpmEmpty=false,npmEmpty=false}={}){
 const dir=mkdtempSync(join(tmpdir(),'studio-offline-advisory-'));
 try{
  const lock=join(dir,'pnpm.yaml'),npm=join(dir,'npm.json'),catalog=join(dir,'public.jsonl'),out=join(dir,'report.json');
  writeFileSync(lock,"lockfileVersion: '9.0'\npackages:\n  '@fixture/example@"+version+"':\n    resolution:\n      integrity: fixture\n    peerDependencies:\n      unrelated: '^4.0.0'\nsnapshots:\n  '@fixture/example@"+version+"(unrelated@4.0.0)':\n    dependencies: {}\n");
  if(pnpmEmpty) writeFileSync(lock,"lockfileVersion: '9.0'\nimporters:\n  .: {}\n");
  writeFileSync(npm,JSON.stringify({lockfileVersion:3,packages:npmEmpty ? {} : {'':{name:'local-fixture'},'node_modules/parent/node_modules/@fixture/example':{version}}}));
  const record={id:'GHSA-fixture-range-boundaries',database_specific:{severity},affected:[{package:{ecosystem:'npm',name:'@fixture/example'},ranges:[{type:ranges?'SEMVER':'GIT',events}]}],...(withdrawn?{withdrawn:'2026-10-07T00:00:00Z'}:{})};
  writeFileSync(catalog,JSON.stringify(record)+'\n');
  const child=spawnSync(process.execPath,[checker,'--pnpm-lock='+lock,'--npm-lock='+npm,'--catalog='+catalog,'--output='+out,'--source-sha=854477d80b1a7aa718edb60d1ed4c1cf22dbed9d',...extra],{encoding:'utf8'});
  let report;try{report=JSON.parse(readFileSync(out,'utf8'));}catch{}
  return{status:child.status,stderr:child.stderr,report};
 }finally{rmSync(dir,{recursive:true,force:true});}
}
test('scoped quoted pnpm keys and nested npm paths count actual package occurrences, excluding snapshots',()=>{const r=run();assert.equal(r.status,1);assert.equal(r.report.resolvedLockOccurrences,2);assert.equal(r.report.uniqueResolvedPackages,1);assert.equal(r.report.severityCounts.HIGH,2);});
test('fixed boundary excludes the fixed version from vulnerable interval',()=>{const r=run({version:'1.0.1'});assert.equal(r.status,0);assert.deepEqual(r.report.findings,[]);});
test('last_affected boundary is inclusive',()=>{const r=run({events:[{introduced:'1.0.0'},{last_affected:'1.0.0'}]});assert.equal(r.status,1);assert.equal(r.report.findings.length,2);});
test('later reintroduced interval remains vulnerable',()=>{const r=run({version:'2.0.0',events:[{introduced:'0'},{fixed:'1.0.0'},{introduced:'2.0.0'}]});assert.equal(r.status,1);assert.equal(r.report.findings.length,2);});
test('withdrawn records cannot create active findings',()=>{const r=run({withdrawn:true});assert.equal(r.status,0);assert.equal(r.report.findings.length,0);});
test('unknown severity on a matching record fails the gate',()=>{const r=run({severity:'UNKNOWN'});assert.equal(r.status,1);assert.equal(r.report.severityCounts.UNKNOWN,2);});
test('unsupported npm advisory range fails closed without a clean report',()=>{const r=run({ranges:false});assert.notEqual(r.status,0);assert.equal(r.report,undefined);assert.match(r.stderr,/unmatchable npm advisory range/);assert.match(r.stderr,/GHSA-fixture-range-boundaries/);assert.match(r.stderr,/@fixture\/example/);});
test('diagnostic flag true records findings without acceptance, while false still fails',()=>{const diagnostic=run({extra:['--diagnostic-only=true']});assert.equal(diagnostic.status,0);assert.equal(diagnostic.report.findings.length,2);const accepted=run({extra:['--diagnostic-only=false']});assert.equal(accepted.status,1);});
test('unknown diagnostic flag is refused',()=>{const r=run({extra:['--diagnostic-only=yes']});assert.notEqual(r.status,0);assert.equal(r.report,undefined);});

test('mixed-case known severity is normalized and still blocks admission',()=>{const r=run({severity:' High '});assert.equal(r.status,1);assert.equal(r.report.severityCounts.HIGH,2);});
test('unknown string and non-string severity fail closed',()=>{for(const severity of ['SAFE',{value:'LOW'},12,null]){const r=run({severity});assert.equal(r.status,1);assert.equal(r.report.severityCounts.UNKNOWN,2);}});
test('both lock scopes must contain resolved packages',()=>{for(const empty of [{pnpmEmpty:true},{npmEmpty:true}]){const r=run(empty);assert.notEqual(r.status,0);assert.equal(r.report,undefined);assert.match(r.stderr,/resolved packages required/);}});
test('unknown and duplicate CLI arguments are refused',()=>{for(const extra of [['--unrecognized=true'],['--diagnostic-only=true','--diagnostic-only=false']]){const r=run({extra});assert.notEqual(r.status,0);assert.equal(r.report,undefined);assert.match(r.stderr,/unknown argument|duplicate argument/);}});
