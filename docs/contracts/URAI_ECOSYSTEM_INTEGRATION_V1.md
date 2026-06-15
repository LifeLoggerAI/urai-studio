# URAI Ecosystem Integration Contract V1

Studio repo orchestrates creator/admin operations in the URAI chain:
`UrAi -> urai-jobs -> urai-content -> asset-factory -> urai-spatial -> urai-studio -> B2Bportal`

Use `URAI_ECOSYSTEM_SCHEMA_V1.json` for cross-repo compatibility.

Studio-specific obligations:
- Preview and approve generated asset packs before broad publish.
- Keep admin/operator diagnostics fail-safe when secrets are missing.
- Keep integration endpoints configurable via env contract.
