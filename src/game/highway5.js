import * as THREE from 'three';

const M=(color,rough=.55,metal=.12,extra={})=>new THREE.MeshPhysicalMaterial({color,roughness:rough,metalness:metal,...extra});

function signTexture(lines,color='#173e68'){
  const c=document.createElement('canvas');c.width=768;c.height=320;const x=c.getContext('2d');x.fillStyle=color;x.fillRect(0,0,c.width,c.height);x.strokeStyle='#e8f5ff';x.lineWidth=8;x.strokeRect(7,7,c.width-14,c.height-14);x.fillStyle='#fff';x.textAlign='center';x.font='800 62px system-ui';x.fillText(lines[0],384,103);x.font='700 42px system-ui';x.fillText(lines[1]||'',384,171);x.font='600 30px system-ui';x.fillStyle='#d8efff';x.fillText(lines[2]||'',384,235);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

export class Highway5{
  constructor(scene){this.scene=scene;this.group=new THREE.Group();scene.add(this.group);this.portalZ=-3120;this.tunnelLength=12900;this.boreX=-1458;this.roads=[];this.colliders=[];this.build();}
  build(){this._approach();this._portal();this._tunnel();this._northExit();}
  _roadSegment(a,b,width=12){
    const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),ang=Math.atan2(dx,dz),cx=(a.x+b.x)/2,cz=(a.z+b.z)/2;
    const road=new THREE.Mesh(new THREE.BoxGeometry(width,.12,len),M(0x111519,.19,.05,{clearcoat:.5,clearcoatRoughness:.08}));road.position.set(cx,.09,cz);road.rotation.y=ang;road.receiveShadow=true;this.group.add(road);
    const lineMat=new THREE.MeshBasicMaterial({color:0xe9ecef,toneMapped:false});for(const side of [-.26,.26]){const line=new THREE.Mesh(new THREE.BoxGeometry(.11,.018,len*.96),lineMat);line.position.set(cx+Math.cos(ang)*width*side,.16,cz-Math.sin(ang)*width*side);line.rotation.y=ang;this.group.add(line);}return {len,ang};
  }
  _approach(){
    const pts=[new THREE.Vector2(-520,-820),new THREE.Vector2(-700,-1080),new THREE.Vector2(-850,-1380),new THREE.Vector2(-1010,-1770),new THREE.Vector2(-1160,-2180),new THREE.Vector2(-1310,-2580),new THREE.Vector2(this.boreX-8.8,this.portalZ)];
    for(let i=0;i<pts.length-1;i++)this._roadSegment({x:pts[i].x,z:pts[i].y},{x:pts[i+1].x,z:pts[i+1].y},12);this.roads.push({name:'國道5號',width:12,points:pts});
    const pole=M(0x59646d,.55,.7),p1=new THREE.Mesh(new THREE.BoxGeometry(.32,8,.32),pole);p1.position.set(-1270,4,-2500);this.group.add(p1);const p2=p1.clone();p2.position.x=-1360;this.group.add(p2);const board=new THREE.Mesh(new THREE.PlaneGeometry(14,5.8),new THREE.MeshBasicMaterial({map:signTexture(['國道 5 號','雪山隧道','XUESHAN TUNNEL  →']),toneMapped:false}));board.position.set(-1315,7.2,-2502);this.group.add(board);
    const barrier=M(0x9ca3a7,.64,.5);for(let i=0;i<7;i++){const a=pts[i],b=pts[i+1]||pts[i];if(!b)continue;const dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz),ang=Math.atan2(dx,dz),cx=(a.x+b.x)/2,cz=(a.y+b.y)/2;for(const side of [-1,1]){const q=new THREE.Mesh(new THREE.BoxGeometry(.28,.55,len*.95),barrier);q.position.set(cx+Math.cos(ang)*6.25*side,.35,cz-Math.sin(ang)*6.25*side);q.rotation.y=ang;this.group.add(q);}}
    for(let i=0;i<5;i++){const hill=new THREE.Mesh(new THREE.ConeGeometry(420+i*35,580+i*55,8),M(i%2?0x26372e:0x1f3028,.98,.0));hill.position.set(-1450+(i-2)*300,250,-3350-i*150);hill.rotation.y=i*.6;this.group.add(hill);}
  }
  _portal(){
    const concrete=M(0x7d817e,.83,.04);for(const off of [-8.8,8.8]){const x=this.boreX+off,ring=new THREE.Mesh(new THREE.TorusGeometry(6.25,.72,12,28,Math.PI),concrete);ring.rotation.z=Math.PI;ring.position.set(x,6.15,this.portalZ);this.group.add(ring);const left=new THREE.Mesh(new THREE.BoxGeometry(1.25,7.2,.9),concrete);left.position.set(x-6.0,3.0,this.portalZ+.2);this.group.add(left);const right=left.clone();right.position.x=x+6.0;this.group.add(right);const top=new THREE.Mesh(new THREE.BoxGeometry(13.2,1.1,.9),concrete);top.position.set(x,7.05,this.portalZ+.2);this.group.add(top);}const label=new THREE.Mesh(new THREE.PlaneGeometry(24,4.3),new THREE.MeshBasicMaterial({map:signTexture(['雪山隧道','XUESHAN TUNNEL','12.9 KM'],'#245c38'),toneMapped:false}));label.position.set(this.boreX,12.4,this.portalZ+1);this.group.add(label);
  }
  _tunnel(){
    const wallMat=M(0x777b78,.78,.02,{side:THREE.BackSide}),roadMat=M(0x111418,.22,.03,{clearcoat:.34,clearcoatRoughness:.12}),laneMat=new THREE.MeshBasicMaterial({color:0xf1f0df,toneMapped:false}),lampMat=new THREE.MeshBasicMaterial({color:0xe8fff8,toneMapped:false});
    const seg=300,count=Math.ceil(this.tunnelLength/seg),bores=[this.boreX-8.8,this.boreX+8.8];
    for(const x of bores)for(let i=0;i<count;i++){const len=Math.min(seg,this.tunnelLength-i*seg),z=this.portalZ-len*.5-i*seg,tube=new THREE.Mesh(new THREE.CylinderGeometry(6.15,6.15,len,18,1,true),wallMat);tube.rotation.x=Math.PI/2;tube.position.set(x,6.08,z);this.group.add(tube);const road=new THREE.Mesh(new THREE.BoxGeometry(10.8,.12,len),roadMat);road.position.set(x,.09,z);road.receiveShadow=true;this.group.add(road);const center=new THREE.Mesh(new THREE.BoxGeometry(.12,.018,len*.98),laneMat);center.position.set(x,.16,z);this.group.add(center);for(const side of [-1,1]){const edge=new THREE.Mesh(new THREE.BoxGeometry(.09,.018,len*.98),laneMat);edge.position.set(x+side*4.55,.16,z);this.group.add(edge);}}
    const lampCount=Math.floor(this.tunnelLength/42)*4,geo=new THREE.BoxGeometry(.5,.12,2.7),lights=new THREE.InstancedMesh(geo,lampMat,lampCount),m=new THREE.Matrix4();let k=0;for(const x of bores)for(let i=0;i<Math.floor(this.tunnelLength/42);i++){const z=this.portalZ-22-i*42;for(const side of [-1,1]){m.makeTranslation(x+side*4.15,5.72,z);lights.setMatrixAt(k++,m);}}this.group.add(lights);
    this._tunnelDetails(bores);
    for(const x of bores){const zc=this.portalZ-this.tunnelLength/2;for(const side of [-1,1])this.colliders.push(new THREE.Box3(new THREE.Vector3(x+side*6.0-.35,-1,zc-this.tunnelLength/2),new THREE.Vector3(x+side*6.0+.35,7.5,zc+this.tunnelLength/2)));}
    const roadPts=[];for(let z=this.portalZ;z>=this.portalZ-this.tunnelLength;z-=250)roadPts.push(new THREE.Vector2(this.boreX-8.8,z));roadPts.push(new THREE.Vector2(this.boreX-8.8,this.portalZ-this.tunnelLength));this.roads.push({name:'雪山隧道',width:10.8,points:roadPts});
  }
  _tunnelDetails(bores){
    // Fictionalized interior dressing: visual-only panels, reflectors and fans; not a map of real service infrastructure.
    const panel=M(0x5f6667,.7,.05),dark=M(0x252b2d,.72,.28),reflect=new THREE.MeshBasicMaterial({color:0x8fdfff,toneMapped:false}),amber=new THREE.MeshBasicMaterial({color:0xffb34f,toneMapped:false});
    const bays=Math.floor(this.tunnelLength/180);for(const x of bores)for(let i=0;i<bays;i++){const z=this.portalZ-90-i*180;
      for(const side of [-1,1]){const seam=new THREE.Mesh(new THREE.BoxGeometry(.05,4.8,1.25),panel);seam.position.set(x+side*5.86,2.8,z);this.group.add(seam);const r=new THREE.Mesh(new THREE.BoxGeometry(.06,.16,.42),i%2?reflect:amber);r.position.set(x+side*5.72,.65,z+32);this.group.add(r);}
      if(i%3===0){const fan=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.05,.28,16),dark);fan.rotation.x=Math.PI/2;fan.position.set(x,5.55,z);this.group.add(fan);for(let b=0;b<4;b++){const blade=new THREE.Mesh(new THREE.BoxGeometry(.16,.04,.75),panel);blade.position.set(x,5.55,z-.15);blade.rotation.z=b*Math.PI/2;this.group.add(blade);}}
      if(i%6===0){const sign=new THREE.Mesh(new THREE.PlaneGeometry(3.2,1.1),new THREE.MeshBasicMaterial({map:signTexture([`${Math.round(i*0.18)} KM`,'KEEP LANE','GAME ROUTE'],'#27513a'),toneMapped:false}));sign.scale.set(.34,.34,.34);sign.position.set(x+3.9,3.3,z-18);sign.rotation.y=-Math.PI/2;this.group.add(sign);}
    }
  }
  _northExit(){
    const end=this.portalZ-this.tunnelLength,pts=[new THREE.Vector2(this.boreX-8.8,end),new THREE.Vector2(this.boreX-80,end-420),new THREE.Vector2(this.boreX-220,end-900)];for(let i=0;i<pts.length-1;i++)this._roadSegment({x:pts[i].x,z:pts[i].y},{x:pts[i+1].x,z:pts[i+1].y},12);this.roads.push({name:'國道5號北端延伸',width:12,points:pts});
    for(let i=0;i<5;i++){const hill=new THREE.Mesh(new THREE.ConeGeometry(280+i*40,430+i*38,8),M(i%2?0x26372e:0x1d2b24,.98,.0));hill.position.set(this.boreX+(i-2)*260,180,end-650-i*120);hill.rotation.y=i*.4;this.group.add(hill);}
  }
  getRoads(){return this.roads;}getColliders(){return this.colliders;}
  insideTunnel(pos){return pos.z<this.portalZ&&pos.z>this.portalZ-this.tunnelLength-50&&Math.abs(pos.x-this.boreX)<22;}
  district(pos){if(this.insideTunnel(pos)){const km=Math.min(this.tunnelLength,(this.portalZ-pos.z));return `國道 5 號 / 雪山隧道 · ${Math.max(0,km/1000).toFixed(1)} / 12.9 km`;}if(pos.z<this.portalZ-this.tunnelLength)return '國道 5 號 / 山區延伸';if(pos.z<-950&&pos.z>this.portalZ+80&&pos.x<-350)return '國道 5 號 / 往雪山隧道';return null;}
}
