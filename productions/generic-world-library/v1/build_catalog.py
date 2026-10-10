#!/usr/bin/env python3
"""Build deterministic GENERIC source specifications. No asset/provider/runtime execution."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VERSION = "1.0.0"
CREATED_AT = "2026-10-07T00:16:23Z"
SCHEMA_VERSION = "urai-generic-world-spec/1.0.0"


def zone(key, width, depth, height=2.7, origin=(0, 0, 0), kind="interior", purpose=""):
    return {"id": key, "dimensionsMeters": {"width": width, "height": height, "depth": depth},
            "originMeters": list(origin), "kind": kind, "purpose": purpose}


def item(key, label, zone_id, xyz, whd, material, role="furniture"):
    return {"id": key, "label": label, "zone": zone_id, "positionMeters": list(xyz),
            "dimensionsMeters": dict(zip(("width", "height", "depth"), whd)),
            "yawDegrees": 0, "role": role, "materialIntent": material,
            "anchorAllowed": True, "collidable": role not in ("wall-decoration", "ceiling-fixture")}


def family(key, batch, title, eras, zones, furniture, intent, architecture, finishes, props,
           ambience, region="us-tx-east", restrictions=(), vegetation=(), variants=()):
    return {"id": "gw-" + key, "batch": batch, "title": title, "eras": eras,
            "zones": zones, "items": furniture, "intent": intent, "architecture": architecture,
            "finishes": finishes, "props": props, "ambience": ambience, "region": region,
            "restrictions": list(restrictions), "vegetation": list(vegetation),
            "familyVariants": list(variants)}


FAMILIES = [
    family("east-texas-living-room", 1, "1960s–1970s East Texas suburban living room", ["1960s", "1970s"],
           [zone("living", 7.2, 5.8, 2.55, purpose="Domestic conversation and family-memory staging"),
            zone("entry", 2.2, 2.4, 2.55, (0, 0, 4.1), purpose="Clear entry and orientation landmark")],
           [item("sofa", "Unbranded three-seat sofa", "living", (-2.2, 0, -1.4), (2.3, .88, .92), "woven-cloth-warm"),
            item("armchair", "Upholstered chair", "living", (2.35, 0, -.8), (.82, .88, .9), "woven-cloth-warm"),
            item("sideboard", "Low wood storage cabinet", "living", (2.65, 0, 1.7), (1.35, .75, .45), "wood-walnut-satin"),
            item("side-table", "Sofa side table", "living", (-2.75, 0, .25), (.55, .56, .55), "wood-walnut-satin")],
           "A maintained, inhabited suburban room with a readable path from entry to seating; generic design, never a family-address reconstruction.",
           "Simple rectangular shell; one broad entry opening, two residential windows on the north wall, optional non-operational masonry fireplace on the east wall. Ceiling fan is optional and disabled in reduced-motion mode.",
           ["paint-warm-off-white", "wood-walnut-satin", "carpet-loop-muted", "woven-cloth-warm"],
           ["unlabelled framed landscape", "blank photo placeholder", "plain ceramic bowl", "closed generic books", "analogue clock without brand"],
           ["low indoor room tone", "optional exterior summer insects at restrained level"],
           variants=["no-fireplace", "masonry-fireplace", "painted-walls", "wood-panel-feature-wall"]),
    family("family-kitchen-dining", 1, "1970s–1980s family kitchen and dining room", ["1970s", "1980s"],
           [zone("kitchen", 5.4, 4.8, 2.55, purpose="Cabinet and appliance substitution"),
            zone("dining", 5.4, 4.4, 2.55, (0, 0, 4.6), purpose="Family gathering staging")],
           [item("cabinet-run", "West cabinet and counter run", "kitchen", (-2.35, 0, -.1), (.6, .91, 3.8), "laminate-warm-neutral"),
            item("refrigerator", "Unbranded refrigerator", "kitchen", (2.05, 0, -1.55), (.85, 1.72, .78), "enamel-appliance-neutral"),
            item("range", "Unbranded range and oven", "kitchen", (2.1, 0, .1), (.76, .91, .68), "enamel-appliance-neutral"),
            item("dining-table", "Compact four-place table", "dining", (-1.6, 0, .15), (1.4, .75, .82), "wood-oak-satin"),
            item("china-cabinet", "Shallow storage cabinet", "dining", (1.9, 0, -1.35), (1.1, 1.75, .4), "wood-oak-satin")],
           "A modest domestic kitchen/dining pair; circulation and task lighting precede clutter. Appliance generations are interchangeable.",
           "Two rectangular zones connected by a 1.5 m cased opening; kitchen window above the counter; separate exterior opening at dining south edge. Avoid exposed working flames and unsafe cable routes.",
           ["paint-warm-off-white", "laminate-warm-neutral", "vinyl-sheet-muted", "wood-oak-satin", "enamel-appliance-neutral"],
           ["plain plates", "opaque storage jar", "dish towel", "unbranded kettle", "generic fruit bowl", "closed recipe notebook"],
           ["low appliance hum optional", "quiet tableware handling only if separately timed"],
           variants=["laminate-counter", "wood-counter-look", "four-place", "six-place-with-resized-dining-zone"]),
    family("east-texas-residential-street", 1, "Small-town East Texas residential street", ["1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("street", 40, 32, 10, kind="exterior", purpose="Walkable sidewalk and road context"),
            zone("porch", 4.8, 2.4, 2.6, (12, 0, -11), "covered-exterior", "Orientation and personalization anchor")],
           [item("house-shell", "Single-storey generic house shell", "street", (-12.5, 0, -8), (10, 3.2, 7), "clapboard-painted-muted", "architecture"),
            item("mailbox", "Plain mailbox without address", "street", (-10, 0, 5.8), (.3, 1.1, .4), "painted-metal-aged", "prop"),
            item("parked-vehicle-slot", "Unbranded parked-vehicle placeholder boundary", "street", (12, 0, -1.5), (1.95, 1.65, 4.8), "painted-metal-neutral", "substitution-slot")],
           "A modular neighborhood stretch with house silhouettes, sidewalks, yards, and utility rhythm; no asserted real street or house numbers.",
           "Road strip 7 m wide through the center, sidewalk bands 1.5 m wide beyond curbs, driveways placed outside reserved pedestrian corridor. Porch shown at sidewalk level by default; any steps need an alternate accessible path.",
           ["asphalt-worn", "concrete-weathered", "clapboard-painted-muted", "brick-muted", "painted-metal-aged"],
           ["blank street sign", "unmarked utility cabinet", "plain planter", "letterbox with no address"],
           ["restrained birds and insects", "optional distant low traffic without horns"],
           vegetation=["broadleaf canopy tree profiles", "grass patches", "low native-like shrubs; species unverified"],
           variants=["sidewalk-both-sides", "one-side-sidewalk-with-safe-route", "shade-trees", "open-yard"]),
    family("school-classroom-hallway", 1, "School classroom and hallway", ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("classroom", 8.4, 7.6, 3, purpose="Learning and memory staging"),
            zone("hallway", 8.4, 2.4, 3, (0, 0, 5), purpose="Unobstructed orientation route")],
           [item("desk-left", "Student desk bank, left", "classroom", (-2.65, 0, -.6), (2.2, .75, 3.4), "laminate-desktop-neutral"),
            item("desk-right", "Student desk bank, right", "classroom", (2.65, 0, -.6), (2.2, .75, 3.4), "laminate-desktop-neutral"),
            item("teacher-desk", "Teacher desk", "classroom", (-2.5, 0, -2.9), (1.4, .75, .65), "wood-oak-satin"),
            item("storage", "Low classroom storage", "classroom", (2.9, 0, 2.7), (1.65, 1.0, .42), "painted-metal-neutral")],
           "An unbranded, empty school environment with legible exits; display content is blank or explicitly authored.",
           "Tall north-wall window rhythm, classroom opening centered toward hallway, board surface on front wall. Desk banks have separate child furniture variants; cameras and navigation retain adult access clearance.",
           ["paint-institutional-soft", "vinyl-tile-muted", "laminate-desktop-neutral", "painted-metal-neutral", "chalkboard-dark-green"],
           ["blank board", "unbranded books", "plain notice paper", "unmarked storage bins"],
           ["quiet classroom room tone", "no bell or crowd by default"],
           restrictions=["No real school insignia, pupil names, class lists, or curriculum claims."],
           variants=["chalkboard-era", "dry-erase-era", "child-desk-scale", "adult-desk-scale"]),
    family("church-sanctuary-fellowship", 1, "Church sanctuary and fellowship hall", ["1940s", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("sanctuary", 12, 16, 5.2, purpose="Respectful generic gathering interior"),
            zone("fellowship", 12, 7, 3.2, (0, 0, 11.5), purpose="Community gathering space")],
           [item("pews-left", "Pew bank, left", "sanctuary", (-3.5, 0, -.2), (3.8, .94, 10.5), "wood-oak-satin"),
            item("pews-right", "Pew bank, right", "sanctuary", (3.5, 0, -.2), (3.8, .94, 10.5), "wood-oak-satin"),
            item("lectern", "Plain lectern", "sanctuary", (-2, 0, -6.5), (.7, 1.1, .6), "wood-oak-satin"),
            item("fellowship-tables", "Folding table group", "fellowship", (-3.1, 0, -.25), (3.5, .74, 3.4), "laminate-warm-neutral")],
           "A modest generic sanctuary and community hall. Denominational signs and symbols are separately optional and require reviewed context.",
           "Clear central aisle 2.2 m, side aisles at least 1.2 m, double rear exit, flat front platform by default. Raised dais variants require an accessible alternative; no forced religious iconography.",
           ["paint-warm-off-white", "wood-oak-satin", "carpet-loop-muted", "glass-clear", "plaster-matte"],
           ["unlabelled song book", "plain vase", "blank community board", "folding chairs"],
           ["soft interior room tone", "no sermon, choir, prayer, or bell recording by default"],
           restrictions=["Respectful generic treatment; denomination is not inferred from family history.", "No names or authored doctrine in signage."],
           variants=["pew-seating", "movable-chair-seating", "plain-windows", "abstract-glass-without-iconography"]),
    family("hospital-room-corridor", 1, "Hospital room and corridor", ["1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("patient-room", 5.6, 4.6, 2.8, purpose="Quiet generic patient room"),
            zone("corridor", 5.6, 2.6, 2.8, (0, 0, 3.6), purpose="Exit and orientation route")],
           [item("bed", "Unoccupied clinical bed", "patient-room", (-1.45, 0, -.75), (1.1, .8, 2.2), "enamel-clinical-neutral"),
            item("visitor-chair", "Visitor chair", "patient-room", (1.7, 0, -1.1), (.7, .9, .72), "vinyl-upholstery-soft"),
            item("cabinet", "Personal storage cabinet", "patient-room", (1.8, 0, 1.25), (.85, 1.0, .5), "laminate-clinical-neutral")],
           "A neutral unoccupied clinical interior. Equipment is visual context only and does not model treatment or patient condition.",
           "Wide room opening 1.3 m; corridor 2.6 m; privacy curtain recess does not cross movement path. Bed clearance remains on central aisle side; no flashing monitors or medical alarm audio.",
           ["paint-institutional-soft", "vinyl-sheet-muted", "enamel-clinical-neutral", "laminate-clinical-neutral", "vinyl-upholstery-soft"],
           ["blank bedside card", "plain drinking cup", "closed storage drawer", "inactive equipment enclosure"],
           ["very low ventilation", "no alarms, distress, or voices by default"],
           restrictions=["No hospital logos, patient identifiers, diagnosis text, or clinical efficacy claims."],
           variants=["single-room", "equipment-minimal", "historical-equipment-reviewed-later", "modern-equipment-reviewed-later"]),
    family("college-dorm-campus", 1, "College dorm room and campus corridor", ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("dorm", 6.6, 5, 2.65, purpose="Shared student room"),
            zone("campus-corridor", 6.6, 2.4, 2.65, (0, 0, 3.7), purpose="Residential corridor")],
           [item("bed-left", "Single bed, left", "dorm", (-2.3, 0, -.8), (1.0, .55, 2.05), "wood-oak-satin"),
            item("bed-right", "Single bed, right", "dorm", (2.3, 0, -.8), (1.0, .55, 2.05), "wood-oak-satin"),
            item("desk-left", "Study desk", "dorm", (-2.1, 0, 1.65), (1.1, .75, .55), "wood-oak-satin"),
            item("wardrobe", "Storage wardrobe", "dorm", (2.25, 0, 1.55), (1.2, 1.9, .6), "wood-oak-satin")],
           "A generic paired dorm room with separate furniture packages for each era and no student identity baked in.",
           "Central entry with 1.1 m nominal opening, large north-wall window, no loft or top bunk by default. Furniture stays along sides so return path is visible.",
           ["paint-warm-off-white", "vinyl-tile-muted", "wood-oak-satin", "woven-cloth-cool", "painted-metal-neutral"],
           ["unbranded study books", "blank pinboard", "plain bedding", "desk lamp", "closed suitcase"],
           ["quiet residential room tone", "optional distant footsteps below dialogue level"],
           restrictions=["No school seals, student photos, or real dorm room numbers."],
           variants=["single-occupant", "paired-room", "no-electronics", "era-reviewed-electronics"]),
    family("military-admin-operations", 1, "Military administrative and operations interior", ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("admin", 9, 7, 2.9, purpose="Generic administrative workplace"),
            zone("operations", 9, 6, 2.9, (0, 0, 6.5), purpose="Fictional operations workspace")],
           [item("desks-left", "Office desk bank", "admin", (-2.7, 0, -.7), (2.7, .75, 3.2), "laminate-desktop-neutral"),
            item("cabinets", "Document cabinets", "admin", (3.5, 0, -.5), (.65, 1.3, 3.6), "painted-metal-neutral"),
            item("operations-table", "Briefing table", "operations", (-2.5, 0, -.1), (2.0, .75, 3.2), "laminate-desktop-neutral"),
            item("console-bank", "Inactive fictional console enclosures", "operations", (3.25, 0, -.2), (.7, 1.2, 3.8), "painted-metal-neutral")],
           "An ordinary generic workplace, never a depiction of a named installation or a real weapons facility. Operations panels are inactive, fictional, and blank.",
           "Two rectangular spaces with a 1.4 m connection and clear exit. No secure-site plans, real launch controls, classified labels, or authentic restricted equipment layouts.",
           ["paint-institutional-soft", "vinyl-tile-muted", "painted-metal-neutral", "laminate-desktop-neutral", "glass-clear"],
           ["blank forms", "plain folders", "inactive wall clock", "fictional blank panel", "unmarked storage box"],
           ["low office ventilation", "no radio traffic, sirens, countdowns, or alarms by default"],
           restrictions=["No official insignia, unit identifiers, classified detail, service-specific procedure, or real secure facility reconstruction."],
           variants=["administrative-only", "fictional-briefing", "mechanical-era", "blank-digital-era"]),
    family("lake-dock-shoreline", 1, "Lake dock and shoreline", ["1940s", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("shore", 24, 22, 8, kind="exterior", purpose="Level lakeside exploration area"),
            zone("dock", 2.4, 12, 1.2, (0, 0, -17), "exterior", "Accessible dock with guarded water boundary")],
           [item("bench", "Plain shoreline bench", "shore", (-6.5, 0, -5.5), (1.8, .9, .65), "wood-weathered"),
            item("storage", "Small dock storage box", "shore", (6, 0, -5), (1.2, .75, .65), "wood-weathered")],
           "A generic inland lake edge with timber dock and visible safe return landmark; it must never inherit a named lake from narration without evidence.",
           "Dock centerline aligns with shore route. Dock deck is level with shore in default navigable variant; water, banks, and edge zones are non-walkable. Railings or conservative movement bounds protect exposed edges; no diving/jumping path.",
           ["wood-weathered", "water-lake-neutral", "soil-muted", "concrete-weathered", "painted-metal-aged"],
           ["unbranded closed tackle box", "plain rope coil secured outside route", "no-catch generic bucket"],
           ["gentle water laps", "restrained birds and insects", "no sudden thunder"],
           vegetation=["mixed broadleaf treeline profiles", "shore grass clumps", "sparse reeds outside dock route"],
           variants=["rail-guarded-dock", "movement-bounded-dock", "clear-water", "turbid-water"]),
    family("backyard-garage-workshop", 1, "Backyard and detached garage or workshop", ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("yard", 18, 20, 7, kind="exterior", purpose="Open yard and level circulation"),
            zone("garage", 6, 6.8, 2.8, (0, 0, -13.4), purpose="Generic workshop with safe empty center")],
           [item("patio-table", "Plain outdoor table", "yard", (-5, 0, -3), (1.4, .74, .85), "painted-metal-aged"),
            item("bench", "Workshop bench", "garage", (-2.3, 0, -.4), (.65, .9, 3.8), "wood-workbench-worn"),
            item("shelf", "Garage storage shelving", "garage", (2.3, 0, -.6), (.6, 1.8, 3.4), "painted-metal-aged")],
           "A reusable household yard and practical workshop; hand tools stay inactive and stored, without dangerous machinery interaction.",
           "Broad garage opening toward yard plus visible side exit; level threshold. Workshop perimeter storage leaves a central 1.8 m route; no loose tools, extension leads, or trip clutter along the route.",
           ["soil-muted", "concrete-weathered", "clapboard-painted-muted", "wood-workbench-worn", "painted-metal-aged"],
           ["closed unmarked storage boxes", "plain planter", "inactive tool silhouettes", "unbranded garden hose in holder"],
           ["low exterior wind", "optional restrained birds", "no power tools by default"],
           vegetation=["grass patches", "shade-tree profile", "plain low hedge"],
           variants=["garage-storage", "woodworking-bench", "hobby-room", "no-tools"]),
    family("diner-cafe", 1, "Diner or cafe interior", ["1940s", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("dining", 10, 8, 3, purpose="Generic neighborhood cafe"),
            zone("entry", 3, 2.6, 3, (0, 0, 5.3), purpose="Visible entrance and orientation")],
           [item("booths-left", "Booth seating bank", "dining", (-3.6, 0, -.1), (2.0, 1.1, 5.2), "vinyl-upholstery-soft"),
            item("counter", "Service counter", "dining", (3.5, 0, -.4), (1.0, 1.05, 5.4), "laminate-warm-neutral"),
            item("table", "Small accessible table", "dining", (-1.8, 0, 2.8), (1.0, .74, .65), "laminate-warm-neutral")],
           "An ordinary unbranded cafe. Accessible route and seated camera option are kept clear; menu surfaces contain no invented readable brands.",
           "Street-facing windows, 1.4 m entry, countertop seating optional with a separate reachable table. Back kitchen remains a non-navigable masked boundary until its own kit exists.",
           ["vinyl-tile-muted", "laminate-warm-neutral", "vinyl-upholstery-soft", "brushed-metal", "glass-clear"],
           ["plain cups", "unlabelled condiment holders", "blank menu board", "unbranded plates", "plain napkin holder"],
           ["quiet cafe room tone", "no copyrighted music, crowd identities, or loud dishes by default"],
           variants=["booth-heavy", "table-heavy", "small-town-counter", "cafe-neutral"]),
    family("motel-room-walkway", 1, "Motel room and exterior walkway", ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("room", 7.2, 5.6, 2.65, purpose="Generic overnight lodging"),
            zone("walkway", 7.2, 2.2, 2.65, (0, 0, 3.9), "covered-exterior", "Level exterior egress route")],
           [item("bed", "Unbranded double bed", "room", (-2.0, 0, -.75), (1.55, .62, 2.05), "woven-cloth-cool"),
            item("desk", "Luggage desk", "room", (2.55, 0, -1.1), (1.1, .75, .6), "wood-oak-satin"),
            item("wardrobe", "Wardrobe", "room", (2.5, 0, 1.55), (1.15, 1.9, .6), "wood-oak-satin")],
           "A modest roadside motel room with external access; no real motel identity, room number, or autobiographical linkage.",
           "Room door at walkway, front window, non-navigable bathroom insert boundary until supplied separately. Default is ground level; upper walkway variants require physical edge protection and separate device verification.",
           ["paint-warm-off-white", "carpet-loop-muted", "wood-oak-satin", "woven-cloth-cool", "concrete-weathered"],
           ["plain bedding", "blank room card", "unbranded lamp", "closed suitcase", "curtain without pattern logo"],
           ["low HVAC optional", "restrained exterior road ambience"],
           restrictions=["No real hotel name, legible invented motel brand, or identifiable guest evidence."],
           variants=["ground-level-default", "single-bed", "twin-bed-with-reflow", "empty-room"]),

    family("bedroom-era", 2, "Bedroom by era", ["1940s", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("bedroom", 6.4, 5.4, 2.6, purpose="Quiet domestic scene"), zone("entry", 2, 2.2, 2.6, (0, 0, 3.8), purpose="Clear return landmark")],
           [item("bed", "Generic double bed", "bedroom", (-1.85, 0, -.75), (1.55, .6, 2.05), "woven-cloth-cool"),
            item("dresser", "Low dresser", "bedroom", (2.1, 0, -1.2), (1.35, .85, .5), "wood-oak-satin"),
            item("chair", "Reading chair", "bedroom", (2.05, 0, 1.3), (.8, .9, .8), "woven-cloth-warm")],
           "A calm, personalizable bedroom with no identity-bearing photos or memorabilia.",
           "Window on north wall, generous entry, visible clear floor beside bed. Child-bedroom and bunk packages remain separately reviewed variants.",
           ["paint-warm-off-white", "wood-oak-satin", "carpet-loop-muted", "woven-cloth-cool"],
           ["blank frame", "closed book", "plain bed linen", "unbranded bedside lamp"], ["soft indoor room tone"], variants=["double-bed", "single-bed", "empty-shell"]),
    family("apartment-living", 2, "Apartment living and compact dining", ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("living", 6.8, 5.6, 2.6, purpose="High-reuse compact home"), zone("entry", 2.4, 3, 2.6, (0, 0, 4.3), purpose="Entry and kitchen boundary")],
           [item("sofa", "Compact sofa", "living", (-2.0, 0, -.7), (2, .86, .85), "woven-cloth-warm"),
            item("table", "Two-place table", "living", (2.1, 0, -1.2), (.9, .74, .7), "wood-oak-satin"),
            item("storage", "Low cabinet", "living", (2.15, 0, 1.3), (1.2, .7, .4), "wood-oak-satin")],
           "An apartment shell designed for geography and furniture substitution without naming a building.",
           "Single-level entrance and window wall; balcony is an optional blocked insert boundary until edge protection is accepted. Kitchen not implied complete.",
           ["paint-warm-off-white", "wood-oak-satin", "vinyl-tile-muted", "woven-cloth-warm"],
           ["blank wall art", "plain plant pot", "closed books"], ["low residential ambience"], variants=["compact", "open-plan", "no-balcony"]),
    family("rural-house-porch", 2, "Rural house common room and porch", ["1940s", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("common-room", 8, 6.4, 2.8, purpose="Domestic rural common room"), zone("porch", 8, 2.8, 2.8, (0, 0, 4.6), "covered-exterior", "Level accessible porch")],
           [item("sofa", "Plain household sofa", "common-room", (-2.7, 0, -.9), (2.3, .88, .9), "woven-cloth-warm"),
            item("cabinet", "Storage hutch", "common-room", (2.85, 0, -.85), (1.2, 1.7, .48), "wood-oak-satin"),
            item("porch-bench", "Porch bench", "porch", (-2.4, 0, .15), (1.7, .88, .65), "wood-weathered")],
           "A maintained rural domestic environment, allowing region-specific construction after evidence review.",
           "Broad front doorway, screened openings optional, porch level with room by default. Raised rural-house layouts require a specified ramp/grade successor, not assumed accessibility.",
           ["clapboard-painted-muted", "wood-oak-satin", "wood-weathered", "woven-cloth-warm"],
           ["plain storage crock", "unlabelled photograph placeholder", "closed book"], ["restrained rural insects and birds"], vegetation=["yard grass", "shade-tree profile"], variants=["screened-porch", "open-porch", "painted-interior"]),
    family("office-workplace", 2, "Ordinary office and corridor", ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("office", 10, 8, 3, purpose="Administrative workplace"), zone("corridor", 10, 2.4, 3, (0, 0, 5.2), purpose="Visible exit")],
           [item("desks-left", "Workstation group", "office", (-3, 0, -.5), (2.5, .75, 4.8), "laminate-desktop-neutral"),
            item("desks-right", "Workstation group", "office", (3, 0, -.5), (2.5, .75, 4.8), "laminate-desktop-neutral"),
            item("storage", "Office cabinet", "office", (3.3, 0, 3.25), (1.5, 1.3, .45), "painted-metal-neutral")],
           "A reusable non-branded office for work memories and films.", "Two workstation banks, central 2 m circulation, windows optional; no private documents or company identity.",
           ["paint-institutional-soft", "carpet-loop-muted", "laminate-desktop-neutral", "painted-metal-neutral"],
           ["blank forms", "plain folders", "inactive unbranded electronics", "plain desk lamp"], ["low office ventilation"], variants=["open-office", "paper-era", "inactive-digital-era"]),
    family("factory-floor", 2, "Generic factory floor and safe observation route", ["1940s", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("floor", 24, 20, 7, purpose="Industrial workplace context"), zone("entry", 4, 3, 3, (0, 0, 11.5), purpose="Clear observation entry")],
           [item("machine-left", "Inactive machine enclosure bank", "floor", (-7, 0, -2), (5, 2.4, 10), "painted-metal-aged"),
            item("machine-right", "Inactive machine enclosure bank", "floor", (7, 0, -2), (5, 2.4, 10), "painted-metal-aged")],
           "A generic workplace shell; inactive machinery is visual set dressing, never an instructional industrial simulation.",
           "High roof with clear structural spans; broad central observation route physically separated from machine envelopes; loading area remains blocked until its own safe route exists.",
           ["concrete-weathered", "painted-metal-aged", "brick-muted", "brushed-metal"],
           ["blank safety board", "unmarked closed crates", "inactive control housings"], ["low ventilation; no impact sounds or machinery start-up"],
           restrictions=["No working machinery, operating procedure, manufacturer identity, or hazard certification."], variants=["assembly-context", "textile-context-reviewed-later", "empty-shell"]),
    family("warehouse", 2, "Warehouse storage and loading threshold", ["1940s", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("storage", 20, 18, 6, purpose="Broadly reusable industrial storage"), zone("loading", 5, 4, 4, (0, 0, 11), purpose="Level threshold variant")],
           [item("rack-left", "Storage rack bank", "storage", (-6.5, 0, -1), (3.2, 3.5, 12), "painted-metal-aged"),
            item("rack-right", "Storage rack bank", "storage", (6.5, 0, -1), (3.2, 3.5, 12), "painted-metal-aged")],
           "An unbranded warehouse with believable shelf scale and a simple safe route.",
           "Central route at least 3 m; rack modules use conservative collision envelopes and no reachable unstable stacks. Raised loading dock variants stay non-navigable until an alternate safe route is specified.",
           ["concrete-weathered", "painted-metal-aged", "wood-workbench-worn", "brick-muted"],
           ["sealed blank cartons", "plain pallets", "inactive hand cart outside aisle"], ["low building ventilation"], variants=["light-storage", "rich-storage-within-racks", "empty-racks"]),
    family("grocery-store", 2, "Neighborhood grocery store", ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("sales", 18, 16, 3.6, purpose="Retail memory staging"), zone("entry", 4, 3, 3.6, (0, 0, 9.5), purpose="Entrance orientation")],
           [item("shelves-left", "Shelf bank left", "sales", (-5.5, 0, -1), (3.2, 1.6, 10), "painted-metal-neutral"),
            item("shelves-right", "Shelf bank right", "sales", (5.5, 0, -1), (3.2, 1.6, 10), "painted-metal-neutral"),
            item("checkout", "Generic checkout counter", "sales", (-4, 0, 6.5), (2.2, .95, .85), "laminate-warm-neutral")],
           "Generic retail shelves with unbranded products and clear orientation. No real chain or invented readable package brands.",
           "Wide central aisle and shelf cross aisles; checkout accessible-height variant included as a future module. Product dressing is instanced within shelf envelopes.",
           ["vinyl-tile-muted", "painted-metal-neutral", "laminate-warm-neutral", "glass-clear"],
           ["blank cartons", "unlabelled bottles", "generic produce shapes", "plain baskets"], ["low HVAC; no copyrighted shop music"],
           restrictions=["Readable food/medicine claims and product logos excluded."], variants=["small-shop", "medium-market", "empty-shelves"]),
    family("park-playground", 2, "Neighborhood park and playground", ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("park", 28, 24, 10, kind="exterior", purpose="Low-stimulation outdoor gathering"), zone("shelter", 6, 5, 3, (10, 0, 8), "covered-exterior", "Orientation shelter")],
           [item("bench", "Park bench", "park", (-7, 0, 4), (1.8, .9, .65), "wood-weathered"),
            item("play-envelope", "Inactive playground equipment boundary", "park", (8, 0, -5), (7, 2.8, 7), "painted-metal-muted", "substitution-slot")],
           "Generic public green space with separate walking and play zones. Equipment is decorative until safe interaction is separately verified.",
           "Level loop walk 1.8 m wide with a visible shelter; playground insert boundary is outside walk route. No forced climbing, falls, swing movement, or water hazard.",
           ["concrete-weathered", "wood-weathered", "soil-muted", "painted-metal-muted"],
           ["blank public notice board", "plain bin", "water-fountain enclosure inactive"], ["restrained birds and wind"], vegetation=["shade-tree profiles", "grass", "low shrubs"], variants=["park-only", "playground-context", "picnic-shelter"]),
    family("cemetery", 2, "Generic cemetery path", ["1940s", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("grounds", 26, 24, 10, kind="exterior", purpose="Respectful remembrance setting"), zone("entry", 4, 3, 2.8, (0, 0, 13.5), "exterior", "Clear return landmark")],
           [item("markers-left", "Uninscribed marker grouping", "grounds", (-7, 0, -1), (6, 1.1, 14), "stone-muted", "substitution-slot"),
            item("markers-right", "Uninscribed marker grouping", "grounds", (7, 0, -1), (6, 1.1, 14), "stone-muted", "substitution-slot"),
            item("bench", "Quiet bench", "grounds", (-6, 0, 9), (1.8, .88, .65), "wood-weathered")],
           "A respectful generic setting with uninscribed markers and no inferred death, faith, or family relationship.",
           "Level central path and accessible resting area; shallow non-navigable planting borders protect marker placement. No open graves or unexpected imagery.",
           ["stone-muted", "concrete-weathered", "soil-muted", "wood-weathered"], ["uninscribed markers", "plain vase without names"], ["quiet wind and distant birds"],
           restrictions=["No real names, dates, burial plot coordinates, or religious inference."], vegetation=["mown grass", "shade-tree profiles"], variants=["flat-markers", "upright-markers", "garden-remembrance"]),
    family("airport-concourse", 2, "Generic airport or transport concourse", ["1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("concourse", 24, 12, 5, purpose="Travel and waiting memories"), zone("waiting", 8, 8, 4, (0, 0, 10), purpose="Quiet resting subspace")],
           [item("seats-left", "Waiting-seat bank", "concourse", (-7, 0, -.5), (6, .9, 1.4), "vinyl-upholstery-soft"),
            item("seats-right", "Waiting-seat bank", "concourse", (7, 0, -.5), (6, .9, 1.4), "vinyl-upholstery-soft"),
            item("counter", "Inactive generic service desk", "waiting", (-2.5, 0, -.8), (1.1, .95, 3.5), "laminate-clinical-neutral")],
           "A quiet unbranded concourse without real airport routes, tickets, airlines, or security procedures.",
           "Broad central path, glazed side wall and readable exit landmark. Escalators and baggage machinery omitted from navigable default.",
           ["vinyl-tile-muted", "glass-clear", "brushed-metal", "vinyl-upholstery-soft"], ["blank sign panels", "closed luggage", "inactive counter displays"], ["restrained ventilation; no announcements by default"],
           restrictions=["No official security layout, real passenger information, or airline marks."], variants=["air-terminal", "station-waiting-hall", "quiet-concourse"]),
    family("rural-road", 2, "Rural road and roadside rest area", ["1940s", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("road-context", 48, 30, 10, kind="exterior", purpose="Travel environment backdrop"), zone("rest-area", 8, 6, 3, (14, 0, 10), "exterior", "Safe pedestrian rest area")],
           [item("fence-left", "Plain roadside fence band", "road-context", (-17, 0, -.5), (.25, 1.2, 24), "wood-weathered", "architecture"),
            item("bench", "Rest-area bench", "rest-area", (-2, 0, .5), (1.8, .88, .65), "wood-weathered")],
           "A generic road backdrop with safe pedestrian observation rather than walkable traffic lanes.",
           "Roadway is non-navigable; level rest-area route and clear shoulder boundary. Road markings are illustrative generic parameters, not certified traffic-control designs.",
           ["asphalt-worn", "soil-muted", "wood-weathered", "concrete-weathered"], ["blank roadside sign", "plain fence posts"], ["quiet wind; optional distant low traffic"],
           vegetation=["grass verge", "distant broadleaf treeline"], variants=["paved-road", "gravel-context", "roadside-rest"]),
    family("gas-station", 2, "Generic gas station forecourt", ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("forecourt", 24, 20, 5, kind="exterior", purpose="Roadside travel context"), zone("shop", 8, 6, 3, (0, 0, -13), purpose="Unbranded shop shell")],
           [item("pump-left", "Inactive unbranded pump island", "forecourt", (-6.5, 0, -1), (2.4, 1.8, 3.0), "painted-metal-muted"),
            item("pump-right", "Inactive unbranded pump island", "forecourt", (6.5, 0, -1), (2.4, 1.8, 3.0), "painted-metal-muted"),
            item("counter", "Plain shop counter", "shop", (-2.5, 0, -.5), (1.0, .95, 3.2), "laminate-warm-neutral")],
           "An inactive unbranded forecourt for visual context, with pedestrian route separated from vehicle slots.",
           "Clear 2 m walkway through forecourt to shop; pumps are non-interactive. No fuel handling, live pricing, traffic motion, brand logos, or inferred place names.",
           ["concrete-weathered", "painted-metal-muted", "glass-clear", "laminate-warm-neutral"], ["blank price panel", "unbranded closed bins", "plain canopy lamps"], ["low outdoor room tone"],
           restrictions=["No working fuel simulation or consumer brand imagery."], variants=["small-roadside", "canopy-modern", "historic-pump-reviewed-later"]),
    family("forest-trail", 2, "Generic temperate forest trail", ["1940s", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("forest", 32, 28, 14, kind="exterior", purpose="Quiet exploration and reflective narrative"), zone("clearing", 7, 6, 4, (0, 0, 17), "exterior", "Return orientation clearing")],
           [item("bench", "Plain clearing bench", "clearing", (-2.2, 0, .25), (1.8, .88, .65), "wood-weathered")],
           "A generic forest corridor with high-reuse vegetation slots. Species and geography remain unverified until region-specific sources are reviewed.",
           "Level 1.8 m trail with turn landmarks and constrained vegetation envelope; no steep drops or obscured exits. Roots and stones do not obstruct accessible default.",
           ["soil-muted", "wood-weathered", "bark-neutral", "leaf-neutral"], ["blank trail marker", "non-personal rock group"], ["restrained forest wind and birds"],
           vegetation=["broadleaf-canopy-profile", "conifer-profile optional by region", "understory outside path"], variants=["light-canopy", "dense-canopy-with-clear-route", "leaf-off"]),
    family("beach-boardwalk", 2, "Generic beach and level boardwalk", ["1940s", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("beach", 32, 26, 10, kind="exterior", purpose="Coastal backdrop"), zone("boardwalk", 2.4, 14, 1.2, (0, 0, 20), "exterior", "Safe accessible approach")],
           [item("bench", "Beach approach bench", "beach", (-6, 0, 6), (1.8, .88, .65), "wood-weathered")],
           "A generic coastal scene; regional species and water appearance are variant assumptions rather than a named beach.",
           "Boardwalk and firm viewing pad are navigable; water and soft-sand regions are excluded from accessible route. Exposed boardwalk edges have guards or movement bounds.",
           ["sand-muted", "water-coastal-neutral", "wood-weathered", "painted-metal-aged"], ["blank orientation sign", "plain rope boundary outside route"], ["gentle surf and restrained wind"],
           region="us-coastal-generic", vegetation=["sparse dune grass profile; regional species unverified"], variants=["calm-water", "overcast-coast", "no-palm-default"]),
    family("courthouse-public-hall", 2, "Generic courthouse public hall", ["1940s", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("hall", 12, 10, 4.2, purpose="Ordinary civic interior"), zone("corridor", 12, 2.6, 3.2, (0, 0, 6.3), purpose="Clear public circulation")],
           [item("bench-left", "Public waiting bench", "hall", (-3.9, 0, -.5), (2.6, .9, .75), "wood-oak-satin"),
            item("bench-right", "Public waiting bench", "hall", (3.9, 0, -.5), (2.6, .9, .75), "wood-oak-satin"),
            item("service-desk", "Unbranded service desk", "hall", (-3.5, 0, -3.5), (2.2, .95, .9), "wood-oak-satin")],
           "A generic public civic hall with no inferred legal proceeding or location.",
           "Flat lobby floor, wide corridor connection, readable neutral door landmarks; security equipment and courtroom seating excluded from default.",
           ["stone-muted", "wood-oak-satin", "plaster-matte", "brushed-metal"], ["blank directory", "unmarked notices", "plain clock"], ["low interior room tone"],
           restrictions=["No court seals, real case data, official forms, or legal procedure claims."], variants=["modest-civic", "historic-civic-inspired", "modern-civic"]),
    family("military-barracks", 2, "Generic military dormitory or barracks", ["1940s", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("dormitory", 10, 8, 3, purpose="Generic shared residential workplace"), zone("corridor", 10, 2.4, 3, (0, 0, 5.2), purpose="Clear route")],
           [item("beds-left", "Single-height bed group", "dormitory", (-3, 0, -.7), (2.4, .6, 4.5), "painted-metal-neutral"),
            item("beds-right", "Single-height bed group", "dormitory", (3, 0, -.7), (2.4, .6, 4.5), "painted-metal-neutral"),
            item("lockers", "Plain storage lockers", "dormitory", (3.2, 0, 3), (2.0, 1.85, .55), "painted-metal-neutral")],
           "A non-specific dormitory with no service identity, named base, or personal occupant record.",
           "Single-height beds by default, 2 m central aisle and clear exterior door. Bunk variant requires safe non-climbing camera behavior and separately reviewed scale.",
           ["paint-institutional-soft", "vinyl-tile-muted", "painted-metal-neutral", "woven-cloth-cool"], ["plain bedding", "blank storage labels", "closed bags"], ["soft residential room tone"],
           restrictions=["No service/unit insignia, uniforms with identity, weapons, or secure-site layout."], variants=["single-height-default", "paired-dorm", "historic-inspired-reviewed-later"]),
    family("clinic-waiting-room", 2, "Clinic waiting and consultation room", ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
           [zone("waiting", 8, 6.4, 2.8, purpose="Quiet care setting"), zone("consultation", 8, 4.8, 2.8, (0, 0, 5.6), purpose="Generic consultation room")],
           [item("seats-left", "Waiting chairs", "waiting", (-2.6, 0, -.6), (1.8, .9, 3.4), "vinyl-upholstery-soft"),
            item("reception", "Inactive reception desk", "waiting", (2.55, 0, -.8), (1.0, .95, 3.2), "laminate-clinical-neutral"),
            item("exam-bench", "Unoccupied generic exam bench", "consultation", (-2.2, 0, -.2), (1.8, .8, .75), "vinyl-upholstery-soft")],
           "A neutral clinic context with no diagnosis, distress cues, or patient identifiers.",
           "Clear center route, 1.3 m consultation connection, inactive equipment. Waiting chairs stay outside turn radius; no sudden alarms.",
           ["paint-institutional-soft", "vinyl-sheet-muted", "laminate-clinical-neutral", "vinyl-upholstery-soft"], ["blank intake form", "plain water cup", "unmarked closed storage"], ["very low ventilation"],
           restrictions=["No provider logos, patient data, treatment claims, or medical instructions."], variants=["small-clinic", "community-care", "equipment-minimal"]),
]

MATERIALS = {
    "paint-warm-off-white": ("warm low-chroma painted plaster", .74, 0, "fine plaster grain"),
    "paint-institutional-soft": ("soft low-chroma institutional paint", .78, 0, "restrained paint grain"),
    "wood-walnut-satin": ("unbranded brown wood veneer", .47, 0, "directional grain; no baked specular highlight"),
    "wood-oak-satin": ("unbranded warm wood", .52, 0, "grain direction follows joinery"),
    "wood-weathered": ("weathered timber", .82, 0, "broad grain, mild wear masks"),
    "wood-workbench-worn": ("used timber work surface", .73, 0, "restrained scratches, no hazard clutter"),
    "carpet-loop-muted": ("muted loop carpet", .94, 0, "small loop normals with scale-correct repeat"),
    "woven-cloth-warm": ("warm neutral woven upholstery", .9, 0, "thread normal; restrained pattern"),
    "woven-cloth-cool": ("cool neutral textile", .9, 0, "woven normal at physical scale"),
    "laminate-warm-neutral": ("neutral domestic laminate", .55, 0, "low-contrast micrograin"),
    "laminate-desktop-neutral": ("matte neutral desk laminate", .62, 0, "subtle micrograin"),
    "laminate-clinical-neutral": ("neutral cleanable laminate", .58, 0, "minimal scratch mask"),
    "enamel-appliance-neutral": ("unbranded enamel appliance surface", .3, 0, "minimal roughness variation"),
    "enamel-clinical-neutral": ("neutral enamel equipment enclosure", .35, 0, "no decals or readable instrument data"),
    "vinyl-sheet-muted": ("neutral sheet floor", .7, 0, "faint scale-correct wear"),
    "vinyl-tile-muted": ("muted vinyl tile floor", .68, 0, "tile size .3 m or .45 m; configurable"),
    "vinyl-upholstery-soft": ("unbranded softly worn vinyl", .57, 0, "subtle seams; no stretched specular band"),
    "painted-metal-neutral": ("neutral painted metal", .52, .05, "small paint wear only"),
    "painted-metal-aged": ("weathered painted metal", .7, .12, "edge wear constrained to plausible exposure"),
    "painted-metal-muted": ("low-chroma painted metal", .62, .05, "restrained wear"),
    "brushed-metal": ("unbranded brushed metal", .4, 1, "anisotropic appearance must degrade gracefully to core glTF"),
    "glass-clear": ("clear glazing", .12, 0, "transparent glTF fallback; transmission extension optional"),
    "plaster-matte": ("matte plaster", .82, 0, "fine plaster surface"),
    "brick-muted": ("generic weathered brick", .83, 0, "brick modules .21 x .065 m are design assumptions"),
    "clapboard-painted-muted": ("painted domestic siding", .73, 0, "board scale .14 m is configurable"),
    "asphalt-worn": ("restrained worn asphalt", .93, 0, "aggregate roughness without conspicuous tiling"),
    "concrete-weathered": ("weathered concrete", .86, 0, "low-contrast aggregate and expansion seams"),
    "soil-muted": ("neutral soil and ground", .95, 0, "region-swappable granular structure"),
    "stone-muted": ("generic muted stone", .86, 0, "non-specific stone provenance; no inscriptions"),
    "sand-muted": ("neutral sand", .96, 0, "low-contrast physical-scale grain"),
    "water-lake-neutral": ("generic lake water", .18, 0, "gentle normal and nonwalkable collision boundary"),
    "water-coastal-neutral": ("generic coastal water", .16, 0, "gentle normal, no strobing reflection"),
    "bark-neutral": ("generic bark", .91, 0, "species-neutral until regional review"),
    "leaf-neutral": ("generic broadleaf foliage", .84, 0, "no alpha-sorted volumetric filler; quality needs visual review"),
    "chalkboard-dark-green": ("matte dark green writing board", .9, 0, "blank surface"),
}

ERA_DATA = {
    "1940s": {"architecture": "simple painted plaster or timber interiors; dimensions remain configurable", "furniture": "plain solid-wood profiles, upholstered chairs, restrained joinery", "appliances": "enamel cabinets and separately reviewed period appliance silhouettes", "lighting": "opaque shades and simple ceiling fixtures", "vehicles": "unbranded rounded-body silhouette brief; licensed or generated mesh pending", "signage": "plain painted lettering guides with no generated brand text", "roadMarkings": "sparse generic road context; exact markings require regional source", "consumerObjects": ["plain ceramics", "wooden storage", "analogue clock"], "electronics": ["unbranded dial-radio enclosure"], "clothing": "generic later character reference brief: restrained woven fabrics; no likeness or uniform insignia", "palette": ["warm off-white", "wood browns", "muted fabric colors"]},
    "1950s": {"architecture": "painted plaster, simple suburban shells, optional restrained trim", "furniture": "wood storage, upholstered sofas, optional tubular chairs and laminate tops", "appliances": "unbranded rounded enamel refrigerator/range briefs", "lighting": "simple shaded lamps and domestic ceiling fixtures", "vehicles": "unbranded mid-century sedan profile brief; mesh pending", "signage": "plain geometric sign panels; no real brand", "roadMarkings": "region-reviewed paint layout required", "consumerObjects": ["plain ceramic cups", "unbranded kitchen canisters"], "electronics": ["dial radio", "blank-screen cabinet television brief"], "clothing": "later reference only: varied practical/occasion wardrobes; region and income editable", "palette": ["warm neutral", "optional restrained pastels", "wood browns"]},
    "1960s": {"architecture": "low residential ceilings, painted walls or optional wood feature panels", "furniture": "low-backed sofas and wood veneer storage with multiple finish levels", "appliances": "enamel kitchen appliances without brand cues", "lighting": "simple ceiling fixtures, table lamps, institutional diffuse fixtures", "vehicles": "unbranded boxier sedan/wagon briefs; detail mesh pending", "signage": "generic painted or printed panels", "roadMarkings": "regional source review needed", "consumerObjects": ["plain books", "ceramics", "analogue wall clock"], "electronics": ["cabinet television with blank screen", "dial telephone enclosure"], "clothing": "later reference only: no universal decade costume or real-person wardrobe assumption", "palette": ["wood browns", "warm off-white", "muted earth fabric tones"]},
    "1970s": {"architecture": "painted or selectively panelled domestic walls; conventional room proportions", "furniture": "cloth sofas, sturdy wood tables, optional low storage consoles", "appliances": "unbranded enamel surfaces with optional warm tint", "lighting": "warm shaded domestic lamps and diffuse institutional fixtures", "vehicles": "unbranded broad sedan/wagon briefs", "signage": "plain geometric print guides; text authored separately", "roadMarkings": "road-context parameters; not traffic certification", "consumerObjects": ["plain recipe notebook", "ceramic bowl", "closed books"], "electronics": ["dial telephone", "cabinet television blank screen"], "clothing": "later character reference only: varied everyday clothing, regional and socioeconomic branches", "palette": ["earth browns", "muted olive optional", "warm neutral"]},
    "1980s": {"architecture": "ordinary painted walls with optional subdued patterned wallcovering", "furniture": "wood/laminate storage, cloth sofas, utilitarian institutional desks", "appliances": "unbranded squared enamel appliance profiles", "lighting": "shaded lamps and diffuse ceiling fixtures", "vehicles": "unbranded angular compact/sedan brief", "signage": "plain printed panels; no recognizable logo layout", "roadMarkings": "regional source review needed", "consumerObjects": ["blank folders", "plain storage bins", "generic dishware"], "electronics": ["corded push-button telephone", "inactive CRT enclosure"], "clothing": "later character brief only: conservative and expressive variants without universal style claim", "palette": ["warm neutrals", "muted blue/green", "wood finishes"]},
    "1990s": {"architecture": "painted walls, wood/laminate floors, practical institutional finishes", "furniture": "mixed wood/laminate storage and upholstered seating", "appliances": "unbranded squared appliance profiles", "lighting": "diffuse ambient plus shaded task lamps", "vehicles": "unbranded rounded sedan/minivan brief", "signage": "generic print signage with authored neutral text only", "roadMarkings": "regional source review needed", "consumerObjects": ["closed notebooks", "plain plastic storage", "generic mugs"], "electronics": ["inactive CRT", "corded phone", "unbranded compact stereo enclosure"], "clothing": "later reference only: diverse silhouettes and regional branches, no identity", "palette": ["off-white", "muted wood", "soft low-chroma accents"]},
    "2000s": {"architecture": "mixed practical suburban, apartment, civic and workplace finishes", "furniture": "wood/laminate and mixed textile seating; varied income branches", "appliances": "unbranded light or stainless-look enclosure briefs", "lighting": "warm/cool task combinations without flicker", "vehicles": "unbranded sedan/SUV brief", "signage": "simple printed or blank digital display panels", "roadMarkings": "regional source review needed", "consumerObjects": ["plain storage", "generic mugs", "blank paper files"], "electronics": ["inactive flat-display or CRT variants", "unbranded early mobile enclosure"], "clothing": "later character reference brief: ordinary clothing variants, no named logos", "palette": ["neutrals", "wood", "restrained cool accents"]},
    "2010s": {"architecture": "mixed modern and inherited older stock; avoid treating all places as renovated", "furniture": "mixed practical furniture and optional simpler contemporary forms", "appliances": "unbranded enamel or stainless-look packages", "lighting": "warm diffuse lamps, simple LED-style fixtures with no flicker", "vehicles": "unbranded contemporary sedan/crossover brief", "signage": "plain physical or inactive digital panels", "roadMarkings": "regional source review needed", "consumerObjects": ["plain bottles", "unlabelled storage", "generic notebooks"], "electronics": ["inactive flat display", "unbranded smartphone enclosure"], "clothing": "later reference only: no real brands, no universal fashion claim", "palette": ["soft neutrals", "wood", "low-chroma accents"]},
    "2020s": {"architecture": "contemporary and inherited older stock, configurable regional/income fit", "furniture": "maintained legacy or simple contemporary forms without assumed affluence", "appliances": "unbranded contemporary enclosure packages", "lighting": "diffuse LED-style ambient/task fixtures; no automatic colored strips", "vehicles": "unbranded contemporary sedan/crossover brief with powertrain unspecified", "signage": "neutral authored signs or blank inactive screens", "roadMarkings": "current jurisdiction evidence needed before exact markings", "consumerObjects": ["plain mugs", "unlabelled containers", "generic books"], "electronics": ["inactive flat display", "unbranded smartphone/laptop enclosure"], "clothing": "later reference brief only, region/person-specific evidence required for actual wardrobe", "palette": ["soft neutrals", "varied wood", "restrained color accents"]},
}

TRUTH_RULES = {
    "allowedStates": ["GENERIC", "INTERPRETIVE", "RECORDED SOURCE TRUTH", "SPATIALLY RECONSTRUCTABLE", "UNKNOWN"],
    "catalogDefault": "GENERIC",
    "generatedPlaceIsAutobiographicalTruth": False,
    "noAutomaticTruthPromotion": True,
    "personalizationRequires": ["authorized evidence reference", "consent scope", "source truth class", "alignment receipt", "reviewed person/place association"],
    "hybridRule": "Preserve truth class per component. A recorded insert does not promote its generic shell or generic props to recorded truth.",
    "realNamesAddressesFacesVoicesInThisCatalog": False,
}

COORDINATES = {"units": "meters", "handedness": "right-handed", "up": "+Y", "assetFront": "+Z", "cameraForward": "-Z",
               "origin": "primary-zone floor center", "zoneLocalOrigin": "floor center", "worldZoneTransforms": "translation only, explicit originMeters",
               "assetTransforms": "Apply mesh-specific transforms once and receipt them; root export may bake vertices. Do not apply a second axis conversion."}


def serialise(value):
    return (json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode()


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(serialise(value))


def material_defs(names):
    out = []
    for name in sorted(set(names)):
        desc, rough, metal, detail = MATERIALS[name]
        out.append({"id": "mat:" + name + ":v1", "name": name, "description": desc,
                    "pbrIntent": {"workflow": "metallic-roughness", "roughness": rough, "metallic": metal,
                                  "baseColorSpace": "sRGB", "dataMapSpace": "linear", "detail": detail},
                    "textureStatus": "SPECIFIED_NOT_GENERATED", "source": "original parameter brief; no imported texture",
                    "textureScaleMeters": {"macroTile": 2, "microTile": .12},
                    "nonRepetitionPlan": "macro albedo/roughness variation plus deterministic masks; high-frequency repeated detail alone is insufficient",
                    "lodFallback": "core glTF material with restrained base color and roughness; do not require unsupported shader"})
    return out


def modular_kits(f):
    primary = f["zones"][0]
    modules = [
        {"id": "kit:" + f["id"] + "-shell:v1", "role": "architecture-shell",
         "description": f["architecture"], "dimensionsMeters": primary["dimensionsMeters"],
         "materialIntent": f["finishes"][0], "shared": False},
        {"id": "kit:door-interior-accessible-neutral:v1", "role": "door",
         "description": "Unbranded door leaf and frame with 1.0 m clear opening target; edge radius, hinges and handle need detailed mesh review",
         "dimensionsMeters": {"width": 1.08, "height": 2.08, "depth": .045}, "materialIntent": "wood-oak-satin", "shared": True},
        {"id": "kit:window-residential-neutral:v1", "role": "window",
         "description": "Unbranded rectangular frame with .06 m depth; window style and mullions are era-swappable",
         "dimensionsMeters": {"width": 1.4, "height": 1.2, "depth": .06}, "materialIntent": "glass-clear", "shared": True},
        {"id": "kit:baseboard-painted-neutral:v1", "role": "trim",
         "description": "Reusable one-meter painted baseboard segment; corners and miters assembled deterministically",
         "dimensionsMeters": {"width": 1, "height": .09, "depth": .018}, "materialIntent": "paint-warm-off-white", "shared": True},
    ] if primary["kind"] == "interior" else [
        {"id": "kit:" + f["id"] + "-ground-shell:v1", "role": "ground-shell",
         "description": f["architecture"], "dimensionsMeters": {**primary["dimensionsMeters"], "height": .3},
         "materialIntent": f["finishes"][0], "shared": False},
        {"id": "kit:sidewalk-concrete-one-meter:v1", "role": "walkway",
         "description": "One-meter modular level sidewalk segment with expansion joint; configurable restrained wear",
         "dimensionsMeters": {"width": 1.8, "height": .08, "depth": 1}, "materialIntent": "concrete-weathered", "shared": True},
    ]
    for obj in f["items"]:
        if obj["role"] == "substitution-slot":
            continue  # An alignment/insertion boundary is not manufacturable art.
        modules.append({"id": "kit:" + f["id"] + "-" + obj["id"] + ":v1", "role": obj["role"],
                        "description": obj["label"] + "; unbranded and identity-free. Bank bounds are composition envelopes: generate submodules, not a solid block.",
                        "dimensionsMeters": obj["dimensionsMeters"], "materialIntent": obj["materialIntent"], "shared": False})
    for i, profile in enumerate(f["vegetation"]):
        canopy = any(term in profile for term in ("canopy", "tree", "conifer"))
        grass = "grass" in profile and not canopy
        vegetation_dimensions = {"width": 5, "height": 8, "depth": 5} if canopy else {"width": 1.2, "height": .22, "depth": 1.2} if grass else {"width": 1.6, "height": 1.5, "depth": 1.6}
        modules.append({"id": "kit:" + f["id"] + "-vegetation-" + str(i + 1) + ":v1", "role": "vegetation",
                        "description": profile + "; region/species assumption, visual review required; use proper silhouette and leaf geometry, not low-quality filler",
                        "dimensionsMeters": vegetation_dimensions,
                        "materialIntent": "leaf-neutral", "shared": False})
    for mod in modules:
        mod.update({"version": VERSION, "truthClassification": "GENERIC", "status": "SPECIFIED",
                    "candidateProviders": ["meshy", "tripo", "rodin", "replicate"],
                    "generationScope": "visual-geometry", "output": {"format": "GLB", "separateComponents": True,
                        "requirements": ["realistic meter scale", "PBR material bindings", "UVs without stretch", "mesh naming", "triangle counts", "LODs", "collision proxy", "no branding", "no real-person likeness"]},
                    "source": {"kind": "original-generic-design-spec", "creator": "UrAi production brief authored with Codex", "createdAt": CREATED_AT,
                               "provider": None, "promptVersion": VERSION, "externalAssets": []},
                    "rights": {"thirdPartySourceUsed": False, "license": "UNASSIGNED_PROJECT_AUTHORED_SPECIFICATION",
                               "commercialUseStatus": "NO_THIRD_PARTY_SOURCE_IN_SPEC; provider output rights require separate review", "attributionRequirement": "none identified for authored source brief; provider output terms pending"}})
    return modules


def nav_for(f):
    zones = []
    for z in f["zones"]:
        d = z["dimensionsMeters"]
        width = min(1.8, d["width"] - .6)
        zones.append({"zone": z["id"], "routeKind": "reserved-center-corridor", "widthMeters": width,
                      "pathLocalMeters": [[0, 0, d["depth"] / 2 - .35], [0, 0, -d["depth"] / 2 + .35]],
                      "turningArea": {"centerLocalMeters": [0, 0, 0], "diameterMeters": 1.5},
                      "obstacleEnvelopes": [o["id"] for o in f["items"] if o["zone"] == z["id"] and o["collidable"]]})
    if f["id"] == "gw-east-texas-residential-street":
        zones[0].update({"routeKind": "sidewalk-route", "widthMeters": 1.5,
                         "pathLocalMeters": [[-4.5, 0, 12], [-4.5, 0, -12]],
                         "turningArea": {"centerLocalMeters": [-4.5, 0, 0], "diameterMeters": 1.5}})
    if f["id"] == "gw-rural-road":
        zones[0].update({"routeKind": "roadside-observation-route", "widthMeters": 1.8,
                         "pathLocalMeters": [[12, 0, 12], [12, 0, -12]],
                         "turningArea": {"centerLocalMeters": [12, 0, 0], "diameterMeters": 1.5}})
    return {"status": "DESIGN_REQUIREMENTS_ONLY_NOT_BAKED", "targetClearRouteWidthMeters": 1.2,
            "targetDoorClearWidthMeters": 1.0, "targetTurningDiameterMeters": 1.5,
            "accessibleDefault": {"levelThreshold": True, "stairsRequired": False, "doorsAutomaticOrFixedOpen": True,
                                  "seatedEyeHeightMeters": 1.2, "standingEyeHeightMeters": 1.65,
                                  "legalAccessibilityCertification": False},
            "zones": zones, "connections": [{"from": f["zones"][i]["id"], "to": f["zones"][i + 1]["id"],
                "clearWidthMeters": 1.4, "stepHeightMeters": 0, "status": "SPECIFIED_NOT_BAKED"} for i in range(len(f["zones"]) - 1)],
            "xr": {"safeTeleport": "Navmesh-constrained valid polygons; no water, roadway, dock edge, machinery or insert void destinations",
                   "teleportSpacingMeters": 1.5, "edgeMarginMeters": .45, "physicalDeviceVerified": False},
            "controls": {"keyboard": True, "touch": True, "reducedMotion": True, "snapTurnOptional": True,
                         "noForcedVisibleHands": True, "uiTargetMinimumCssPixels": 48},
            "requiredBeforeIntegration": ["baked navigation polygons", "collision/navmesh consistency test", "connected exit route", "door-state traversal test", "teleport valid/invalid surface tests", "seated and standing camera clearance", "device verification where claimed"]}


def camera_shots(f):
    d = f["zones"][0]["dimensionsMeters"]
    width, depth = d["width"], d["depth"]
    eye = 1.65
    return [
        {"id": "wide", "kind": "wide", "positionLocalMeters": [0, eye, depth / 2 - .45], "lookAtLocalMeters": [0, 1.1, -depth / 4], "fovDegrees": 64, "aspect": "16:9"},
        {"id": "eye-height", "kind": "first-person", "positionLocalMeters": [0, eye, .6], "lookAtLocalMeters": [0, eye, -depth / 2 + .4], "fovDegrees": 62, "aspect": "16:9"},
        {"id": "doorway", "kind": "navigation", "positionLocalMeters": [0, eye, depth / 2 + .3], "lookAtLocalMeters": [0, eye, 0], "fovDegrees": 58, "aspect": "16:9"},
        {"id": "material-detail", "kind": "detail", "positionLocalMeters": [-width / 2 + .85, 1.4, depth / 2 - 1.1], "lookAtLocalMeters": [-width / 2 + .1, 1.0, depth / 2 - 1.1], "fovDegrees": 38, "aspect": "4:3"},
        {"id": "mobile-budget", "kind": "tier-comparison", "tier": "mobile", "sameCameraAs": "wide", "aspect": "16:9"},
        {"id": "xr-seated", "kind": "xr-relevant", "positionLocalMeters": [0, 1.2, .6], "lookAtLocalMeters": [0, 1.2, -depth / 2 + .4], "fovDegrees": 70, "aspect": "1:1", "physicalHeadsetCapture": False},
    ]


def spec(f):
    mods = modular_kits(f)
    all_finishes = f["finishes"] + [o["materialIntent"] for o in f["items"]] + [m["materialIntent"] for m in mods]
    if f["vegetation"]:
        all_finishes.extend(["leaf-neutral", "bark-neutral"])
    primary = f["zones"][0]
    d = primary["dimensionsMeters"]
    ext = primary["kind"] != "interior"
    personal_slot_x = d["width"] / 2 - min(1.2, d["width"] / 4)
    return {
        "$schema": "../schema/world-spec.schema.json", "schemaVersion": SCHEMA_VERSION,
        "id": f["id"], "version": VERSION, "batch": f["batch"], "title": f["title"],
        "truthClassification": "GENERIC", "status": "SPECIFIED", "createdAt": CREATED_AT,
        "designIntent": f["intent"], "coordinateConvention": COORDINATES,
        "historicalClaim": {"isHistoricalReconstruction": False, "isUniversalEraOrRegionClaim": False,
                            "designAssumptions": "Plausible design brief only. Era, species, equipment, road markings and regional detail need evidence-specific review before personalization."},
        "region": {"default": f["region"], "taxonomyRef": "../taxonomy/regions.json", "namedLocation": None, "exactAddress": None},
        "era": {"allowed": ["era-" + e for e in f["eras"]], "default": "era-" + f["eras"][0], "packRefPattern": "../era-packs/{era}.json"},
        "variantAxesRef": "../taxonomy/variant-axes.json",
        "controlledVariants": {"era": ["era-" + e for e in f["eras"]], "region": [f["region"], "region-adapter-required"],
            "season": ["spring", "summer", "autumn", "winter"], "weather": ["clear", "overcast", "light-rain", "dry-haze"] if ext else ["clear", "overcast", "light-rain-exterior-only"],
            "timeOfDay": ["dawn", "morning", "midday", "afternoon", "dusk", "night"],
            "finishLevel": ["basic-maintained", "modest-worn", "middle-maintained", "institutional-practical"],
            "furniturePackage": ["era-neutral", "era-adapter-reviewed", "personal-substitution-governed"],
            "propPackage": ["none", "neutral-light", "neutral-rich", "personal-evidence-governed"],
            "wallFloorCeiling": f["finishes"], "lightingProfile": ["neutral", "calm", "reflective", "energized", "heavy", "uncertain", "hopeful"],
            "vegetation": ["none", "region-profile-neutral", "region-adapter-reviewed"] if ext else ["none", "exterior-window-view-only"],
            "signage": ["none", "blank", "neutral-authored-text-after-review"], "vehicles": ["none", "unbranded-era-slot-reviewed"] if ext else ["none"],
            "navigation": ["accessible-level-default", "alternate-geometry-reviewed"], "lod": ["desktop", "mobile", "xr"],
            "dressing": ["empty", "light", "rich"], "familyOptions": f["familyVariants"]},
        "composition": {"zones": f["zones"], "architectureBrief": f["architecture"],
            "openings": [{"id": "primary-entry", "zone": primary["id"], "wall": "+Z", "centerLocalMeters": [0, 1.05, d["depth"] / 2],
                "nominalWidthMeters": 1.1 if not ext else 1.8, "heightMeters": min(2.1, d["height"]),
                "clearWidthTargetMeters": 1.0 if not ext else 1.8, "levelThreshold": True,
                "status": "SPECIFIED_NOT_GEOMETRY_VALIDATED"}],
            "furniture": f["items"], "propBriefs": f["props"], "vegetationBriefs": f["vegetation"],
            "dressingRules": {"empty": "Shell, openings, orientation landmark and required safety geometry only",
                "light": "Specified furniture plus sparse neutral props on supporting surfaces; no real people",
                "rich": "Add governed prop submodules within reserved placement envelopes; maintain clear route, readable exits and low visual stimulation",
                "people": "Not generated in this lane; occupancy, character likeness, voices and animation require separate identity/consent authority"}},
        "modularKit": mods,
        "dependencyManifest": {"status": "LOGICAL_SPEC_REFERENCES_ONLY", "resolver": "existing Asset Factory governed resolution; no new runtime path",
            "assetFactoryAuthority": {"repository": "urai-asset-factory", "integrationBinding": None},
            "logicalKitIds": [m["id"] for m in mods], "actualOutputArtifacts": [], "brokenBinaryDependencyTest": "NOT_APPLICABLE_NO_BINARY_OUTPUT_BOUND"},
        "materialDefinitions": material_defs(all_finishes),
        "lighting": {"status": "CONFIGURATION_TARGET_NOT_RENDER_VALIDATED", "primary": "diffuse natural light plus restrained practical fixtures",
            "interiorFixtureCctKelvin": 3000 if not ext else 4000, "daylightCctKelvin": 5600,
            "targetIlluminanceLux": {"navigation": 100 if not ext else 80, "task": 250 if not ext else 150},
            "toneMappingIntent": "preserve midtone orientation and restrained highlights; no crushed blacks or blown window regions",
            "emotionalWeatherRef": "../taxonomy/emotional-weather.json", "weatherDrivenSaturation": False,
            "noStrobe": True, "reducedStimulation": {"movingShadows": False, "animatedWaterAmplitudeMeters": .015, "suddenLightning": False, "exposureAdaptation": "slow optional, disableable"}},
        "navigation": nav_for(f),
        "audio": {"status": "SPECIFIED_NO_AUDIO_BYTES", "ambienceBriefs": f["ambience"], "music": None,
                  "speech": None, "copyrightedRecordings": False, "requiredSourceRights": "separate recording/generation receipt before runtime use",
                  "reducedStimulation": {"defaultLevel": "restrained", "suddenTransientSounds": False, "muteSupported": True}},
        "personalization": {"enabledByDefault": False, "truthRulesRef": "../taxonomy/truth-rules.json",
            "anchors": [{"id": "entry-floor-center", "zone": primary["id"], "positionLocalMeters": [0, 0, d["depth"] / 2 - .6], "orientationYawDegrees": 0, "purpose": "return continuity and coordinate alignment"},
                {"id": "neutral-display-wall", "zone": primary["id"], "positionLocalMeters": [-d["width"] / 2 + .03, 1.5, 0], "orientationYawDegrees": 90, "purpose": "authorized photo/object placement; empty by default"},
                {"id": "captured-insert-slot", "zone": primary["id"], "positionLocalMeters": [personal_slot_x, 0, -d["depth"] / 3], "orientationYawDegrees": 0, "purpose": "reviewed captured reality replacement boundary; disabled in generic spec"}],
            "accepts": ["authorized photos", "real-family-object substitutions", "era corrections", "region adapter", "named-location association after evidence review", "vehicles", "personal audio and voices through consent gate", "characters through identity gate", "memory anchors", "emotional state", "narrative beats", "captured subspaces"],
            "recordedInsert": {"status": "UNBOUND", "formats": ["Gaussian splat", "photogrammetry", "NeRF/splat hybrid", "GLB reconstructed subspace"],
                "defaultTransform": {"translationMeters": [0, 0, 0], "rotationQuaternionXyzw": [0, 0, 0, 1], "scale": [1, 1, 1]},
                "boundingVolume": {"kind": "AABB", "extentMeters": [min(2, d["width"] / 3), min(2.2, d["height"]), min(2, d["depth"] / 3)], "placement": "captured-insert-slot", "doNotIntersectReservedRoute": True},
                "alignmentRequires": ["source coordinate convention", "unit scale receipt", "at least three reviewed noncollinear alignment anchors", "transform residuals", "bounding volume", "collision authority", "occlusion shell", "lighting blend parameters", "source truth and consent receipts"],
                "collision": "Use a separately validated proxy; a splat is not walkable collision or navigation evidence",
                "replaceNotOverlay": "Disable covered generic geometry after accepted alignment to avoid double walls, z-fighting and false occlusion",
                "privacy": "Opaque revocable source references only; no private coordinates, identities or raw media in public specs"}},
        "performanceProfiles": {"status": "DESIGN_BUDGETS_NOT_MEASUREMENTS", "basis": "initial conservative content targets; runtime/device metrics remain unmeasured",
            "desktop": {"visibleTriangleTarget": 750000, "textureMemoryMiBTarget": 384, "drawCallsTarget": 220, "maxSingleTextureEdge": 2048, "targetFps": 60},
            "mobile": {"visibleTriangleTarget": 120000, "textureMemoryMiBTarget": 96, "drawCallsTarget": 85, "maxSingleTextureEdge": 1024, "targetFps": 30},
            "xr": {"visibleTriangleTarget": 180000, "textureMemoryMiBTarget": 128, "drawCallsTarget": 95, "maxSingleTextureEdge": 1024, "targetFps": 72},
            "lodRules": {"preserve": ["silhouette", "doorway clearance", "orientation landmarks", "collision topology"],
                "mobile": "merge static kit surfaces where governed resolver allows, reduce texture edge and secondary props, retain route and exits",
                "xr": "stable silhouettes and low draw overhead; no aggressive near-field popping; headroom validated on physical devices",
                "switching": "screen-space thresholds with hysteresis, tested under camera motion; no runtime switching implemented by this spec"}},
        "previewPlan": {"status": "NOT_RENDERED_BY_SPEC_LANE", "shots": camera_shots(f),
                        "requiredReceiptFields": ["sourceSpecSha256", "assetSha256", "renderer/version", "camera matrix", "tier", "seed", "lighting", "imageSha256", "visualReviewer", "knownLimitations"]},
        "qa": {"specValidation": "machine-check dimensions, zone references, naming, truth boundary, navigation reservations and deterministic hashes",
            "assetValidation": "NOT_RUN_NO_ASSET_BYTES", "visualAcceptance": "NOT_REVIEWED", "aaaAccepted": False,
            "requiredAssetChecks": ["GLB structure", "geometry integrity", "normals", "UVs", "texture/material binding", "triangles", "file bytes", "texture memory", "bounds", "scale", "orientation", "origin", "collisions", "baked navmesh", "LOD switching", "missing dependencies", "duplicate hashes"],
            "requiredVisualChecks": ["believable proportions", "door/window construction", "no floating or intersecting furniture", "material scale", "non-repeated wear", "foliage silhouette", "readable exits", "lighting", "era/regional suitability without truth inflation", "seated and standing eye-height quality"]},
        "provenance": {"sourceKind": "original-generic-design-specification", "creator": "UrAi production brief authored with Codex", "createdAt": CREATED_AT,
            "generationProvider": None, "generationDate": None, "promptSpecVersion": VERSION, "sourceMedia": [], "thirdPartyAssets": [],
            "references": [{"repository": "urai-studio", "issue": 153}, {"repository": "urai-jobs", "issue": 152}],
            "licensing": {"license": "UNASSIGNED_PROJECT_AUTHORED_SPECIFICATION", "repositoryLicenseFound": False,
                "attributionRequired": "none identified for authored brief", "commercialUseStatus": "No third-party source bytes in these specifications; provider/artifact commercial rights not established by a source brief",
                "restrictions": ["no autobiographical truth claim", "no real-person identity", "no licensed brands without explicit record", "no private source media"] + f["restrictions"]}},
        "productionStatus": {"sourceSpecification": "SPECIFIED", "modelPackage": "NOT_GENERATED_BY_SPEC_LANE", "textures": "SPECIFIED_NOT_GENERATED",
            "lighting": "SPECIFIED", "collision": "SPECIFIED_NOT_VALIDATED", "navmesh": "SPECIFIED_NOT_BAKED", "lods": "SPECIFIED",
            "previews": "NOT_RENDERED_BY_SPEC_LANE", "performanceMeasurements": "NOT_MEASURED", "runtimeIntegrated": False,
            "productionDeployed": False, "spatialAccepted": False, "independentlyApproved": False, "xrCertified": False},
        "knownLimitations": ["Design intent alone does not meet AAA visual acceptance.", "No geometry, texture, audio, navmesh or provider output bytes are produced by this Studio spec file.",
            "Era/region detail is a generic creative assumption and requires user-source correction when attached to memory.", "Requested budgets are targets and do not prove runtime FPS, device performance or certification.",
            "Opening dimensions and navigation reserves need validation against actual generated geometry.", "Shared kits are logical IDs; actual asset resolution must use existing Asset Factory authority."],
        "integrationBoundary": {"activeSpatialCandidateModified": False, "runtimeAssetBinding": None, "releaseCandidate": None,
                                "requiresSeparateIntegrationPRAndEvidence": True},
    }


def variant_taxonomy():
    return {"schemaVersion": SCHEMA_VERSION, "id": "urai-generic-world-variant-axes", "version": VERSION,
        "truthClassification": "GENERIC", "seedPolicy": {"algorithm": "SHA-256 of canonical familyId/version/axis-selection/specSha256", "floatingRandomnessAllowed": False},
        "identifier": {"familyPattern": "gw-{slug}", "variantPattern": "{family}@{version}+{era}.{region}.{dressing}.{tier}.{lighting}.{seed12}",
                       "receiptPattern": "sha256:{digest}", "successors": "New spec/version and new output hashes; never overwrite accepted output history"},
        "axes": {
            "era": ["era-" + e for e in ERA_DATA], "region": ["us-tx-east", "us-south-generic", "us-coastal-generic", "region-adapter-required"],
            "season": ["spring", "summer", "autumn", "winter"], "weather": ["clear", "overcast", "light-rain", "dry-haze"],
            "timeOfDay": ["dawn", "morning", "midday", "afternoon", "dusk", "night"],
            "finishLevel": ["basic-maintained", "modest-worn", "middle-maintained", "institutional-practical"],
            "furniturePackage": ["era-neutral", "era-adapter-reviewed", "personal-substitution-governed"],
            "propPackage": ["none", "neutral-light", "neutral-rich", "personal-evidence-governed"],
            "lightingProfile": ["neutral", "calm", "reflective", "energized", "heavy", "uncertain", "hopeful"],
            "dressing": ["empty", "light", "rich"], "tier": ["mobile", "desktop", "xr"],
            "navigation": ["accessible-level-default", "alternate-geometry-reviewed"],
            "signage": ["none", "blank", "neutral-authored-text-after-review"], "vehicles": ["none", "unbranded-era-slot-reviewed"],
            "vegetation": ["none", "region-profile-neutral", "region-adapter-reviewed"]},
        "compatibilityRules": [
            {"when": {"variant.weather": "light-rain"}, "requires": "regional/climatic applicability and no slippery-looking accessible route without clear alternate"},
            {"when": {"variant.timeOfDay": "night"}, "requires": "illuminated exit landmark and stable exposure; no pitch-black navigation"},
            {"when": {"variant.dressing": "rich"}, "requires": "same clear route and low-stimulation switch; no people introduced"},
            {"when": {"variant.region": "region-adapter-required"}, "requires": "reviewed region pack before asset acceptance"},
            {"when": {"variant.furniturePackage": "personal-substitution-governed"}, "requires": "evidence/consent gate and component-level truth receipts"},
            {"when": {"variant.navigation": "alternate-geometry-reviewed"}, "requires": "new collision/navmesh and reachable-exit QA"}],
        "unimplementedAxisCombinations": "Specs define controlled choices. This catalog does not pretend every Cartesian combination is generated or accepted."}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", type=Path, default=ROOT)
    args = ap.parse_args()
    out = args.out.resolve()
    write_json(out / "taxonomy" / "truth-rules.json", TRUTH_RULES)
    write_json(out / "taxonomy" / "coordinate-convention.json", COORDINATES)
    write_json(out / "taxonomy" / "variant-axes.json", variant_taxonomy())
    write_json(out / "taxonomy" / "regions.json", {"schemaVersion": SCHEMA_VERSION, "version": VERSION,
        "defaultRegion": "us-tx-east", "regionIsHistoricalEvidence": False,
        "regions": [
            {"id": "us-tx-east", "parent": "us-south-generic", "label": "East Texas generic creative adapter", "status": "SPECIFIED_NOT_SOURCE_VERIFIED",
             "assumptions": {"climateFeel": "warm/humid variants; not site-specific climatology", "vegetation": "broadleaf and optional mixed pine profiles subject to species review", "builtEnvironment": "ordinary maintained suburban/rural/civic stock, varied income and era", "snowDefault": False}, "namedPlaces": [], "preciseCoordinates": None},
            {"id": "us-south-generic", "parent": None, "label": "U.S. South generic adapter", "status": "SPECIFIED_NOT_SOURCE_VERIFIED", "assumptions": {"notUniversal": True, "regionalDetail": "requires subregion and context review"}, "namedPlaces": [], "preciseCoordinates": None},
            {"id": "us-coastal-generic", "parent": None, "label": "Generic U.S. coast adapter", "status": "SPECIFIED_NOT_SOURCE_VERIFIED", "assumptions": {"species": "unspecified", "climate": "unspecified", "noPalmDefault": True}, "namedPlaces": [], "preciseCoordinates": None}],
        "extensionContract": {"required": ["id", "parent", "label", "climate assumptions", "vegetation/architecture review", "source provenance if historical claims", "era compatibility", "accessibility profile"], "regionIdPattern": "{country}-{subregion}-{adapter-version}", "noUserCultureAssumption": True}})
    write_json(out / "taxonomy" / "emotional-weather.json", {"schemaVersion": SCHEMA_VERSION, "version": VERSION,
        "notDiagnosis": True, "changesTruthState": False, "notNarrativeEvidence": True,
        "profiles": [
            {"id": "neutral", "exposureDeltaStops": 0, "cctDeltaKelvin": 0, "saturationScale": 1},
            {"id": "calm", "exposureDeltaStops": 0, "cctDeltaKelvin": -150, "saturationScale": .94},
            {"id": "reflective", "exposureDeltaStops": -.08, "cctDeltaKelvin": -100, "saturationScale": .92},
            {"id": "energized", "exposureDeltaStops": .08, "cctDeltaKelvin": 100, "saturationScale": 1.03},
            {"id": "heavy", "exposureDeltaStops": -.1, "cctDeltaKelvin": -100, "saturationScale": .9},
            {"id": "uncertain", "exposureDeltaStops": -.04, "cctDeltaKelvin": 80, "saturationScale": .94},
            {"id": "hopeful", "exposureDeltaStops": .1, "cctDeltaKelvin": -120, "saturationScale": 1.02}],
        "safety": {"minimumNavigationLuxTarget": 80, "exitVisibilityRequired": True, "strobe": False, "suddenLightning": False,
                   "animatedExposure": "optional and disableable", "lowStimulationOverride": "neutral, no motion, no transient audio, sparse dressing"}})
    for era, data in ERA_DATA.items():
        write_json(out / "era-packs" / ("era-" + era + ".json"), {"schemaVersion": SCHEMA_VERSION, "id": "era-" + era, "version": VERSION,
            "status": "SPECIFIED", "truthClassification": "GENERIC", "historicalReconstruction": False,
            "universalHistoricalClaim": False, "scope": "Creative modular brief; region, income, older retained objects and renovation dates vary",
            "components": data, "compatibleRegionAxes": ["us-tx-east", "us-south-generic", "region-adapter-required"],
            "variationRules": ["Earlier objects may persist into later eras; do not require every object to match a single decade style", "Income, region, institution and household taste can override palette choices", "Exact personal wardrobe, vehicle or appliance requires authorized evidence"],
            "provenance": {"source": "original generic design brief", "createdAt": CREATED_AT, "externalAssets": []},
            "generationStatus": "NO_ASSET_BYTES", "license": "UNASSIGNED_PROJECT_AUTHORED_SPECIFICATION"})
    entries = []
    for f in FAMILIES:
        s = spec(f)
        path = out / "specs" / (s["id"] + ".json")
        write_json(path, s)
        entries.append({"id": s["id"], "version": VERSION, "batch": s["batch"], "title": s["title"], "truthClassification": "GENERIC",
                        "status": "SPECIFIED", "sourceSpec": str(path.relative_to(out)), "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                        "modularKitCount": len(s["modularKit"]), "zoneCount": len(s["composition"]["zones"]), "runtimeBinding": None})
    manifest = {"schemaVersion": SCHEMA_VERSION, "id": "urai-generic-world-library", "version": VERSION, "createdAt": CREATED_AT,
        "truthClassification": "GENERIC", "authority": {"studioIssue": 153, "jobsIssue": 152,
            "studioBaseSha": "854477d80b1a7aa718edb60d1ed4c1cf22dbed9d", "activeSpatialCandidateTouched": False},
        "scope": "Source specifications and packaging contracts only; Asset Factory geometry/provider results require their own receipts",
        "worldCount": len(entries), "batch1Count": sum(e["batch"] == 1 for e in entries), "batch2Count": sum(e["batch"] == 2 for e in entries),
        "worlds": entries, "eraPackCount": len(ERA_DATA), "assetCompleteCount": 0, "runtimeIntegratedCount": 0, "visualAcceptedCount": 0,
        "providerExecution": "NONE", "sourceLicensing": "No third-party input assets; authored specification license remains unassigned", "integration": "UNBOUND"}
    write_json(out / "catalog.json", manifest)
    inputs = [out / "build_catalog.py", out / "schema" / "world-spec.schema.json"]
    source_files = [p for p in inputs if p.exists()]
    outputs = sorted(list((out / "specs").glob("*.json")) + list((out / "taxonomy").glob("*.json")) + list((out / "era-packs").glob("*.json")) + [out / "catalog.json"])
    records = [{"path": str(p.relative_to(out)), "sha256": hashlib.sha256(p.read_bytes()).hexdigest(), "bytes": p.stat().st_size} for p in outputs]
    write_json(out / "receipts" / "source-specification-receipt.json", {"schemaVersion": "urai-spec-receipt/1.0.0", "createdAt": CREATED_AT,
        "receiptKind": "SOURCE_SPECIFICATION_HASHES", "truthClassification": "GENERIC", "assetGenerationOccurred": False,
        "inputs": [{"path": str(p.relative_to(out)), "sha256": hashlib.sha256(p.read_bytes()).hexdigest(), "bytes": p.stat().st_size} for p in source_files],
        "outputs": records, "outputSetSha256": hashlib.sha256(serialise(records)).hexdigest(), "immutableIntent": "Versioned files; publish by immutable git commit or archived package before authority use", "providerSpend": 0})
    print(json.dumps({"out": str(out), "worlds": len(entries), "batch1": manifest["batch1Count"], "batch2": manifest["batch2Count"], "eraPacks": len(ERA_DATA), "status": "SPECIFIED"}))


if __name__ == "__main__":
    main()
