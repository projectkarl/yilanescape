# QA — YILAN // REDLINE v2.4

- High-poly GLB catalog: **50 assets**
- Source triangles: **651,054**
- PBR material sets: **13**
- New v2.4 generated assets: **14**
- New v2.4 4K material sets: **4**
- Screen-space grain policy: **prohibited**
- Hero-landmark photo-match gate: **required**
- Generic fictional city fallback for shipping: **prohibited**

Run:
```bash
python Scripts/validate_world_reference.py
python Scripts/validate_highpoly_assets.py
```

This QA verifies source files/manifests and scale metadata. It does not claim that current hero meshes are photogrammetry or final 1:1 survey-grade replicas.
