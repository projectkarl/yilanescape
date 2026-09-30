import * as THREE from 'three';

export class Rain {
  constructor(scene,count=1800){
    this.scene=scene; this.count=count; this.radius=190; this.intensity=1;
    const g=new THREE.BufferGeometry(); const a=new Float32Array(count*6);
    for(let i=0;i<count;i++) this._reset(a,i,new THREE.Vector3(),true);
    g.setAttribute('position',new THREE.BufferAttribute(a,3));
    this.lines=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xb9d5e7,transparent:true,opacity:.24,depthWrite:false,blending:THREE.AdditiveBlending}));
    this.lines.frustumCulled=false; scene.add(this.lines);
    // wet mist layer
    const fogGeo=new THREE.BufferGeometry(); const fa=new Float32Array(320*3);
    for(let i=0;i<320;i++){fa[i*3]=(Math.random()-.5)*250;fa[i*3+1]=.2+Math.random()*2.7;fa[i*3+2]=(Math.random()-.5)*250;}
    fogGeo.setAttribute('position',new THREE.BufferAttribute(fa,3));
    this.mist=new THREE.Points(fogGeo,new THREE.PointsMaterial({color:0x9cb3c1,size:.5,transparent:true,opacity:.08,depthWrite:false}));scene.add(this.mist);
  }
  _reset(a,i,c,initial=false){
    const o=i*6; const x=c.x+(Math.random()-.5)*this.radius*2; const z=c.z+(Math.random()-.5)*this.radius*2; const y=initial?Math.random()*75:62+Math.random()*20;
    a[o]=x;a[o+1]=y;a[o+2]=z; a[o+3]=x+1.6;a[o+4]=y-3.8-Math.random()*2.8;a[o+5]=z+.25;
  }
  setIntensity(v){this.intensity=THREE.MathUtils.clamp(v,0,1);this.lines.material.opacity=.03+.25*this.intensity;this.mist.material.opacity=.015+.08*this.intensity;this.lines.visible=this.intensity>.015;this.mist.visible=this.intensity>.04;}
  update(dt,center){
    if(this.intensity<=.01)return;
    const a=this.lines.geometry.attributes.position.array;
    const fall=(48+28*this.intensity)*dt;
    for(let i=0;i<this.count;i++){
      const o=i*6; a[o]-=fall*.18;a[o+1]-=fall;a[o+2]+=fall*.04; a[o+3]-=fall*.18;a[o+4]-=fall;a[o+5]+=fall*.04;
      if(a[o+1]<0||Math.abs(a[o]-center.x)>this.radius||Math.abs(a[o+2]-center.z)>this.radius)this._reset(a,i,center);
    }
    this.lines.geometry.attributes.position.needsUpdate=true;
    this.mist.position.x=THREE.MathUtils.lerp(this.mist.position.x,center.x,.04);this.mist.position.z=THREE.MathUtils.lerp(this.mist.position.z,center.z,.04);
  }
}
