"""Run from Unreal Editor: Tools > Execute Python Script.
Imports the v2.1 GLB source pack into /Game/HighPoly and enables Nanite where the manifest requests it.
Designed for UE 5.8 Interchange-backed importing; it uses AssetImportTask so the active Interchange pipeline handles GLB.
"""
import json
from pathlib import Path
import unreal

ROOT = Path(unreal.Paths.project_dir())
MANIFEST = ROOT / 'Content/Data/HighPoly/HighPolyAssetManifest.json'
SOURCE_DIR = ROOT / 'Content/SourceAssets/HighPoly'
DEST_ROOT = '/Game/HighPoly'

def log(msg):
    unreal.log(f'[YILAN-HQ] {msg}')

def import_one(entry):
    src = SOURCE_DIR / entry['file']
    if not src.exists():
        raise RuntimeError(f'Missing source asset: {src}')
    category = entry['category']
    dest = f"{DEST_ROOT}/{category}"
    task = unreal.AssetImportTask()
    task.filename = str(src)
    task.destination_path = dest
    task.automated = True
    task.replace_existing = True
    task.save = True
    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
    imported = list(task.imported_object_paths)
    if not imported:
        raise RuntimeError(f'Import produced no assets: {entry["asset"]}')
    for path in imported:
        obj = unreal.EditorAssetLibrary.load_asset(path)
        if isinstance(obj, unreal.StaticMesh):
            try:
                # In current UE versions Nanite settings are editable through this struct.
                settings = obj.get_editor_property('nanite_settings')
                if hasattr(settings, 'enabled'):
                    settings.enabled = bool(entry.get('nanite', False))
                obj.set_editor_property('nanite_settings', settings)
            except Exception as exc:
                log(f'Nanite setting skipped for {path}: {exc}')
            try:
                obj.set_editor_property('allow_cpu_access', False)
            except Exception:
                pass
            unreal.EditorAssetLibrary.save_loaded_asset(obj)
        log(f'Imported {path}')
    return imported

def main():
    data = json.loads(MANIFEST.read_text(encoding='utf-8'))
    all_imported=[]
    for entry in data['assets']:
        all_imported += import_one(entry)
    log(f'Complete: {len(all_imported)} imported Unreal assets from {len(data["assets"])} GLB sources.')

if __name__ == '__main__':
    main()
