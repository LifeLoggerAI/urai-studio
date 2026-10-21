'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createRequire}=require('node:module');
const {createHash}=require('node:crypto');
const {test,after}=require('node:test');
const root=path.resolve(__dirname,'../..');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'patches/braces-3.0.3-provenance.json'),'utf8'));
assert.equal(manifest.advisoryId,'GHSA-vfj7-8cjw-p6xm');assert.equal(manifest.upstreamPackage,'braces');assert.equal(manifest.upstreamVersion,'3.0.3');assert.equal(manifest.upstreamPatchedVersion,null);
assert.equal(manifest.patchSha256,hash(fs.readFileSync(path.join(root,manifest.patchPath))));
assert.equal(manifest.maximumDepth,128);
const packageJson=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
assert.equal(packageJson.pnpm.patchedDependencies['braces@3.0.3'],manifest.patchPath);
const lock=fs.readFileSync(path.join(root,'pnpm-lock.yaml'));
assert.ok(lock.toString('utf8').includes(manifest.upstreamIntegrity));
const studioRequire=createRequire(path.join(root,'apps/studio/package.json'));
const fastGlobPackagePath=studioRequire.resolve('fast-glob/package.json');
const fastGlobPackage=JSON.parse(fs.readFileSync(fastGlobPackagePath,'utf8'));
assert.equal(fastGlobPackage.name,'fast-glob');assert.equal(typeof fastGlobPackage.dependencies.micromatch,'string');
const fastGlobRequire=createRequire(fastGlobPackagePath);
const micromatchPackagePath=fastGlobRequire.resolve('micromatch/package.json');
const micromatchPackage=JSON.parse(fs.readFileSync(micromatchPackagePath,'utf8'));
assert.equal(micromatchPackage.name,'micromatch');assert.equal(typeof micromatchPackage.dependencies.braces,'string');
const micromatchRequire=createRequire(micromatchPackagePath);
const parents=[['fast-glob -> micromatch -> braces',micromatchRequire]];
const actualParentChain={
 fastGlob:{version:fastGlobPackage.version,declaredMicromatch:fastGlobPackage.dependencies.micromatch,packageSha256:hash(fs.readFileSync(fastGlobPackagePath))},
 micromatch:{version:micromatchPackage.version,declaredBraces:micromatchPackage.dependencies.braces,packageSha256:hash(fs.readFileSync(micromatchPackagePath))}
};
const bindings=[];
for(const [name,scoped] of parents){
 const packagePath=scoped.resolve('braces/package.json'),dir=path.dirname(packagePath),pkg=JSON.parse(fs.readFileSync(packagePath,'utf8')),braces=scoped('braces');
 assert.equal(pkg.name,'braces');assert.equal(pkg.version,'3.0.3');
 const runtimeFiles=manifest.files.map(item=>{
  const actual=hash(fs.readFileSync(path.join(dir,item.path)));assert.equal(actual,item.patchedSha256,name+': '+item.path);
  return{path:item.path,sha256:actual};
 });
 bindings.push({consumer:name,packageVersion:pkg.version,entry:path.relative(root,scoped.resolve('braces')),runtimeFiles});
 test(name+': ordinary patterns and literal behavior remain compatible',()=>{
  assert.deepEqual(braces('src/**/*.{js,ts,tsx}'),['src/**/*.(js|ts|tsx)']);
  assert.deepEqual(braces.expand('a/{b,c}/d'),['a/b/d','a/c/d']);assert.deepEqual(braces.expand('file-{1..3}.txt'),['file-1.txt','file-2.txt','file-3.txt']);
  assert.deepEqual(braces.expand('{a,{b,c}}'),['a','b','c']);assert.equal(braces.stringify('a/{b,c}/d'),'a/{b,c}/d');
  assert.deepEqual(braces('\\{a,b\\}'),['{a,b}']);assert.deepEqual(braces('"{a,b}"'),['{a,b}']);
 });
 test(name+': fixed parser nesting boundary is usable',()=>{
  for(const [open,close]of [['{','}'],['(',')']])for(const method of ['parse','compile','expand','stringify'])assert.doesNotThrow(()=>braces[method](open.repeat(128)+'x'+close.repeat(128)));
 });
 test(name+': over-bound input fails explicitly before stack exhaustion',()=>{
  for(const depth of [129,4000])for(const [open,close]of [['{','}'],['(',')']])for(const method of ['parse','compile','expand','stringify'])assert.throws(()=>braces[method](open.repeat(depth)+'x'+close.repeat(depth)),{name:'SyntaxError',message:/maximum depth \(128\)/});
 });
 test(name+': caller options cannot raise the fixed guard',()=>{
  for(const method of ['parse','compile','expand','stringify'])assert.throws(()=>braces[method]('{'.repeat(129)+'x'+'}'.repeat(129),{maxDepth:10000,maxLength:10000}),{name:'SyntaxError',message:/maximum depth \(128\)/});
 });
 test(name+': supplied AST traversal remains bounded',()=>{
  for(const method of ['compile','expand','stringify']){
   const ast={type:'root',nodes:[]};let node=ast;
   for(let depth=0;depth<4000;depth++){const child={type:'paren',parent:node,nodes:[]};node.nodes.push(child);node=child;}
   node.nodes.push({type:'text',value:'x'});assert.throws(()=>braces[method](ast),{name:'SyntaxError',message:/maximum depth \(128\)/});
  }
 });
}
test('actual micromatch consumer retains brace glob API behavior',()=>{
 const micromatch=fastGlobRequire('micromatch');assert.deepEqual(micromatch(['a.js','b.ts','c.txt'],'*.{js,ts}'),['a.js','b.ts']);
});
test('actual fast-glob consumer retains filesystem glob API behavior',()=>{
 const os=require('node:os'),directory=fs.mkdtempSync(path.join(os.tmpdir(),'urai-studio-glob-'));
 try{for(const file of ['a.js','b.ts','c.txt'])fs.writeFileSync(path.join(directory,file),'fixture');
  const fastGlob=studioRequire('fast-glob');assert.deepEqual(fastGlob.sync('*.{js,ts}',{cwd:directory,onlyFiles:true}).sort(),['a.js','b.ts']);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
after(()=>{
 const receipt={schemaVersion:'urai-studio-braces-installed-binding-v1',sourceSha:process.env.EXACT_SOURCE_SHA,workflowRunId:process.env.GITHUB_RUN_ID,advisoryId:manifest.advisoryId,upstreamVersion:manifest.upstreamVersion,upstreamIntegrity:manifest.upstreamIntegrity,patchSha256:manifest.patchSha256,lockSha256:{pnpm:hash(lock),npmFunctions:hash(fs.readFileSync(path.join(root,'functions/package-lock.json')))},actualParentChain,actualConsumerBindings:bindings,installedBodyVerified:true,behaviorResult:'REFER_TO_EXACT_NODE_TEST_STEP_RESULT',rawUpstreamAdvisoryRetained:true,upstreamFixed:false,productionAcceptance:false};
 fs.mkdirSync(path.join(root,'dependency-evidence'),{recursive:true});fs.writeFileSync(path.join(root,'dependency-evidence/braces-installed-runtime.json'),JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify(receipt));
});
