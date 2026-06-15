# Studio WebXR Handoff

Studio manages operator/creator approval and handoff to spatial runtime.

## Flow
1. Select generated asset pack.
2. Validate pack completeness against shared schema.
3. Approve for spatial publish.
4. Emit scene/object references for runtime consumption.

## Required checks
- asset format compatibility (`png`, `svg`, `webp`, `glb`, `gltf`)
- scene/object transform integrity
- fallback behavior when secrets/providers are absent
