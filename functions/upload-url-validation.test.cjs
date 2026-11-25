const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const {validateSignedUploadRequest: validate} = require('./lib/upload-url-validation.js');
const uid = 'user_1234';
const request = {fileName:'sample.mp4', mimeType:'video/mp4', bytes:8192};
const bad = (input, user, code) =>
  assert.throws(() => validate(input,user), e => e.message === code);

test('accepts valid owner, MIME and size', () => {
  assert.deepEqual(validate(request,uid), {...request,uid});
});
test('rejects unauthenticated or malformed owner', () => {
  for(const v of [undefined,null,'','a/b','../admin','abc\\def',42])
    bad(request,v,'invalid_owner_uid');
});
test('rejects missing or non-object requests', () => {
  for(const v of [null,undefined,'hello',[],42])bad(v,uid,'invalid_upload_request');
});
test('rejects path traversal, separators, dots and dangerous filenames', () => {
  for(const fileName of ['../sample.mp4','../../escape.mp4','/root.mp4',
    'folder/sample.mp4','folder\\sample.mp4','.secret.mp4',
    'foo..mp4','name\n.mp4','bad%2f.mp4','has space.mp4'])
    bad({...request,fileName},uid,'invalid_filename');
});
test('rejects empty, overlong and nonstring filenames', () => {
  for(const fileName of ['', 'a'.repeat(129)+'.mp4', {}, 2])
    bad({...request,fileName},uid,'invalid_filename');
});
test('rejects undefined, unknown, and forged MIME types', () => {
  for(const mimeType of [undefined,'','application/x-msdownload','text/html',
    'image/svg+xml','video/mp4; charset=utf-8',{},1])
    bad({...request,mimeType},uid,'invalid_mime_type');
});
test('rejects file-extension mismatch', () => {
  for(const fileName of ['sample.png','sample.exe','sample.mp4.exe'])
    bad({...request,fileName},uid,'invalid_mime_type');
});
test('rejects zero, negative, NaN, Infinity and bogus sizes', () => {
  for(const bytes of [0,-1,NaN,Infinity,-Infinity,'100',null,{},1.5])
    bad({...request,bytes},uid,'invalid_upload_size');
});
test('rejects over-limit byte declarations', () => {
  for(const bytes of [500*1024*1024+1,Number.MAX_SAFE_INTEGER,1e40])
    bad({...request,bytes},uid,'invalid_upload_size');
});
test('accepts exactly 500 MiB *declared* size', () => {
  assert.equal(validate({...request,bytes:500*1024*1024},uid).bytes,500*1024*1024);
});
test('accepts permitted media extensions with matching MIME', () => {
  for(const [fileName,mimeType] of [['x.jpeg','image/jpeg'],['x.png','image/png'],
    ['x.webp','image/webp'],['x.webm','video/webm'],['x.m4a','audio/mp4'],
    ['x.wav','audio/wav'],['x.mp3','audio/mpeg']])
    assert.equal(validate({fileName,mimeType,bytes:1},uid).fileName,fileName);
});
test('returns no client-controlled owner replacement', () => {
  assert.equal(validate({...request,uid:'other'},uid).uid,uid);
});
test('callable is not exported from the reviewed Studio Functions entrypoint', () => {
  const index=readFileSync(path.join(__dirname,'src/index.ts'),'utf8');
  assert.doesNotMatch(index,/createUploadUrl|upload-url-validation/);
});
test('explicitly warns that request-side size is not provider-side enforced', () => {
  const source=readFileSync(path.join(__dirname,'src/createUploadUrl.ts'),'utf8');
  assert.match(source,/does NOT enforce a GCS body-size cap/);
  assert.match(source,/validateSignedUploadRequest\(data, context\.auth\.uid\)/);
});
