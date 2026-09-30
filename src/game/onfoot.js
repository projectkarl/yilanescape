import * as THREE from 'three';
function M(color,roughness=.78,metalness=.03){return new THREE.MeshStandardMaterial({color,roughness,metalness});}
function capsule(radius,length,mat){const m=new THREE.Mesh(new THREE.CapsuleGeometry(radius,length,6,12),mat);m.castShadow=true;m.receiveShadow=true;return m;}
export class OnFootPlayer{
  constructor(scene){
    this.scene=scene;this.group=new THREE.Group();this.heading=0;this.velocity=0;this.damage=0;this.visible=false;this.stamina=100;this.legs=[];this.arms=[];this.stun=0;this.knockVelocity=new THREE.Vector3();
    const jacket=M(0x243341,.73),shirt=M(0xbfc4c3,.80),pants=M(0x151b22,.90),skin=M(0xc99776,.80),shoe=M(0x0b0d10,.94),hair=M(0x181615,.92),metal=M(0x545d62,.48,.58);
    const pelvis=new THREE.Mesh(new THREE.SphereGeometry(.19,16,10),pants);pelvis.scale.set(1.14,.66,.72);pelvis.position.y=.92;this.group.add(pelvis);
    this.torso=new THREE.Mesh(new THREE.CapsuleGeometry(.225,.50,7,14),jacket);this.torso.scale.set(1.08,1,.74);this.torso.position.y=1.40;this.group.add(this.torso);
    const shirtV=new THREE.Mesh(new THREE.BoxGeometry(.22,.20,.018),shirt);shirtV.position.set(0,1.55,-.205);shirtV.rotation.x=-.07;this.group.add(shirtV);
    const neck=new THREE.Mesh(new THREE.CylinderGeometry(.07,.075,.14,10),skin);neck.position.y=1.79;this.group.add(neck);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.19,18,14),skin);head.scale.set(.86,1.05,.90);head.position.y=1.99;this.group.add(head);
    const hairMesh=new THREE.Mesh(new THREE.SphereGeometry(.195,18,10,0,Math.PI*2,0,Math.PI/1.85),hair);hairMesh.scale.copy(head.scale);hairMesh.position.set(0,2.055,.005);this.group.add(hairMesh);
    const nose=new THREE.Mesh(new THREE.ConeGeometry(.025,.06,8),skin);nose.rotation.x=Math.PI/2;nose.position.set(0,1.99,-.176);this.group.add(nose);
    for(const side of [-1,1]){
      const hip=new THREE.Group();hip.position.set(side*.115,.90,0);this.group.add(hip);const thigh=capsule(.082,.46,pants);thigh.position.y=-.22;hip.add(thigh);const knee=new THREE.Group();knee.position.set(0,-.43,0);hip.add(knee);const shin=capsule(.073,.44,pants);shin.position.y=-.22;knee.add(shin);const foot=new THREE.Mesh(new THREE.BoxGeometry(.17,.10,.30),shoe);foot.position.set(0,-.47,-.06);knee.add(foot);this.legs.push({hip,knee,foot});
      const shoulder=new THREE.Group();shoulder.position.set(side*.29,1.62,0);this.group.add(shoulder);const upper=capsule(.061,.38,jacket);upper.position.y=-.18;shoulder.add(upper);const elbow=new THREE.Group();elbow.position.set(0,-.36,0);shoulder.add(elbow);const fore=capsule(.052,.34,skin);fore.position.y=-.16;elbow.add(fore);const hand=new THREE.Mesh(new THREE.SphereGeometry(.06,10,8),skin);hand.scale.set(.75,1,.72);hand.position.y=-.37;elbow.add(hand);this.arms.push({shoulder,elbow,hand});
    }
    const belt=new THREE.Mesh(new THREE.BoxGeometry(.46,.05,.31),M(0x2a2c2e,.84,.18));belt.position.y=1.03;this.group.add(belt);const buckle=new THREE.Mesh(new THREE.BoxGeometry(.08,.06,.02),metal);buckle.position.set(0,1.03,-.165);this.group.add(buckle);
    this.scene.add(this.group);this.hide();
  }
  showAt(pos,heading=0){this.group.position.copy(pos);this.group.position.y=.02;this.heading=heading;this.group.rotation.y=heading;this.velocity=0;this.stamina=Math.max(25,this.stamina);this.group.visible=true;this.visible=true;}
  hide(){this.group.visible=false;this.visible=false;this.velocity=0;}
  update(dt,input,colliders=[]){
    if(!this.visible)return;if(this.stun>0){this.stun=Math.max(0,this.stun-dt);this.group.position.addScaledVector(this.knockVelocity,dt);this.knockVelocity.multiplyScalar(Math.max(0,1-dt*4.5));this.torso.rotation.z=THREE.MathUtils.lerp(this.torso.rotation.z,this.stun>0?.55:0,Math.min(1,dt*6));this.velocity=0;return;}this.torso.rotation.z=THREE.MathUtils.lerp(this.torso.rotation.z,0,Math.min(1,dt*7));const turn=((input.left?1:0)-(input.right?1:0))*dt*(Math.abs(this.velocity)>1?2.55:2.1);this.heading+=turn;this.group.rotation.y=this.heading;const forward=(input.gas?1:0)-(input.brake?1:0),sprint=input.handbrake&&this.stamina>3&&Math.abs(forward)>.1;if(sprint)this.stamina=Math.max(0,this.stamina-dt*18);else this.stamina=Math.min(100,this.stamina+dt*(Math.abs(forward)<.1?14:7));const max=sprint?7.2:4.5;this.velocity=THREE.MathUtils.lerp(this.velocity,forward*max,Math.min(1,dt*7));const dir=new THREE.Vector3(-Math.sin(this.heading),0,-Math.cos(this.heading)),before=this.group.position.clone();this.group.position.addScaledVector(dir,this.velocity*dt);const p=this.group.position;for(const b of colliders){if(p.x>b.min.x-.35&&p.x<b.max.x+.35&&p.z>b.min.z-.35&&p.z<b.max.z+.35){this.group.position.copy(before);this.velocity=0;break;}}
    const pace=Math.min(1,Math.abs(this.velocity)/4.5),phase=performance.now()*.0105*Math.max(.28,Math.abs(this.velocity)),swing=Math.sin(phase)*(.40+.26*pace),knee=Math.max(0,-Math.sin(phase))*.48;for(const [j,l] of this.legs.entries()){l.hip.rotation.x=(j?1:-1)*swing;l.knee.rotation.x=knee*(j?1:.7);}for(const [j,a] of this.arms.entries()){a.shoulder.rotation.x=(j?-1:1)*swing*.68;a.elbow.rotation.x=-.10-Math.max(0,(j?-1:1)*swing)*.16;}this.torso.rotation.x=THREE.MathUtils.lerp(this.torso.rotation.x,sprint?.10:pace*.03,dt*7);this.group.position.y=.02+(pace>.12?Math.abs(Math.sin(phase))*.018:0);
  }
  hit(sourcePos,severity=1){if(!this.visible)return;const away=this.group.position.clone().sub(sourcePos);away.y=0;if(away.lengthSq()<.01)away.set(1,0,0);away.normalize();this.knockVelocity.copy(away).multiplyScalar(2.2+severity*.75);this.stun=Math.min(1.8,.35+severity*.14);this.damage=Math.min(100,this.damage+5+severity*4.2);this.stamina=Math.max(0,this.stamina-severity*7);}
  get speedKmh(){return Math.abs(this.velocity)*3.6;}get staminaPct(){return this.stamina/100;}
}
