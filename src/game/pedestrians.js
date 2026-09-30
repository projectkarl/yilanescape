import * as THREE from 'three';

const skinTones=[0xe2b39b,0xc78f72,0x9e6e55,0xf0c3a8];
const clothes=[0x27394d,0x5a3342,0x344b37,0x5e563c,0x393941,0x6b3940,0x2f4859];

function personMesh(i){
  const g=new THREE.Group();
  const bodyMat=new THREE.MeshStandardMaterial({color:clothes[i%clothes.length],roughness:.85});const dark=new THREE.MeshStandardMaterial({color:0x15181c,roughness:.9});const skin=new THREE.MeshStandardMaterial({color:skinTones[i%skinTones.length],roughness:.78});
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.25,.72,4,8),bodyMat);torso.position.y=1.25;g.add(torso);const head=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),skin);head.position.y=1.92;g.add(head);
  const legs=[];for(const x of [-.13,.13]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.085,.58,3,7),dark);leg.position.set(x,.55,0);g.add(leg);legs.push(leg);}
  const arms=[];for(const x of [-.34,.34]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.065,.52,3,7),bodyMat);arm.position.set(x,1.28,0);arm.rotation.z=x<0?-.12:.12;g.add(arm);arms.push(arm);}
  if(i%5===0){const umbrella=new THREE.Mesh(new THREE.SphereGeometry(.65,12,6,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:[0x2b3a53,0x702f39,0x3a5140][i%3],roughness:.58,side:THREE.DoubleSide}));umbrella.position.set(.15,2.42,0);g.add(umbrella);const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,1.1,5),dark);shaft.position.set(.15,1.9,0);g.add(shaft);}
  g.scale.setScalar(.94+((i*17)%10)/100);g.userData={legs,arms};return g;
}

export class Pedestrians{
  constructor(scene,roads,count=42){this.scene=scene;this.roads=roads.filter(r=>r.points?.length>1&&r.width>=5);this.people=[];this.seq=0;this.spawn(count);}
  _add(road,seg,t,side,i,panic=0){const a=road.points[seg],b=road.points[seg+1];if(!a||!b)return null;const g=personMesh(i);const dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz)||1;const nx=-dz/len,nz=dx/len,offset=(road.width*.5+1.15)*side;g.position.set(THREE.MathUtils.lerp(a.x,b.x,t)+nx*offset,.02,THREE.MathUtils.lerp(a.y,b.y,t)+nz*offset);g.rotation.y=Math.atan2(dx,dz);this.scene.add(g);const p={g,road,seg,t,speed:.72+((i*19)%55)/100,dir:i%3?1:-1,side,panic,panicTimer:0,id:++this.seq};this.people.push(p);return p;}
  spawn(n){if(!this.roads.length)return;for(let i=0;i<n;i++){const road=this.roads[(i*13)%this.roads.length],seg=(i*5)%Math.max(1,road.points.length-1);this._add(road,seg,(i*.37)%1,i%2?1:-1,i);}}
  reactToCrash(pos,severity=1){for(const p of this.people){const d=p.g.position.distanceTo(pos);if(d<28+severity*2){p.panic=Math.max(p.panic,.75);p.panicTimer=Math.max(p.panicTimer,3+severity*.55);const away=p.g.position.clone().sub(pos);if(Math.abs(away.x)+Math.abs(away.z)>.1)p.side=away.x>=0?1:-1;}}if(severity>3)this.addFleeingPerson(pos);}
  addFleeingPerson(pos,road=null){
    const r=road||this.roads.reduce((best,x)=>{const p=x.points?.[0];if(!p)return best;const d=Math.hypot(p.x-pos.x,p.y-pos.z);return !best||d<best.d?{r:x,d}:best;},null)?.r;if(!r)return;
    const p=this._add(r,0,.1,1,this.seq+31,1);if(p){p.g.position.copy(pos);p.g.position.y=.02;p.panic=1;p.panicTimer=6;p.dir=Math.random()>.5?1:-1;}
  }
  update(dt,threatPos=null){
    for(const p of this.people){const visualDist=threatPos?p.g.position.distanceTo(threatPos):0;p.g.visible=!threatPos||visualDist<360;if(threatPos&&visualDist>520)continue;const pts=p.road.points;if(pts.length<2)continue;let a=pts[p.seg],b=pts[p.seg+1];if(!a||!b){p.seg=0;a=pts[0];b=pts[1];}
      const dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz)||1;if(p.panicTimer>0)p.panicTimer-=dt;
      if(threatPos){const d=p.g.position.distanceTo(threatPos);const panicTarget=(d<8||p.panicTimer>0)?1:d<16?.5:0;p.panic=THREE.MathUtils.lerp(p.panic,panicTarget,Math.min(1,dt*(panicTarget>p.panic?4:1.7)));if(d<5.5&&p.panic>.5)p.side=p.g.position.x>threatPos.x?1:-1;}
      const walk=p.speed*(1+p.panic*2.25);p.t+=dt*walk/Math.max(1,len)*p.dir;if(p.t>1){p.t=0;p.seg=(p.seg+1)%(pts.length-1);}else if(p.t<0){p.t=1;p.seg=(p.seg-1+pts.length-1)%(pts.length-1);}
      a=pts[p.seg];b=pts[p.seg+1]||pts[0];const ddx=b.x-a.x,ddz=b.y-a.y,ll=Math.hypot(ddx,ddz)||1,nnx=-ddz/ll,nnz=ddx/ll;const off=(p.road.width*.5+1.15+p.panic*2.8)*p.side;
      p.g.position.x=THREE.MathUtils.lerp(a.x,b.x,p.t)+nnx*off;p.g.position.z=THREE.MathUtils.lerp(a.y,b.y,p.t)+nnz*off;p.g.rotation.y=Math.atan2(ddx,ddz)+(p.dir<0?Math.PI:0);
      const swing=Math.sin(performance.now()*.006*walk+p.seg)*(.18+p.panic*.12);for(const [j,m] of (p.g.userData.legs||[]).entries())m.rotation.x=(j?1:-1)*swing;for(const [j,m] of (p.g.userData.arms||[]).entries())m.rotation.x=(j?1:-1)*swing*.75;
    }
  }
}
