# v2.1 high-poly import

The source pack lives in `Content/SourceAssets/HighPoly/*.glb`. These are source files, not cooked `.uasset` files.

## Automated import
1. Open the project in Unreal Editor.
2. Ensure **Interchange**, **Interchange Editor**, and **Python Editor Script Plugin** are enabled.
3. Run `Scripts/import_highpoly_assets.py` from **Tools → Execute Python Script**.
4. Imported assets appear under `/Game/HighPoly/<category>`.
5. Open the hero car and selected street props in Static Mesh Editor and verify Nanite visualization before approving them for World Partition cells.

UE 5.8's Interchange pipeline supports GLB/glTF importing and is the intended importer for this pack. Nanite is enabled for dense static meshes where requested by the manifest; the scooter is intentionally kept non-Nanite until a skeletal/Chaos vehicle version is authored.

## What is actually high-poly here
- `SM_Redline_HeroSupercar_HQ`: ~177k source triangles, unbranded original design. It is a **visual mesh**; a final drivable car still needs a proper skeletal/Chaos vehicle rig, collision primitives, wheel bones, suspension and authored 4K materials.
- Street light / traffic signal: dense round geometry and separate luminaires/lenses rather than low-sided cylinders.
- Scooter: detailed traffic/display mesh. A drivable scooter requires its own skeletal rig.
- Crowd proxy: medium-distance silhouette proxy only. It is **not** a replacement for MetaHuman/equivalent hero pedestrians.

## Placement rule
Do not scatter these assets randomly. In Tier A Yilan zones, placement must be driven by the verified road/street-furniture reference layer. Asset type is reusable; location is not guessed.
