#!/usr/bin/env python3
import os,pathlib,resource,subprocess
root=pathlib.Path(__file__).resolve().parents[1]
jobs_root=pathlib.Path(os.environ.get('URAI_R1615_JOBS_ROOT',''))
if not jobs_root.is_absolute() or not (jobs_root/'functions/lib/functions/jobs/studioLifeMovieBridge.js').is_file():
 raise SystemExit('R1615 requires an existing exact Jobs #529 compiled isolated source checkout')
logdir=pathlib.Path(os.environ.get('URAI_R1615_CUSTODY','/workspace/r1615-studio-custody'))
logdir.mkdir(parents=True,exist_ok=True)
env={k:os.environ[k] for k in ('PATH','HOME','LANG') if k in os.environ}
env.update({
 'PATH':'/workspace/r1580-jre21/bin:'+env.get('PATH','/usr/local/bin:/usr/bin:/bin'),
 'GCLOUD_PROJECT':'demo-urai-studio-r1591',
 'FIREBASE_AUTH_EMULATOR_HOST':'127.0.0.1:19099',
 'FIRESTORE_EMULATOR_HOST':'127.0.0.1:18080',
 'FIREBASE_STORAGE_EMULATOR_HOST':'127.0.0.1:19199',
 'FIREBASE_CONFIG':'{"projectId":"demo-urai-studio-r1591"}',
 'FUNCTIONS_EMULATOR':'true',
 'NODE_ENV':'test',
 'URAI_ENV':'test',
 'URAI_R1615_JOBS_ROOT':str(jobs_root),
 'URAI_JOBS_BRIDGE_URL':'http://127.0.0.1:15002',
 'URAI_STUDIO_JOBS_BRIDGE_TOKEN':'synthetic-r1591-local-bridge-only',
 'CI':'1',
})
soft,hard=resource.getrlimit(resource.RLIMIT_NOFILE)
resource.setrlimit(resource.RLIMIT_NOFILE,(min(8192,hard),hard))
with (logdir/'studio-r1615-playback-interface.log').open('w') as log:
 result=subprocess.run(['node','/workspace/genesis/node_modules/firebase-tools/lib/bin/firebase.js',
  'emulators:exec','--config','firebase.studio-r1591.emulators.json','--project','demo-urai-studio-r1591',
  '--only','auth,firestore,storage','node tests/integration/r1615-studio-jobs-playback.emulator.mjs'],
  cwd=root,env=env,stdout=log,stderr=subprocess.STDOUT)
(logdir/'studio-r1615-playback-interface.exit').write_text(str(result.returncode)+'\n')
raise SystemExit(result.returncode)
