from __future__ import annotations
import json, math, importlib.util
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
import trimesh

HERE=Path(__file__).resolve()
ROOT=HERE.parents[2]
BASE=ROOT/'Scripts'/'AssetGen'/'generate_v23_assets.py'
spec=importlib.util.spec_from_file_location('v23', BASE)
v23=importlib.util.module_from_spec(spec); spec.loader.exec_module(v23)
HP=ROOT/'Content'/'SourceAssets'/'HighPoly'; PBR=ROOT/'Content'/'SourceAssets'/'PBR'; DATA=ROOT/'Content'/'Data'/'HighPoly'

# aliases
T=v23.T; R=v23.R; add=v23.add; box=v23.box; cyl=v23.cyl; sphere=v23.sphere; torus=v23.torus
smooth=v23.smooth_cylinder_between; combined_boxes=v23.combined_boxes; arch_ring=v23.arch_ring


def export_scene(scene, name):
    path=HP/name
    scene.export(str(path), file_type='glb')
    sc=trimesh.load(path, force='scene')
    tris=sum(len(g.faces) for g in sc.geometry.values() if hasattr(g,'faces'))
    verts=sum(len(g.vertices) for g in sc.geometry.values() if hasattr(g,'vertices'))
    scale=(sc.bounds[1]-sc.bounds[0]).tolist()
    return {'file':name,'asset':name[:-4],'triangles':int(tris),'vertices':int(verts),'real_scale_m':[round(float(x),2) for x in scale]}


def station_plaza_canopy():
    s=trimesh.Scene()
    # sculptural canopy / rain protection for station forecourt; clean curved members
    box(s,'base_paver',(26.0,14.0,0.18),(0,0,0.09))
    for ix,x in enumerate(np.linspace(-10.5,10.5,7)):
        for iy,y in enumerate((-4.6,4.6)):
            smooth(s,f'column_{ix}_{iy}',(x,y,0.18),(x*0.94,y*0.92,5.2),0.17,48)
            smooth(s,f'branchA_{ix}_{iy}',(x*0.94,y*0.92,5.2),(x+1.4,y*0.65,6.6),0.105,36)
            smooth(s,f'branchB_{ix}_{iy}',(x*0.94,y*0.92,5.2),(x-1.4,y*0.65,6.6),0.105,36)
    # roof ribs
    for x in np.linspace(-11.7,11.7,15):
        smooth(s,f'rib_{x:.1f}',(x,-5.7,6.35),(x,5.7,6.35),0.07,28)
    for y in np.linspace(-5.5,5.5,8):
        smooth(s,f'long_{y:.1f}',(-12.0,y,6.42),(12.0,y,6.42),0.055,24)
    # translucent roof panels as thin clean geometry
    for i,x in enumerate(np.linspace(-10.8,10.8,7)):
        box(s,f'roof_panel_{i}',(3.0,10.8,0.035),(x,0,6.5))
    return s


def station_taxi_canopy():
    s=trimesh.Scene();L=22.0
    box(s,'platform',(L,3.4,0.16),(0,0,0.08))
    for x in np.linspace(-9.5,9.5,6):
        cyl(s,f'post_{x:.1f}',0.085,3.2,(float(x),0.75,1.6),36)
        smooth(s,f'brace_{x:.1f}',(x,0.75,3.05),(x,0.0,3.65),0.055,24)
    # curved roof approximation
    for x in np.linspace(-10.5,10.5,8):
        smooth(s,f'roof_rib_{x:.1f}',(x,-1.45,3.25),(x,1.45,3.25),0.055,24)
    box(s,'roof',(L,3.25,0.08),(0,0,3.35))
    # curb markers / bollards
    for x in np.linspace(-10,10,11): cyl(s,f'bollard_{x:.1f}',0.055,0.72,(float(x),-1.2,0.36),24)
    return s


def xingkou_warehouse():
    s=trimesh.Scene();W=24;D=11;H=7.2
    box(s,'shell',(W,D,H),(0,0,H/2))
    # brick piers / bays
    for x in np.linspace(-11.4,11.4,9): box(s,f'pier_{x:.1f}',(0.42,D+0.15,H+0.2),(float(x),0,H/2))
    for x in np.linspace(-9.9,9.9,7):
        box(s,f'window_{x:.1f}',(2.0,0.14,2.15),(float(x),-5.58,3.55))
        # mullions
        for dx in (-0.62,0,0.62): box(s,f'mul_{x:.1f}_{dx}',(0.055,0.20,2.0),(float(x+dx),-5.7,3.55))
        for z in (3.0,3.55,4.1): box(s,f'mulh_{x:.1f}_{z}',(1.9,0.20,0.05),(float(x),-5.7,float(z)))
    # large cargo doors
    for x in (-7.8,0,7.8):
        box(s,f'door_{x}',(4.4,0.16,3.8),(x,-5.6,1.9))
        for z in np.linspace(0.35,3.55,15): box(s,f'doorslat_{x}_{z:.2f}',(4.25,0.07,0.035),(x,-5.72,float(z)))
    # sawtooth-like roof monitors
    for x in np.linspace(-8.5,8.5,4):
        box(s,f'roofmonitor_{x:.1f}',(3.5,4.4,1.05),(float(x),0,7.55))
        box(s,f'roofglass_{x:.1f}',(3.0,0.08,0.72),(float(x),-2.25,7.7))
    # gutters/downpipes
    for x in (-11.5,11.5):
        cyl(s,f'downpipe_{x}',0.055,7.0,(x,-5.75,3.5),24)
    return s


def arcade_5storey():
    s=trimesh.Scene();W=10.0;D=12.0;H=17.5
    box(s,'shell',(W,D,H),(0,2.2,H/2))
    # arcade
    box(s,'arcade_ceiling',(W,3.2,0.30),(0,-3.75,3.5))
    for x in np.linspace(-4.5,4.5,5): cyl(s,f'column_{x:.1f}',0.22,3.55,(float(x),-5.1,1.78),40)
    # store glazing
    for x in np.linspace(-3.6,3.6,4): box(s,f'shopglass_{x:.1f}',(2.0,0.12,2.75),(float(x),-5.85,1.42))
    # floors
    for fi,z in enumerate((5.2,8.2,11.2,14.2,16.1)):
        for x in (-3.5,-1.15,1.15,3.5):
            box(s,f'win_{fi}_{x}',(1.65,0.12,1.6),(x,-3.85,z))
            box(s,f'frameV_{fi}_{x}',(0.08,0.18,1.7),(x,-3.94,z))
            box(s,f'ac_{fi}_{x}',(0.72,0.32,0.5),(x+0.45,-4.05,z-1.0))
            torus(s,f'acfan_{fi}_{x}',0.16,0.018,(x+0.45,-4.23,z-1.0),R(math.pi/2,[1,0,0]),44,10)
        if fi<4:
            box(s,f'balcony_{fi}',(9.2,0.92,0.16),(0,-4.35,z-0.98))
            for x in np.linspace(-4.2,4.2,18): box(s,f'rail_{fi}_{x:.2f}',(0.035,0.035,0.88),(float(x),-4.68,z-0.5))
    # vertical signage structure
    box(s,'sign_bracket',(0.15,1.35,8.0),(4.75,-3.9,10.0)); box(s,'sign_panel',(1.35,0.20,7.2),(5.1,-4.35,10.0))
    # rooftop clutter
    cyl(s,'tank',0.72,1.3,(2.6,2.0,18.15),64)
    for x in (-2.8,-1.6,-0.4): box(s,f'roofac_{x}',(1.0,0.6,0.75),(x,2.0,17.85))
    return s


def hero_scooter():
    s=trimesh.Scene()
    # two high-res wheel assemblies
    for y in (-0.68,0.68):
        torus(s,f'tire_{y}',0.255,0.065,(0,y,0.31),R(math.pi/2,[1,0,0]),128,32)
        torus(s,f'rim_{y}',0.19,0.025,(0,y,0.31),R(math.pi/2,[1,0,0]),96,20)
        cyl(s,f'hub_{y}',0.07,0.13,(0,y,0.31),64,axis='y')
    sphere(s,'lowerbody',0.48,(0,0,0.68),(0.78,1.45,0.64),4)
    sphere(s,'frontfairing',0.42,(0,0.48,0.94),(0.7,0.72,1.05),4)
    sphere(s,'rearbody',0.40,(0,-0.35,0.92),(0.70,0.85,0.62),4)
    sphere(s,'seat',0.34,(0,-0.18,1.20),(0.72,1.18,0.28),4)
    smooth(s,'forkL',(-0.10,0.55,0.40),(-0.13,0.50,1.12),0.035,32); smooth(s,'forkR',(0.10,0.55,0.40),(0.13,0.50,1.12),0.035,32)
    smooth(s,'handle',(-0.34,0.48,1.28),(0.34,0.48,1.28),0.028,28)
    for sx in (-1,1):
        smooth(s,f'mirrorstem_{sx}',(0.18*sx,0.45,1.25),(0.38*sx,0.48,1.55),0.016,18)
        sphere(s,f'mirror_{sx}',0.115,(0.40*sx,0.49,1.58),(1.0,0.34,0.75),3)
    sphere(s,'headlamp',0.17,(0,0.72,1.16),(1.45,0.32,0.72),3)
    box(s,'tail_lamp',(0.38,0.05,0.18),(0,-0.69,1.0))
    box(s,'plate',(0.38,0.04,0.16),(0,-0.79,0.73))
    # footboard + kickstand
    box(s,'footboard',(0.45,0.75,0.10),(0,0,0.60)); smooth(s,'kickstand',(0,-0.15,0.55),(0.17,-0.18,0.10),0.025,18)
    return s


def city_bus():
    s=trimesh.Scene();L=11.8;W=2.5;H=3.25
    # rounded shell from overlapping smooth volumes + structural body
    box(s,'chassis',(L,W,0.35),(0,0,0.55))
    box(s,'body',(L-0.3,W-0.12,H-0.55),(0,0,1.85))
    sphere(s,'frontcap',1.15,(L/2-0.55,0,2.0),(0.7,1.08,1.05),4)
    sphere(s,'rearcap',1.0,(-L/2+0.55,0,2.0),(0.62,1.05,1.0),4)
    # wheels
    for x in (-4.2,4.1):
        for y in (-1.24,1.24):
            torus(s,f'tire_{x}_{y}',0.48,0.12,(x,y,0.55),R(math.pi/2,[1,0,0]),128,32)
            cyl(s,f'hub_{x}_{y}',0.24,0.16,(x,y,0.55),64,axis='y')
    # windows each side
    for side in (-1.26,1.26):
        for x in np.linspace(-4.4,3.5,8): box(s,f'win_{side}_{x:.1f}',(0.82,0.06,1.15),(float(x),side,2.35))
    # doors on curb side
    for x in (3.8,1.5):
        box(s,f'door_{x}',(1.1,0.07,2.45),(x,-1.28,1.55))
        for dx in (-0.27,0.27): box(s,f'doorframe_{x}_{dx}',(0.055,0.10,2.4),(x+dx,-1.33,1.55))
    # lights, mirrors, destination box, plates
    box(s,'frontglass',(0.10,1.85,1.05),(5.87,0,2.35)); box(s,'dest',(0.11,1.45,0.35),(5.94,0,3.0))
    for y in (-0.78,0.78): sphere(s,f'head_{y}',0.14,(5.96,y,1.15),(0.35,1,0.65),3)
    for y in (-0.85,0.85): sphere(s,f'tail_{y}',0.12,(-5.95,y,1.15),(0.35,1,0.65),3)
    for y in (-1.55,1.55):
        smooth(s,f'mirrorstem_{y}',(4.9,np.sign(y)*1.15,2.75),(5.25,y,2.85),0.025,18)
        sphere(s,f'mirror_{y}',0.14,(5.3,y,2.87),(0.8,0.35,1.0),3)
    # roof AC pods / antenna
    for x in (-2.7,0,2.7): box(s,f'roofac_{x}',(1.8,1.4,0.35),(x,0,3.6))
    return s


def taxi_sedan():
    s=trimesh.Scene();L=4.72;W=1.86
    box(s,'floor',(L-0.3,W-0.16,0.20),(0,0,0.42))
    sphere(s,'body',1.0,(0,0,0.83),(2.15,0.90,0.55),4)
    sphere(s,'cabin',0.92,(-0.20,0,1.20),(1.42,0.82,0.70),4)
    # wheels
    for x in (-1.55,1.55):
        for y in (-0.92,0.92):
            torus(s,f'tire_{x}_{y}',0.34,0.085,(x,y,0.47),R(math.pi/2,[1,0,0]),128,32)
            torus(s,f'rim_{x}_{y}',0.245,0.032,(x,y,0.47),R(math.pi/2,[1,0,0]),96,20)
            cyl(s,f'hub_{x}_{y}',0.10,0.12,(x,y,0.47),48,axis='y')
    # glazing / door seams / lights
    box(s,'windscreen',(0.08,1.45,0.72),(1.05,0,1.40)); box(s,'rear_glass',(0.08,1.38,0.60),(-1.12,0,1.38))
    for side in (-0.94,0.94):
        for x in (-0.55,0.45): box(s,f'sideglass_{side}_{x}',(0.80,0.05,0.54),(x,side,1.42))
        for x in (-0.90,0.70): box(s,f'doorhandle_{side}_{x}',(0.20,0.04,0.045),(x,side*1.01,0.98))
    for y in (-0.62,0.62): sphere(s,f'head_{y}',0.14,(2.18,y,0.78),(0.45,1.2,0.55),3); sphere(s,f'tail_{y}',0.13,(-2.18,y,0.80),(0.40,1.15,0.55),3)
    # taxi roof lamp + mirrors
    box(s,'taxi_lamp',(0.50,0.20,0.16),(0.05,0,2.02))
    for y in (-1.05,1.05): sphere(s,f'mirror_{y}',0.13,(0.85,y,1.25),(0.65,0.42,0.82),3)
    return s


def double_arm_lamp():
    s=trimesh.Scene();cyl(s,'pole',0.11,8.6,(0,0,4.3),48)
    for sx in (-1,1):
        smooth(s,f'arm_{sx}',(0,0,8.35),(2.25*sx,0,8.1),0.065,32)
        box(s,f'fixture_{sx}',(1.15,0.32,0.16),(2.55*sx,0,8.0))
        box(s,f'diffuser_{sx}',(0.95,0.30,0.035),(2.55*sx,-0.16,7.91))
    box(s,'base',(0.55,0.55,0.18),(0,0,0.09))
    return s


def tactile_corner():
    s=trimesh.Scene();box(s,'slab',(4.0,4.0,0.08),(0,0,0.04))
    # tactile strips / dots clean geometry
    for x in np.linspace(-1.55,1.55,8):
        for y in np.linspace(-1.55,0.55,6): cyl(s,f'dot_{x:.2f}_{y:.2f}',0.055,0.025,(float(x),float(y),0.095),18)
    for y in np.linspace(0.95,1.55,4):
        for x in np.linspace(-1.6,1.6,9): box(s,f'bar_{x:.2f}_{y:.2f}',(0.20,0.055,0.025),(float(x),float(y),0.095))
    return s


def storm_drain():
    s=trimesh.Scene(); box(s,'frame',(2.2,0.55,0.12),(0,0,0.0))
    # grate bars
    for x in np.linspace(-1.0,1.0,18): box(s,f'bar_{x:.2f}',(0.055,0.44,0.055),(float(x),0,0.08))
    for y in (-0.20,0,0.20): box(s,f'cross_{y}',(2.0,0.035,0.06),(0,y,0.08))
    return s


def road_arrow_kit():
    s=trimesh.Scene()
    # straight + turn arrows as clean raised decal geometry
    box(s,'shaft_straight',(0.34,2.1,0.015),(-1.4,0,0.008))
    # arrow heads from triangle extrusion
    for name,cx,rot in [('straight',-1.4,0),('left',1.2,math.pi/2),('right',3.6,-math.pi/2)]:
        verts=np.array([[-0.55,-0.65,0],[0.55,-0.65,0],[0,0.55,0],[-0.55,-0.65,0.015],[0.55,-0.65,0.015],[0,0.55,0.015]])
        faces=np.array([[0,1,2],[3,5,4],[0,3,4],[0,4,1],[1,4,5],[1,5,2],[2,5,3],[2,3,0]])
        m=trimesh.Trimesh(verts,faces,process=False); m.apply_transform(R(rot,[0,0,1])); m.apply_transform(T(cx,0.95,0.008)); add(s,m,name)
    box(s,'shaft_left',(0.34,2.1,0.015),(1.2,0,0.008)); box(s,'shaft_right',(0.34,2.1,0.015),(3.6,0,0.008))
    return s


def planter_bench():
    s=trimesh.Scene(); box(s,'planter',(2.4,1.4,0.48),(0,0,0.24)); box(s,'soil',(2.1,1.1,0.06),(0,0,0.51))
    # bench wraps one side
    box(s,'seat',(2.6,0.48,0.12),(0,-0.92,0.48)); box(s,'back',(2.6,0.10,0.65),(0,-1.12,0.78))
    for x in (-1.05,1.05): box(s,f'leg_{x}',(0.12,0.42,0.46),(x,-0.92,0.23))
    # small tree
    cyl(s,'trunk',0.10,2.2,(0,0,1.62),36)
    for p in [(0.4,0.2,3.0),(-0.45,0.1,2.95),(0,-0.4,3.15),(0.3,-0.3,3.25)]: sphere(s,f'leaf_{p}',0.55,p,(1.1,0.9,0.8),3)
    return s


def station_signage_kit():
    s=trimesh.Scene()
    # multiple freestanding urban wayfinding bodies; text remains material/decals in UE
    for i,(x,h,w) in enumerate([(-2.5,2.4,0.72),(-0.8,3.0,0.9),(1.2,2.0,0.65),(2.7,2.7,0.78)]):
        cyl(s,f'post_{i}',0.045,h,(x,0,h/2),24)
        box(s,f'panel_{i}',(w,0.08,0.55),(x,0,h-0.35))
        box(s,f'base_{i}',(0.28,0.28,0.08),(x,0,0.04))
    return s


def tunnel_ceiling_services():
    s=trimesh.Scene();L=12.0
    # Generic publicly visible ceiling cable trays / lighting service rails only.
    for x in (-2.7,2.7):
        box(s,f'tray_{x}',(0.38,L,0.10),(x,0,0))
        for y in np.linspace(-5.5,5.5,7):
            cyl(s,f'hanger_{x}_{y:.1f}',0.022,0.65,(x,float(y),0.40),18)
    for y in np.linspace(-5.2,5.2,6): box(s,f'lightbar_{y:.1f}',(5.9,0.14,0.10),(0,float(y),-0.25))
    return s

ASSETS={
 'SM_Yilan_Station_PlazaCanopy_HQ.glb':('landmark_structure',station_plaza_canopy,True,'station-front structural/roof proxy; final footprint/orientation requires site photo-match'),
 'SM_Yilan_Station_TaxiCanopy_HQ.glb':('street_furniture',station_taxi_canopy,True,'front-station taxi shelter visual module'),
 'SM_Yilan_Xingkou_1919_Warehouse_HQ.glb':('landmark_architecture',xingkou_warehouse,True,'historic station-area warehouse reference mesh; final shipping requires current facade photo-match'),
 'SM_Yilan_Arcade_5Storey_10m_HQ.glb':('architecture',arcade_5storey,True,'Yilan/Taiwan arcade building style module; not a substitute for named hero buildings'),
 'SM_Taiwan_HeroScooter_2026_HQ.glb':('vehicle_hero',hero_scooter,False,'high-detail static/visual scooter; drivable variant requires skeletal/Chaos rig'),
 'SM_Taiwan_CityBus_Hero_HQ.glb':('vehicle_hero',city_bus,False,'high-detail unbranded city-bus visual mesh; driving/door rig not included'),
 'SM_Taiwan_TaxiSedan_Hero_HQ.glb':('vehicle_hero',taxi_sedan,False,'high-detail unbranded taxi visual mesh; gameplay rig not included'),
 'SM_Taiwan_StreetLamp_DoubleArm_HQ.glb':('street_furniture',double_arm_lamp,True,'double-arm urban streetlight variant'),
 'SM_Taiwan_TactilePaving_Corner_HQ.glb':('road',tactile_corner,True,'clean tactile-paving corner module'),
 'SM_Taiwan_StormDrain_Linear_2m_HQ.glb':('road',storm_drain,True,'linear storm-drain/grate detail'),
 'SM_Taiwan_RoadArrowKit_HQ.glb':('road',road_arrow_kit,True,'clean road-marking arrow geometry; production may use decals'),
 'SM_Yilan_Station_PlanterBench_HQ.glb':('street_furniture',planter_bench,True,'station/plaza planter-bench landscape module'),
 'SM_Yilan_StationFront_SignageKit_HQ.glb':('street_furniture',station_signage_kit,True,'sign bodies only; final text/branding requires current-site reference and rights review'),
 'SM_Xueshan_Tunnel_CeilingServices_12m_HQ.glb':('tunnel_visual',tunnel_ceiling_services,True,'generic publicly visible lighting/service visual module; no restricted operational layout'),
}


def material_set(name, mode):
    out=PBR/name; out.mkdir(parents=True,exist_ok=True)
    S=1024; N=4096
    yy,xx=np.mgrid[0:S,0:S]
    if mode=='paver':
        tile=128; joint=7
        bx=xx%tile; by=yy%tile; mortar=(bx<joint)|(by<joint)
        base=np.empty((S,S,3),dtype=np.uint8); base[:]=[166,163,156]; base[mortar]=[92,92,88]
        h=np.where(mortar,-0.25,0.02).astype(np.float32); rough=np.where(mortar,210,185).astype(np.uint8)
    elif mode=='roadpaint':
        base=np.empty((S,S,3),dtype=np.uint8); base[:]=[228,228,218]
        # subtle broad abrasion only, no salt/pepper noise
        wave=(np.sin(xx/80.0)+np.sin(yy/105.0))*0.5
        val=np.clip(base.astype(np.int16)+(wave[...,None]*4).astype(np.int16),0,255).astype(np.uint8); base=val
        h=wave.astype(np.float32)*0.005; rough=np.clip((0.48+wave*0.02)*255,0,255).astype(np.uint8)
    elif mode=='warehouseplaster':
        wave=(np.sin(xx/110.0)+np.sin(yy/165.0))*0.5
        r=np.clip((0.69+wave*0.018)*255,0,255).astype(np.uint8); g=np.clip((0.66+wave*0.017)*255,0,255).astype(np.uint8); b=np.clip((0.60+wave*0.016)*255,0,255).astype(np.uint8)
        base=np.stack([r,g,b],axis=2); h=wave.astype(np.float32)*0.02; rough=np.clip((0.69+wave*0.025)*255,0,255).astype(np.uint8)
    else: # brushed metal
        line=np.sin(xx/6.0)*0.5+np.sin(xx/31.0)*0.2
        base=np.zeros((S,S,3),dtype=np.uint8); base[:]=[110,116,120]
        h=line.astype(np.float32)*0.008; rough=np.clip((0.34+line*0.025)*255,0,255).astype(np.uint8)
    gy,gx=np.gradient(h); nx=-gx*6; ny=-gy*6; nz=np.ones_like(nx); norm=np.sqrt(nx*nx+ny*ny+nz*nz); nx/=norm;ny/=norm;nz/=norm
    normal=np.stack([(nx+1)*127.5,(ny+1)*127.5,(nz+1)*127.5],axis=2).astype(np.uint8)
    metallic=np.full((S,S),220 if mode=='metal' else 0,dtype=np.uint8)
    maps={}
    for kind,img in {
        'BaseColor':Image.fromarray(base,'RGB'),'Normal':Image.fromarray(normal,'RGB'),'Roughness':Image.fromarray(rough,'L'),'Metallic':Image.fromarray(metallic,'L')}.items():
        img=img.resize((N,N),Image.Resampling.LANCZOS)
        p=out/f'{name}_{kind}.png'; img.save(p,optimize=True,compress_level=7); maps[kind]=str(p.relative_to(PBR)).replace('\\','/')
    return {'name':name,'resolution':[4096,4096],'maps':maps,'notes':'clean 4K asset-space PBR; no screen-space grain'}


def main():
    new=[]
    for filename,(category,fac,nanite,notes) in ASSETS.items():
        e=export_scene(fac(),filename); e.update({'category':category,'nanite':nanite,'notes':notes}); new.append(e); print(filename,e['triangles'])

    mats=[material_set('M_Taiwan_ConcretePaver_4K','paver'),material_set('M_Taiwan_RoadMarking_4K','roadpaint'),material_set('M_Yilan_WarehousePlaster_4K','warehouseplaster'),material_set('M_BrushedMetal_Clean_4K','metal')]

    # Update high-poly manifest
    mp=DATA/'HighPolyAssetManifest.json'; m=json.loads(mp.read_text(encoding='utf-8')); existing={a['asset'] for a in m['assets']}
    for e in new:
        if e['asset'] not in existing: m['assets'].append(e)
    m['version']='2.4'; m['asset_count']=len(m['assets']); m['total_triangles']=sum(int(a.get('triangles',0)) for a in m['assets']); m['total_vertices']=sum(int(a.get('vertices',0)) for a in m['assets']); mp.write_text(json.dumps(m,indent=2,ensure_ascii=False),encoding='utf-8')

    pp=DATA/'PBRMaterialManifest.json'; p=json.loads(pp.read_text(encoding='utf-8')); existing={x['name'] for x in p['materials']}
    for e in mats:
        q={'name':e['name'],'resolution':e['resolution'],'maps':{k.lower():v for k,v in e['maps'].items()},'notes':e['notes']}
        if e['name'] not in existing: p['materials'].append(q)
    p['version']='2.4'; pp.write_text(json.dumps(p,indent=2,ensure_ascii=False),encoding='utf-8')

    (DATA/'V24GeneratedAssets.json').write_text(json.dumps({'version':'2.4','assets':new,'pbr':mats},indent=2,ensure_ascii=False),encoding='utf-8')

    kit={
      'version':'2.4',
      'purpose':'High-fidelity assembly recipe for Yilan Station forecourt / Diudiudang / Xingkou vertical slice. Local transforms are art-review placeholders, not geospatial truth.',
      'source_facts':[
        'Yilan Station official address: No. 1, Guangfu Rd., Yilan City.',
        'TRA lists a front-station taxi waiting area at Guangfu Rd. 1.',
        'Diudiudang Forest/Jimmy Square sits opposite/south of the station and uses nine ~14 m steel trees plus suspended train artwork.',
        'Yilan Xingkou is a historic station-front warehouse context dating to 1919; final hero mesh requires current-site photo match.'
      ],
      'hero_assets':['SM_Yilan_Station_Facade_Hero_HQ','SM_Yilan_Station_PlazaCanopy_HQ','SM_Yilan_Xingkou_1919_Warehouse_HQ','SM_Yilan_Diudiudang_SteelTree_14m_HQ','SM_Yilan_Diudiudang_SuspendedTrain_HQ'],
      'mobility_assets':['SM_Taiwan_HeroScooter_2026_HQ','SM_Taiwan_CityBus_Hero_HQ','SM_Taiwan_TaxiSedan_Hero_HQ'],
      'support_assets':['SM_Yilan_Station_TaxiCanopy_HQ','SM_Yilan_Arcade_5Storey_10m_HQ','SM_Taiwan_StreetLamp_DoubleArm_HQ','SM_Taiwan_TactilePaving_Corner_HQ','SM_Taiwan_StormDrain_Linear_2m_HQ','SM_Taiwan_RoadArrowKit_HQ','SM_Yilan_Station_PlanterBench_HQ','SM_Yilan_StationFront_SignageKit_HQ'],
      'quality_gate':{'screen_space_grain':False,'full_scene_fog_to_hide_assets':False,'fake_dof_to_hide_assets':False,'hero_building_requires_photo_match':True,'hero_landmark_requires_current_site_reference':True,'pbr_minimum':'4K hero / 2K support','nanite_for_static_hero_meshes':True,'vehicle_visual_mesh_not_equal_gameplay_rig':True}
    }
    (DATA/'StationDistrictAssemblyV24.json').write_text(json.dumps(kit,indent=2,ensure_ascii=False),encoding='utf-8')

if __name__=='__main__': main()
