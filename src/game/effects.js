import * as THREE from 'three';

export class VehicleEffects{
  constructor(scene){this.scene=scene;this.sparks=[];this.smoke=[];this.spray=[];this.glass=[];this.rings=[];}
  impact(position,severity=1){
    const count=Math.min(18,5+Math.floor(severity*4));
    const mat=new THREE.MeshBasicMaterial({color:0xffb04a,toneMapped:false,transparent:true,opacity:1});
    for(let i=0;i<count;i++){
      const m=new THREE.Mesh(new THREE.SphereGeometry(.025,4,3),mat.clone());m.position.copy(position).add(new THREE.Vector3((Math.random()-.5)*1.2,.35+Math.random()*.5,(Math.random()-.5)*1.2));
      const v=new THREE.Vector3((Math.random()-.5)*5,1.5+Math.random()*3,(Math.random()-.5)*5);this.scene.add(m);this.sparks.push({m,v,life:.28+Math.random()*.28});
    }
    if(severity>3.4)this.glassBurst(position,severity);
  }
  glassBurst(position,severity=4){
    const count=Math.min(24,8+Math.floor(severity*2));const mat=new THREE.MeshPhysicalMaterial({color:0xbfe9ff,transparent:true,opacity:.42,roughness:.08,metalness:.05,transmission:.28,side:THREE.DoubleSide});
    for(let i=0;i<count;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(.06+Math.random()*.11,.04+Math.random()*.08),mat.clone());m.position.copy(position).add(new THREE.Vector3((Math.random()-.5)*1.5,.65+Math.random()*.6,(Math.random()-.5)*1.3));m.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3);const v=new THREE.Vector3((Math.random()-.5)*4.5,1+Math.random()*3.5,(Math.random()-.5)*4.5);this.scene.add(m);this.glass.push({m,v,life:.55+Math.random()*.45,spin:new THREE.Vector3(Math.random()*5,Math.random()*5,Math.random()*5)});}
  }
  splashRing(position,rain=.5){if(rain<.18)return;const geo=new THREE.RingGeometry(.15,.21,18);const mat=new THREE.MeshBasicMaterial({color:0xa8d9ee,transparent:true,opacity:.16+rain*.12,side:THREE.DoubleSide,depthWrite:false});const m=new THREE.Mesh(geo,mat);m.rotation.x=-Math.PI/2;m.position.copy(position);m.position.y=.19;this.scene.add(m);this.rings.push({m,life:.35,rate:4+rain*5});}
  smokeFrom(car,dt){
    if(!car||car.damage<62||Math.random()>dt*9)return;
    const mat=new THREE.MeshBasicMaterial({color:0x9ea4a6,transparent:true,opacity:.22,depthWrite:false});const m=new THREE.Mesh(new THREE.SphereGeometry(.22+Math.random()*.18,6,5),mat);
    const p=car.group.position.clone().add(new THREE.Vector3(0,.78,0));m.position.copy(p);this.scene.add(m);this.smoke.push({m,life:1.5,vy:.55+Math.random()*.35});
  }
  update(dt,car,rainLevel=.5){
    this.smokeFrom(car,dt);
    if(car&&car.speedKmh>32&&rainLevel>.05&&Math.random()<dt*Math.min(38,car.speedKmh*.16)*rainLevel){const mat=new THREE.MeshBasicMaterial({color:0xc6ddeb,transparent:true,opacity:.12+rainLevel*.12,depthWrite:false});const m=new THREE.Mesh(new THREE.SphereGeometry(.07+Math.random()*.11,5,4),mat);const side=Math.random()>.5?-.82:.82,back=new THREE.Vector3(Math.sin(car.heading)*side,.18,Math.cos(car.heading)*1.65);m.position.copy(car.group.position).add(back);this.scene.add(m);this.spray.push({m,life:.42,v:new THREE.Vector3((Math.random()-.5)*.8,.22,Math.cos(car.heading)*2)});if(Math.random()<.08)this.splashRing(m.position,rainLevel);}
    for(let i=this.sparks.length-1;i>=0;i--){const s=this.sparks[i];s.life-=dt;s.v.y-=9.8*dt;s.m.position.addScaledVector(s.v,dt);s.m.material.opacity=Math.max(0,s.life*2);if(s.life<=0){this.scene.remove(s.m);this.sparks.splice(i,1);}}
    for(let i=this.smoke.length-1;i>=0;i--){const s=this.smoke[i];s.life-=dt;s.m.position.y+=s.vy*dt;s.m.scale.multiplyScalar(1+dt*.7);s.m.material.opacity=Math.max(0,s.life*.13);if(s.life<=0){this.scene.remove(s.m);this.smoke.splice(i,1);}}
    for(let i=this.spray.length-1;i>=0;i--){const s=this.spray[i];s.life-=dt;s.m.position.addScaledVector(s.v,dt);s.m.scale.multiplyScalar(1+dt*2.5);s.m.material.opacity=Math.max(0,s.life*.28);if(s.life<=0){this.scene.remove(s.m);this.spray.splice(i,1);}}
    for(let i=this.glass.length-1;i>=0;i--){const s=this.glass[i];s.life-=dt;s.v.y-=9.8*dt;s.m.position.addScaledVector(s.v,dt);s.m.rotation.x+=s.spin.x*dt;s.m.rotation.y+=s.spin.y*dt;s.m.rotation.z+=s.spin.z*dt;s.m.material.opacity=Math.max(0,s.life*.5);if(s.life<=0){this.scene.remove(s.m);this.glass.splice(i,1);}}
    for(let i=this.rings.length-1;i>=0;i--){const s=this.rings[i];s.life-=dt;s.m.scale.multiplyScalar(1+dt*s.rate);s.m.material.opacity=Math.max(0,s.life*.45);if(s.life<=0){this.scene.remove(s.m);this.rings.splice(i,1);}}
  }
}
