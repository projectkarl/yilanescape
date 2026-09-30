import * as THREE from 'three';
import { llToWorld } from './osm.js';

const M=(color,rough=.55,metal=.12,extra={})=>new THREE.MeshPhysicalMaterial({color,roughness:rough,metalness:metal,...extra});
const V=(lat,lon)=>{const p=llToWorld(lat,lon);return new THREE.Vector2(p.x,p.y);};

function signTexture(lines,color='#173e68'){
  const c=document.createElement('canvas');c.width=768;c.height=320;const x=c.getContext('2d');x.fillStyle=color;x.fillRect(0,0,c.width,c.height);x.strokeStyle='#e8f5ff';x.lineWidth=8;x.strokeRect(7,7,c.width-14,c.height-14);x.fillStyle='#fff';x.textAlign='center';x.font='800 62px system-ui';x.fillText(lines[0],384,103);x.font='700 42px system-ui';x.fillText(lines[1]||'',384,171);x.font='600 30px system-ui';x.fillStyle='#d8efff';x.fillText(lines[2]||'',384,235);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

export class Highway5{
  constructor(scene){
    this.scene=scene;this.group=new THREE.Group();scene.add(this.group);this.tunnelLength=12900;this.roads=[];this.colliders=[];
    // Approximate public-road alignment: Yilan IC -> Toucheng -> southern tunnel approach.
    this.yilanIC=V(24.735843,121.781688);
    this.touchengIC=V(24.829221,121.789742);
    this.portal=V(24.8423,121.7891);
    const towardPinglin=V(24.9300,121.7240);const d=new THREE.Vector2(towardPinglin.x-this.portal.x,towardPinglin.y-this.portal.y).normalize();
    this.dir=d;this.perp=new THREE.Vector2(d.y,-d.x);this.angle=Math.atan2(d.x,d.y);
    this.build();
  }
  build(){this._approach();this._portal();this._tunnel();this._northExit();}
  _roadSegment(a,b,width=12){
    const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),ang=Math.atan2(dx,dz),cx=(a.x+b.x)/2,cz=(a.z+b.z)/2;
    const road=new THREE.Mesh(new THREE.BoxGeometry(width,.12,len),M(0x15191c,.34,.04,{clearcoat:.30,clearcoatRoughness:.18}));road.position.set(cx,.09,cz);road.rotation.y=ang;road.receiveShadow=true;this.group.add(road);
    const lineMat=new THREE.MeshBasicMaterial({color:0xf0efe8,toneMapped:false});for(const side of [-.26,.26]){const line=new THREE.Mesh(new THREE.BoxGeometry(.11,.018,len*.96),lineMat);line.position.set(cx+Math.cos(ang)*width*side,.16,cz-Math.sin(ang)*width*side);line.rotation.y=ang;this.group.add(line);}return {len,ang};
  }
  _approach(){
    const cityLink=[V(24.7470,121.7680),V(24.7435,121.7745),this.yilanIC];
    for(let i=0;i<cityLink.length-1;i++)this._roadSegment({x:cityLink[i].x,z:cityLink[i].y},{x:cityLink[i+1].x,z:cityLink[i+1].y},10);
    this.roads.push({name:'宜蘭市 / 宜蘭交流道連絡道',width:10,points:cityLink});

    const freeway=[
      this.yilanIC,
      V(24.7600,121.7827),
      V(24.7886,121.7797),
      V(24.81904,121.782384),
      this.touchengIC,
      this.portal,
    ];
    for(let i=0;i<freeway.length-1;i++)this._roadSegment({x:freeway[i].x,z:freeway[i].y},{x:freeway[i+1].x,z:freeway[i+1].y},15);
    this.roads.push({name:'國道5號',width:15,points:freeway});

    const signP=freeway[freeway.length-2],next=freeway[freeway.length-1],dx=next.x-signP.x,dz=next.y-signP.y,ang=Math.atan2(dx,dz),perp=new THREE.Vector2(Math.cos(ang),-Math.sin(ang));
    const center=new THREE.Vector3(signP.x+dx*.58,7.2,signP.y+dz*.58);
    const pole=M(0x59646d,.55,.7);for(const s of [-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(.32,8,.32),pole);p.position.set(center.x+perp.x*5.4*s,4,center.z+perp.y*5.4*s);this.group.add(p);}
    const board=new THREE.Mesh(new THREE.PlaneGeometry(14,5.8),new THREE.MeshBasicMaterial({map:signTexture(['國道 5 號','雪山隧道','XUESHAN TUNNEL']),toneMapped:false,side:THREE.DoubleSide}));board.position.copy(center);board.rotation.y=ang;this.group.add(board);

    // Mountain mass begins near the actual northern Yilan / Toucheng side rather than immediately outside Yilan city.
    for(let i=0;i<6;i++){const t=700+i*360,base=this._at(t,0),hill=new THREE.Mesh(new THREE.ConeGeometry(430+i*30,540+i*42,9),M(i%2?0x2e4036:0x24362e,.98,.0));hill.position.set(base.x+this.perp.x*(i%2?560:-560),250,base.z+this.perp.y*(i%2?560:-560));hill.rotation.y=i*.52;this.group.add(hill);}
  }
  _at(t,lateral=0){return new THREE.Vector3(this.portal.x+this.dir.x*t+this.perp.x*lateral,0,this.portal.y+this.dir.y*t+this.perp.y*lateral);}
  _boreCenter(t,side){return this._at(t,side*8.8);}
  _portal(){
    const concrete=M(0x858a88,.76,.04),dir3=new THREE.Vector3(this.dir.x,0,this.dir.y),normalQ=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),dir3),rotY=this.angle;
    for(const side of [-1,1]){
      const c=this._boreCenter(0,side),ring=new THREE.Mesh(new THREE.TorusGeometry(6.25,.72,12,30,Math.PI),concrete);ring.quaternion.copy(normalQ);ring.rotation.z+=Math.PI;ring.position.set(c.x,6.15,c.z);this.group.add(ring);
      for(const edge of [-1,1]){const q=new THREE.Mesh(new THREE.BoxGeometry(1.25,7.2,.9),concrete),p=this._boreCenter(0,side);q.position.set(p.x+this.perp.x*6*edge,3,p.z+this.perp.y*6*edge);q.rotation.y=rotY;this.group.add(q);}
      const top=new THREE.Mesh(new THREE.BoxGeometry(13.2,1.1,.9),concrete);top.position.set(c.x,7.05,c.z);top.rotation.y=rotY;this.group.add(top);
    }
    const lp=this._at(-3,0),label=new THREE.Mesh(new THREE.PlaneGeometry(24,4.3),new THREE.MeshBasicMaterial({map:signTexture(['雪山隧道','XUESHAN TUNNEL','12.9 KM'],'#245c38'),toneMapped:false,side:THREE.DoubleSide}));label.position.set(lp.x,12.4,lp.z);label.quaternion.copy(normalQ);this.group.add(label);
  }
  _tunnel(){
    const wallMat=M(0x838786,.72,.01,{side:THREE.BackSide}),roadMat=M(0x15181b,.30,.02,{clearcoat:.24,clearcoatRoughness:.18}),laneMat=new THREE.MeshBasicMaterial({color:0xf3f1df,toneMapped:false}),lampMat=new THREE.MeshBasicMaterial({color:0xeafff8,toneMapped:false}),dir3=new THREE.Vector3(this.dir.x,0,this.dir.y),tubeQ=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir3);
    const seg=300,count=Math.ceil(this.tunnelLength/seg);
    for(const side of [-1,1])for(let i=0;i<count;i++){
      const len=Math.min(seg,this.tunnelLength-i*seg),t=i*seg+len*.5,c=this._boreCenter(t,side);
      const tube=new THREE.Mesh(new THREE.CylinderGeometry(6.15,6.15,len,20,1,true),wallMat);tube.quaternion.copy(tubeQ);tube.position.set(c.x,6.08,c.z);this.group.add(tube);
      const road=new THREE.Mesh(new THREE.BoxGeometry(10.8,.12,len),roadMat);road.position.set(c.x,.09,c.z);road.rotation.y=this.angle;road.receiveShadow=true;this.group.add(road);
      const center=new THREE.Mesh(new THREE.BoxGeometry(.12,.018,len*.98),laneMat);center.position.set(c.x,.16,c.z);center.rotation.y=this.angle;this.group.add(center);
      for(const e of [-1,1]){const edge=new THREE.Mesh(new THREE.BoxGeometry(.09,.018,len*.98),laneMat);edge.position.set(c.x+this.perp.x*4.55*e,.16,c.z+this.perp.y*4.55*e);edge.rotation.y=this.angle;this.group.add(edge);}
    }
    const perBore=Math.floor(this.tunnelLength/44)*2,lights=new THREE.InstancedMesh(new THREE.BoxGeometry(.5,.12,2.7),lampMat,perBore*2),m=new THREE.Matrix4(),q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),this.angle),s=new THREE.Vector3(1,1,1);let k=0;
    for(const side of [-1,1])for(let i=0;i<Math.floor(this.tunnelLength/44);i++){const t=22+i*44;for(const edge of [-1,1]){const p=this._boreCenter(t,side);p.x+=this.perp.x*4.15*edge;p.z+=this.perp.y*4.15*edge;p.y=5.72;m.compose(p,q,s);lights.setMatrixAt(k++,m);}}this.group.add(lights);
    this._tunnelDetails();
    const roadPts=[];for(let t=0;t<=this.tunnelLength;t+=250){const p=this._boreCenter(t,-1);roadPts.push(new THREE.Vector2(p.x,p.z));}const e=this._boreCenter(this.tunnelLength,-1);roadPts.push(new THREE.Vector2(e.x,e.z));this.roads.push({name:'雪山隧道',width:10.8,points:roadPts});
  }
  _tunnelDetails(){
    // Fictionalized visual dressing only. No real emergency/service layout is reproduced.
    const panel=M(0x666c6d,.68,.04),dark=M(0x2a3032,.70,.26),reflect=new THREE.MeshBasicMaterial({color:0x8fdfff,toneMapped:false}),amber=new THREE.MeshBasicMaterial({color:0xffb34f,toneMapped:false}),fanQ=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(this.dir.x,0,this.dir.y));
    const bays=Math.floor(this.tunnelLength/190);
    for(const side of [-1,1])for(let i=0;i<bays;i++){
      const t=95+i*190,c=this._boreCenter(t,side);
      for(const edge of [-1,1]){const seam=new THREE.Mesh(new THREE.BoxGeometry(.07,4.8,1.25),panel);seam.position.set(c.x+this.perp.x*5.86*edge,2.8,c.z+this.perp.y*5.86*edge);seam.rotation.y=this.angle;this.group.add(seam);const r=new THREE.Mesh(new THREE.BoxGeometry(.10,.18,.42),i%2?reflect:amber);const rp=this._boreCenter(t+30,side);r.position.set(rp.x+this.perp.x*5.7*edge,.65,rp.z+this.perp.y*5.7*edge);r.rotation.y=this.angle;this.group.add(r);}
      if(i%3===0){const fan=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.05,.28,16),dark);fan.quaternion.copy(fanQ);fan.position.set(c.x,5.55,c.z);this.group.add(fan);}
    }
  }
  _northExit(){
    const end=this._at(this.tunnelLength,0),p1=new THREE.Vector2(end.x,end.z),p2=new THREE.Vector2(end.x+this.dir.x*520+this.perp.x*80,end.z+this.dir.y*520+this.perp.y*80),p3=new THREE.Vector2(p2.x+this.dir.x*720+this.perp.x*150,p2.y+this.dir.y*720+this.perp.y*150),pts=[p1,p2,p3];
    for(let i=0;i<pts.length-1;i++)this._roadSegment({x:pts[i].x,z:pts[i].y},{x:pts[i+1].x,z:pts[i+1].y},12);this.roads.push({name:'國道5號 / 坪林方向',width:12,points:pts});
    for(let i=0;i<5;i++){const p=this._at(this.tunnelLength+450+i*180,(i%2?1:-1)*400),hill=new THREE.Mesh(new THREE.ConeGeometry(300+i*38,430+i*42,9),M(i%2?0x2b3c33:0x223229,.98,.0));hill.position.set(p.x,185,p.z);hill.rotation.y=i*.42;this.group.add(hill);}
  }
  getRoads(){return this.roads;}getColliders(){return this.colliders;}
  laneTarget(pos,offset=0){const rx=pos.x-this.portal.x,rz=pos.z-this.portal.y,t=THREE.MathUtils.clamp(rx*this.dir.x+rz*this.dir.y,0,this.tunnelLength);const p=this._boreCenter(t,-1);p.x+=this.perp.x*offset;p.z+=this.perp.y*offset;return p;}
  insideTunnel(pos){const rx=pos.x-this.portal.x,rz=pos.z-this.portal.y,t=rx*this.dir.x+rz*this.dir.y,lateral=Math.abs(rx*this.perp.x+rz*this.perp.y);return t>0&&t<this.tunnelLength+40&&lateral<22;}
  district(pos){
    const rx=pos.x-this.portal.x,rz=pos.z-this.portal.y,t=rx*this.dir.x+rz*this.dir.y;
    if(this.insideTunnel(pos))return `國道 5 號 / 雪山隧道 · ${Math.max(0,Math.min(this.tunnelLength,t)/1000).toFixed(1)} / 12.9 km`;
    if(t>this.tunnelLength)return '國道 5 號 / 坪林方向';
    const p=new THREE.Vector2(pos.x,pos.z);if(p.distanceTo(this.yilanIC)<1200)return '國道 5 號 / 宜蘭交流道';if(p.distanceTo(this.touchengIC)<1800)return '國道 5 號 / 頭城交流道';if(p.distanceTo(this.portal)<2600)return '國道 5 號 / 往雪山隧道';return null;
  }
}
