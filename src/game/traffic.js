import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const bodyMat=(color)=>new THREE.MeshPhysicalMaterial({color,metalness:.72,roughness:.18,clearcoat:1,clearcoatRoughness:.045});
const bodyMat2=(color)=>new THREE.MeshPhysicalMaterial({color:new THREE.Color(color).offsetHSL(0,0,-.08),metalness:.68,roughness:.24,clearcoat:.88,clearcoatRoughness:.065});
const dark=new THREE.MeshStandardMaterial({color:0x0d1013,roughness:.46,metalness:.24});
const tireMat=new THREE.MeshStandardMaterial({color:0x090a0b,roughness:.94,metalness:.01});
const rimMat=new THREE.MeshStandardMaterial({color:0x5e666c,roughness:.22,metalness:.91});
const glass=new THREE.MeshPhysicalMaterial({color:0x172b37,metalness:.12,roughness:.045,transmission:.16,transparent:true,opacity:.82,clearcoat:.85,clearcoatRoughness:.04});
const headMat=new THREE.MeshBasicMaterial({color:0xeaf7ff,toneMapped:false});
const plateMat=new THREE.MeshStandardMaterial({color:0xe7e8e4,roughness:.55,metalness:.03});

function addMesh(g,geo,mat,pos=[0,0,0],rot=[0,0,0]){const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.rotation.set(...rot);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function wheel(g,x,z,r=.31,width=.22){const w=new THREE.Group();w.position.set(x,r+.06,z);g.add(w);const t=addMesh(w,new THREE.CylinderGeometry(r,r,width,24,1),tireMat,[0,0,0],[0,0,Math.PI/2]);const rim=addMesh(w,new THREE.CylinderGeometry(r*.68,r*.68,width+.012,18),rimMat,[0,0,0],[0,0,Math.PI/2]);for(let s=0;s<6;s++){const spoke=addMesh(w,new THREE.BoxGeometry(.035,r*.60,.028),rimMat);spoke.rotation.z=s*Math.PI/3;}return w;}
function tail(g,x,y,z,arr,w=.34){const t=addMesh(g,new RoundedBoxGeometry(w,.08,.04,2,.025),new THREE.MeshBasicMaterial({color:0xff3025,toneMapped:false,transparent:true,opacity:.72}),[x,y,z]);t.castShadow=false;arr.push(t);return t;}
function addMirror(g,x,y,z,body){const stem=addMesh(g,new THREE.CylinderGeometry(.018,.022,.18,8),dark,[x,y-.07,z],[0,0,x<0?-.65:.65]);const mir=addMesh(g,new RoundedBoxGeometry(.22,.12,.08,3,.035),body,[x+(x<0?-.08:.08),y,z]);mir.rotation.y=x<0?-.18:.18;return {stem,mir};}
function addPlate(g,z,L){const p=addMesh(g,new RoundedBoxGeometry(.64,.16,.025,2,.025),plateMat,[0,.55,z]);const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');x.fillStyle='#f4f5ef';x.fillRect(0,0,256,64);x.fillStyle='#26333b';x.font='800 28px system-ui';x.textAlign='center';x.textBaseline='middle';x.fillText(`YL-${String(Math.floor((L*997)%8999)+1000)}`,128,32);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;p.material=new THREE.MeshStandardMaterial({map:tex,roughness:.55});return p;}
function addSedanDetails(g,body,color,{L,W,type}){
  const lower=bodyMat2(color);addMesh(g,new RoundedBoxGeometry(W*.98,.15,L*.94,3,.05),lower,[0,.42,0]);
  const grille=addMesh(g,new RoundedBoxGeometry(W*.56,.18,.055,3,.025),dark,[0,.56,-L/2-.035]);grille.castShadow=false;
  for(const x of [-W*.34,W*.34]){const h=addMesh(g,new RoundedBoxGeometry(.42,.10,.045,3,.025),headMat,[x,.70,-L/2-.045]);h.castShadow=false;}
  for(const x of [-W*.47,W*.47])addMirror(g,x,.96,-.48,body);
  const handleM=new THREE.MeshStandardMaterial({color:0xabb0b2,roughness:.25,metalness:.85});for(const x of [-W/2-.012,W/2+.012])for(const z of [-.52,.72]){const h=addMesh(g,new RoundedBoxGeometry(.24,.035,.055,2,.015),handleM,[x,.86,z]);h.rotation.y=Math.PI/2;}
  const rocker=addMesh(g,new RoundedBoxGeometry(W+.05,.08,L*.62,2,.025),dark,[0,.34,.20]);rocker.scale.x=1.01;
  addPlate(g,L/2+.04,L);
}
function makeTrafficVehicle(color,type='sedan'){
  const g=new THREE.Group(),body=bodyMat(color),body2=bodyMat2(color),brake=[];let L=4.25,W=1.80,H=.54;
  if(type==='van'){L=4.85;W=1.94;H=.78;}else if(type==='compact'){L=3.78;W=1.70;H=.51;}else if(type==='pickup'){L=4.95;W=1.93;H=.62;}else if(type==='bus'){L=8.35;W=2.42;H=1.18;}else if(type==='scooter'){L=1.83;W=.72;H=.36;}
  const wheels=[];
  if(type==='scooter'){
    addMesh(g,new RoundedBoxGeometry(.44,.36,1.36,4,.12),body,[0,.61,.05],[-.06,0,0]);addMesh(g,new RoundedBoxGeometry(.43,.46,.46,4,.11),body2,[0,.79,-.43]);addMesh(g,new RoundedBoxGeometry(.36,.12,.55,3,.06),dark,[0,.91,.24]);for(const z of [-.67,.70])wheels.push(wheel(g,0,z,.275,.10));addMesh(g,new THREE.CylinderGeometry(.045,.045,.72,10),rimMat,[0,1.17,-.50],[-.20,0,0]);addMesh(g,new THREE.BoxGeometry(.70,.045,.045),rimMat,[0,1.44,-.64]);
    const rider=new THREE.Group();rider.position.set(0,.02,.08);g.add(rider);const jacket=new THREE.MeshStandardMaterial({color:[0x243447,0x45563f,0x563338,0x31343a][Math.floor(color)%4],roughness:.82}),pants=new THREE.MeshStandardMaterial({color:0x1b1d22,roughness:.9}),skin=new THREE.MeshStandardMaterial({color:0xc49373,roughness:.78});addMesh(rider,new THREE.CapsuleGeometry(.17,.44,5,10),jacket,[0,1.35,.10],[.28,0,0]);addMesh(rider,new THREE.SphereGeometry(.145,14,10),skin,[0,1.73,-.08]);const helmet=addMesh(rider,new THREE.SphereGeometry(.18,16,10,0,Math.PI*2,0,Math.PI/1.72),new THREE.MeshPhysicalMaterial({color:0x20252c,roughness:.26,metalness:.45,clearcoat:.7}),[0,1.79,-.08]);for(const x of [-.12,.12]){const leg=addMesh(rider,new THREE.CapsuleGeometry(.055,.46,4,8),pants,[x,1.00,.18],[.42,0,x<0?.14:-.14]);leg.castShadow=true;}tail(g,0,.68,.92,brake,.22);const head=addMesh(g,new RoundedBoxGeometry(.20,.08,.035,2,.02),headMat,[0,.88,-.92]);head.castShadow=false;
  }else if(type==='bus'){
    addMesh(g,new RoundedBoxGeometry(W,1.02,L,5,.16),body,[0,1.00,0]);addMesh(g,new RoundedBoxGeometry(W-.10,1.12,L-.36,4,.11),body2,[0,1.84,-.02]);const windshield=addMesh(g,new RoundedBoxGeometry(W-.26,.82,.035,4,.06),glass,[0,1.92,-L/2-.025],[-.05,0,0]);windshield.castShadow=false;for(let i=0;i<6;i++){for(const s of [-1,1]){const wnd=addMesh(g,new RoundedBoxGeometry(.035,.55,.82,3,.04),glass,[s*(W/2+.015),1.84,-2.35+i*.94]);wnd.castShadow=false;}}for(const x of [-W*.39,W*.39])for(const z of [-L*.33,L*.34])wheels.push(wheel(g,x,z,.40,.28));tail(g,-.78,.90,L/2+.025,brake,.42);tail(g,.78,.90,L/2+.025,brake,.42);for(const x of [-.76,.76]){const h=addMesh(g,new RoundedBoxGeometry(.42,.10,.035,3,.02),headMat,[x,.90,-L/2-.03]);h.castShadow=false;}addPlate(g,L/2+.04,L);
  }else{
    addMesh(g,new RoundedBoxGeometry(W,.52,L,5,.16),body,[0,.62,0]);
    if(type==='pickup'){
      addMesh(g,new RoundedBoxGeometry(W-.18,.66,1.86,4,.13),body2,[0,1.09,-.72]);for(const s of [-1,1]){const win=addMesh(g,new RoundedBoxGeometry(.035,.42,1.2,3,.04),glass,[s*(W/2-.08),1.18,-.76]);win.castShadow=false;}const bed=addMesh(g,new RoundedBoxGeometry(W-.15,.30,1.62,3,.08),body2,[0,.77,1.38]);addMesh(g,new RoundedBoxGeometry(W-.30,.12,1.34,3,.04),dark,[0,.91,1.38]);
    }else if(type==='van'){
      addMesh(g,new RoundedBoxGeometry(W-.16,.84,2.95,5,.16),body2,[0,1.18,-.15]);const front=addMesh(g,new RoundedBoxGeometry(W-.26,.52,.035,3,.05),glass,[0,1.34,-1.66],[-.06,0,0]);front.castShadow=false;for(const s of [-1,1]){for(const z of [-.82,.35]){const win=addMesh(g,new RoundedBoxGeometry(.035,.43,.76,3,.04),glass,[s*(W/2-.08),1.34,z]);win.castShadow=false;}}
    }else{
      addMesh(g,new RoundedBoxGeometry(W-.18,.58,type==='compact'?1.58:1.84,5,.16),body2,[0,1.03,.04]);const front=addMesh(g,new RoundedBoxGeometry(W-.38,.36,.035,3,.05),glass,[0,1.16,-.90],[-.16,0,0]);front.castShadow=false;const rear=addMesh(g,new RoundedBoxGeometry(W-.42,.32,.035,3,.05),glass,[0,1.13,.91],[.14,0,0]);rear.castShadow=false;for(const s of [-1,1])for(const z of [-.36,.46]){const win=addMesh(g,new RoundedBoxGeometry(.035,.34,.58,3,.035),glass,[s*(W/2-.09),1.08,z]);win.castShadow=false;}
    }
    for(const x of [-(W/2-.12),(W/2-.12)])for(const z of [-L*.30,L*.31])wheels.push(wheel(g,x,z,type==='van'?.35:.32,.22));addSedanDetails(g,body,color,{L,W,type});for(const x of [-.56,.56])tail(g,x,.65,L/2+.035,brake,.36);
  }
  g.userData={length:L,width:W,brake,type,wheels};return g;
}

export class Traffic{
  constructor(scene,roads,count=20){this.scene=scene;this.roads=roads.filter(r=>r.points?.length>1&&r.width>=6);this.cars=[];this.targetCount=count;this.seq=0;this.events=[];this.spawn(count);}
  spawn(n){
    if(!this.roads.length)return;const colors=[0x35414a,0xa6a5a0,0x234964,0x733c39,0xd7d4cd,0x25322b,0x776449,0x8a3238,0x286878,0xe8e5dc,0x4e5061,0xb6bec2];const types=['sedan','scooter','compact','sedan','van','scooter','pickup','sedan','scooter','compact','bus','sedan'];
    for(let i=0;i<n;i++){const r=this.roads[(i*7+this.seq)%this.roads.length];if(!r)continue;let type=types[(i+this.seq)%types.length];if(type==='bus'&&r.width<9)type='van';const color=colors[(i*3+this.seq)%colors.length],mesh=makeTrafficVehicle(color,type),seg=(i*11+this.seq)%Math.max(1,r.points.length-1),a=r.points[seg],b=r.points[seg+1];if(!a||!b)continue;const heading=Math.atan2(b.x-a.x,b.y-a.y),lane=(i%2?1:-1)*Math.min(type==='scooter'?1.15:1.7,r.width*.18),nx=Math.cos(heading),nz=-Math.sin(heading);mesh.position.set(a.x+nx*lane,.03,a.y+nz*lane);mesh.rotation.y=heading;this.scene.add(mesh);const base=type==='bus'?7:type==='scooter'?8.5:8,target=type==='bus'?10:type==='scooter'?13:9+Math.random()*10;this.cars.push({id:++this.seq,mesh,road:r,seg,t:Math.random(),speed:base+Math.random()*7,targetSpeed:target,normalTarget:target,color,type,fuel:type==='scooter'?4+Math.random()*3:18+Math.random()*38,lane,heading,braking:false,crashed:0,hazard:false,reported:false});}
  }
  update(dt,focus=null,signals=null){
    for(const c of this.cars){const dFocus=focus?c.mesh.position.distanceTo(focus):0;c.mesh.visible=dFocus<760;if(dFocus>960)continue;let a=c.road.points[c.seg],b=c.road.points[c.seg+1];if(!b){c.seg=0;a=c.road.points[0];b=c.road.points[1];}const dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz)||1,heading=Math.atan2(dx,dz);c.heading=heading;
      if(c.crashed>0){c.crashed-=dt;c.speed=THREE.MathUtils.lerp(c.speed,0,Math.min(1,dt*4.5));c.braking=true;c.hazard=true;if(c.crashed<=0){c.hazard=false;c.reported=false;c.targetSpeed=c.normalTarget;}this._lights(c);continue;}
      let desired=c.targetSpeed;if(dFocus<(c.type==='bus'?6.8:4.8))desired*=.08;else if(dFocus<11)desired*=.42;if(signals){const sig=signals.shouldStop(c.mesh.position,heading,15);if(sig.stop&&sig.distance<11.5)desired=Math.min(desired,Math.max(0,(sig.distance-3.2)*1.15));}
      let nearestAhead=999;const fwd=new THREE.Vector3(-Math.sin(heading),0,-Math.cos(heading));for(const o of this.cars){if(o===c||!o.mesh.visible)continue;const delta=o.mesh.position.clone().sub(c.mesh.position),ahead=delta.dot(fwd);if(ahead<=0||ahead>18)continue;const lateral=Math.abs(delta.x*fwd.z-delta.z*fwd.x),laneWidth=(c.type==='scooter'||o.type==='scooter')?1.25:2.0;if(lateral<laneWidth)nearestAhead=Math.min(nearestAhead,ahead);}if(nearestAhead<13)desired=Math.min(desired,Math.max(0,(nearestAhead-3.8)*1.15));
      const was=c.speed;c.speed=THREE.MathUtils.lerp(c.speed,desired,Math.min(1,dt*(desired<was?4.8:1.7)));c.braking=c.speed<was-.08;this._lights(c);c.t+=dt*c.speed/len;if(c.t>1){c.t=0;c.seg=(c.seg+1)%(c.road.points.length-1);}const aa=c.road.points[c.seg],bb=c.road.points[c.seg+1]||c.road.points[0],h=Math.atan2(bb.x-aa.x,bb.y-aa.y),nnx=Math.cos(h),nnz=-Math.sin(h);c.mesh.position.x=THREE.MathUtils.lerp(aa.x,bb.x,c.t)+nnx*c.lane;c.mesh.position.z=THREE.MathUtils.lerp(aa.y,bb.y,c.t)+nnz*c.lane;c.mesh.rotation.y=h;if(c.type==='scooter')c.mesh.rotation.z=THREE.MathUtils.lerp(c.mesh.rotation.z,Math.sin(performance.now()*.001+c.id)*.018,dt*3);for(const w of c.mesh.userData.wheels||[])w.rotation.x-=c.speed*dt*.62;
    }
  }
  _lights(c){const blink=Math.floor(performance.now()/330)%2===0;for(const lamp of c.mesh.userData.brake||[]){lamp.material.opacity=c.hazard?(blink?1:.15):(c.braking?1:.62);lamp.material.transparent=true;lamp.scale.setScalar((c.braking||c.hazard&&blink)?1.12:1);}}
  resolvePlayerCollision(car){if(!car)return 0;let severity=0;for(const c of this.cars){const radius=c.type==='bus'?3.8:c.type==='scooter'?1.45:2.65,d=car.group.position.distanceTo(c.mesh.position);if(d>radius)continue;const rel=Math.abs(car.velocity)+c.speed,hit=Math.min(8,rel*.14);severity=Math.max(severity,hit);const away=car.group.position.clone().sub(c.mesh.position);away.y=0;if(away.lengthSq()<.01)away.set(1,0,0);away.normalize();car.group.position.addScaledVector(away,.22+hit*.035);car.velocity*=-.28;car.damage=Math.min(100,car.damage+1.2+hit*1.4);c.speed*=.25;c.targetSpeed=0;if(hit>2.4){c.crashed=Math.max(c.crashed,8+hit*1.7);c.hazard=true;if(!c.reported){c.reported=true;this.events.push({type:'crash',position:c.mesh.position.clone(),road:c.road,severity:hit,vehicleType:c.type});}}}return severity;}
  resolvePedestrianCollision(player){if(!player?.visible)return 0;let severity=0;for(const c of this.cars){if(c.crashed>0)continue;const radius=c.type==='bus'?1.8:c.type==='scooter'?.8:1.15,d=player.group.position.distanceTo(c.mesh.position);if(d>radius)continue;const hit=Math.min(7,Math.max(1,c.speed*.28));severity=Math.max(severity,hit);player.hit?.(c.mesh.position,hit);c.speed*=.35;c.crashed=Math.max(c.crashed,4+hit);c.hazard=true;if(!c.reported){c.reported=true;this.events.push({type:'pedestrian-hit',position:c.mesh.position.clone(),road:c.road,severity:hit,vehicleType:c.type});}}return severity;}
  drainEvents(){return this.events.splice(0,this.events.length);}nearest(pos,max=4.8){let best=null,d=max;for(const c of this.cars){if(c.crashed>0)continue;const dd=c.mesh.position.distanceTo(pos);if(dd<d){best=c;d=dd;}}return best?{car:best,distance:d}:null;}
  take(c){const idx=this.cars.indexOf(c);if(idx<0)return null;this.cars.splice(idx,1);const out={position:c.mesh.position.clone(),heading:c.mesh.rotation.y,color:c.color,type:c.type,fuel:c.fuel,driverPos:c.mesh.position.clone(),road:c.road};this.scene.remove(c.mesh);setTimeout(()=>this.spawn(1),3500);return out;}
  dispose(){for(const c of this.cars)this.scene.remove(c.mesh);this.cars=[];}
}
