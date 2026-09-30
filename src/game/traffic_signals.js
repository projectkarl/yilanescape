import * as THREE from 'three';

const M=(color,rough=.62,metal=.18)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});

function key(p,size=5){return `${Math.round(p.x/size)},${Math.round(p.y/size)}`;}

function findJunctions(roads,max=14){
  const buckets=new Map();
  roads.forEach((r,ri)=>{
    if(!r?.points?.length||r.width<7)return;
    r.points.forEach((p,pi)=>{
      if(Math.abs(p.x)>980||Math.abs(p.y)>980)return;
      const k=key(p);let b=buckets.get(k);if(!b){b={sum:new THREE.Vector2(),n:0,roads:new Set(),points:[]};buckets.set(k,b);}
      b.sum.add(p);b.n++;b.roads.add(ri);b.points.push({p,pi,r});
    });
  });
  const items=[];
  for(const b of buckets.values()){
    if(b.roads.size<2)continue;
    const p=b.sum.multiplyScalar(1/b.n);
    if(Math.hypot(p.x,p.y)<45)continue;
    items.push({x:p.x,z:p.y,score:b.roads.size*10+b.n});
  }
  items.sort((a,b)=>b.score-a.score);
  const picked=[];
  for(const c of items){if(picked.every(p=>Math.hypot(p.x-c.x,p.z-c.z)>110)){picked.push(c);if(picked.length>=max)break;}}
  // Fallback city-core junctions when OSM topology does not share vertices.
  if(picked.length<6){
    [[-300,-245],[-100,-70],[110,115],[330,300],[-510,300],[540,-425],[-300,500],[330,-610]].forEach(([x,z])=>{
      if(picked.length<max&&picked.every(p=>Math.hypot(p.x-x,p.z-z)>85))picked.push({x,z,score:1});
    });
  }
  return picked;
}

export class TrafficSignals{
  constructor(scene,roads){
    this.scene=scene;this.time=0;this.cycle=24;this.junctions=findJunctions(roads);this.group=new THREE.Group();scene.add(this.group);this.lights=[];this.build();
  }
  phaseFor(heading){
    const alongZ=Math.abs(Math.cos(heading))>=Math.abs(Math.sin(heading));
    const t=this.time%this.cycle;
    // Alternating two-axis phases with a short all-red/yellow buffer.
    if(alongZ){if(t<9)return 'green';if(t<11)return 'yellow';if(t<22)return 'red';return 'yellow';}
    if(t<11)return 'red';if(t<20)return 'green';if(t<22)return 'yellow';return 'red';
  }
  shouldStop(pos,heading,range=13){
    let nearest=null,d=range;
    for(const j of this.junctions){const dd=Math.hypot(pos.x-j.x,pos.z-j.z);if(dd<d){d=dd;nearest=j;}}
    if(!nearest)return {stop:false,distance:999,state:'green'};
    const state=this.phaseFor(heading);return {stop:state==='red',distance:d,state,junction:nearest};
  }
  update(dt){this.time+=dt;for(const l of this.lights){const state=this.phaseFor(l.heading);l.r.material.opacity=state==='red'?1:.13;l.y.material.opacity=state==='yellow'?1:.10;l.g.material.opacity=state==='green'?1:.12;}}
  build(){
    const pole=M(0x22272c,.55,.65);const housing=M(0x101317,.58,.45);
    const red=new THREE.MeshBasicMaterial({color:0xff253e,transparent:true,opacity:.15,toneMapped:false});
    const amber=new THREE.MeshBasicMaterial({color:0xffb22f,transparent:true,opacity:.12,toneMapped:false});
    const green=new THREE.MeshBasicMaterial({color:0x2cff86,transparent:true,opacity:.12,toneMapped:false});
    for(const j of this.junctions){
      for(let axis=0;axis<2;axis++)for(const side of [-1,1]){
        const g=new THREE.Group();g.position.set(j.x+(axis?side*7:side*2.2),0,j.z+(axis?side*2.2:side*7));g.rotation.y=axis?Math.PI/2:0;
        const p=new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,4.8,7),pole);p.position.y=2.4;g.add(p);
        const arm=new THREE.Mesh(new THREE.BoxGeometry(3.4,.08,.08),pole);arm.position.set(-side*1.55,4.55,0);g.add(arm);
        const box=new THREE.Mesh(new THREE.BoxGeometry(.55,1.55,.42),housing);box.position.set(-side*3.0,4.35,0);g.add(box);
        const lamps=[];for(const [y,mat] of [[4.82,red],[4.35,amber],[3.88,green]]){const m=new THREE.Mesh(new THREE.CircleGeometry(.14,12),mat.clone());m.position.set(-side*3.0,y,-.215);m.rotation.y=Math.PI;g.add(m);lamps.push(m);}
        this.group.add(g);this.lights.push({r:lamps[0],y:lamps[1],g:lamps[2],heading:axis?Math.PI/2:0});
      }
    }
  }
}
