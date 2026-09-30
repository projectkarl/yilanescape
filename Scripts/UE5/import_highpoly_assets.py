"""YILAN // REDLINE v2.3 - Unreal Editor Python importer.
Run inside UE5 Editor (Tools > Execute Python Script).
Imports GLB source assets and 2K/4K PBR texture sets, then enables Nanite where the manifest requests it.
"""
import json
from pathlib import Path
import unreal

PROJECT = Path(unreal.Paths.project_dir())
SRC = PROJECT / 'Content' / 'SourceAssets' / 'HighPoly'
PBR = PROJECT / 'Content' / 'SourceAssets' / 'PBR'
DATA = PROJECT / 'Content' / 'Data' / 'HighPoly'
MESH_DEST = '/Game/HighPoly/Meshes'
TEX_DEST = '/Game/HighPoly/Textures'
MAT_DEST = '/Game/HighPoly/Materials'

asset_tools = unreal.AssetToolsHelpers.get_asset_tools()
editor_assets = unreal.EditorAssetLibrary


def import_file(filename: Path, dest: str):
    task = unreal.AssetImportTask()
    task.filename = str(filename)
    task.destination_path = dest
    task.automated = True
    task.save = True
    task.replace_existing = False
    asset_tools.import_asset_tasks([task])
    return list(task.imported_object_paths)


def import_all_textures():
    imported = {}
    for path in sorted(PBR.rglob('*.png')):
        for obj_path in import_file(path, TEX_DEST):
            asset = editor_assets.load_asset(obj_path)
            if isinstance(asset, unreal.Texture2D):
                lower = path.stem.lower()
                if 'normal' in lower:
                    asset.set_editor_property('srgb', False)
                    try: asset.set_editor_property('compression_settings', unreal.TextureCompressionSettings.TC_NORMALMAP)
                    except Exception: pass
                elif 'roughness' in lower or 'metallic' in lower:
                    asset.set_editor_property('srgb', False)
                editor_assets.save_loaded_asset(asset)
                imported[path.stem] = obj_path
    return imported


def create_pbr_materials(texture_paths):
    manifest = json.loads((DATA/'PBRMaterialManifest.json').read_text(encoding='utf-8'))
    material_library = unreal.MaterialEditingLibrary
    created=[]
    for m in manifest['materials']:
        name=m['name']
        pkg=f'{MAT_DEST}/{name}'
        mat=editor_assets.load_asset(pkg)
        if mat is None:
            mat=asset_tools.create_asset(name, MAT_DEST, unreal.Material, unreal.MaterialFactoryNew())
        # Start clean so the graph is deterministic.
        try: material_library.delete_all_material_expressions(mat)
        except Exception: pass
        specs=[
            ('BaseColor','MP_BASE_COLOR',False),
            ('Normal','MP_NORMAL',True),
            ('Roughness','MP_ROUGHNESS',False),
            ('Metallic','MP_METALLIC',False),
        ]
        x=0
        for suffix,prop_name,is_normal in specs:
            key=f'{name}_{suffix}'
            tex_path=texture_paths.get(key)
            if not tex_path: continue
            tex=editor_assets.load_asset(tex_path)
            node=material_library.create_material_expression(mat, unreal.MaterialExpressionTextureSample, -520, x)
            node.texture=tex
            try:
                if is_normal: node.sampler_type=unreal.MaterialSamplerType.SAMPLERTYPE_NORMAL
            except Exception: pass
            prop=getattr(unreal.MaterialProperty, prop_name)
            channel='RGB' if suffix in ('BaseColor','Normal') else 'R'
            material_library.connect_material_property(node, channel, prop)
            x += 180
        material_library.recompile_material(mat)
        editor_assets.save_loaded_asset(mat)
        created.append(pkg)
    return created


def import_meshes():
    manifest=json.loads((DATA/'HighPolyAssetManifest.json').read_text(encoding='utf-8'))
    imported=[]
    nanite_targets=[]
    for item in manifest['assets']:
        src=SRC/item['file']
        if not src.exists():
            unreal.log_warning(f'Missing source: {src}')
            continue
        paths=import_file(src,MESH_DEST)
        imported += paths
        if item.get('nanite'):
            nanite_targets += paths
        # Optional first-pass material assignment from the source manifest.
        # Hero assets still require artist-authored multi-material slot QA in UE5.
        hint=item.get('material_hint')
        if hint:
            mat=editor_assets.load_asset(f'{MAT_DEST}/{hint}')
            if mat:
                for obj_path in paths:
                    obj=editor_assets.load_asset(obj_path)
                    if isinstance(obj, unreal.StaticMesh):
                        try:
                            obj.set_material(0, mat)
                            editor_assets.save_loaded_asset(obj)
                        except Exception as exc:
                            unreal.log_warning(f'Material hint not applied to {obj_path}: {exc}')
    # Nanite API can vary slightly between UE5 point releases, so use feature detection.
    try:
        subsystem=unreal.get_editor_subsystem(unreal.StaticMeshEditorSubsystem)
        for path in nanite_targets:
            asset=editor_assets.load_asset(path)
            if not isinstance(asset,unreal.StaticMesh): continue
            try:
                settings=unreal.MeshNaniteSettings()
                settings.enabled=True
                subsystem.set_nanite_settings(asset, settings, True)
                editor_assets.save_loaded_asset(asset)
            except Exception as exc:
                unreal.log_warning(f'Nanite not applied automatically to {path}: {exc}')
    except Exception as exc:
        unreal.log_warning(f'Nanite subsystem unavailable: {exc}')
    return imported


if __name__ == '__main__':
    unreal.log('YILAN v2.3 high-poly import started')
    textures=import_all_textures()
    materials=create_pbr_materials(textures)
    meshes=import_meshes()
    unreal.log(f'Imported mesh objects: {len(meshes)}; materials: {len(materials)}; textures: {len(textures)}')
    unreal.log('YILAN v2.3 high-poly import finished')
