# Station district vertical-slice build — v2.3

## Art target
The next playable vertical slice is the Yilan Station / Jimmy Square arrival zone. The quality target is crisp, close-range game art: no full-screen grain, no fake blur to hide mesh quality, and no generic box building standing in for a named landmark.

## Hero layer
1. Yilan Station facade: use `SM_Yilan_Station_Facade_Hero_HQ` as the source/reference mesh and photo-match it in UE5 before sign-off.
2. Diudiudang Forest: use nine `SM_Yilan_Diudiudang_SteelTree_14m_HQ` instances only after current-site layout QA.
3. Suspended train: use `SM_Yilan_Diudiudang_SuspendedTrain_HQ` as the art proxy, then refine proportions/material breakup from permitted current references.
4. Hero roads: use `M_Asphalt_Pro_4K`; lane paint should remain sharp at parked-car camera distance.
5. Station surface: use `M_Yilan_StationPaint_4K` as an authored base, then art-direct mural/color regions separately rather than baking a copied third-party image.

## Support layer
Arcade buildings, corner shops, scooter clusters, bus-stop poles, pedestrian signals, street trees, curb/drain, utility poles, AC units and road markings can be instanced along verified street geometry. Named buildings remain bespoke.

## UE5 setup
- World Partition enabled for the production map.
- Nanite for static hero architecture and dense street props.
- Lumen/VSM for the PC high-fidelity target.
- HLOD for background streets; do not lower the parked-camera hero zone below the visual gate.
- Hero characters must use a skeletal high-quality character pipeline; the crowd proxy is never a first-person-close character.
- Drivable vehicles require Chaos-ready skeletal/wheel rigs; static GLBs are visual sources, not finished physics vehicles.

## Reality QA
Official Yilan tourism references identify Jimmy Square / Diudiudang Forest directly opposite Yilan Station, nine steel trees around 14 m tall, and the suspended green flying-train artwork. Those facts lock the landmark language; exact placement still requires current-site spatial matching.

Reference notes: `Docs/V23_REFERENCE_NOTES.md`.
