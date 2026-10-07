
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const allowed=new Set(['pnpm-lock.yaml','functions/package-lock.json','dependency-evidence/original-match.json','dependency-evidence/resolved-match.json','dependency-evidence/accepted-match.json']);
for(const path of process.argv.slice(2)){
 if(!allowed.has(path))throw new Error('evidence export path refused');
 const bytes=await readFile(path);if(bytes.length>2*1024*1024)throw new Error('evidence export byte budget');
 const value=bytes.toString('base64');const chunks=[];
 for(let at=0;at<value.length;at+=8192)chunks.push(value.slice(at,at+8192));
 const header={path,sourceSha:process.env.EXACT_SOURCE_SHA,workflowRunId:process.env.GITHUB_RUN_ID,byteLength:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),encoding:'base64',chunkCount:chunks.length};
 console.log('URAI_DEPENDENCY_EVIDENCE_HEADER='+JSON.stringify(header));
 for(let index=0;index<chunks.length;index++)console.log('URAI_DEPENDENCY_EVIDENCE_CHUNK='+JSON.stringify({path,index,value:chunks[index]}));
 console.log('URAI_DEPENDENCY_EVIDENCE_END='+JSON.stringify({path,sha256:header.sha256}));
}
