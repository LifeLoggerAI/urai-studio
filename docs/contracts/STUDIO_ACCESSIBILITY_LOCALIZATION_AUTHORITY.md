# Studio Accessibility and Localization Authority

Status: PRE-LAUNCH SOURCE CONTRACT.

Studio must not hard-code a launch language count or language list from historical campaign material.

Current higher-level control evidence requires global localization, RTL behavior, text expansion safety, captions and accessible variants, while historical media plans contain older numeric references such as 19+ captions and broader product planning has used 20+ language goals. Those numbers are not treated here as a canonical immutable language set.

Every localized export package must therefore retain:

- a `localizationAuthorityRef` pointing at the current approved language authority;
- source language;
- locale;
- translation authority reference when translated;
- localized review state;
- textless master where applicable;
- captions/SRT/transcript as required;
- RTL and text-expansion QA when the selected locale requires it.

Adding a locale to a package does not prove that locale is launch-approved. Removing a locale from a historical campaign list does not silently change product launch canon.

The language set is resolved from current product/content/localization authority at release time and is not embedded as a stale constant in Studio.
