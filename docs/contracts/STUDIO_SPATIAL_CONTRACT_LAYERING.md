# Studio → Spatial contract layering

Current Spatial authority inspected: `LifeLoggerAI/urai-spatial#1296`, exact head `05374b8b2e2ca44c3f5ce5ea21dca94349c0837c`.

## Resolution

There is no need to mutate Spatial runtime behavior or bump the Spatial `0.1.0` wire solely for Studio release evidence.

The contract is now represented as two layers:

1. **Spatial core wire — `urai-spatial/0.1.0`**
   - producer / consumer
   - export/project/tenant identity
   - scene manifest
   - asset manifest
   - consent receipt
   - safety boundaries
   - disabled runtime target matrix

2. **Studio producer evidence envelope — `1.0.0`**
   - exact Studio build SHA
   - exact Spatial build SHA
   - validator identity/version
   - validation timestamp
   - live-smoke URL
   - protected deployment / acceptance authority

Studio validates the complete envelope, then `toStudioSpatialCoreExport()` removes `releaseEvidence` before the downstream Spatial core wire is represented.

This eliminates the previous ambiguity where the Studio interface carried extra evidence while being described as though the entire object were the Spatial 0.1.0 schema.

## Release boundary

- WebXR / Quest / VisionOS / handheld AR remain disabled.
- No live provider sync is enabled.
- A source envelope is not trusted release authority.
- Emission still requires protected Studio deployment evidence, protected Spatial acceptance evidence, consent authority, asset authority and safety authority.
- Any future change to the actual core wire fields requires a real wire-version decision across both repositories.
