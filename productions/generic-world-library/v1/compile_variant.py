#!/usr/bin/env python3
"""Compose a deterministic controlled-variant recipe without generating any world asset."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def canonical(value):
    return (json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode()


def compile_recipe(root, family_id, selection):
    path = root / "specs" / (family_id + ".json")
    spec_bytes = path.read_bytes()
    spec = json.loads(spec_bytes)
    if spec["truthClassification"] != "GENERIC" or spec["status"] != "SPECIFIED":
        raise ValueError("Recipe input must be a GENERIC source specification")
    defaults = {"era": spec["era"]["default"], "region": spec["region"]["default"], "season": "summer",
                "weather": "clear", "timeOfDay": "afternoon", "finishLevel": "middle-maintained",
                "dressing": "light", "lod": "desktop", "lightingProfile": "neutral", "navigation": "accessible-level-default"}
    chosen = {**defaults, **{k:v for k,v in selection.items() if v is not None}}
    axes = spec["controlledVariants"]
    for axis, value in chosen.items():
        if axis not in axes or value not in axes[axis]:
            raise ValueError("Unsupported controlled choice: " + axis + "=" + value)
    # An unreviewed future region adapter is selectable in taxonomy but cannot be fabricated here.
    if chosen["region"] == "region-adapter-required":
        raise ValueError("Supply a reviewed region-pack successor rather than compiling an unnamed region adapter")
    if chosen["navigation"] != "accessible-level-default":
        raise ValueError("Alternate geometry requires a successor collision/navigation recipe")
    spec_hash = hashlib.sha256(spec_bytes).hexdigest()
    seed_input = {"familyId": spec["id"], "version": spec["version"], "selection": chosen, "sourceSpecSha256": spec_hash}
    seed = hashlib.sha256(canonical(seed_input)).hexdigest()
    weather = json.loads((root / "taxonomy" / "emotional-weather.json").read_text())
    profile = next(p for p in weather["profiles"] if p["id"] == chosen["lightingProfile"])
    era_path = root / "era-packs" / (chosen["era"] + ".json")
    id_parts = [chosen["era"], chosen["region"], chosen["dressing"], chosen["lod"], chosen["lightingProfile"], seed[:12]]
    value = {"schemaVersion": "urai-generic-world-variant-recipe/1.0.0",
        "id": spec["id"] + "@" + spec["version"] + "+" + ".".join(id_parts), "familyId": spec["id"], "version": spec["version"],
        "truthClassification": "GENERIC", "status": "SPECIFIED", "seedSha256": seed, "selection": chosen,
        "sourceSpec": {"path": str(path.relative_to(root)), "sha256": spec_hash},
        "eraPack": {"path": str(era_path.relative_to(root)), "sha256": hashlib.sha256(era_path.read_bytes()).hexdigest()},
        "composition": spec["composition"], "materialDefinitions": spec["materialDefinitions"],
        "dressingRule": spec["composition"]["dressingRules"][chosen["dressing"]],
        "logicalKitIds": spec["dependencyManifest"]["logicalKitIds"],
        "lighting": {**spec["lighting"], "emotionalProfile": profile}, "performanceTarget": spec["performanceProfiles"][chosen["lod"]],
        "navigation": spec["navigation"], "personalization": {"enabled": False, "truthRule": "No generic component becomes autobiographical truth", "insertStatus": "UNBOUND"},
        "outputsGenerated": [], "providerExecuted": False, "runtimeIntegrated": False,
        "implementationStatus": "RECIPE_COMPILED_ONLY: no selection claims model/material/lighting changes have been built",
        "requiresBeforeAccepted": ["asset realization bound to this recipe hash", "realized geometry compared with source brief", "asset machine QA", "visual review", "license receipt", "runtime integration and device proof if claimed"]}
    return value


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--root", type=Path, default=ROOT)
    ap.add_argument("--family", required=True)
    ap.add_argument("--out", type=Path, required=True)
    for option in ("era", "region", "season", "weather", "time-of-day", "finish-level", "dressing", "lod", "lighting-profile", "navigation"):
        ap.add_argument("--" + option)
    args = ap.parse_args()
    selection = {"era": args.era, "region": args.region, "season": args.season, "weather": args.weather, "timeOfDay": args.time_of_day,
                 "finishLevel": args.finish_level, "dressing": args.dressing, "lod": args.lod, "lightingProfile": args.lighting_profile, "navigation": args.navigation}
    recipe = compile_recipe(args.root.resolve(), args.family, selection)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    recipe_bytes = canonical(recipe)
    if args.out.exists() and args.out.read_bytes() != recipe_bytes:
        raise ValueError("Existing recipe bytes differ; preserve history by writing a successor file")
    args.out.write_bytes(recipe_bytes)
    print(json.dumps({"id": recipe["id"], "sha256": hashlib.sha256(args.out.read_bytes()).hexdigest(), "status": "SPECIFIED", "assetsGenerated": 0}))


if __name__ == "__main__":
    main()
