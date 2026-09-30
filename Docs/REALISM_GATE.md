# REALISM GATE — shipping quality bar

A build is rejected if any of the following is visible in normal gameplay screenshots:

- film grain, full-screen noise, deliberate blur, fake fog used to hide geometry;
- roads or intersections that do not correspond to the real Yilan alignment in Tier A zones;
- landmark buildings replaced by generic boxes;
- repeated low-poly pedestrians/vehicles within the player's near field;
- unreadable or texture-smeared road markings/signage at normal camera distance;
- visibly tiled 512px/1K hero-surface textures in 4K mode;
- floating streetlights, signs, vehicles, or sidewalks;
- wrong side-of-road driving logic or impossible lane connectivity;
- fake tunnel teleportation or shortened Xueshan Tunnel in the production map.

## Target frame-quality

PC High: 1440p/60 target, TAA/TSR quality, no grain.
PC Ultra: 4K/60 target on high-end GPU, Nanite + Lumen + virtual shadows.
Photo Mode: native 4K output, highest LOD/texture bias, traffic simulation may reduce for capture quality.

## Near-field asset targets

Hero car: 150k–350k visible triangles after Nanite/import optimization; 4K PBR exterior and interior hero surfaces.
Pedestrian: MetaHuman-quality silhouette/skin/hair target or equivalent licensed character quality.
Hero facade: bespoke geometry for windows, arcades, AC units, signs, awnings, utility lines, roof equipment.
Road: 2K–4K PBR asphalt plus decals for repairs, drains, manholes, lane wear, puddles and curb dirt.
