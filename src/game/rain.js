import * as THREE from 'three';
export class Rain{
  constructor(scene,count=760){this.scene=scene;this.count=count;this.radius=165;this.intensity=0;const g=new THREE.BufferGeometry(),a=new Float32Array(count*6);for(let i=0;i<count;i++)this._reset(a,i,new THREE.Vector3(),true);g.setAttribute('position',new THREE.BufferAttribute(a,3));this.lines=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xd6e5ed,transparent:true,opacity:.0,depthWrite:false,blending:THREE.NormalBlending}));this.lines.frustumCulled=false;scene.add(this.lines);}
  _reset(a,i,c,initial=false){const o=i*6,x=c.x+(Math.random()-.5)*this.radius*2,z=c.z+(Math.random()-.5)*this.radius*2,y=initial?Math.random()*62:52+Math.random()*17;a[o]=x;a[o+1]=y;a[o+2]=z;a[o+3]=x+.72;a[o+4]=y-2.7-Math.random()*1.8;a[o+5]=z+.10;}
  setIntensity(v){this.intensity=THREE.MathUtils.clamp(v,0,1);this.lines.material.opacity=.018+.10*this.intensity;this.lines.visible=this.intensity>.02;}
  update(dt,center){if(this.intensity<=.01)return;const a=this.lines.geometry.attributes.position.array,fall=(42+22*this.intensity)*dt;for(let i=0;i<this.count;i++){const o=i*6;a[o]-=fall*.08;a[o+1]-=fall;a[o+2]+=fall*.02;a[o+3]-=fall*.08;a[o+4]-=fall;a[o+5]+=fall*.02;if(a[o+1]<0||Math.abs(a[o]-center.x)>this.radius||Math.abs(a[o+2]-center.z)>this.radius)this._reset(a,i,center);}this.lines.geometry.attributes.position.needsUpdate=true;}
}
