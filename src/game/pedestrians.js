import * as THREE from 'three';

const skinTones=[0xe2b394,0xc99473,0xb97e5d,0xf0c7a9,0x9e6a50];
const tops=[0x26384a,0x58624f,0x68444a,0x3e4147,0x8a765d,0x394e56,0x6d665b,0x304737];
const bottoms=[0x161a20,0x272a2e,0x303237,0x3a3430,0x1e2732];
const shoes=[0x111316,0x312b27,0xd9d8d2,0x222326];
function M(color,r=.82,m=.02,extra={}){return new THREE.MeshStandardMaterial({color,roughness:r,metalness:m,...extra});}
function capsule(radius,length,mat){const m=new THREE.Mesh(new THREE.CapsuleGeometry(radius,length,6,10),mat);m.castShadow=true;m.receiveShadow=true;return m;}
function limb(parent,{x=0,y=0,z=0,length=.55,radius=.065,mat,side=1,upper=true}){const pivot=new THREE.Group();pivot.position.set(x,y,z);parent.add(pivot);const seg=capsule(radius,length,mat);seg.position.y=-length*.48;seg.rotation.z=side*.02;pivot.add(seg);return {pivot,mesh:seg};}

function personMesh(i){
  const g=new THREE.Group(),height=.94+((i*17)%12)/100,skin=M(skinTones[i%skinTones.length],.80),top=M(tops[(i*3)%tops.length],.76),bottom=M(bottoms[(i*5)%bottoms.length],.88),shoe=M(shoes[(i*7)%shoes.length],.92),hair=M([0x171514,0x2b211d,0x3b312c,0x111214][i%4],.90),metal=M(0x4b5154,.45,.55);
  const pelvis=new THREE.Mesh(new THREE.SphereGeometry(.19,14,9),bottom);pelvis.scale.set(1.15,.68,.72);pelvis.position.y=.91;g.add(pelvis);
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.22,.50,6,12),top);torso.scale.set(1.08,1.0,.74);torso.position.y=1.38;g.add(torso);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.07,.075,.14,10),skin);neck.position.y=1.78;g.add(neck);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.19,18,14),skin);head.scale.set(.86,1.05,.90);head.position.y=1.98;g.add(head);
  const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.194,18,10,0,Math.PI*2,0,Math.PI/1.85),hair);hairCap.scale.copy(head.scale);hairCap.position.set(0,2.045,.005);g.add(hairCap);
  const nose=new THREE.Mesh(new THREE.ConeGeometry(.025,.06,8),skin);nose.rotation.x=Math.PI/2;nose.position.set(0,1.98,-.175);g.add(nose);
  const legs=[],arms=[];
  for(const side of [-1,1]){
    const hip=limb(g,{x:side*.115,y:.88,z:0,length:.46,radius:.082,mat:bottom,side});const knee=new THREE.Group();knee.position.set(0,-.43,0);hip.pivot.add(knee);const shin=capsule(.073,.44,bottom);shin.position.y=-.22;knee.add(shin);const foot=new THREE.Mesh(new THREE.BoxGeometry(.16,.10,.29),shoe);foot.position.set(0,-.47,-.06);knee.add(foot);legs.push({hip:hip.pivot,knee,shin,foot});
    const shoulder=limb(g,{x:side*.29,y:1.62,z:0,length:.38,radius:.06,mat:top,side});const elbow=new THREE.Group();elbow.position.set(0,-.36,0);shoulder.pivot.add(elbow);const fore=capsule(.052,.34,skin);fore.position.y=-.16;elbow.add(fore);const hand=new THREE.Mesh(new THREE.SphereGeometry(.06,10,8),skin);hand.scale.set(.75,1,.72);hand.position.y=-.37;elbow.add(hand);arms.push({shoulder:shoulder.pivot,elbow,fore,hand});
  }
  if(i%6===1){const bag=new THREE.Mesh(new THREE.BoxGeometry(.34,.48,.16),M(0x2f3438,.82,.05));bag.position.set(.22,1.30,.18);bag.rotation.z=-.08;g.add(bag);const strap=new THREE.Mesh(new THREE.TorusGeometry(.31,.018,6,18,Math.PI*1.2),M(0x24282b,.82,.1));strap.position.set(.04,1.49,.06);strap.rotation.x=Math.PI/2;strap.rotation.z=.55;g.add(strap);}
  if(i%7===0){const coat=new THREE.Mesh(new THREE.CylinderGeometry(.28,.34,.76,16,1,true),top);coat.position.y=1.27;g.add(coat);}
  if(i%5===0){const umb=new THREE.Group();umb.position.set(.18,1.72,0);const canopy=new THREE.Mesh(new THREE.SphereGeometry(.63,20,8,0,Math.PI*2,0,Math.PI/2),M([0x273b55,0x713e47,0x405844,0x6a6260][i%4],.52));canopy.scale.y=.62;canopy.position.y=.62;umb.add(canopy);const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.014,.014,1.05,8),metal);shaft.position.y=.08;umb.add(shaft);g.add(umb);}
  g.scale.setScalar(height);g.userData={legs,arms,torso,head,height};return g;
}

export class Pedestrians{
  constructor(scene,roads,count=42){this.scene=scene;this.roads=roads.filter(r=>r.points?.length>1&&r.width>=5);this.people=[];this.seq=0;this.spawn(count);}
  _add(road,seg,t,side,i,panic=0){const a=road.points[seg],b=road.points[seg+1];if(!a||!b)return null;const g=personMesh(i),dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz)||1,nx=-dz/len,nz=dx/len,offset=(road.width*.5+1.35)*side;g.position.set(THREE.MathUtils.lerp(a.x,b.x,t)+nx*offset,.02,THREE.MathUtils.lerp(a.y,b.y,t)+nz*offset);g.rotation.y=Math.atan2(dx,dz);this.scene.add(g);const p={g,road,seg,t,speed:.70+((i*19)%52)/100,dir:i%3?1:-1,side,panic,panicTimer:0,id:++this.seq,phase:i*.77};this.people.push(p);return p;}
  spawn(n){if(!this.roads.length)return;for(let i=0;i<n;i++){const road=this.roads[(i*13)%this.roads.length],seg=(i*5)%Math.max(1,road.points.length-1);this._add(road,seg,(i*.37)%1,i%2?1:-1,i);}}
  reactToCrash(pos,severity=1){for(const p of this.people){const d=p.g.position.distanceTo(pos);if(d<30+severity*2.2){p.panic=Math.max(p.panic,.78);p.panicTimer=Math.max(p.panicTimer,3.5+severity*.55);const away=p.g.position.clone().sub(pos);if(Math.abs(away.x)+Math.abs(away.z)>.1)p.side=away.x>=0?1:-1;}}if(severity>3)this.addFleeingPerson(pos);}
  addFleeingPerson(pos,road=null){const r=road||this.roads.reduce((best,x)=>{const p=x.points?.[0];if(!p)return best;const d=Math.hypot(p.x-pos.x,p.y-pos.z);return !best||d<best.d?{r:x,d}:best;},null)?.r;if(!r)return;const p=this._add(r,0,.1,1,this.seq+31,1);if(p){p.g.position.copy(pos);p.g.position.y=.02;p.panic=1;p.panicTimer=6;p.dir=Math.random()>.5?1:-1;}}
  update(dt,threatPos=null){
    const time=performance.now()*.001;
    for(const p of this.people){const visualDist=threatPos?p.g.position.distanceTo(threatPos):0;p.g.visible=!threatPos||visualDist<330;if(threatPos&&visualDist>480)continue;const pts=p.road.points;if(pts.length<2)continue;let a=pts[p.seg],b=pts[p.seg+1];if(!a||!b){p.seg=0;a=pts[0];b=pts[1];}const dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz)||1;if(p.panicTimer>0)p.panicTimer-=dt;
      if(threatPos){const d=p.g.position.distanceTo(threatPos),panicTarget=(d<8||p.panicTimer>0)?1:d<16?.5:0;p.panic=THREE.MathUtils.lerp(p.panic,panicTarget,Math.min(1,dt*(panicTarget>p.panic?4:1.7)));if(d<5.5&&p.panic>.5)p.side=p.g.position.x>threatPos.x?1:-1;}
      const walk=p.speed*(1+p.panic*2.15);p.t+=dt*walk/Math.max(1,len)*p.dir;if(p.t>1){p.t=0;p.seg=(p.seg+1)%(pts.length-1);}else if(p.t<0){p.t=1;p.seg=(p.seg-1+pts.length-1)%(pts.length-1);}a=pts[p.seg];b=pts[p.seg+1]||pts[0];const ddx=b.x-a.x,ddz=b.y-a.y,ll=Math.hypot(ddx,ddz)||1,nnx=-ddz/ll,nnz=ddx/ll,off=(p.road.width*.5+1.35+p.panic*2.6)*p.side;p.g.position.x=THREE.MathUtils.lerp(a.x,b.x,p.t)+nnx*off;p.g.position.z=THREE.MathUtils.lerp(a.y,b.y,p.t)+nnz*off;p.g.rotation.y=Math.atan2(ddx,ddz)+(p.dir<0?Math.PI:0);
      const pace=Math.min(1.6,walk/1.2),swing=Math.sin(time*6.7*pace+p.phase)*(.46+p.panic*.14),bend=Math.max(0,-Math.sin(time*6.7*pace+p.phase))*.42;for(const [j,l] of p.g.userData.legs.entries()){l.hip.rotation.x=(j?1:-1)*swing;l.knee.rotation.x=bend*(j?1:.65);}for(const [j,a2] of p.g.userData.arms.entries()){a2.shoulder.rotation.x=(j?-1:1)*swing*.66;a2.elbow.rotation.x=-.10-Math.max(0,(j?-1:1)*swing)*.18;}p.g.userData.torso.rotation.x=p.panic?.08:.015;p.g.position.y=.02+Math.abs(Math.sin(time*6.7*pace+p.phase))*.012;
    }
  }
}
