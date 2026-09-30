import * as THREE from 'three';
import { llToWorld } from './osm.js';
import { WORLD } from './config.js';

const M=(color,roughness=.65,metalness=.08,extra={})=>new THREE.MeshPhysicalMaterial({color,roughness,metalness,...extra});

export class City {
  constructor(scene){this.scene=scene;this.group=new THREE.Group();scene.add(this.group);this.roads=[];this.colliders=[];this.lights=[];this.asphalt=this._makeAsphaltTexture();}

  _makeAsphaltTexture(){
    const c=document.createElement('canvas');c.width=c.height=1024;const x=c.getContext('2d');const im=x.createImageData(1024,1024);
    for(let i=0;i<im.data.length;i+=4){const n=18+Math.floor(Math.random()*24);im.data[i]=n;im.data[i+1]=n+2;im.data[i+2]=n+4;im.data[i+3]=255;}x.putImageData(im,0,0);
    x.globalAlpha=.34;x.strokeStyle='#08090a';x.lineWidth=2;for(let k=0;k<46;k++){x.beginPath();let px=Math.random()*1024,py=Math.random()*1024;x.moveTo(px,py);for(let j=0;j<5;j++){px+=(Math.random()-.5)*110;py+=25+Math.random()*70;x.lineTo(px,py);}x.stroke();}
    x.globalAlpha=.12;x.fillStyle='#d8dde0';for(let k=0;k<1800;k++)x.fillRect(Math.random()*1024,Math.random()*1024,1+Math.random()*2,1+Math.random()*2);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);t.needsUpdate=true;return t;
  }
  build(data,maxBuildings=700,maxLamps=60){
    this.clear();this.roads=data.roads;
    this._ground();this._mountains();this._roads(data.roads);this._buildings(data.buildings.slice(0,maxBuildings));this._landmarks();this._streetFurniture(data.roads,maxLamps);this._streetLife(data.roads,Math.min(90,Math.floor(maxLamps*1.2)));this._taiwanRoadside(data.roads,Math.min(56,Math.floor(maxLamps*.72)));this._puddles(data.roads);this._riceFields();
  }
  clear(){for(const l of this.lights)this.scene.remove(l);this.lights=[];while(this.group.children.length)this.group.remove(this.group.children[0]);this.colliders=[];}
  _ground(){
    const g=new THREE.Mesh(new THREE.PlaneGeometry(3200,3200),M(0x111716,.84,.12));g.rotation.x=-Math.PI/2;g.position.y=-.04;g.receiveShadow=true;this.group.add(g);
    const wet=new THREE.Mesh(new THREE.PlaneGeometry(2600,2600),M(0x0b1114,.24,.72,{transparent:true,opacity:.32}));wet.rotation.x=-Math.PI/2;wet.position.y=-.01;wet.receiveShadow=true;this.group.add(wet);
  }
  _mountains(){
    const mountainMat=M(0x111b20,.98,.0);const mistMat=M(0x1b262b,.95,.0,{transparent:true,opacity:.82});
    const ranges=[[-850,-920,330,360],[0,-1050,520,470],[780,-860,390,420],[-1080,40,340,410],[1060,-120,300,360]];
    for(let i=0;i<ranges.length;i++){
      const [x,z,r,h]=ranges[i];const geo=new THREE.ConeGeometry(r,h,7,1);const mesh=new THREE.Mesh(geo,i%2?mountainMat:mistMat);mesh.position.set(x,h*.48,z);mesh.rotation.y=i*.8;mesh.receiveShadow=true;this.group.add(mesh);
    }
  }
  _roads(roads){
    const roadMat=M(0x121518,.22,.02,{map:this.asphalt,clearcoat:.46,clearcoatRoughness:.13});const edgeMat=M(0x3d4144,.72,.1);const lane=new THREE.MeshBasicMaterial({color:0xe7dca7,transparent:true,opacity:.62,toneMapped:false});const white=new THREE.MeshBasicMaterial({color:0xe8ecef,transparent:true,opacity:.42,toneMapped:false});
    for(const r of roads){
      for(let i=0;i<r.points.length-1;i++){
        const a=r.points[i],b=r.points[i+1],dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz);if(len<2)continue;
        const ang=Math.atan2(dx,dz);const cx=(a.x+b.x)/2,cz=(a.y+b.y)/2;
        const sidewalk=new THREE.Mesh(new THREE.BoxGeometry(r.width+2.8,.13,len+1.6),edgeMat);sidewalk.position.set(cx,.02,cz);sidewalk.rotation.y=ang;sidewalk.receiveShadow=true;this.group.add(sidewalk);
        const road=new THREE.Mesh(new THREE.BoxGeometry(r.width,.085,len),roadMat);road.position.set(cx,.105,cz);road.rotation.y=ang;road.receiveShadow=true;this.group.add(road);
        if(r.width>=7.5){
          const stripe=new THREE.Mesh(new THREE.BoxGeometry(.11,.018,Math.max(1,len*.82)),lane);stripe.position.set(cx,.157,cz);stripe.rotation.y=ang;this.group.add(stripe);
          if(len>22){for(const side of [-1,1]){const e=new THREE.Mesh(new THREE.BoxGeometry(.08,.016,Math.max(1,len*.9)),white);e.position.set(cx+Math.cos(ang)*r.width*.39*side,.154,cz-Math.sin(ang)*r.width*.39*side);e.rotation.y=ang;this.group.add(e);}}
        }
        // occasional crosswalk
        if(r.width>=8 && (i%5===0) && len>18){for(let k=-3;k<=3;k++){const bar=new THREE.Mesh(new THREE.BoxGeometry(r.width*.75,.02,.42),white);bar.position.set(cx+Math.sin(ang)*k*.82,.16,cz+Math.cos(ang)*k*.82);bar.rotation.y=ang;this.group.add(bar);}}
      }
    }
  }
  _buildings(buildings){
    const wallColors=[0x45494b,0x5a5550,0x4d5558,0x5e554e,0x434b4d,0x625f58,0x4f4946];
    buildings.forEach((b,idx)=>{
      const pts=b.points;if(pts.length<3)return;const shape=new THREE.Shape();shape.moveTo(pts[0].x,-pts[0].y);for(let i=1;i<pts.length;i++)shape.lineTo(pts[i].x,-pts[i].y);
      const geom=new THREE.ExtrudeGeometry(shape,{depth:b.height,bevelEnabled:false});geom.rotateX(-Math.PI/2);
      const mesh=new THREE.Mesh(geom,M(wallColors[idx%wallColors.length],.76,.06));mesh.position.y=.14;mesh.castShadow=idx%5===0;mesh.receiveShadow=true;this.group.add(mesh);
      const box=new THREE.Box3().setFromObject(mesh);const w=box.max.x-box.min.x,d=box.max.z-box.min.z;if(w<82&&d<82)this.colliders.push(box);
      if(idx%3===0)this._facade(box,b.height,idx);
      if(idx%11===0)this._roofDetails(box,idx);
      if(idx%13===0)this._shopfront(box,idx);
    });
  }
  _facade(box,h,seed){
    if(!Number.isFinite(box.min.x))return;const w=box.max.x-box.min.x,d=box.max.z-box.min.z;if(w<6||d<6||h<6)return;
    const warm=seed%4!==0;const m=new THREE.MeshBasicMaterial({color:warm?0xf1c46d:0x88c8ff,transparent:true,opacity:warm?.34:.26,toneMapped:false,depthWrite:false});
    const rows=Math.min(6,Math.floor(h/3.1));for(let r=1;r<=rows;r++){
      const y=2.5+r*2.8;
      for(const side of [-1,1]){const win=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(10,w*.54),.45),m);win.position.set((box.min.x+box.max.x)/2,y,side>0?box.max.z+.025:box.min.z-.025);if(side<0)win.rotation.y=Math.PI;this.group.add(win);}
    }
  }
  _roofDetails(box,seed){const w=box.max.x-box.min.x,d=box.max.z-box.min.z;if(w<8||d<8)return;const roofY=box.max.y+.25;const ac=M(0x34383b,.65,.4);for(let i=0;i<Math.min(3,1+(seed%3));i++){const unit=new THREE.Mesh(new THREE.BoxGeometry(1.3,.75,.65),ac);unit.position.set((box.min.x+box.max.x)/2+(i-1)*1.8,roofY+.35,(box.min.z+box.max.z)/2);this.group.add(unit);}}
  _shopfront(box,seed){
    const w=box.max.x-box.min.x;if(w<8)return;const side=seed%2?box.max.z+.035:box.min.z-.035;const signC=[0xff4f55,0x4fd6ff,0xffce55,0x8dff8a][seed%4];
    const sign=new THREE.Mesh(new THREE.BoxGeometry(Math.min(7,w*.55),.8,.08),new THREE.MeshBasicMaterial({color:signC,transparent:true,opacity:.78,toneMapped:false}));sign.position.set((box.min.x+box.max.x)/2,2.5,side);if(seed%2===0)sign.rotation.y=Math.PI;this.group.add(sign);
    const awn=new THREE.Mesh(new THREE.BoxGeometry(Math.min(8,w*.6),.08,1.2),M(0x23272c,.55,.28));awn.position.set((box.min.x+box.max.x)/2,2.05,seed%2?box.max.z+.5:box.min.z-.5);this.group.add(awn);
  }
  _puddles(roads){
    const puddle=M(0x0a1721,.055,.02,{transparent:true,opacity:.38,clearcoat:1,clearcoatRoughness:.02});let n=0;
    for(const r of roads){if(r.width<6)continue;for(let i=0;i<r.points.length-1;i+=3){if(n++>85)return;const a=r.points[i],b=r.points[Math.min(i+1,r.points.length-1)];const dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz);if(len<8)continue;const p=new THREE.Mesh(new THREE.PlaneGeometry(2+((n*7)%4),.6+((n*3)%3)*.35),puddle);p.rotation.x=-Math.PI/2;p.rotation.z=Math.atan2(dx,dz);p.position.set((a.x+b.x)/2+Math.sin(n)*r.width*.23,.166,(a.y+b.y)/2+Math.cos(n)*r.width*.23);this.group.add(p);}}
  }
  _streetFurniture(roads,maxLamps=60){
    const poleMat=M(0x252b31,.36,.78);const bulbMat=new THREE.MeshBasicMaterial({color:0xffd3a0,toneMapped:false});let n=0;
    for(const r of roads){if(r.width<7)continue;for(let i=0;i<r.points.length-1;i+=2){if(n++>=maxLamps)return;const a=r.points[i],b=r.points[Math.min(i+1,r.points.length-1)];const dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz);if(len<8)continue;const ang=Math.atan2(dx,dz);const side=n%2?1:-1;const x=(a.x+b.x)/2+Math.cos(ang)*r.width*.65*side,z=(a.y+b.y)/2-Math.sin(ang)*r.width*.65*side;
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(.06,.085,5.3,6),poleMat);pole.position.set(x,2.65,z);this.group.add(pole);const arm=new THREE.Mesh(new THREE.BoxGeometry(1.1,.07,.07),poleMat);arm.position.set(x-Math.cos(ang)*side*.45,5.16,z+Math.sin(ang)*side*.45);arm.rotation.y=ang;this.group.add(arm);const bulb=new THREE.Mesh(new THREE.SphereGeometry(.11,6,4),bulbMat);bulb.position.set(x-Math.cos(ang)*side*.88,5.08,z+Math.sin(ang)*side*.88);this.group.add(bulb);
      if(n%6===0){const light=new THREE.PointLight(0xffb96e,8.5,35,2);light.position.copy(bulb.position);this.scene.add(light);this.lights.push(light);}
    }}
  }

  _streetLife(roads,maxProps=72){
    const metal=M(0x343a40,.58,.62),pole=M(0x4a4f52,.72,.45),rubber=M(0x111315,.93,.02),seat=M(0x24272c,.86,.06);
    const signColors=[0x37d67a,0xffc83d,0x4db5ff,0xff5d65];let n=0;
    for(const r of roads){if(r.width<5.8)continue;for(let i=0;i<r.points.length-1;i++){if(n>=maxProps)return;const a=r.points[i],b=r.points[i+1],dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz);if(len<18)continue;const ang=Math.atan2(dx,dz),side=n%2?1:-1,cx=(a.x+b.x)/2,cz=(a.y+b.y)/2,ox=Math.cos(ang)*(r.width*.5+1.65)*side,oz=-Math.sin(ang)*(r.width*.5+1.65)*side;
      if(n%3===0){
        const g=new THREE.Group();g.position.set(cx+ox,.15,cz+oz);g.rotation.y=ang+(side<0?Math.PI:0);const body=new THREE.Mesh(new THREE.BoxGeometry(.42,.42,1.32),M([0x4b5663,0x953d47,0x2d566c,0x69614f][n%4],.52,.4));body.position.y=.42;g.add(body);for(const z of [-.42,.44]){const w=new THREE.Mesh(new THREE.TorusGeometry(.21,.055,8,14),rubber);w.rotation.y=Math.PI/2;w.position.set(0,.22,z);g.add(w);}const saddle=new THREE.Mesh(new THREE.BoxGeometry(.34,.12,.46),seat);saddle.position.set(0,.76,.14);g.add(saddle);const bar=new THREE.Mesh(new THREE.BoxGeometry(.52,.04,.04),metal);bar.position.set(0,.82,-.5);g.add(bar);this.group.add(g);
      }else if(n%3===1){
        const p=new THREE.Mesh(new THREE.CylinderGeometry(.055,.075,5.5,7),pole);p.position.set(cx+ox,2.75,cz+oz);this.group.add(p);for(let w=0;w<3;w++){const line=new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,7.5,4),metal);line.rotation.z=Math.PI/2;line.position.set(cx+ox+(w-1)*.08,5.0+w*.18,cz+oz);line.rotation.y=ang;this.group.add(line);}
      }else{
        const post=new THREE.Mesh(new THREE.BoxGeometry(.12,2.2,.12),metal);post.position.set(cx+ox,1.1,cz+oz);this.group.add(post);const sign=new THREE.Mesh(new THREE.BoxGeometry(1.7,.68,.08),new THREE.MeshBasicMaterial({color:signColors[n%signColors.length],toneMapped:false}));sign.position.set(cx+ox,2.15,cz+oz);sign.rotation.y=ang;this.group.add(sign);
      }n++;
    }}
  }
  _taiwanRoadside(roads,maxProps=42){
    const metal=M(0x3d454b,.62,.54),glass=M(0x15303b,.18,.28,{transparent:true,opacity:.48,transmission:.1}),orange=new THREE.MeshBasicMaterial({color:0xff7a28,toneMapped:false}),white=M(0xd9ddda,.74,.06);let n=0;
    for(const r of roads){if(r.width<7)continue;for(let i=0;i<r.points.length-1;i+=2){if(n>=maxProps)return;const a=r.points[i],b=r.points[i+1],dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz);if(len<22)continue;const ang=Math.atan2(dx,dz),side=n%2?1:-1,cx=(a.x+b.x)/2,cz=(a.y+b.y)/2,off=r.width*.5+2.1,ox=Math.cos(ang)*off*side,oz=-Math.sin(ang)*off*side;
      if(n%4===0){const shelter=new THREE.Group();shelter.position.set(cx+ox,.03,cz+oz);shelter.rotation.y=ang;const roof=new THREE.Mesh(new THREE.BoxGeometry(4.2,.12,1.55),metal);roof.position.y=2.35;shelter.add(roof);for(const x of [-1.9,1.9]){const p=new THREE.Mesh(new THREE.BoxGeometry(.09,2.3,.09),metal);p.position.set(x,1.15,.55);shelter.add(p);}const back=new THREE.Mesh(new THREE.PlaneGeometry(3.8,1.75),glass);back.position.set(0,1.25,.7);shelter.add(back);const bench=new THREE.Mesh(new THREE.BoxGeometry(2.6,.12,.45),white);bench.position.set(0,.55,.25);shelter.add(bench);const stop=new THREE.Mesh(new THREE.BoxGeometry(.28,2.6,.12),metal);stop.position.set(-2.35,1.3,.35);shelter.add(stop);const plate=new THREE.Mesh(new THREE.BoxGeometry(.82,.55,.08),new THREE.MeshBasicMaterial({color:0x36a8ff,toneMapped:false}));plate.position.set(-2.35,2.15,.28);shelter.add(plate);this.group.add(shelter);
      }else if(n%4===1){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.045,.06,2.9,7),metal);pole.position.set(cx+ox,1.45,cz+oz);this.group.add(pole);const mirror=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.07,24),orange);mirror.rotation.x=Math.PI/2;mirror.position.set(cx+ox,2.7,cz+oz);this.group.add(mirror);const face=new THREE.Mesh(new THREE.CircleGeometry(.39,20),new THREE.MeshPhysicalMaterial({color:0x7fc9de,metalness:.8,roughness:.08,clearcoat:1}));face.position.set(cx+ox,2.7,cz+oz-.045);face.rotation.y=ang;this.group.add(face);
      }else if(n%4===2){for(let k=0;k<3;k++){const cone=new THREE.Mesh(new THREE.ConeGeometry(.16,.48,8),new THREE.MeshStandardMaterial({color:0xe86825,roughness:.65}));cone.position.set(cx+ox+Math.cos(ang)*(k-.9)*.6,.24,cz+oz-Math.sin(ang)*(k-.9)*.6);this.group.add(cone);}}
      else{const box=new THREE.Mesh(new THREE.BoxGeometry(.78,1.28,.48),M(0x6c7477,.66,.3));box.position.set(cx+ox,.64,cz+oz);box.rotation.y=ang;this.group.add(box);const sticker=new THREE.Mesh(new THREE.PlaneGeometry(.42,.32),new THREE.MeshBasicMaterial({color:0xffd14d,toneMapped:false}));sticker.position.set(cx+ox,.87,cz+oz-.25);sticker.rotation.y=ang;this.group.add(sticker);}n++;
    }}
  }
  _riceFields(){
    const matField=M(0x203827,.96,.02);const water=M(0x122630,.18,.76,{transparent:true,opacity:.36});
    const fields=[[760,620,520,260],[-760,650,430,260],[720,-720,420,210],[-760,-720,360,220]];
    for(let i=0;i<fields.length;i++){const [x,z,w,d]=fields[i];const f=new THREE.Mesh(new THREE.PlaneGeometry(w,d),i%2?matField:water);f.rotation.x=-Math.PI/2;f.position.set(x,.005,z);this.group.add(f);for(let k=0;k<10;k++){const line=new THREE.Mesh(new THREE.BoxGeometry(w*.9,.02,.08),M(0x365d3d,.95,.0));line.position.set(x,.03,z-d*.42+k*(d*.084));this.group.add(line);}}
  }
  _landmarks(){for(const lm of WORLD.landmarks){const p=llToWorld(lm.lat,lm.lon);if(lm.type==='station')this._station(p,lm.name);else if(lm.type==='distillery')this._distillery(p,lm.name);else if(lm.type==='park')this._park(p,lm.name);else this._oldtown(p,lm.name);}}
  _label(text,pos){const canvas=document.createElement('canvas');canvas.width=640;canvas.height=128;const c=canvas.getContext('2d');c.font='700 42px system-ui';c.shadowColor='#000';c.shadowBlur=12;c.fillStyle='#fff';c.textAlign='center';c.fillText(text,320,72);const tex=new THREE.CanvasTexture(canvas);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));s.scale.set(42,8.4,1);s.position.copy(pos);s.position.y+=17;this.group.add(s);}
  _station(p,name){
    const g=new THREE.Group();g.position.set(p.x,0,p.y);const base=new THREE.Mesh(new THREE.BoxGeometry(50,7.5,17),M(0x766c5b,.7,.08));base.position.y=3.75;base.castShadow=true;g.add(base);const roof=new THREE.Mesh(new THREE.BoxGeometry(52,.8,19),M(0x34383c,.52,.36));roof.position.y=7.8;g.add(roof);for(let i=-3;i<=3;i++){const arch=new THREE.Mesh(new THREE.TorusGeometry(3.3,.7,8,28,Math.PI),M(0xa49378,.65,.12));arch.rotation.z=Math.PI;arch.position.set(i*7,1.15,8.6);g.add(arch);}const sign=new THREE.Mesh(new THREE.BoxGeometry(13,1.4,.2),new THREE.MeshBasicMaterial({color:0x52a1ff,toneMapped:false}));sign.position.set(0,5.5,8.62);g.add(sign);this.group.add(g);this._label(name,new THREE.Vector3(p.x,0,p.y));}
  _distillery(p,name){const g=new THREE.Group();g.position.set(p.x,0,p.y);for(let i=0;i<5;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(25+(i%2)*6,7.5,15),M(i%2?0x755a44:0x5e7464,.8,.05));b.position.set((i%3)*28,3.75,Math.floor(i/3)*19);b.castShadow=true;g.add(b);}const tower=new THREE.Mesh(new THREE.BoxGeometry(7,20,7),M(0x6e5548,.8,.04));tower.position.set(28,10,-8);g.add(tower);this.group.add(g);this._label(name,new THREE.Vector3(p.x,0,p.y));}
  _park(p,name){const park=new THREE.Mesh(new THREE.CircleGeometry(22,32),M(0x264a33,1,.0));park.rotation.x=-Math.PI/2;park.position.set(p.x,.18,p.y);this.group.add(park);for(let i=0;i<12;i++){const t=new THREE.Mesh(new THREE.CylinderGeometry(.18,.3,5,7),M(0x4a3326,1,.0));t.position.set(p.x+Math.sin(i*2.3)*16,2.5,p.y+Math.cos(i*1.7)*15);this.group.add(t);const crown=new THREE.Mesh(new THREE.SphereGeometry(2.2,8,6),M(0x244c30,1,.0));crown.position.copy(t.position);crown.position.y=5.6;this.group.add(crown);}this._label(name,new THREE.Vector3(p.x,0,p.y));}
  _oldtown(p,name){const g=new THREE.Group();g.position.set(p.x,0,p.y);const brick=M(0x6f3f32,.78,.06);const hall=new THREE.Mesh(new THREE.BoxGeometry(26,9,18),brick);hall.position.y=4.5;hall.castShadow=true;g.add(hall);const tower=new THREE.Mesh(new THREE.BoxGeometry(6,15,6),brick);tower.position.set(-8,7.5,-2);g.add(tower);this.group.add(g);this._label(name,new THREE.Vector3(p.x,0,p.y));}
}
