# R854 Studio selected-snapshot inventory, Git metadata only

GitHub recursive Git-tree responses were complete (`truncated=false`) for the following **immutable tree SHA** snapshots. [Full selected-tree Git path/mode/object/size manifest](MANIFEST_SELECTED_TREES.json).

| Snapshot | Commit SHA | Git blobs | Directory nodes | Markdown + MDX | Git-reported byte sum |
| --- | --- | ---: | ---: | ---: | ---: |
| Main | `854477d80b1a7aa718edb60d1ed4c1cf22dbed9d` | 751 | 276 | 90 | 3,642,986 |
| Studio current #179 | `153d6c35557c66a8b9f8629778ca796b83730464` | 908 | 300 | 105 | 6,068,047 |
| Separate fallback donor #175 | `aeac000487bb79d3f2e7ea1af406fb96c1a2a1ba` | 900 | 300 | 105 | 5,992,143 |
| Historical `v1.0.0-studio-static` tag | `9d5e68c720f34e20048434ee09f2710a469f20ef` | 534 | 188 | 17 | 160,017,868 |

These are **3,093 tracked path occurrences** across four trees; repeated paths and blobs are NOT independent unique contents. No all-tree deduplicated unique-byte total is asserted.

Git refs listing returned **160 current branch names representing 152 distinct branch HEAD commits**, plus three named tag refs. [Raw branch-tip registry](BRANCH_REFS_20261107.json); [all branch compare ledger](BRANCH_COMPARISONS_20261107.json). An earlier Studio audit worker reported 152 nontruncated distinct branch trees and full retrieval of 105 #179 MD/MDX docs; the actual report/ZIP exports are not attached as standalone bytes here and were **not reverified** in this R854 pass.

### Historical data at risk of being overlooked
The historical tagged tree `3e2f7f7c18eeef913c6ed0cddb6d8dd551db5903` (Feb 5, 2026) includes large preserved archives:
- `.bak/urai-studio_20260204_040449.tgz`: **89,386,304** Git-reported bytes, blob `8f273aa4cec006665f0733b3d018b56303acd063`.
- `.bak/urai-studio_20260204_040038.tgz`: **45,607,332**, blob `41ee39da22047fbae9ba527207680609466e3ded`.
- `.bak/urai-studio_20260204_035902.tgz`: **13,232,966**, blob `308a91c0d4e2448f0418b2475491a78d2a9b2aa9`.
- Several additional ~1.1 MB historic `.tgz` snapshots. The present main/#179 also retain four ~74–77 KB `.backups/` archives.

**Not performed:** downloading any of these archive payloads, inspecting members, computing raw SHA-256, extracting protected credentials or scanning every historical file. The GitHub text connector does not supply oversize/binary blob payloads. Use an authorized isolated read-only Git mirror, safe archive path-traversal guard and sensitive-data quarantine. File object identity and size are **metadata**, not content-forensic certification.

**Not in scope of completed inventory:** all 160 tree contents, every reachable commit, deleted refs, untracked workspace files, LFS targets, outside GitHub Creative Factory, full Video Factory CI ZIP media bytes, deployed Firestore/Storage/IAM, live family/private media and production provider history.
