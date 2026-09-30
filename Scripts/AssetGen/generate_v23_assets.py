from __future__ import annotations
import json, math
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
import trimesh
from trimesh.transformations import translation_matrix, rotation_matrix, scale_matrix

ROOT = Path(__file__).resolve().parents[2]
HP = ROOT / 'Content/SourceAssets/HighPoly'
PBR = ROOT / 'Content/SourceAssets/PBR'
DATA = ROOT / 'Content/Data/HighPoly'
HP.mkdir(parents=True, exist_ok=True)
PBR.mkdir(parents=True, exist_ok=True)


def T(x=0,y=0,z=0): return translation_matrix([x,y,z])
def R(angle, axis): return rotation_matrix(angle, axis)

def add(scene, mesh, name, transform=None):
    if transform is not None:
        mesh = mesh.copy(); mesh.apply_transform(transform)
    scene.add_geometry(mesh, node_name=name, geom_name=name)

def box(scene, name, size, pos=(0,0,0)):
    add(scene, trimesh.creation.box(extents=size), name, T(*pos))

def cyl(scene, name, radius, height, pos=(0,0,0), sections=64, axis='z'):
    m = trimesh.creation.cylinder(radius=radius, height=height, sections=sections)
    tf=T(*pos)
    if axis=='x': tf=tf @ R(math.pi/2,[0,1,0])
    elif axis=='y': tf=tf @ R(math.pi/2,[1,0,0])
    add(scene,m,name,tf)

def sphere(scene, name, radius, pos=(0,0,0), scale=(1,1,1), subdivisions=3):
    m=trimesh.creation.icosphere(subdivisions=subdivisions, radius=radius)
    tf=T(*pos) @ np.diag([scale[0], scale[1], scale[2], 1.0])
    add(scene,m,name,tf)

def torus(scene,name,major,minor,pos=(0,0,0),rot=None,major_sections=96,minor_sections=24):
    # parametric torus; Z is normal axis
    u=np.linspace(0,2*np.pi,major_sections,endpoint=False)
    v=np.linspace(0,2*np.pi,minor_sections,endpoint=False)
    verts=[]
    for uu in u:
        for vv in v:
            verts.append([(major+minor*np.cos(vv))*np.cos(uu),(major+minor*np.cos(vv))*np.sin(uu),minor*np.sin(vv)])
    faces=[]
    for i in range(major_sections):
        ni=(i+1)%major_sections
        for j in range(minor_sections):
            nj=(j+1)%minor_sections
            a=i*minor_sections+j;b=ni*minor_sections+j;c=ni*minor_sections+nj;d=i*minor_sections+nj
            faces += [[a,b,c],[a,c,d]]
    m=trimesh.Trimesh(np.array(verts),np.array(faces),process=False)
    tf=T(*pos)
    if rot is not None: tf=tf @ rot
    add(scene,m,name,tf)

def arch_ring(scene,name,cx,cy,cz,r_outer,r_inner,depth,segments=64):
    # semi-circle ring in XZ, extruded along Y
    verts=[]; faces=[]
    for y in (-depth/2, depth/2):
        for r in (r_outer,r_inner):
            for i in range(segments+1):
                th=math.pi*i/segments
                verts.append([cx+r*math.cos(th),cy+y,cz+r*math.sin(th)])
    # indices per surface
    n=segments+1
    # front/back annulus strips
    for side in range(2):
        bo=side*2*n; bi=bo+n
        for i in range(segments):
            a=bo+i;b=bo+i+1;c=bi+i+1;d=bi+i
            if side==0: faces += [[a,c,b],[a,d,c]]
            else: faces += [[a,b,c],[a,c,d]]
    # outer/inner curved walls connect front/back
    for ring in (0,1):
        b0=ring*n; b1=2*n+ring*n
        for i in range(segments):
            a=b0+i;b=b0+i+1;c=b1+i+1;d=b1+i
            if ring==0: faces += [[a,b,c],[a,c,d]]
            else: faces += [[a,c,b],[a,d,c]]
    # end caps
    for i in (0,segments):
        of=i; inf=n+i; ob=2*n+i; inb=3*n+i
        faces += [[of,ob,inb],[of,inb,inf]]
    m=trimesh.Trimesh(np.array(verts),np.array(faces),process=False)
    add(scene,m,name)

def smooth_cylinder_between(scene,name,p0,p1,r,sections=48):
    p0=np.array(p0,dtype=float);p1=np.array(p1,dtype=float)
    vec=p1-p0;L=np.linalg.norm(vec)
    if L<1e-6:return
    m=trimesh.creation.cylinder(radius=r,height=L,sections=sections)
    # align z to vec
    z=np.array([0.,0.,1.]);v=vec/L
    axis=np.cross(z,v); dot=float(np.clip(np.dot(z,v),-1,1))
    tf=np.eye(4)
    if np.linalg.norm(axis)>1e-8:
        tf=R(math.acos(dot),axis/np.linalg.norm(axis))
    elif dot<0:
        tf=R(math.pi,[1,0,0])
    tf=T(*((p0+p1)/2)) @ tf
    add(scene,m,name,tf)

def combined_boxes(scene, name, specs):
    meshes=[]
    for size,pos in specs:
        m=trimesh.creation.box(extents=size); m.apply_transform(T(*pos)); meshes.append(m)
    if meshes:
        add(scene,trimesh.util.concatenate(meshes),name)

def railcar_body(scene,name,length=8.5,width=2.65,height=2.75,pos=(0,0,0)):
    # Extruded rounded-roof cross-section along X.
    x0=-length/2; x1=length/2
    # y-z cross section clockwise: lower rectangle + curved roof
    pts=[]
    pts.append((-width/2,0)); pts.append((width/2,0)); pts.append((width/2,height*0.70))
    r=width/2
    cz=height*0.70
    for i in range(1,17):
        th=(i/16)*math.pi
        pts.append((r*math.cos(th),cz+r*math.sin(th)*0.35))
    pts.append((-width/2,height*0.70))
    verts=[]
    for x in (x0,x1):
        for y,z in pts: verts.append([x,y,z])
    n=len(pts); faces=[]
    for i in range(n):
        j=(i+1)%n
        faces += [[i,j,n+j],[i,n+j,n+i]]
    # end caps fan
    c0=len(verts); verts.append([x0,0,height*0.45]); c1=len(verts); verts.append([x1,0,height*0.45])
    for i in range(n):
        j=(i+1)%n
        faces += [[c0,j,i],[c1,n+i,n+j]]
    m=trimesh.Trimesh(np.array(verts),np.array(faces),process=False);m.apply_transform(T(*pos));add(scene,m,name)

def export(scene, filename):
    path=HP/filename
    scene.export(str(path), file_type='glb')
    return path

def station_facade():
    s=trimesh.Scene()
    # main front structure - three arched bays with piers and upper mural band
    width=31.0; depth=4.8
    # side / center piers
    for x,w in [(-14.5,2.0),(-10.7,1.3),(-5.4,1.3),(-2.6,1.2),(2.6,1.2),(5.4,1.3),(10.7,1.3),(14.5,2.0)]:
        box(s,f'pier_{x}',(w,depth,4.4),(x,0,2.2))
    box(s,'upper_band',(width,depth,3.0),(0,0,5.9))
    # arches and reveal trims
    for j,cx in enumerate([-8.1,0,8.1]):
        arch_ring(s,f'arch_trim_{j}',cx,-2.47,2.45,2.55,2.18,0.34,72)
        # glass/door plane behind opening
        box(s,f'door_glass_{j}',(4.2,0.12,2.55),(cx,-2.15,1.25))
        # mullions
        for dx in (-1.35,0,1.35):
            box(s,f'mullion_{j}_{dx}',(0.08,0.18,2.45),(cx+dx,-2.25,1.25))
    # top sign block and tower
    box(s,'sign_plinth',(13.2,1.0,1.45),(0,-2.85,7.4))
    box(s,'station_sign',(10.8,0.18,1.05),(0,-3.4,7.45))
    box(s,'tower',(7.4,3.6,2.15),(0,0.15,8.65))
    # shallow pyramidal roof using 4 triangles
    verts=np.array([[-4,-2,9.72],[4,-2,9.72],[4,2,9.72],[-4,2,9.72],[0,0,11.0]])
    faces=np.array([[0,1,4],[1,2,4],[2,3,4],[3,0,4],[0,3,2],[0,2,1]])
    add(s,trimesh.Trimesh(verts,faces,process=False),'roof')
    # planter / front curb
    for x in (-11.8,11.8):
        cyl(s,f'planter_{x}',0.75,0.55,(x,-3.1,0.28),48)
        for k in range(8):
            ang=2*math.pi*k/8
            smooth_cylinder_between(s,f'plantstem_{x}_{k}',(x,-3.1,0.55),(x+0.65*math.cos(ang),-3.1+0.65*math.sin(ang),2.1),0.045,16)
    # simplified iconic giraffe sculpture proxy at left -- proportions based on public façade reference, not photogrammetry
    smooth_cylinder_between(s,'giraffe_neck',(-13.1,-2.9,5.6),(-14.5,-3.0,11.0),0.38,64)
    sphere(s,'giraffe_head',0.68,(-14.65,-3.02,11.25),(1.05,0.6,0.65),3)
    for dx in (-0.28,0.28):
        smooth_cylinder_between(s,f'giraffe_oss_{dx}',(-14.65+dx,-3.02,11.65),(-14.72+dx,-3.02,12.08),0.07,20)
        sphere(s,f'giraffe_oss_tip_{dx}',0.10,(-14.72+dx,-3.02,12.1),subdivisions=2)
    # arched columns inspired by station front supports
    for x in (-11.1,11.1):
        cyl(s,f'column_{x}',0.30,3.2,(x,-2.85,1.6),48)
        sphere(s,f'cap_{x}',0.43,(x,-2.85,3.15),(1,1,0.35),2)
    # Fine facade relief panels: geometry detail for close-up shadowing, kept as one mesh.
    tiles=[]
    for ix,x in enumerate(np.linspace(-14.6,14.6,74)):
        for iz,z in enumerate(np.linspace(4.65,6.95,8)):
            if abs(x)<5.9 and z>6.45: continue
            tiles.append(((0.34,0.045,0.24),(float(x),-2.425,float(z))))
    combined_boxes(s,'facade_relief_tiles',tiles)
    # Arch voussoirs around the three public-facing openings.
    vous=[]
    for cx in (-8.1,0,8.1):
        for i in range(44):
            th=math.pi*(i+0.5)/44; r=2.66
            x=cx+r*math.cos(th); z=2.45+r*math.sin(th)
            vous.append(((0.23,0.16,0.34),(x,-2.64,z)))
    combined_boxes(s,'arch_voussoirs',vous)
    # Roof edge / drainage details.
    gutters=[]
    for x in np.linspace(-14.7,14.7,80): gutters.append(((0.31,0.12,0.10),(float(x),-2.42,7.13)))
    combined_boxes(s,'roof_edge_modules',gutters)
    return s

def arcade_building():
    s=trimesh.Scene();W=8.0;D=9.0;H=11.5
    # rear building shell
    box(s,'shell',(W,D,H),(0,2.4,H/2))
    # recessed arcade floor / ceiling
    box(s,'arcade_ceiling',(W,3.0,0.28),(0,-3.2,3.4))
    for x in (-3.5,-1.2,1.2,3.5): cyl(s,f'arcade_col_{x}',0.23,3.45,(x,-4.35,1.72),48)
    # glass storefront modules
    for x in (-2.4,0,2.4):
        box(s,f'glass_{x}',(2.1,0.12,2.65),(x,-4.47,1.35))
        box(s,f'sill_{x}',(2.25,0.25,0.18),(x,-4.42,0.12))
    # upper windows, AC, balcony rails
    for floor,z in enumerate((5.0,8.0,10.3)):
        for x in (-2.7,0,2.7):
            box(s,f'window_{floor}_{x}',(1.55,0.16,1.5),(x,-2.18,z))
            box(s,f'windowframe_v_{floor}_{x}',(0.10,0.22,1.62),(x,-2.27,z))
        if floor<2:
            box(s,f'balcony_{floor}',(7.4,1.05,0.18),(0,-2.75,z-0.95))
            for x in np.linspace(-3.4,3.4,13): box(s,f'rail_{floor}_{x:.1f}',(0.04,0.04,0.95),(x,-3.12,z-0.42))
            box(s,f'rail_top_{floor}',(7.0,0.06,0.08),(0,-3.12,z+0.02))
        for x in (-2.7,2.7):
            box(s,f'ac_{floor}_{x}',(0.75,0.35,0.55),(x,-2.42,z-1.15))
            # fan grille torus
            torus(s,f'acfan_{floor}_{x}',0.19,0.018,(x,-2.62,z-1.15),R(math.pi/2,[1,0,0]),48,12)
    # rooftop tank
    cyl(s,'tank',0.62,1.1,(2.2,2.2,12.05),64)
    for x in (1.75,2.65): box(s,f'tankleg_{x}',(0.12,0.12,0.7),(x,2.2,11.45))
    # vertical sign bracket and sign body
    box(s,'sign_bracket',(0.12,1.25,5.6),(3.85,-2.6,6.4))
    box(s,'vertical_sign',(1.15,0.22,4.6),(4.25,-2.95,6.4))
    return s

def storefront_corner():
    s=trimesh.Scene()
    # corner shop with wrapped glazing / awning / roller shutter
    box(s,'body',(8.0,6.2,4.0),(0,0,2.0))
    box(s,'glass_front',(6.5,0.12,2.5),(-0.7,-3.15,1.45))
    box(s,'glass_side',(0.12,4.8,2.5),(4.05,-0.5,1.45))
    for x in (-3,-1.5,0,1.5,3): box(s,f'front_mullion{x}',(0.07,0.18,2.55),(x,-3.23,1.45))
    for y in (-2,-0.5,1,2.5): box(s,f'side_mullion{y}',(0.18,0.07,2.55),(4.13,y,1.45))
    # canopy
    box(s,'awning',(7.5,1.25,0.16),(-0.25,-3.55,3.0))
    for x in (-3.4,-1.7,0,1.7,3.4): smooth_cylinder_between(s,f'awning_tie{x}',(x,-3.1,3.1),(x,-4.0,2.7),0.025,12)
    # shutter section
    box(s,'shutter',(1.3,0.13,2.55),(3.15,-3.18,1.45))
    for z in np.arange(0.35,2.65,0.18): box(s,f'slat{z:.2f}',(1.25,0.04,0.035),(3.15,-3.27,z))
    # sign box
    box(s,'signbox',(6.4,0.55,0.7),(-0.7,-3.35,3.6))
    # rooftop parapet & AC
    box(s,'parapet_front',(8.2,0.2,0.65),(0,-3.0,4.3))
    box(s,'ac',(1.0,0.55,0.75),(2.6,1.8,4.55))
    torus(s,'ac_fan',0.27,0.025,(2.6,1.50,4.55),R(math.pi/2,[1,0,0]),56,14)
    return s

def scooter_cluster():
    s=trimesh.Scene()
    for idx,x in enumerate((-0.8,0.0,0.8)):
        # body shells
        sphere(s,f'body{idx}',0.42,(x,0,0.72),(0.75,1.25,0.55),3)
        sphere(s,f'seat{idx}',0.32,(x,0.08,1.02),(0.65,1.25,0.25),3)
        # wheels
        for y in (-0.68,0.68):
            torus(s,f'wheel{idx}_{y}',0.24,0.055,(x,y,0.35),R(math.pi/2,[1,0,0]),64,18)
            cyl(s,f'wheelhub{idx}_{y}',0.08,0.12,(x,y,0.35),32,axis='y')
        smooth_cylinder_between(s,f'fork{idx}',(x,0.48,0.45),(x,0.55,1.1),0.04,20)
        smooth_cylinder_between(s,f'handlebar{idx}',(x-0.3,0.55,1.2),(x+0.3,0.55,1.2),0.03,18)
        box(s,f'plate{idx}',(0.36,0.04,0.16),(x,-0.77,0.72))
        # mirrors
        for sx in (-1,1):
            smooth_cylinder_between(s,f'mirrorstem{idx}_{sx}',(x+0.18*sx,0.46,1.15),(x+0.33*sx,0.52,1.43),0.018,14)
            sphere(s,f'mirror{idx}_{sx}',0.11,(x+0.34*sx,0.53,1.45),(1,0.35,0.75),2)
    return s

def pedestrian_signal():
    s=trimesh.Scene();cyl(s,'pole',0.08,3.4,(0,0,1.7),40)
    box(s,'box',(0.48,0.32,0.72),(0,0,2.55))
    for z in (2.72,2.38):
        cyl(s,f'lens{z}',0.10,0.05,(0,-0.185,z),32,axis='y')
        box(s,f'hood{z}',(0.28,0.18,0.08),(0,-0.27,z+0.09))
    box(s,'buttonbox',(0.22,0.18,0.35),(0,-0.14,1.15))
    cyl(s,'button',0.045,0.03,(0,-0.25,1.18),24,axis='y')
    return s

def bus_stop_pole():
    s=trimesh.Scene();cyl(s,'pole',0.055,3.1,(0,0,1.55),40)
    box(s,'sign',(0.55,0.08,0.8),(0,0,2.65))
    cyl(s,'top_disc',0.24,0.07,(0,0,3.18),48,axis='y')
    box(s,'route_panel',(0.42,0.06,0.75),(0,0,1.95))
    box(s,'base',(0.38,0.38,0.10),(0,0,0.05))
    return s

def street_tree_planter():
    s=trimesh.Scene();box(s,'planter',(1.5,1.5,0.42),(0,0,0.21))
    # soil inset and trunk
    box(s,'soil',(1.24,1.24,0.05),(0,0,0.45))
    cyl(s,'trunk',0.17,3.4,(0,0,2.15),56)
    # branching and leafy clusters
    branches=[((0,0,3.4),(0.9,0.4,4.6)),((0,0,3.6),(-0.8,0.3,4.7)),((0,0,3.3),(0.2,-0.9,4.5)),((0,0,3.7),(-0.3,-0.7,4.9))]
    for i,(a,b) in enumerate(branches): smooth_cylinder_between(s,f'branch{i}',a,b,0.09,28)
    for i,p in enumerate([(0.9,0.4,4.8),(-0.9,0.3,4.9),(0.3,-0.9,4.7),(-0.3,-0.7,5.1),(0,0.2,5.3),(0.8,-0.3,5.2)]):
        sphere(s,f'leaf{i}',0.75,p,(1.2,0.9,0.8),3)
    return s

def road_crosswalk():
    s=trimesh.Scene()
    # clean mesh decals / raised marking cards, not textured noise
    for i in range(10):
        box(s,f'stripe{i}',(0.45,4.5,0.015),(-2.25+i*0.5,0,0.0075))
    # stop line
    box(s,'stopline',(0.25,5.4,0.018),(-2.9,0,0.009))
    return s

def tunnel_portal():
    s=trimesh.Scene();width=14.4;h=8.0
    # retaining walls / portal face around arch opening
    box(s,'leftwall',(4.0,2.0,8.0),(-7.0,0,4.0));box(s,'rightwall',(4.0,2.0,8.0),(7.0,0,4.0));box(s,'topwall',(10.0,2.0,2.4),(0,0,7.0))
    arch_ring(s,'portal_arch',0,-1.05,2.2,5.15,4.55,0.55,96)
    # wing walls
    box(s,'wingL',(5.5,1.2,4.2),(-10.7,1.8,2.1));box(s,'wingR',(5.5,1.2,4.2),(10.7,1.8,2.1))
    # road slab and curbs
    box(s,'road',(11.5,14.0,0.22),(0,4.5,-0.11))
    for x in (-5.5,5.5): box(s,f'curb{x}',(0.28,14.0,0.22),(x,4.5,0.11))
    # entrance light rail
    for y in (-1.5,1.0,3.5,6.0):
        box(s,f'lightbar{y}',(9.6,0.14,0.12),(0,y,6.2))
        for x in np.linspace(-4.5,4.5,7): box(s,f'light_{y}_{x:.1f}',(0.65,0.24,0.12),(x,y,6.1))
    return s

def tunnel_light_rail():
    s=trimesh.Scene()
    box(s,'rail',(9.2,0.10,0.12),(0,0,0))
    for x in np.linspace(-4.3,4.3,9):
        box(s,f'fixture{x:.1f}',(0.58,0.28,0.16),(x,0,-0.12))
        box(s,f'diffuser{x:.1f}',(0.47,0.30,0.035),(x,-0.15,-0.19))
    for x in (-4.45,4.45): cyl(s,f'hanger{x}',0.025,0.75,(x,0,0.42),16)
    return s

def double_barrier():
    s=trimesh.Scene()
    for side in (-0.38,0.38):
        # W-like beam approximated by three longitudinal rails
        for z in (0.35,0.55,0.75): box(s,f'beam{side}_{z}',(8.0,0.08,0.10),(0,side,z))
        for x in np.linspace(-3.8,3.8,5):
            cyl(s,f'post{side}_{x:.1f}',0.055,1.1,(x,side,0.55),24)
    for x in np.linspace(-3.8,3.8,5): box(s,f'spacer{x:.1f}',(0.12,0.85,0.12),(x,0,0.55))
    return s

def suspended_train():
    s=trimesh.Scene()
    railcar_body(s,'carbody',8.8,2.55,2.75,(0,0,0.55))
    # windows, doors, glazing frames
    specs=[]
    for side in (-1.29,1.29):
        for x in (-3.1,-2.0,-0.85,0.85,2.0,3.1):
            specs.append(((0.78,0.06,0.78),(x,side,1.82)))
        for x in (-1.42,1.42): specs.append(((0.92,0.07,1.85),(x,side,1.22)))
    combined_boxes(s,'windows_doors',specs)
    # end windows and destination box
    box(s,'front_glass',(0.08,1.85,0.82),(4.44,0,1.82)); box(s,'rear_glass',(0.08,1.85,0.82),(-4.44,0,1.82))
    box(s,'destination',(0.10,0.9,0.25),(4.49,0,2.55))
    # underframe + bogies + wheels
    box(s,'underframe',(7.8,2.0,0.22),(0,0,0.35))
    for bx in (-2.55,2.55):
        box(s,f'bogie_{bx}',(1.5,1.9,0.22),(bx,0,0.18))
        for x in (bx-0.45,bx+0.45):
            for y in (-0.94,0.94):
                torus(s,f'wheel_{x}_{y}',0.23,0.055,(x,y,0.08),R(math.pi/2,[1,0,0]),48,16)
    # overhead suspension brackets/cables for the artwork installation
    for x in (-3.2,-1.1,1.1,3.2):
        box(s,f'roof_mount_{x}',(0.32,1.5,0.18),(x,0,3.48))
        for y in (-0.55,0.55): smooth_cylinder_between(s,f'hanger_{x}_{y}',(x,y,3.55),(x,y,5.15),0.035,18)
    # underbody detail
    for x in np.linspace(-3.5,3.5,8): box(s,f'underbox_{x:.1f}',(0.52,0.9,0.28),(float(x),0,0.04))
    return s

ASSETS={
'SM_Yilan_Station_Facade_Hero_HQ.glb':station_facade,
'SM_Yilan_Arcade_3Storey_8m_HQ.glb':arcade_building,
'SM_Yilan_CornerStore_Glass_HQ.glb':storefront_corner,
'SM_Taiwan_Scooter_Parked_Triple_HQ.glb':scooter_cluster,
'SM_Taiwan_PedestrianSignal_HQ.glb':pedestrian_signal,
'SM_Taiwan_BusStopPole_HQ.glb':bus_stop_pole,
'SM_Yilan_StreetTree_Planter_HQ.glb':street_tree_planter,
'SM_Taiwan_Crosswalk_StopLine_5m_HQ.glb':road_crosswalk,
'SM_Xueshan_SouthPortal_Visual_HQ.glb':tunnel_portal,
'SM_Xueshan_Tunnel_LightRail_9m_HQ.glb':tunnel_light_rail,
'SM_Taiwan_Freeway_DoubleBarrier_8m_HQ.glb':double_barrier,
'SM_Yilan_Diudiudang_SuspendedTrain_HQ.glb':suspended_train,
}


def generate_pbr_4k(name, mode):
    """Generate 4K texture outputs from a compact 1024 source field.
    This is asset-space detail only: no screen-space grain/noise pass is used.
    """
    out=PBR/name;out.mkdir(parents=True,exist_ok=True)
    S=1024; N=4096
    yy,xx=np.mgrid[0:S,0:S]
    rng=np.random.default_rng(abs(hash(name))%(2**32))
    if mode=='asphalt':
        low=rng.normal(0,1,(S,S)).astype(np.float32)
        # low-pass twice: avoids salt/pepper "grain" while retaining material breakup
        im=Image.fromarray(np.uint8((low-low.min())/(low.max()-low.min())*255)).filter(ImageFilter.GaussianBlur(5))
        low=np.asarray(im,dtype=np.float32)/255.0-0.5
        base=np.empty((S,S,3),dtype=np.uint8)
        val=np.clip((0.20+low*0.065)*255,0,255).astype(np.uint8)
        base[:,:,0]=val; base[:,:,1]=np.clip(val+2,0,255); base[:,:,2]=np.clip(val+3,0,255)
        rough=np.clip((0.79+low*0.12)*255,0,255).astype(np.uint8)
        h=low*0.5
    elif mode=='stationpaint':
        wave=(np.sin(xx/47.0)+np.sin(yy/73.0))*0.5
        r=np.clip((0.24+wave*0.012)*255,0,255).astype(np.uint8)
        g=np.clip((0.39+wave*0.012)*255,0,255).astype(np.uint8)
        b=np.clip((0.30+wave*0.010)*255,0,255).astype(np.uint8)
        base=np.stack([r,g,b],axis=2)
        rough=np.clip((0.56+wave*0.025)*255,0,255).astype(np.uint8)
        h=wave*0.03
    else:
        base=np.zeros((S,S,3),dtype=np.uint8); base[:]=[117,48,31]
        bw,bh=90,41; mortar=4
        row=(yy//bh); off=(row%2)*(bw//2); bx=(xx+off)%bw; by=yy%bh
        mask=(bx<mortar)|(by<mortar)
        base[mask]=[142,128,116]
        wave=(np.sin((xx+yy)/29.0)+np.sin(xx/61.0))*0.5
        delta=(wave*5).astype(np.int16)
        for c in range(3):
            ch=base[:,:,c].astype(np.int16); ch[~mask]=np.clip(ch[~mask]+delta[~mask],0,255);base[:,:,c]=ch.astype(np.uint8)
        rough=np.where(mask,224,184).astype(np.uint8)
        h=np.where(mask,-0.4,0.14+wave*0.03).astype(np.float32)
    gy,gx=np.gradient(h)
    nx=-gx*5;ny=-gy*5;nz=np.ones_like(nx)
    norm=np.sqrt(nx*nx+ny*ny+nz*nz);nx/=norm;ny/=norm;nz/=norm
    normal=np.stack([(nx+1)*127.5,(ny+1)*127.5,(nz+1)*127.5],axis=2).astype(np.uint8)
    metallic=np.zeros((S,S),dtype=np.uint8)
    sources={
        'BaseColor':Image.fromarray(base,'RGB'),
        'Normal':Image.fromarray(normal,'RGB'),
        'Roughness':Image.fromarray(rough,'L'),
        'Metallic':Image.fromarray(metallic,'L'),
    }
    rel={}
    for kind,img in sources.items():
        img=img.resize((N,N),Image.Resampling.LANCZOS)
        p=out/f'{name}_{kind}.png'; img.save(p,optimize=True,compress_level=7)
        rel[kind]=str(p.relative_to(PBR)).replace('\\','/')
    return rel

def main():
    generated=[]
    for fn,fac in ASSETS.items():
        sc=fac(); path=export(sc,fn)
        loaded=trimesh.load(path,force='scene')
        tris=sum(len(g.faces) for g in loaded.geometry.values() if hasattr(g,'faces'))
        verts=sum(len(g.vertices) for g in loaded.geometry.values() if hasattr(g,'vertices'))
        b=loaded.bounds; scale=(b[1]-b[0]).tolist()
        generated.append({'file':fn,'triangles':int(tris),'vertices':int(verts),'real_scale_m':[round(float(x),2) for x in scale]})
        print(fn,tris,verts,scale)
    pbr=[
        ('M_Asphalt_Pro_4K','asphalt'),
        ('M_Yilan_StationPaint_4K','stationpaint'),
        ('M_Yilan_AgedBrick_4K','brick')]
    pbr_entries=[]
    for name,mode in pbr:
        maps=generate_pbr_4k(name,mode)
        pbr_entries.append({'name':name,'resolution':[4096,4096],'maps':maps,'notes':'local procedural PBR source; material texture only, no screen-space grain'})
        print('PBR',name)
    (DATA/'V23GeneratedAssets.json').write_text(json.dumps({'version':'2.3','assets':generated,'pbr':pbr_entries},indent=2,ensure_ascii=False),encoding='utf-8')

if __name__=='__main__': main()
