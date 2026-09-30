import json, pathlib, sys
from PIL import Image
import trimesh
ROOT=pathlib.Path(__file__).resolve().parents[1]
DATA=ROOT/'Content/Data/HighPoly'
SRC=ROOT/'Content/SourceAssets/HighPoly'
PBR=ROOT/'Content/SourceAssets/PBR'
errors=[]
manifest=json.loads((DATA/'HighPolyAssetManifest.json').read_text(encoding='utf-8'))
for a in manifest['assets']:
    f=SRC/a['file']
    if not f.exists(): errors.append(f"missing GLB: {a['file']}"); continue
    try:
        sc=trimesh.load(f,force='scene')
        tris=sum(len(g.faces) for g in sc.geometry.values() if hasattr(g,'faces'))
        if tris < 12: errors.append(f"too few triangles: {a['asset']} ({tris})")
    except Exception as e: errors.append(f"invalid GLB {a['file']}: {e}")
pbr=json.loads((DATA/'PBRMaterialManifest.json').read_text(encoding='utf-8'))
for m in pbr['materials']:
    for typ,rel in m['maps'].items():
        f=PBR/rel
        if not f.exists(): errors.append(f"missing map: {rel}"); continue
        try:
            im=Image.open(f)
            if im.size != tuple(m['resolution']): errors.append(f"resolution mismatch {rel}: {im.size}")
        except Exception as e: errors.append(f"bad image {rel}: {e}")
if errors:
    print('\n'.join('ERROR: '+e for e in errors)); sys.exit(1)
print(f"PASS: {len(manifest['assets'])} GLB assets, {len(pbr['materials'])} PBR material sets")
print(f"Manifest triangles: {manifest.get('total_triangles', 'n/a'):,}")
