
"""Download a public ecosystem catalog; no repository data is transmitted."""
import argparse, hashlib, json, pathlib, urllib.request, zipfile
parser=argparse.ArgumentParser()
parser.add_argument("--output-directory",type=pathlib.Path,required=True)
args=parser.parse_args()
args.output_directory.mkdir(parents=True,exist_ok=True)
archive=args.output_directory/"public-osv-npm.zip"
request=urllib.request.Request("https://osv-vulnerabilities.storage.googleapis.com/npm/all.zip",headers={"User-Agent":"public-advisory-catalog-download"})
with urllib.request.urlopen(request,timeout=120) as response,archive.open("wb") as target:
    size=0
    for chunk in iter(lambda:response.read(1024*1024),b""):
        size+=len(chunk)
        if size>512*1024*1024:raise ValueError("catalog download exceeds bounded transport")
        target.write(chunk)
catalog=args.output_directory/"public-osv-npm.jsonl"
count=0
with zipfile.ZipFile(archive) as bundle,catalog.open("w") as target:
    if bundle.testzip() is not None:raise ValueError("catalog CRC mismatch")
    for entry in sorted(bundle.infolist(),key=lambda item:item.filename):
        if not entry.filename.endswith(".json"):continue
        if entry.file_size>4*1024*1024:raise ValueError("oversized advisory record")
        record=json.loads(bundle.read(entry))
        if not isinstance(record.get("id"),str):raise ValueError("advisory ID missing")
        target.write(json.dumps(record,separators=(",",":"))+"\n")
        count+=1
if count==0:raise ValueError("empty public catalog")
receipt={"schemaVersion":"public-osv-npm-catalog-download-v1","url":"https://osv-vulnerabilities.storage.googleapis.com/npm/all.zip","archiveSha256":hashlib.sha256(archive.read_bytes()).hexdigest(),"records":count,"privateRepositoryInputs":False}
(args.output_directory/"public-catalog-receipt.json").write_text(json.dumps(receipt,indent=2)+"\n")
print(json.dumps(receipt))
