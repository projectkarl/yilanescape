import * as THREE from 'three';

function labelSprite(text){
  const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle='rgba(5,11,16,.78)';x.fillRect(0,22,512,84);x.strokeStyle='rgba(112,221,255,.8)';x.strokeRect(2,24,508,80);x.fillStyle='#fff';x.font='700 34px system-ui';x.textAlign='center';x.fillText(text,256,74);x.font='500 19px system-ui';x.fillStyle='#8ee8ff';x.fillText('F · 加油',256,99);const tex=new THREE.CanvasTexture(c);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));s.scale.set(18,4.5,1);return s;
}

export class FuelStations{
  constructor(scene){
    this.scene=scene;this.stations=[
      {name:'宜蘭中央加油站',x:260,z:-380},{name:'北門加油站',x:-690,z:520},{name:'環市加油站',x:740,z:690},{name:'國五補給站',x:-1030,z:-1680}
    ];this.group=new THREE.Group();scene.add(this.group);this.build();
  }
  build(){
    const white=new THREE.MeshStandardMaterial({color:0xdce4e8,roughness:.52,metalness:.18}),dark=new THREE.MeshStandardMaterial({color:0x202930,roughness:.62}),cyan=new THREE.MeshBasicMaterial({color:0x4cdfff,toneMapped:false});
    for(const s of this.stations){const g=new THREE.Group();g.position.set(s.x,0,s.z);const slab=new THREE.Mesh(new THREE.BoxGeometry(22,.18,15),dark);slab.position.y=.08;g.add(slab);for(const x of [-7,0,7]){const pump=new THREE.Mesh(new THREE.BoxGeometry(1,.95,.6),white);pump.position.set(x,.58,0);g.add(pump);const screen=new THREE.Mesh(new THREE.PlaneGeometry(.5,.22),cyan);screen.position.set(x,.72,-.31);g.add(screen);}for(const x of [-8,8])for(const z of [-5,5]){const pole=new THREE.Mesh(new THREE.BoxGeometry(.3,4,.3),white);pole.position.set(x,2,z);g.add(pole);}const roof=new THREE.Mesh(new THREE.BoxGeometry(20,.35,12),white);roof.position.y=4.1;g.add(roof);const strip=new THREE.Mesh(new THREE.BoxGeometry(19.5,.08,.08),cyan);strip.position.set(0,3.93,-6.12);g.add(strip);const label=labelSprite(s.name);label.position.set(0,6.4,0);g.add(label);this.group.add(g);s.group=g;}
  }
  nearest(pos,max=13){let best=null,d=max;for(const s of this.stations){const dd=Math.hypot(pos.x-s.x,pos.z-s.z);if(dd<d){best=s;d=dd;}}return best?{station:best,distance:d}:null;}
}
