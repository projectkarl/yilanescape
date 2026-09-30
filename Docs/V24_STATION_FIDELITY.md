# v2.4 Station Fidelity Upgrade

## Goal
Build a station-front vertical slice that can survive a parked, daylight, close-range camera. Fidelity must come from geometry, materials and correct placement—not post-process blur.

## Current public-reference facts locked for art review
1. Yilan Station official address: No. 1 Guangfu Road, Yilan City.
2. TRA lists a front-station taxi waiting area at the station address.
3. Diudiudang Forest / Jimmy Square is directly associated with the station precinct; Yilan tourism describes nine steel trees about 14 m high and a suspended green train installation.
4. Yilan tourism describes Yilan Xingkou as a station-front historic warehouse context dating to 1919 and later preserved/rebuilt in its historic character.

## v2.4 hero scene components
- Station facade hero mesh
- Station forecourt canopy / hardscape module
- Taxi waiting/shelter module
- Diudiudang steel-tree and suspended-train modules
- Xingkou warehouse reference mesh
- High-detail taxi, bus and scooter visual meshes
- 4K pavers, road paint, warehouse plaster and clean brushed metal

## Shipping blockers still open
- Station facade must be photo-matched from a current reference set; the current mesh is a production reference model, not photogrammetry.
- Exact station-forecourt curb geometry, lamp positions, sign text and storefront frontage must be surveyed/verified against current imagery and authoritative map data.
- Jimmy artwork/characters require rights review before exact reproduction. Structural/site context may be modeled, while copyrighted artwork must not be copied blindly.
- Vehicles need skeletal/Chaos rigs, interior materials and damage LODs before gameplay sign-off.
- Hero pedestrians need a high-quality skeletal pipeline (MetaHuman/equivalent), not static crowd proxies.

## Visual rejection criteria
Reject any review capture with:
- film grain/noise overlay
- fog hiding near-field geometry
- low-resolution textures visible at normal driving camera distance
- mismatched curb/road alignment at a hero intersection
- generic facade substituted for a named landmark
- blurred TAA/DOF used to disguise asset limitations
