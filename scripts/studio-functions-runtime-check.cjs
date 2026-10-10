const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createRequire}=require('node:module');
const {createHash}=require('node:crypto');
const functionsRoot=path.resolve('functions');
const functionsRequire=createRequire(path.join(functionsRoot,'package.json'));
const sha=process.env.EXACT_SOURCE_SHA;
assert.match(sha||'',/^[0-9a-f]{40}$/);
const modules={};
for(const parent of ['gaxios','google-gax','teeny-request']){
  const entry=functionsRequire.resolve(parent), scoped=createRequire(entry),uuid=scoped('uuid');
  const id=uuid.v4();assert.equal(uuid.validate(id),true);assert.equal(uuid.version(id),4);
  let dir=path.dirname(scoped.resolve('uuid')), manifest,manifestPath;
  for(let depth=0;depth<8;depth++){
    const target=path.join(dir,'package.json');
    if(fs.existsSync(target)){const data=JSON.parse(fs.readFileSync(target,'utf8'));if(data.name==='uuid'){manifest=data;manifestPath=target;break;}}
    const above=path.dirname(dir);if(above===dir)break;dir=above;
  }
  assert.equal(manifest?.version,'11.1.1');
  modules[parent]={uuidVersion:manifest.version,entry:path.relative(functionsRoot,scoped.resolve('uuid')),packageSha256:createHash('sha256').update(fs.readFileSync(manifestPath)).digest('hex')};
}
const functionsExports=require(path.join(functionsRoot,'lib/index.js'));
for(const name of ['bootstrapOwner','createJob','approvePublish','listUsers','updateUserRole','setUserDisabledStatus','ping','createStudioProject','getStudioDashboard'])assert.equal(typeof functionsExports[name],'function',name);
const receipt={schemaVersion:'urai-studio-npm-functions-runtime-check-v1',sourceSha:sha,workflowRunId:process.env.GITHUB_RUN_ID,nodeVersion:process.version,measurement:'CLEAN_NPM_LOCK_COMPILATION_AND_LOCAL_SDK_MODULE_LINKAGE',uuidParentBindings:modules,verifiedExports:Object.keys(functionsExports).sort(),liveProviderAcceptance:false,productionAcceptance:false};
fs.mkdirSync('dependency-evidence',{recursive:true});fs.writeFileSync('dependency-evidence/npm-functions-runtime.json',JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));
