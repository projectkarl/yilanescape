# UE5 high-fidelity import

1. Open `YilanRedline.uproject` in Unreal Engine 5.
2. Ensure Python Editor Script Plugin, Editor Scripting Utilities and Interchange are enabled.
3. In the Editor, run `Scripts/UE5/import_highpoly_assets.py`.
4. Imported static meshes go to `/Game/HighPoly/Meshes`; textures to `/Game/HighPoly/Textures`; generated PBR materials to `/Game/HighPoly/Materials`.
5. Nanite is enabled for manifest assets where supported by the current UE point release.
6. Hero drivable vehicles must still be converted to a Chaos Vehicle skeletal rig: the GLBs in this package are high-detail **visual source meshes**, not a pretend finished vehicle physics rig.
7. Hero pedestrians must use MetaHuman/equivalent skeletal characters. The included crowd proxy is for medium distance only.

## Quality gate
Before a mesh is approved for the shipping hero zones, inspect it in:
- clear daylight at 1–5 m,
- wet/rain lighting,
- 4K viewport capture,
- motion at vehicle speed.

Reject the asset if detail only looks acceptable because of fog, bloom, depth-of-field or motion blur.
