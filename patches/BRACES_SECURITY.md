# Studio braces local mitigation

Upstream braces 3.0.3 remains affected by GHSA-vfj7-8cjw-p6xm and has no published fixed release in the observed public catalog. This preparation retains that exact package identity and the raw HIGH finding. The existing acceptance gate remains unchanged and continues to block on the raw advisory.

The patch adopts the exact five depth-guard source files already reviewed in LifeLoggerAI/urai-investors at 1ecff671d6fd2eb095828e5ab47a4bf7726aeb33. It bounds brace/parenthesis parsing and supplied AST compile/expand/stringify traversal at 128. Caller options cannot raise that bound. The provenance JSON retains upstream integrity, original and patched per-file hashes, the committed patch hash and the original MIT license. pnpm patchedDependencies applies it without renaming the package.

Studio tests verify the actual installed fast-glob -> micromatch -> braces dependency chain and both caller APIs, all five runtime file hashes, ordinary patterns, boundary and over-bound inputs, supplied ASTs and caller options. The runtime receipt binds source SHA, run ID and both lock bytes; behavior is proved by the actual test step result, not inferred from the receipt. These are local dependency tests, not provider or production evidence.

The known upstream advisory stays unresolved. A final release must satisfy its existing acceptance requirements, or obtain a governed exact-SHA exception only if that process permits one; this patch grants no exception or approval. Replace the patch with a compatible upstream fixed release when available and rerun all affected acceptance.
