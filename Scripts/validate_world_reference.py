import json, pathlib, sys
root = pathlib.Path(__file__).resolve().parents[1]
paths = [
    root / 'Content/Data/WorldReference/YilanReference.json',
    root / 'Content/Data/WorldReference/RealityZones.json'
]
for p in paths:
    with p.open('r', encoding='utf-8') as f:
        json.load(f)
    print('OK', p.relative_to(root))
ref=json.loads(paths[0].read_text(encoding='utf-8'))
assert ref['highway_reference']['tunnel_length_m']==12900
assert len(ref['priority_corridors']) >= 10
print('World-reference validation passed')
