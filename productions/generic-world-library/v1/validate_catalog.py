#!/usr/bin/env python3
"""Validate source-spec contracts. Does not validate nonexistent assets or render quality."""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BATCH1 = {"gw-east-texas-living-room", "gw-family-kitchen-dining", "gw-east-texas-residential-street",
          "gw-school-classroom-hallway", "gw-church-sanctuary-fellowship", "gw-hospital-room-corridor",
          "gw-college-dorm-campus", "gw-military-admin-operations", "gw-lake-dock-shoreline",
          "gw-backyard-garage-workshop", "gw-diner-cafe", "gw-motel-room-walkway"}


def canonical(value):
    return (json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode()


def require(predicate, message, errors):
    if not predicate:
        errors.append(message)


def positive(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) and value > 0


def dims_ok(d):
    return isinstance(d, dict) and set(d) == {"width", "height", "depth"} and all(positive(v) for v in d.values())


def vector_ok(v):
    return isinstance(v, list) and len(v) == 3 and all(isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x) for x in v)


def box(obj):
    x, _, z = obj["positionMeters"]
    d = obj["dimensionsMeters"]
    return x-d["width"]/2, x+d["width"]/2, z-d["depth"]/2, z+d["depth"]/2


def intersects(a, b):
    return min(a[1], b[1]) - max(a[0], b[0]) > 1e-7 and min(a[3], b[3]) - max(a[2], b[2]) > 1e-7


def validate_spec(s):
    errors = []
    require(re.fullmatch(r"gw-[a-z0-9]+(?:-[a-z0-9]+)*", s.get("id", "")) is not None, "invalid family id", errors)
    require(re.fullmatch(r"\d+\.\d+\.\d+", s.get("version", "")) is not None, "invalid semantic version", errors)
    require(s.get("truthClassification") == "GENERIC", "generic catalog cannot promote truth classification", errors)
    require(s.get("status") == "SPECIFIED", "source brief must remain SPECIFIED", errors)
    require(s.get("batch") in (1, 2), "invalid batch", errors)
    c = s.get("coordinateConvention", {})
    require(all(c.get(k) == v for k, v in {"units": "meters", "handedness": "right-handed", "up": "+Y", "assetFront": "+Z", "cameraForward": "-Z"}.items()), "coordinate convention mismatch", errors)
    require(s.get("historicalClaim", {}).get("isHistoricalReconstruction") is False, "historical reconstruction falsely claimed", errors)
    require(s.get("historicalClaim", {}).get("isUniversalEraOrRegionClaim") is False, "universal historical style falsely claimed", errors)
    require(s.get("region", {}).get("namedLocation") is None and s.get("region", {}).get("exactAddress") is None, "private or real location bound in generic source", errors)
    pstatus = s.get("productionStatus", {})
    require(all(pstatus.get(k) is False for k in ("runtimeIntegrated", "productionDeployed", "spatialAccepted", "independentlyApproved", "xrCertified")), "integration/acceptance status inflation", errors)
    boundary = s.get("integrationBoundary", {})
    require(boundary.get("activeSpatialCandidateModified") is False and boundary.get("runtimeAssetBinding") is None and boundary.get("releaseCandidate") is None, "active candidate or runtime bound", errors)
    require(s.get("qa", {}).get("aaaAccepted") is False and s.get("qa", {}).get("visualAcceptance") == "NOT_REVIEWED", "source checks falsely equated to visual acceptance", errors)
    require(s.get("dependencyManifest", {}).get("actualOutputArtifacts") == [], "binary output falsely claimed by source specification", errors)
    zones = s.get("composition", {}).get("zones", [])
    zone_map = {z.get("id"): z for z in zones}
    require(bool(zones) and len(zones) == len(zone_map), "missing or duplicate zones", errors)
    for z in zones:
        require(dims_ok(z.get("dimensionsMeters")), "invalid dimensions: " + str(z.get("id")), errors)
        require(vector_ok(z.get("originMeters")), "invalid zone origin: " + str(z.get("id")), errors)
        if z.get("kind") == "interior" and dims_ok(z.get("dimensionsMeters")):
            require(z["dimensionsMeters"]["height"] >= 2.3, "implausible default interior headroom", errors)
    furniture = s.get("composition", {}).get("furniture", [])
    require(len({o.get("id") for o in furniture}) == len(furniture), "duplicate furniture id", errors)
    valid_objects = []
    for obj in furniture:
        valid = dims_ok(obj.get("dimensionsMeters")) and vector_ok(obj.get("positionMeters")) and obj.get("zone") in zone_map
        require(valid, "invalid object dimensions/position/zone: " + str(obj.get("id")), errors)
        if not valid:
            continue
        z = zone_map[obj["zone"]]
        d = z["dimensionsMeters"]
        x0,x1,z0,z1 = box(obj)
        require(x0 >= -d["width"]/2-1e-7 and x1 <= d["width"]/2+1e-7 and z0 >= -d["depth"]/2-1e-7 and z1 <= d["depth"]/2+1e-7, "object envelope outside zone: " + obj["id"], errors)
        require(obj["positionMeters"][1] >= 0 and obj["positionMeters"][1] + obj["dimensionsMeters"]["height"] <= d["height"]+1e-7, "object floats below floor or exceeds zone height: " + obj["id"], errors)
        if obj.get("collidable"):
            valid_objects.append(obj)
    for i,a in enumerate(valid_objects):
        for b in valid_objects[i+1:]:
            if a["zone"] == b["zone"]:
                require(not intersects(box(a), box(b)), "overlapping specified furniture envelopes: " + a["id"] + "/" + b["id"], errors)
    nav = s.get("navigation", {})
    require(nav.get("status") == "DESIGN_REQUIREMENTS_ONLY_NOT_BAKED", "baked navigation falsely claimed", errors)
    for route in nav.get("zones", []):
        require(route.get("zone") in zone_map, "route zone missing", errors)
        require(positive(route.get("widthMeters")) and route.get("widthMeters", 0) >= 1.2, "reserved route too narrow", errors)
        path = route.get("pathLocalMeters", [])
        require(len(path) >= 2 and all(vector_ok(p) for p in path), "invalid route path", errors)
        if len(path) < 2 or not positive(route.get("widthMeters")) or not all(vector_ok(p) for p in path):
            continue
        for start, end in zip(path, path[1:]):
            require(abs(start[0] - end[0]) < 1e-7 or abs(start[2] - end[2]) < 1e-7, "source validator supports only axis-aligned reservation segments", errors)
            half = route["widthMeters"]/2
            route_box = (min(start[0],end[0])-half, max(start[0],end[0])+half, min(start[2],end[2]), max(start[2],end[2])) if abs(start[0]-end[0]) < 1e-7 else (min(start[0],end[0]), max(start[0],end[0]), min(start[2],end[2])-half, max(start[2],end[2])+half)
            for obj in valid_objects:
                if obj["zone"] == route["zone"]:
                    require(not intersects(route_box, box(obj)), "reserved navigation intersects specified furniture: " + obj["id"], errors)
        turn = route.get("turningArea", {})
        require(positive(turn.get("diameterMeters")) and turn.get("diameterMeters", 0) >= 1.5, "turning reservation too small", errors)
    for connection in nav.get("connections", []):
        require(connection.get("from") in zone_map and connection.get("to") in zone_map, "broken connection zone", errors)
        require(connection.get("clearWidthMeters", 0) >= 1.0 and connection.get("stepHeightMeters") == 0, "default connection clearance/threshold invalid", errors)
    mats = {m.get("name") for m in s.get("materialDefinitions", [])}
    kit_ids = []
    for kit in s.get("modularKit", []):
        kit_ids.append(kit.get("id"))
        require(re.fullmatch(r"kit:[a-z0-9-]+:v\d+", kit.get("id", "")) is not None, "invalid kit id", errors)
        require(dims_ok(kit.get("dimensionsMeters")), "invalid kit dimensions", errors)
        require(kit.get("materialIntent") in mats, "kit references unspecified material", errors)
        require(isinstance(kit.get("source"), dict) and isinstance(kit.get("rights"), dict), "kit missing provenance/rights object", errors)
        require(kit.get("source", {}).get("externalAssets") == [], "unreviewed external asset in source spec", errors)
        require(kit.get("output", {}).get("format") == "GLB", "unexpected geometry interchange format", errors)
        require(kit.get("truthClassification") == "GENERIC" and kit.get("status") == "SPECIFIED", "kit truth/status inflation", errors)
    require(bool(kit_ids) and len(set(kit_ids)) == len(kit_ids), "missing/duplicate modular kits", errors)
    require(kit_ids == s.get("dependencyManifest", {}).get("logicalKitIds"), "logical dependency manifest mismatch", errors)
    require(s.get("personalization", {}).get("enabledByDefault") is False, "personalization enabled without authority", errors)
    require(s.get("personalization", {}).get("recordedInsert", {}).get("status") == "UNBOUND", "captured insert falsely bound", errors)
    required_shots = {"wide", "eye-height", "doorway", "material-detail", "mobile-budget", "xr-seated"}
    require(required_shots <= {sh.get("id") for sh in s.get("previewPlan", {}).get("shots", [])}, "preview shot contract incomplete", errors)
    return errors


def self_test(valid_spec):
    mutations = [
        ("negative-dimension", lambda s: s["composition"]["zones"][0]["dimensionsMeters"].update(width=-1)),
        ("truth-promotion", lambda s: s.update(truthClassification="RECORDED SOURCE TRUTH")),
        ("candidate-binding", lambda s: s["integrationBoundary"].update(runtimeAssetBinding="active-runtime")),
        ("blocked-route", lambda s: s["composition"]["furniture"][0].update(positionMeters=[0, 0, 0])),
        ("external-source", lambda s: s["modularKit"][0]["source"].update(externalAssets=["unlicensed.glb"])),
        ("visual-inflation", lambda s: s["qa"].update(aaaAccepted=True)),
    ]
    out = []
    for name, change in mutations:
        copy = json.loads(json.dumps(valid_spec))
        change(copy)
        errors = validate_spec(copy)
        out.append({"case": name, "rejected": bool(errors)})
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--root", type=Path, default=ROOT)
    ap.add_argument("--out", type=Path)
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    root = args.root.resolve()
    catalog = json.loads((root / "catalog.json").read_text())
    receipt = json.loads((root / "receipts" / "source-specification-receipt.json").read_text())
    specs = []
    results = []
    general_errors = []
    shared = {}
    json_schema_available = False
    try:
        import jsonschema
        json_schema_available = True
        schema = json.loads((root / "schema" / "world-spec.schema.json").read_text())
        schema_validator = jsonschema.Draft202012Validator(schema)
    except ImportError:
        schema_validator = None
    for record in catalog["worlds"]:
        path = root / record["sourceSpec"]
        s = json.loads(path.read_text())
        specs.append(s)
        errs = validate_spec(s)
        if schema_validator:
            errs.extend("json-schema: " + e.message for e in schema_validator.iter_errors(s))
        require(path.name == s["id"] + ".json", "file/id mismatch", errs)
        require(hashlib.sha256(path.read_bytes()).hexdigest() == record["sha256"], "source spec hash mismatch", errs)
        for kit in s["modularKit"]:
            if kit["id"] in shared:
                require(canonical(kit) == shared[kit["id"]], "same kit id has different content: " + kit["id"], errs)
            else:
                shared[kit["id"]] = canonical(kit)
        results.append({"id": s["id"], "sourceSpecSha256": record["sha256"], "checksPassed": not errs, "errors": errs})
    require({s["id"] for s in specs if s["batch"] == 1} == BATCH1, "Batch 1 family set mismatch", general_errors)
    require(sum(s["batch"] == 2 for s in specs) >= 12, "insufficient Batch 2 briefs", general_errors)
    require(len(specs) == catalog["worldCount"] and len({s["id"] for s in specs}) == len(specs), "catalog count/duplicate mismatch", general_errors)
    for record in receipt["outputs"] + receipt["inputs"]:
        p = root / record["path"]
        require(p.is_file() and hashlib.sha256(p.read_bytes()).hexdigest() == record["sha256"], "receipt byte hash mismatch: " + record["path"], general_errors)
    require(hashlib.sha256(canonical(receipt["outputs"])).hexdigest() == receipt["outputSetSha256"], "aggregate output hash mismatch", general_errors)
    era_files = list((root / "era-packs").glob("era-*.json"))
    require(len(era_files) == 9, "era pack count mismatch", general_errors)
    for path in era_files:
        e = json.loads(path.read_text())
        require(e.get("truthClassification") == "GENERIC" and e.get("universalHistoricalClaim") is False, "era pack truth claim mismatch", general_errors)
        require(set(e["components"]) == {"architecture", "furniture", "appliances", "lighting", "vehicles", "signage", "roadMarkings", "consumerObjects", "electronics", "clothing", "palette"}, "era component brief incomplete", general_errors)
    tests = self_test(specs[0]) if args.self_test and specs else []
    require(all(t["rejected"] for t in tests), "negative contract fixture unexpectedly accepted", general_errors)
    passed = not general_errors and all(r["checksPassed"] for r in results)
    result = {"schemaVersion": "urai-spec-validation/1.0.0", "scope": "SOURCE_SPECIFICATIONS_ONLY", "passed": passed,
        "worldCount": len(specs), "batch1": sum(s["batch"] == 1 for s in specs), "batch2": sum(s["batch"] == 2 for s in specs),
        "eraPacks": len(era_files), "uniqueKitBriefs": len(shared), "sourceOutputSetSha256": receipt["outputSetSha256"],
        "jsonSchemaValidationRun": json_schema_available, "results": results, "errors": general_errors, "negativeContractChecks": tests,
        "geometryValidationRun": False, "rendersReviewed": False, "aaaAccepted": False, "runtimeIntegrated": False,
        "limits": "Navigation checks use specified axis-aligned envelopes, not actual generated geometry. Performance, collision, navmesh, UVs, GLBs, textures, visual quality and device behavior require separate asset receipts."}
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_bytes(canonical(result))
    print(json.dumps(result if not passed else {k: result[k] for k in ("passed", "worldCount", "batch1", "batch2", "eraPacks", "uniqueKitBriefs", "sourceOutputSetSha256", "jsonSchemaValidationRun", "negativeContractChecks")}))
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
