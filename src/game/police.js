import * as THREE from 'three';
import { Car } from './car.js';

export class Pursuit {
  constructor(scene){this.scene=scene;this.units=[];this.heat=2;this.lastSeen=0;this.search=1;this.alert='巡邏單位追緝';}
  setHeat(v){this.heat=THREE.MathUtils.clamp(v,1,6);this._sync();}
  _sync(){
    const need=Math.min(11,1+Math.ceil(this.heat*1.45));
    while(this.units.length<need){
      const idx=this.units.length; const armored=this.heat>=5 && idx>need-3;
      const c=new Car(this.scene,{police:true,armored,color:armored?0x141b22:0x111821});
      const a=(idx/need)*Math.PI*2; const r=80+Math.random()*65;c.group.position.set(Math.sin(a)*r,.04,Math.cos(a)*r);this.units.push(c);
    }
    while(this.units.length>need){const c=this.units.pop();this.scene.remove(c.group)}
  }
  update(dt,player){
    this.lastSeen+=dt; let nearest=9999;
    const predicted=player.group.position.clone(); const dir=new THREE.Vector3(-Math.sin(player.heading),0,-Math.cos(player.heading));predicted.addScaledVector(dir,Math.min(35,player.velocity*.55));
    for(let i=0;i<this.units.length;i++){
      const u=this.units[i]; u.chase(dt,predicted,1+this.heat*.08+i*.015); const d=u.group.position.distanceTo(player.group.position);nearest=Math.min(nearest,d);
      if(d<4.4){player.damage=Math.min(100,player.damage+dt*(3.3+this.heat*.55));player.velocity*=.992;}
      if(d>330){const a=Math.random()*Math.PI*2;u.group.position.set(player.group.position.x+Math.sin(a)*170,.04,player.group.position.z+Math.cos(a)*170);}
    }
    if(player.speedKmh>115)this.heat=Math.min(6,this.heat+dt*.014);
    if(nearest<42)this.lastSeen=0;
    if(this.lastSeen>9)this.search=Math.max(0,this.search-dt*.065); else this.search=Math.min(1,this.search+dt*.22);
    if(this.search===0)this.heat=Math.max(1,this.heat-dt*.055);
    this.alert=this.heat>=5?'虛構重裝攔截隊加入':this.heat>=4?'高性能攔截單位加入':this.heat>=3?'空中搜索 / 多車包圍':'巡邏單位追緝';
    this._sync();
  }
}
