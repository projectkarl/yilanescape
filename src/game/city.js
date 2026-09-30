import * as THREE from 'three';
import { llToWorld } from './osm.js';
import { WORLD } from './config.js';
import { createAsphaltPBR, createFacadeLibrary, createRoofMaterials, createGlassMaterial, makeTextTexture } from './materials.js';

const M=(color,roughness=.65,metalness=.08,extra={})=>new THREE.MeshPhysicalMaterial({color,roughness,metalness,...extra});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function hash01(n){const x=Math.sin(n*12.9898+78.233)*43758.5453;return x-Math.floor(x);}

function roadRibbon(points,width,y,material,uvMeters=7){
  if(!points?.length||points.length<2)return null;
  const pos=[],uv=[],idx=[];let acc=0;const dists=[0];for(let i=1;i<points.length;i++){acc+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);dists.push(acc);}
  for(let i=0;i<points.length;i++){
    const p=points[i],prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],dx=next.x-prev.x,dz=next.y-prev.y,len=Math.hypot(dx,dz)||1,nx=-dz/len,nz=dx/len;
    pos.push(p.x+nx*width*.5,y,p.y+nz*width*.5,p.x-nx*width*.5,y,p.y-nz*width*.5);
    const v=dists[i]/uvMeters;uv.push(0,v,1,v);
  }
  for(let i=0;i<points.length-1;i++){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,b,c,b,d,c);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const mesh=new THREE.Mesh(g,material);mesh.receiveShadow=true;return mesh;
}
function offsetPoints(points,offset){return points.map((p,i)=>{const prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],dx=next.x-prev.x,dz=next.y-prev.y,len=Math.hypot(dx,dz)||1,nx=-dz/len,nz=dx/len;return new THREE.Vector2(p.x+nx*offset,p.y+nz*offset);});}

export class City{
  constructor(scene){
    this.scene=scene;this.group=new THREE.Group();scene.add(this.group);this.roads=[];this.colliders=[];this.lights=[];
    this.roadPBR=createAsphaltPBR(1024);this.asphalt=this.roadPBR.map;this.facades=createFacadeLibrary();this.roofs=createRoofMaterials();this.glassDark=createGlassMaterial();this.glassLit=createGlassMaterial({lit:true});
    this.windowFrame=M(0x3b4144,.5,.55);this.concrete=M(0x797a76,.88,.03);this.sidewalk=M(0x878784,.84,.02);this.storeGlass=createGlassMaterial({lit:true});
  }
  build(data,maxBuildings=900,maxLamps=84,detailBuildings=220){
    this.clear();this.roads=data.roads||[];this._ground();this._mountains();this._waterways(data.waterways||[]);this._roads(this.roads);this._crosswalks(this.roads);this._railways(data.railways||[]);this._buildings((data.buildings||[]).slice(0,maxBuildings),detailBuildings);this._landmarks();this._streetFurniture(this.roads,maxLamps);this._streetLife(this.roads,Math.min(130,Math.floor(maxLamps*1.15)));this._taiwanRoadside(this.roads,Math.min(90,Math.floor(maxLamps*.78)));this._poiSigns(data.pois||[]);this._puddles(this.roads);this._riceFields();
  }
  clear(){for(const l of this.lights)this.scene.remove(l);this.lights=[];while(this.group.children.length){const o=this.group.children.pop();o?.removeFromParent?.();}this.colliders=[];}
  _ground(){
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(62000,62000),M(0x394a3b,.98,.0));ground.rotation.x=-Math.PI/2;ground.position.y=-.05;ground.receiveShadow=true;this.group.add(ground);
    // city subgrade; opaque and clean, not a translucent haze layer.
    const cityBase=new THREE.Mesh(new THREE.PlaneGeometry(6500,6500),M(0x62625d,.91,.01));cityBase.rotation.x=-Math.PI/2;cityBase.position.y=-.025;cityBase.receiveShadow=true;this.group.add(cityBase);
  }
  _mountains(){
    const mats=[M(0x405743,.99,0),M(0x354b3a,.99,0),M(0x4b604d,.99,0)];
    const ranges=[[-3100,-500,1250,620],[-2550,-1900,1200,720],[-1400,-3100,1500,820],[-100,-3850,1250,780],[-3700,1150,1100,630],[-2600,2400,1150,560]];
    for(let i=0;i<ranges.length;i++){const [x,z,rx,ry]=ranges[i],g=new THREE.SphereGeometry(1,36,18),m=new THREE.Mesh(g,mats[i%mats.length]);m.scale.set(rx,ry,rx*.72);m.position.set(x,-ry*.12,z);m.receiveShadow=true;this.group.add(m);}
  }
  _waterways(lines){
    const mat=M(0x416f7f,.18,.08,{clearcoat:.7,clearcoatRoughness:.08});for(const l of lines){const r=roadRibbon(l.points,Math.max(5,Number(l.tags?.width)||7),.015,mat,12);if(r)this.group.add(r);}
  }
  _roads(roads){
    const roadMat=M(0xffffff,.68,.02,{map:this.roadPBR.map,roughnessMap:this.roadPBR.roughnessMap,normalMap:this.roadPBR.normalMap,normalScale:new THREE.Vector2(.28,.28),clearcoat:.12,clearcoatRoughness:.38});
    const yellow=new THREE.MeshBasicMaterial({color:0xd8b445,toneMapped:false}),white=new THREE.MeshBasicMaterial({color:0xe8e8e4,toneMapped:false}),curb=M(0x9a9b96,.80,.02);
    for(const r of roads){
      const walk=roadRibbon(r.points,r.width+3.0,.025,this.sidewalk,10);if(walk)this.group.add(walk);const curbR=roadRibbon(r.points,r.width+.7,.052,curb,9);if(curbR)this.group.add(curbR);const road=roadRibbon(r.points,r.width,.105,roadMat,6.5);if(road)this.group.add(road);
      const highway=r.tags?.highway||'';if(r.width>=7.5){
        const isMajor=['primary','secondary','tertiary','trunk','motorway'].includes(highway);if(isMajor){for(const off of [-.12,.12]){const pts=offsetPoints(r.points,off),line=roadRibbon(pts,.085,.163,yellow,40);if(line)this.group.add(line);}}else{const line=roadRibbon(r.points,.08,.163,white,40);if(line)this.group.add(line);}
        if(r.width>=10){for(const off of [-r.width*.36,r.width*.36]){const pts=offsetPoints(r.points,off),line=roadRibbon(pts,.075,.162,white,40);if(line)this.group.add(line);}}
      }
    }
  }
  _crosswalks(roads){
    const major=roads.filter(r=>r.width>=8).slice(0,26),mat=new THREE.MeshBasicMaterial({color:0xf1f0ea,toneMapped:false,transparent:true,opacity:.92});let made=0;
    const hit=(a,b,c,d)=>{const r={x:b.x-a.x,z:b.y-a.y},s={x:d.x-c.x,z:d.y-c.y},den=r.x*s.z-r.z*s.x;if(Math.abs(den)<1e-5)return null;const q={x:c.x-a.x,z:c.y-a.y},t=(q.x*s.z-q.z*s.x)/den,u=(q.x*r.z-q.z*r.x)/den;if(t>.08&&t<.92&&u>.08&&u<.92)return{x:a.x+t*r.x,z:a.y+t*r.z};return null;};
    for(let i=0;i<major.length;i++)for(let j=i+1;j<major.length;j++){if(made>=28)return;const A=major[i],B=major[j];for(let ai=0;ai<A.points.length-1;ai++){for(let bi=0;bi<B.points.length-1;bi++){const p=hit(A.points[ai],A.points[ai+1],B.points[bi],B.points[bi+1]);if(!p||Math.hypot(p.x,p.z)>1850)continue;const a=A.points[ai],b=A.points[ai+1],ang=Math.atan2(b.x-a.x,b.y-a.y);for(let k=-3;k<=3;k++){const bar=new THREE.Mesh(new THREE.BoxGeometry(A.width*.80,.018,.42),mat);bar.position.set(p.x+Math.sin(ang)*k*.72,.174,p.z+Math.cos(ang)*k*.72);bar.rotation.y=ang;this.group.add(bar);}made++;ai=A.points.length;bi=B.points.length;break;}}}
  }
  _railways(lines){
    const ballast=M(0x595957,.92,.0),steel=M(0x7d8588,.33,.82),sleeper=M(0x4e4036,.88,.03);
    for(const l of lines){const bed=roadRibbon(l.points,5.8,.04,ballast,4);if(bed)this.group.add(bed);for(const off of [-.78,.78]){const rail=roadRibbon(offsetPoints(l.points,off),.075,.18,steel,30);if(rail)this.group.add(rail);}for(let i=0;i<l.points.length-1;i++){const a=l.points[i],b=l.points[i+1],dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz),ang=Math.atan2(dx,dz),steps=Math.min(18,Math.floor(len/3.0));for(let k=1;k<steps;k++){const t=k/steps,s=new THREE.Mesh(new THREE.BoxGeometry(2.8,.08,.18),sleeper);s.position.set(THREE.MathUtils.lerp(a.x,b.x,t),.11,THREE.MathUtils.lerp(a.y,b.y,t));s.rotation.y=ang;this.group.add(s);}}}
  }
  _buildings(buildings,detailLimit){
    for(let idx=0;idx<buildings.length;idx++){
      const b=buildings[idx],pts=b.points;if(!pts||pts.length<3)continue;const shape=new THREE.Shape();shape.moveTo(pts[0].x,-pts[0].y);for(let i=1;i<pts.length;i++)shape.lineTo(pts[i].x,-pts[i].y);const h=clamp(b.height||8,3.2,48),geom=new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,curveSegments:1});geom.rotateX(-Math.PI/2);
      const facade=this.facades[idx%this.facades.length],roof=this.roofs[idx%this.roofs.length],mesh=new THREE.Mesh(geom,[roof,facade]);mesh.position.y=.14;mesh.castShadow=idx<detailLimit&&idx%3===0;mesh.receiveShadow=true;this.group.add(mesh);
      const box=new THREE.Box3().setFromObject(mesh),w=box.max.x-box.min.x,d=box.max.z-box.min.z;if(w<86&&d<86)this.colliders.push(box);
      if(idx<detailLimit)this._facadeDetailed(box,h,idx,b.tags||{});else if(idx<detailLimit*2&&idx%4===0)this._facadeMedium(box,h,idx);
      if(idx<detailLimit&&idx%5===0)this._roofDetails(box,idx);if(idx<detailLimit&&idx%3===0)this._shopfrontDetailed(box,idx,b.tags||{});
    }
  }
  _facadeMedium(box,h,seed){
    if(!Number.isFinite(box.min.x)||h<6)return;const w=box.max.x-box.min.x,d=box.max.z-box.min.z,frontZ=seed%2?box.max.z+.025:box.min.z-.025,rot=seed%2?0:Math.PI;const rows=Math.min(5,Math.floor(h/3.2));for(let r=1;r<rows;r++){const win=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w*.58,9),.72),this.glassDark);win.position.set((box.min.x+box.max.x)/2,2.0+r*2.9,frontZ);win.rotation.y=rot;win.castShadow=false;this.group.add(win);}if(d>w&&seed%3===0){/* keep distant facade cheap */}
  }
  _facadeDetailed(box,h,seed,tags){
    if(!Number.isFinite(box.min.x)||h<5.5)return;const w=box.max.x-box.min.x,d=box.max.z-box.min.z,levels=Math.max(1,Math.min(9,Math.round(h/3.15))),frontOnZ=w>=d;
    const addFace=(axis,side)=>{
      const span=axis==='z'?w:d;if(span<5.5)return;const cells=clamp(Math.floor(span/3.0),2,7),frameMat=this.windowFrame;
      for(let floor=1;floor<levels;floor++)for(let c=0;c<cells;c++){
        const u=(c+.5)/cells-.5,y=1.7+floor*3.05,lit=((seed*17+floor*5+c*3)%9)<3,glass=lit?this.glassLit:this.glassDark;
        const ww=Math.min(1.35,span/cells*.58),hh=1.35,frame=new THREE.Mesh(new THREE.BoxGeometry(axis==='z'?ww:.055,hh+.14,axis==='z'?.055:ww),frameMat),pane=new THREE.Mesh(new THREE.BoxGeometry(axis==='z'?ww-.12:.025,hh,axis==='z'?.025:ww-.12),glass);
        if(axis==='z'){const x=(box.min.x+box.max.x)/2+u*span*.92,z=side>0?box.max.z+.045:box.min.z-.045;frame.position.set(x,y,z);pane.position.set(x,y,z+side*.04);}else{const z=(box.min.z+box.max.z)/2+u*span*.92,x=side>0?box.max.x+.045:box.min.x-.045;frame.position.set(x,y,z);pane.position.set(x+side*.04,y,z);}this.group.add(frame,pane);
        if(floor===1&&c===cells-1&&seed%4===0){const ac=new THREE.Group(),caseM=M(0xb8bbb8,.72,.12),fanM=M(0x444a4b,.72,.28),caseMesh=new THREE.Mesh(new THREE.BoxGeometry(.72,.5,.32),caseM);ac.add(caseMesh);const fan=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.025,16),fanM);fan.rotation.x=Math.PI/2;fan.position.z=.17;ac.add(fan);if(axis==='z')ac.position.set((box.min.x+box.max.x)/2+u*span*.92,y-.82,side>0?box.max.z+.21:box.min.z-.21);else{ac.rotation.y=Math.PI/2;ac.position.set(side>0?box.max.x+.21:box.min.x-.21,y-.82,(box.min.z+box.max.z)/2+u*span*.92);}this.group.add(ac);}
      }
      if(levels>=3&&seed%4===1){const balconyM=M(0x6c7070,.62,.42),railM=M(0x4c5255,.42,.62),y=4.15,balW=Math.min(span*.55,6.5);let slab;if(axis==='z'){slab=new THREE.Mesh(new THREE.BoxGeometry(balW,.12,.75),balconyM);slab.position.set((box.min.x+box.max.x)/2,y,side>0?box.max.z+.36:box.min.z-.36);}else{slab=new THREE.Mesh(new THREE.BoxGeometry(.75,.12,balW),balconyM);slab.position.set(side>0?box.max.x+.36:box.min.x-.36,y,(box.min.z+box.max.z)/2);}this.group.add(slab);for(let i=-2;i<=2;i++){const bar=new THREE.Mesh(new THREE.BoxGeometry(axis==='z'?.035:.52,.74,axis==='z'?.52:.035),railM);if(axis==='z')bar.position.set(slab.position.x+i*balW/5,y+.42,slab.position.z+side*.24);else bar.position.set(slab.position.x+side*.24,y+.42,slab.position.z+i*balW/5);this.group.add(bar);}}
    };
    addFace('z',1);addFace('z',-1);if(!frontOnZ||seed%2===0){addFace('x',1);addFace('x',-1);} 
  }
  _roofDetails(box,seed){
    const w=box.max.x-box.min.x,d=box.max.z-box.min.z;if(w<7||d<7)return;const y=box.max.y+.18,metal=M(0x575d5e,.58,.48),white=M(0xc7c9c4,.72,.15);
    const tank=new THREE.Mesh(new THREE.CylinderGeometry(.65,.65,1.3,18),white);tank.position.set((box.min.x+box.max.x)/2+w*.18,y+.65,(box.min.z+box.max.z)/2);this.group.add(tank);
    for(let i=0;i<1+(seed%3);i++){const ac=new THREE.Mesh(new THREE.BoxGeometry(1.1,.64,.55),metal);ac.position.set((box.min.x+box.max.x)/2-w*.18+i*1.4,y+.33,(box.min.z+box.max.z)/2+d*.12);this.group.add(ac);}
    if(seed%3===0){const base=new THREE.Mesh(new THREE.CylinderGeometry(.03,.04,2.4,6),metal);base.position.set((box.min.x+box.max.x)/2,y+1.2,(box.min.z+box.max.z)/2-d*.18);this.group.add(base);for(let k=0;k<3;k++){const wire=new THREE.Mesh(new THREE.TorusGeometry(.32+k*.18,.015,5,18,Math.PI*1.7),metal);wire.rotation.x=Math.PI/2;wire.position.copy(base.position);wire.position.y=y+1.4+k*.22;this.group.add(wire);}}
  }
  _shopfrontDetailed(box,seed,tags){
    const w=box.max.x-box.min.x,d=box.max.z-box.min.z;if(Math.max(w,d)<7)return;const useZ=w>=d,side=seed%2?1:-1,span=useZ?w:d,centerX=(box.min.x+box.max.x)/2,centerZ=(box.min.z+box.max.z)/2;
    const glass=this.storeGlass,metal=M(0x34393c,.48,.52),shutter=M(0x7f807b,.72,.24),signColors=['#275a75','#8c3c32','#426948','#6b4c7b','#875d26'],names=['咖啡','小吃','生活','車業','便利','茶飲','藥局','五金'],name=tags.name||names[seed%names.length],tex=makeTextTexture(String(name).slice(0,8),{w:640,h:180,bg:signColors[seed%signColors.length],sub:'YILAN CITY'}),signMat=new THREE.MeshBasicMaterial({map:tex,toneMapped:false});
    const storefrontW=Math.min(span*.68,8.5),doorW=1.05;
    if(useZ){const z=side>0?box.max.z+.07:box.min.z-.07,sgn=new THREE.Mesh(new THREE.PlaneGeometry(storefrontW,.82),signMat);sgn.position.set(centerX,2.72,z+side*.02);sgn.rotation.y=side>0?0:Math.PI;this.group.add(sgn);const pane=new THREE.Mesh(new THREE.BoxGeometry(storefrontW-1.25,1.75,.035),glass);pane.position.set(centerX-.55,1.15,z+side*.02);this.group.add(pane);const door=new THREE.Mesh(new THREE.BoxGeometry(doorW,1.95,.05),glass);door.position.set(centerX+storefrontW*.36,1.05,z+side*.03);this.group.add(door);const awn=new THREE.Mesh(new THREE.BoxGeometry(storefrontW+.4,.08,1.0),metal);awn.position.set(centerX,2.15,z+side*.43);this.group.add(awn);if(seed%5===0){const sh=new THREE.Mesh(new THREE.BoxGeometry(storefrontW*.38,1.8,.06),shutter);sh.position.set(centerX-storefrontW*.25,1.08,z+side*.07);this.group.add(sh);}}
    else{const x=side>0?box.max.x+.07:box.min.x-.07,sgn=new THREE.Mesh(new THREE.PlaneGeometry(storefrontW,.82),signMat);sgn.position.set(x+side*.02,2.72,centerZ);sgn.rotation.y=side>0?Math.PI/2:-Math.PI/2;this.group.add(sgn);const pane=new THREE.Mesh(new THREE.BoxGeometry(.035,1.75,storefrontW-1.25),glass);pane.position.set(x+side*.02,1.15,centerZ-.55);this.group.add(pane);const door=new THREE.Mesh(new THREE.BoxGeometry(.05,1.95,doorW),glass);door.position.set(x+side*.03,1.05,centerZ+storefrontW*.36);this.group.add(door);const awn=new THREE.Mesh(new THREE.BoxGeometry(1.0,.08,storefrontW+.4),metal);awn.position.set(x+side*.43,2.15,centerZ);this.group.add(awn);}
  }
  _puddles(roads){
    const mat=M(0x4c6570,.12,.02,{transparent:true,opacity:.18,clearcoat:1,clearcoatRoughness:.03});let n=0;for(const r of roads){if(r.width<7)continue;for(let i=0;i<r.points.length-1;i+=5){if(n++>46)return;const a=r.points[i],b=r.points[i+1],dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz);if(len<12)continue;const p=new THREE.Mesh(new THREE.CircleGeometry(1.2+(n%4)*.5,24),mat);p.scale.y=.28;p.rotation.x=-Math.PI/2;p.rotation.z=Math.atan2(dx,dz);p.position.set((a.x+b.x)/2+Math.sin(n*.7)*r.width*.22,.168,(a.y+b.y)/2+Math.cos(n*.8)*r.width*.22);this.group.add(p);}}
  }
  _streetFurniture(roads,maxLamps=84){
    const poleMat=M(0x3b4247,.43,.72),bulbMat=new THREE.MeshBasicMaterial({color:0xffe1b5,toneMapped:false});let n=0;for(const r of roads){if(r.width<7)continue;for(let i=0;i<r.points.length-1;i+=2){if(n++>=maxLamps)return;const a=r.points[i],b=r.points[Math.min(i+1,r.points.length-1)],dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz);if(len<10)continue;const ang=Math.atan2(dx,dz),side=n%2?1:-1,x=(a.x+b.x)/2+Math.cos(ang)*r.width*.67*side,z=(a.y+b.y)/2-Math.sin(ang)*r.width*.67*side;const pole=new THREE.Mesh(new THREE.CylinderGeometry(.055,.085,5.6,10),poleMat);pole.position.set(x,2.8,z);this.group.add(pole);const arm=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,1.15,8),poleMat);arm.rotation.z=Math.PI/2;arm.rotation.y=ang;arm.position.set(x-Math.cos(ang)*side*.46,5.34,z+Math.sin(ang)*side*.46);this.group.add(arm);const bulb=new THREE.Mesh(new THREE.SphereGeometry(.10,10,7),bulbMat);bulb.position.set(x-Math.cos(ang)*side*.95,5.28,z+Math.sin(ang)*side*.95);this.group.add(bulb);if(n%7===0){const light=new THREE.PointLight(0xffc988,5.0,30,2);light.position.copy(bulb.position);this.scene.add(light);this.lights.push(light);}}}
  }
  _streetLife(roads,maxProps=96){
    const metal=M(0x41484c,.56,.58),rubber=M(0x111214,.95,.01),seat=M(0x24272a,.90,.03),colors=[0x465868,0x7e4148,0x455d50,0x77705f,0x252f3c];let n=0;
    for(const r of roads){if(r.width<5.8)continue;for(let i=0;i<r.points.length-1;i++){if(n>=maxProps)return;const a=r.points[i],b=r.points[i+1],dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz);if(len<20)continue;const ang=Math.atan2(dx,dz),side=n%2?1:-1,cx=(a.x+b.x)/2,cz=(a.y+b.y)/2,ox=Math.cos(ang)*(r.width*.5+1.75)*side,oz=-Math.sin(ang)*(r.width*.5+1.75)*side;
      if(n%2===0){const g=new THREE.Group();g.position.set(cx+ox,.14,cz+oz);g.rotation.y=ang+(side<0?Math.PI:0);const body=new THREE.Mesh(new THREE.BoxGeometry(.46,.38,1.28),M(colors[n%colors.length],.48,.48,{clearcoat:.35}));body.position.y=.47;g.add(body);const cowl=new THREE.Mesh(new THREE.BoxGeometry(.42,.44,.42),M(colors[n%colors.length],.48,.48,{clearcoat:.35}));cowl.position.set(0,.72,-.42);g.add(cowl);for(const z of [-.48,.52]){const w=new THREE.Mesh(new THREE.TorusGeometry(.205,.052,10,18),rubber);w.rotation.y=Math.PI/2;w.position.set(0,.22,z);g.add(w);}const saddle=new THREE.Mesh(new THREE.BoxGeometry(.34,.10,.46),seat);saddle.position.set(0,.76,.16);g.add(saddle);const mirror=new THREE.Mesh(new THREE.SphereGeometry(.07,10,6),metal);mirror.scale.set(1,.72,.25);mirror.position.set(.28,1.03,-.45);g.add(mirror);this.group.add(g);
      }else{const p=new THREE.Mesh(new THREE.CylinderGeometry(.055,.078,6.0,9),metal);p.position.set(cx+ox,3.0,cz+oz);this.group.add(p);for(let w=0;w<4;w++){const wire=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,8.5,5),M(0x25292b,.78,.4));wire.rotation.z=Math.PI/2;wire.rotation.y=ang;wire.position.set(cx+ox+(w-1.5)*.075,5.1+w*.16,cz+oz);this.group.add(wire);}}
      n++;
    }}
  }
  _taiwanRoadside(roads,maxProps=70){
    const metal=M(0x555d61,.58,.58),glass=M(0x27414c,.16,.18,{transparent:true,opacity:.52,transmission:.08}),orange=new THREE.MeshBasicMaterial({color:0xff7a28,toneMapped:false}),white=M(0xd8d9d5,.78,.05);let n=0;
    for(const r of roads){if(r.width<7)continue;for(let i=0;i<r.points.length-1;i+=2){if(n>=maxProps)return;const a=r.points[i],b=r.points[i+1],dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz);if(len<24)continue;const ang=Math.atan2(dx,dz),side=n%2?1:-1,cx=(a.x+b.x)/2,cz=(a.y+b.y)/2,off=r.width*.5+2.15,ox=Math.cos(ang)*off*side,oz=-Math.sin(ang)*off*side;
      if(n%4===0){const shelter=new THREE.Group();shelter.position.set(cx+ox,.03,cz+oz);shelter.rotation.y=ang;const roof=new THREE.Mesh(new THREE.BoxGeometry(4.2,.12,1.55),metal);roof.position.y=2.35;shelter.add(roof);for(const x of [-1.9,1.9]){const p=new THREE.Mesh(new THREE.BoxGeometry(.08,2.3,.08),metal);p.position.set(x,1.15,.55);shelter.add(p);}const back=new THREE.Mesh(new THREE.PlaneGeometry(3.8,1.75),glass);back.position.set(0,1.25,.70);shelter.add(back);const bench=new THREE.Mesh(new THREE.BoxGeometry(2.6,.12,.45),white);bench.position.set(0,.55,.25);shelter.add(bench);this.group.add(shelter);
      }else if(n%4===1){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.045,.06,2.9,9),metal);pole.position.set(cx+ox,1.45,cz+oz);this.group.add(pole);const mirror=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.06,28),orange);mirror.rotation.x=Math.PI/2;mirror.position.set(cx+ox,2.7,cz+oz);this.group.add(mirror);const face=new THREE.Mesh(new THREE.CircleGeometry(.39,24),M(0x9cc9d4,.05,.92,{clearcoat:1}));face.position.set(cx+ox,2.7,cz+oz-.045);face.rotation.y=ang;this.group.add(face);
      }else if(n%4===2){for(let k=0;k<3;k++){const cone=new THREE.Mesh(new THREE.ConeGeometry(.16,.48,12),M(0xdf6a24,.68,.02));cone.position.set(cx+ox+Math.cos(ang)*(k-.9)*.6,.24,cz+oz-Math.sin(ang)*(k-.9)*.6);this.group.add(cone);}}
      else{const box=new THREE.Mesh(new THREE.BoxGeometry(.78,1.28,.48),M(0x747c7e,.64,.28));box.position.set(cx+ox,.64,cz+oz);box.rotation.y=ang;this.group.add(box);}n++;
    }}
  }
  _poiSigns(pois){let n=0;for(const p of pois){if(n++>22)break;if(!p.name||String(p.name).length>18)continue;const tex=makeTextTexture(String(p.name).slice(0,12),{w:520,h:140,bg:'#255477',sub:String(p.kind||'').toUpperCase(),border:false}),mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,toneMapped:false}),g=new THREE.Group();g.position.set(p.x,.05,p.z);const post=new THREE.Mesh(new THREE.BoxGeometry(.06,2.3,.06),M(0x4b555b,.50,.70));post.position.y=1.15;g.add(post);const board=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.64),mat);board.position.set(0,2.0,0);g.add(board);this.group.add(g);}}
  _riceFields(){const matField=M(0x385d3b,.98,.01),water=M(0x526f75,.14,.42,{transparent:true,opacity:.48,clearcoat:1,clearcoatRoughness:.08});const fields=[[1050,850,700,300],[-1050,950,620,300],[980,-1050,600,280],[-980,-980,540,260]];for(let i=0;i<fields.length;i++){const [x,z,w,d]=fields[i],f=new THREE.Mesh(new THREE.PlaneGeometry(w,d),i%2?matField:water);f.rotation.x=-Math.PI/2;f.position.set(x,.002,z);this.group.add(f);for(let k=0;k<18;k++){const line=new THREE.Mesh(new THREE.BoxGeometry(w*.92,.025,.055),M(0x4d7c4e,.98,0));line.position.set(x,.025,z-d*.45+k*(d*.05));this.group.add(line);}}}
  _landmarks(){for(const lm of WORLD.landmarks){const p=llToWorld(lm.lat,lm.lon);if(lm.type==='station')this._station(p,lm.name);else if(lm.type==='distillery')this._distillery(p,lm.name);else if(lm.type==='park')this._park(p,lm.name);else this._oldtown(p,lm.name);}}
  _label(text,pos){const tex=makeTextTexture(text,{w:720,h:170,bg:'rgba(18,40,56,.92)',sub:'YILAN'}),s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));s.scale.set(30,7.1,1);s.position.copy(pos);s.position.y+=13;this.group.add(s);}
  _station(p,name){
    const g=new THREE.Group();g.position.set(p.x,0,p.y);const wall=M(0x8d8678,.74,.04),metal=M(0x4d555a,.48,.60),glass=this.glassDark;const base=new THREE.Mesh(new THREE.BoxGeometry(46,7.2,15),wall);base.position.y=3.6;base.castShadow=true;g.add(base);const canopy=new THREE.Mesh(new THREE.BoxGeometry(50,.26,5.2),metal);canopy.position.set(0,4.1,9.3);g.add(canopy);for(let i=-5;i<=5;i++){const p1=new THREE.Mesh(new THREE.CylinderGeometry(.08,.10,3.8,10),metal);p1.position.set(i*4.2,2.1,8.1);g.add(p1);}for(let i=-5;i<=5;i++){const win=new THREE.Mesh(new THREE.BoxGeometry(3.1,1.5,.06),glass);win.position.set(i*4.05,2.65,7.54);g.add(win);}const roof=new THREE.Mesh(new THREE.BoxGeometry(48,.6,16),M(0x3c4245,.50,.45));roof.position.y=7.55;g.add(roof);this.group.add(g);this._label(name,new THREE.Vector3(p.x,0,p.y));}
  _distillery(p,name){const g=new THREE.Group();g.position.set(p.x,0,p.y);for(let i=0;i<5;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(24+(i%2)*5,7.3,14),M(i%2?0x775d49:0x657d69,.84,.03));b.position.set((i%3)*27,3.65,Math.floor(i/3)*18);b.castShadow=true;g.add(b);for(let w=-2;w<=2;w++){const win=new THREE.Mesh(new THREE.BoxGeometry(2.2,1.2,.04),this.glassDark);win.position.set(b.position.x+w*3.2,4.0,b.position.z+7.03);g.add(win);}}const tower=new THREE.Mesh(new THREE.BoxGeometry(7,20,7),M(0x765e50,.84,.03));tower.position.set(28,10,-8);g.add(tower);this.group.add(g);this._label(name,new THREE.Vector3(p.x,0,p.y));}
  _park(p,name){const park=new THREE.Mesh(new THREE.CircleGeometry(22,48),M(0x406b47,.98,0));park.rotation.x=-Math.PI/2;park.position.set(p.x,.18,p.y);this.group.add(park);for(let i=0;i<14;i++){const t=new THREE.Mesh(new THREE.CylinderGeometry(.16,.28,5.2,10),M(0x57402d,.98,0));t.position.set(p.x+Math.sin(i*2.3)*16,2.6,p.y+Math.cos(i*1.7)*15);this.group.add(t);const crown=new THREE.Mesh(new THREE.SphereGeometry(2.0,14,10),M(0x315d39,.99,0));crown.scale.set(1.1,.85,1);crown.position.copy(t.position);crown.position.y=5.8;this.group.add(crown);}this._label(name,new THREE.Vector3(p.x,0,p.y));}
  _oldtown(p,name){const g=new THREE.Group();g.position.set(p.x,0,p.y);const brick=M(0x8a5c49,.82,.03),stone=M(0xa19584,.86,.02),hall=new THREE.Mesh(new THREE.BoxGeometry(25,8.8,17),brick);hall.position.y=4.4;hall.castShadow=true;g.add(hall);for(let i=-3;i<=3;i++){const win=new THREE.Mesh(new THREE.BoxGeometry(2.3,1.45,.05),this.glassDark);win.position.set(i*3.15,4.4,8.52);g.add(win);}const tower=new THREE.Mesh(new THREE.BoxGeometry(6.2,14.6,6.2),brick);tower.position.set(-8,7.3,-2);g.add(tower);const trim=new THREE.Mesh(new THREE.BoxGeometry(6.6,.42,6.6),stone);trim.position.set(-8,12.3,-2);g.add(trim);this.group.add(g);this._label(name,new THREE.Vector3(p.x,0,p.y));}
}
