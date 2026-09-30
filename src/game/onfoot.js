import * as THREE from 'three';
function M(color,roughness=.75,metalness=.05){return new THREE.MeshStandardMaterial({color,roughness,metalness});}
export class OnFootPlayer{
  constructor(scene){
    this.scene=scene;this.group=new THREE.Group();this.heading=0;this.velocity=0;this.damage=0;this.visible=false;this.stamina=100;this.legs=[];this.arms=[];this.stun=0;this.knockVelocity=new THREE.Vector3();
    const jacket=M(0x202c38,.72),pants=M(0x11161d,.9),skin=M(0xc99578,.78),shoe=M(0x07090c,.95),hair=M(0x121316,.92);
    this.torso=new THREE.Mesh(new THREE.CapsuleGeometry(.29,.78,5,10),jacket);this.torso.position.y=1.3;this.group.add(this.torso);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.23,12,10),skin);head.position.y=2.02;this.group.add(head);const hairMesh=new THREE.Mesh(new THREE.SphereGeometry(.235,10,7,0,Math.PI*2,0,Math.PI/2),hair);hairMesh.position.set(0,2.09,.01);this.group.add(hairMesh);
    for(const x of [-.15,.15]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.095,.62,4,8),pants);leg.position.set(x,.57,0);this.group.add(leg);this.legs.push(leg);const s=new THREE.Mesh(new THREE.BoxGeometry(.18,.1,.34),shoe);s.position.set(x,.15,-.07);this.group.add(s);}
    for(const x of [-.36,.36]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.07,.58,4,8),jacket);arm.position.set(x,1.3,0);arm.rotation.z=x<0?-.1:.1;this.group.add(arm);this.arms.push(arm);}
    this.scene.add(this.group);this.hide();
  }
  showAt(pos,heading=0){this.group.position.copy(pos);this.group.position.y=.02;this.heading=heading;this.group.rotation.y=heading;this.velocity=0;this.stamina=Math.max(25,this.stamina);this.group.visible=true;this.visible=true;}
  hide(){this.group.visible=false;this.visible=false;this.velocity=0;}
  update(dt,input,colliders=[]){
    if(!this.visible)return;if(this.stun>0){this.stun=Math.max(0,this.stun-dt);this.group.position.addScaledVector(this.knockVelocity,dt);this.knockVelocity.multiplyScalar(Math.max(0,1-dt*4.5));this.torso.rotation.z=THREE.MathUtils.lerp(this.torso.rotation.z,this.stun>0?.55:0,Math.min(1,dt*6));this.velocity=0;return;}this.torso.rotation.z=THREE.MathUtils.lerp(this.torso.rotation.z,0,Math.min(1,dt*7));const turn=((input.left?1:0)-(input.right?1:0))*dt*(Math.abs(this.velocity)>1?2.55:2.1);this.heading+=turn;this.group.rotation.y=this.heading;const forward=(input.gas?1:0)-(input.brake?1:0),sprint=input.handbrake&&this.stamina>3&&Math.abs(forward)>.1;
    if(sprint)this.stamina=Math.max(0,this.stamina-dt*18);else this.stamina=Math.min(100,this.stamina+dt*(Math.abs(forward)<.1?14:7));const max=sprint?7.2:4.5;this.velocity=THREE.MathUtils.lerp(this.velocity,forward*max,Math.min(1,dt*7));const dir=new THREE.Vector3(-Math.sin(this.heading),0,-Math.cos(this.heading)),before=this.group.position.clone();this.group.position.addScaledVector(dir,this.velocity*dt);const p=this.group.position;for(const b of colliders){if(p.x>b.min.x-.35&&p.x<b.max.x+.35&&p.z>b.min.z-.35&&p.z<b.max.z+.35){this.group.position.copy(before);this.velocity=0;break;}}
    const pace=Math.min(1,Math.abs(this.velocity)/4.5),swing=Math.sin(performance.now()*.011*Math.max(.25,Math.abs(this.velocity)))*(.18+.20*pace);this.legs.forEach((m,j)=>m.rotation.x=(j?1:-1)*swing);this.arms.forEach((m,j)=>m.rotation.x=(j?1:-1)*swing*.78);this.torso.rotation.x=THREE.MathUtils.lerp(this.torso.rotation.x,sprint?.10:pace*.035,dt*7);this.group.position.y=.02+(pace>.12?Math.abs(Math.sin(performance.now()*.011*Math.max(.25,Math.abs(this.velocity))))*.025:0);
  }
  hit(sourcePos,severity=1){if(!this.visible)return;const away=this.group.position.clone().sub(sourcePos);away.y=0;if(away.lengthSq()<.01)away.set(1,0,0);away.normalize();this.knockVelocity.copy(away).multiplyScalar(2.2+severity*.75);this.knockVelocity.y=0;this.stun=Math.min(1.8,.35+severity*.14);this.damage=Math.min(100,this.damage+5+severity*4.2);this.stamina=Math.max(0,this.stamina-severity*7);}
  get speedKmh(){return Math.abs(this.velocity)*3.6;}get staminaPct(){return this.stamina/100;}
}
