# High-poly asset catalog — v2.3

Total source catalog: **36 GLB assets / 436,178 triangles**.

## v2.3 station-district additions
- `SM_Yilan_Station_Facade_Hero_HQ` — 15,730 triangles; [31.0, 6.25, 12.22] m. Official Yilan tourism station imagery/description: Jimmy-themed painted station facade with smiling giraffe; geometry is a high-detail reference model, not photogrammetry.
- `SM_Yilan_Arcade_3Storey_8m_HQ` — 8,728 triangles; [8.82, 11.6, 12.61] m. Taiwan/Yilan arcade mid-rise kit; style module only, not a substitute for a named hero building.
- `SM_Yilan_CornerStore_Glass_HQ` — 2,168 triangles; [8.32, 7.28, 4.93] m. Corner storefront module with wrapped glazing, shutter, awning and rooftop service detail.
- `SM_Taiwan_Scooter_Parked_Triple_HQ` — 25,020 triangles; [2.5, 1.53, 1.48] m. Parked scooter cluster for streetscape density; drivable scooters require skeletal/Chaos rig.
- `SM_Taiwan_PedestrianSignal_HQ` — 560 triangles; [0.48, 0.52, 3.4] m. Pedestrian signal/push-button visual prop; signal behavior supplied by gameplay logic.
- `SM_Taiwan_BusStopPole_HQ` — 388 triangles; [0.55, 0.38, 3.42] m. Taiwan-style bus stop pole visual kit.
- `SM_Yilan_StreetTree_Planter_HQ` — 8,376 triangles; [3.6, 2.65, 5.9] m. Street tree/planter hero prop; replace foliage clusters with SpeedTree/foliage cards for final runtime optimization.
- `SM_Taiwan_Crosswalk_StopLine_5m_HQ` — 132 triangles; [5.5, 5.4, 0.02] m. Geometry marking kit; use decal/material variant in production where appropriate.
- `SM_Xueshan_SouthPortal_Visual_HQ` — 1,252 triangles; [26.9, 14.0, 8.42] m. Publicly visible tunnel-portal visual module only; does not encode restricted operational/rescue infrastructure.
- `SM_Xueshan_Tunnel_LightRail_9m_HQ` — 356 triangles; [9.2, 0.44, 1.0] m. Generic visible tunnel-light rail module.
- `SM_Taiwan_Freeway_DoubleBarrier_8m_HQ` — 1,092 triangles; [8.0, 0.87, 1.1] m. Double-side freeway barrier module.
- `SM_Yilan_Diudiudang_SuspendedTrain_HQ` — 13,352 triangles; [9.02, 2.65, 5.36] m. High-detail artwork proxy; final placement/proportions require photo-matched art QA.

## Existing hero / vehicle assets
- `SM_Redline_HeroSupercar_HQ` — original unbranded hero-supercar visual mesh.
- `SM_Redline_ApexGT_Hero_HQ` — original unbranded hero GT visual mesh.
- `SM_Yilan_Scooter_HQ` — Taiwan-style scooter visual mesh.
- `SM_Pedestrian_CrowdProxy_HQ` — medium-distance crowd proxy only; hero pedestrians must use a skeletal high-quality character pipeline.

## Yilan landmark kit
- `SM_Yilan_Diudiudang_SteelTree_14m_HQ` — 14 m structural-tree module; use nine instances only after layout QA.
- `SM_Yilan_Diudiudang_SuspendedTrain_HQ` — suspended green-train artwork proxy added in v2.3.
- `SM_Yilan_Distillery_RedBrickWarehouseFacade_HQ` — distillery red-brick industrial facade module.
- `SM_Yilan_Historic_Wayo_Facade_HQ` — historic-district style module; not a claimed 1:1 named building.

## PBR library
- `M_Yilan_RedBrick_2K` — 2048×2048, BaseColor/Normal/Roughness/Metallic
- `M_Taiwan_CreamTile_2K` — 2048×2048, BaseColor/Normal/Roughness/Metallic
- `M_Concrete_Clean_2K` — 2048×2048, BaseColor/Normal/Roughness/Metallic
- `M_Asphalt_Clean_2K` — 2048×2048, BaseColor/Normal/Roughness/Metallic
- `M_Yilan_GreenSteel_2K` — 2048×2048, BaseColor/Normal/Roughness/Metallic
- `M_CedarTimber_2K` — 2048×2048, BaseColor/Normal/Roughness/Metallic
- `M_Asphalt_Pro_4K` — 4096×4096, BaseColor/Normal/Roughness/Metallic
- `M_Yilan_StationPaint_4K` — 4096×4096, BaseColor/Normal/Roughness/Metallic
- `M_Yilan_AgedBrick_4K` — 4096×4096, BaseColor/Normal/Roughness/Metallic

## Production rule
No full-screen grain, fake depth-of-field blur or dense fog may be used to hide asset quality. Named hero landmarks require photo-match QA.
