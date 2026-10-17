import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const requireStudio=createRequire(new URL('../../apps/studio/package.json',import.meta.url));
const sharp=requireStudio('sharp');
test('installed patched sharp retains bounded PNG/JPEG/WebP/AVIF transforms',async()=>{
  assert.equal(sharp.versions.sharp,'0.35.5');
  const seed=await sharp({create:{width:4,height:4,channels:4,background:'#2b3059'}}).png().toBuffer();
  for(const format of ['png','jpeg','webp','avif']){
    const output=await sharp(seed).resize(2,2).toFormat(format).toBuffer();
    const metadata=await sharp(output).metadata();
    assert.equal(metadata.width,2);assert.equal(metadata.height,2);assert.ok(output.length>0);
  }
});
test('installed patched SVG support retains the product image pipeline',async()=>{
  const output=await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="#2b3059"/></svg>')).resize(2,2).png().toBuffer();
  const metadata=await sharp(output).metadata();assert.equal(metadata.width,2);assert.equal(metadata.height,2);
});
test('corrupted image bytes fail explicitly rather than yield a false success',async()=>{
  await assert.rejects(sharp(Buffer.from('not an image')).png().toBuffer(),/unsupported image format/i);
});
