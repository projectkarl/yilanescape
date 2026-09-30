# YILAN // REDLINE v2.3 — High-Poly Station District Build

This UE5 production package continues the formal high-fidelity line. v2.3 adds a station-district asset layer instead of another visual-effects pass.

## Physically included
- **36 importable GLB source assets** in `Content/SourceAssets/HighPoly/`.
- **436,178 source triangles** across the catalog.
- **9 local PBR material sets**: 6×2K support materials plus 3×4K hero materials.
- A new high-detail Yilan Station facade reference mesh, station-front arcade/shop modules, parked scooter cluster, pedestrian signal, bus-stop pole, street tree/planter and clean crosswalk/stop-line kit.
- A new Diudiudang suspended-train landmark proxy plus the existing nine-instance 14 m steel-tree module.
- Xueshan/freeway additions: visible south-portal visual module, tunnel light rail and double barrier.
- UE5 Python importer updated for 2K/4K textures, Nanite and first-pass `material_hint` assignment.
- `StationFrontHeroKit.json` defines the asset set and a no-grain/photo-match quality gate for the station vertical slice.

## New v2.3 hero-quality materials
- `M_Asphalt_Pro_4K`
- `M_Yilan_StationPaint_4K`
- `M_Yilan_AgedBrick_4K`

All three are **4096×4096 BaseColor / Normal / Roughness / Metallic** asset textures. They do not add screen-space film grain.

## Reality rule
High polygon count alone does not make a real landmark accurate. The Yilan Station and Diudiudang meshes are reference-locked production meshes, **not photogrammetry**. Final shipping placement/proportions still require current-site photo matching and authoritative map alignment. Generic arcade/store modules must never replace a named hero building.

## Validation
```bash
python Scripts/validate_world_reference.py
python Scripts/validate_highpoly_assets.py
```

Then inside UE5 run `Scripts/UE5/import_highpoly_assets.py`.

See `Docs/HIGH_POLY_ASSET_CATALOG.md`, `Docs/V23_REFERENCE_NOTES.md`, `Docs/REALISM_GATE.md` and `Content/Data/HighPoly/StationFrontHeroKit.json`.
