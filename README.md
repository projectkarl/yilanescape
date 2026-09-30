# YILAN // REDLINE v2.4 — Station Fidelity Upgrade

This package continues the formal UE5 high-fidelity production line. v2.4 focuses on the Yilan Station forecourt, station-area mobility, street frontage and close-range streetscape quality instead of adding more screen-space effects.

## Physically included
- **50 importable GLB source assets** in `Content/SourceAssets/HighPoly/`.
- **651,054 source triangles** across the catalog.
- **13 local PBR material sets**, including 7 hero 4K sets and 6 support 2K sets.
- New station-front plaza canopy, taxi shelter, Xingkou warehouse reference mesh, 5-storey arcade block, station planter/bench and signage kits.
- New high-detail unbranded Taiwan-style hero scooter, city bus and taxi visual meshes.
- New double-arm streetlight, tactile paving, storm drain and road-arrow kits for close-up street fidelity.
- New publicly-visible Xueshan tunnel ceiling-service visual module. Restricted operational/security layout is not modeled.
- `StationDistrictAssemblyV24.json` defines the v2.4 hero/support set and quality gate.

## Reality baseline
- Yilan Station is locked to the official station context at Guangfu Road No. 1.
- The station-front taxi waiting area is part of the official transfer context and is represented as a scene module.
- Diudiudang Forest / Jimmy Square remains a station-adjacent hero zone. The nine ~14 m steel-tree structure and suspended train remain photo-match-gated.
- The historic Yilan Xingkou station-front warehouse context is represented with a dedicated hero reference mesh; shipping geometry still requires current-site photo matching.

## Quality gate
- No screen-space film grain.
- No dense fog or depth-of-field used to hide mesh quality.
- Named hero landmarks cannot be replaced by generic procedural buildings.
- Hero static meshes use Nanite where appropriate.
- Hero vehicle GLBs are visual meshes only until Chaos/skeletal rigs are authored.
- Final shipping landmark placement requires authoritative map alignment and current-site photo review.

## Validation
```bash
python Scripts/validate_world_reference.py
python Scripts/validate_highpoly_assets.py
```

Then in Unreal Editor run `Scripts/UE5/import_highpoly_assets.py`.

See `Docs/V24_STATION_FIDELITY.md`, `Docs/HIGH_POLY_ASSET_CATALOG.md`, `Docs/REALISM_GATE.md` and `Content/Data/HighPoly/StationDistrictAssemblyV24.json`.
