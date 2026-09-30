import * as THREE from 'three';

const WEATHER = [
  {id:'storm',label:'豪雨',rain:1.0,fog:1.18,exposure:.68,bloom:1.06,sky:0x061019},
  {id:'rain',label:'雨',rain:.72,fog:1.00,exposure:.74,bloom:1.0,sky:0x09151e},
  {id:'drizzle',label:'細雨',rain:.38,fog:.86,exposure:.79,bloom:.92,sky:0x0d1b25},
  {id:'mist',label:'山霧',rain:.12,fog:1.32,exposure:.72,bloom:.88,sky:0x101b21},
  {id:'clear',label:'短暫停雨',rain:0,fog:.68,exposure:.86,bloom:.82,sky:0x0c1b28},
];

export class EnvironmentCycle{
  constructor({scene,renderer,hemi,moon,cityGlow,rain,bloom,baseBloom=.52}){
    this.scene=scene;this.renderer=renderer;this.hemi=hemi;this.moon=moon;this.cityGlow=cityGlow;this.rain=rain;this.bloom=bloom;this.baseBloom=baseBloom;
    this.minutes=20*60+36;this.timeScale=.42;this.weatherIndex=1;this.weatherTimer=62;this.transition=1;this.target=WEATHER[this.weatherIndex];this.current={...this.target};
    this.sky=new THREE.Color(this.target.sky);this.fog=new THREE.Color(0x0a141b);this.sunset=new THREE.Color(0x69462f);this.night=new THREE.Color(0x061019);this.day=new THREE.Color(0x6d8793);
  }
  nextWeather(){
    this.weatherIndex=(this.weatherIndex+1)%WEATHER.length;this.target=WEATHER[this.weatherIndex];this.weatherTimer=50+Math.random()*55;this.transition=0;
  }
  update(dt,inTunnel=false){
    this.minutes=(this.minutes+dt*this.timeScale)%(24*60);this.weatherTimer-=dt;if(this.weatherTimer<=0)this.nextWeather();this.transition=Math.min(1,this.transition+dt*.11);
    const t=this.transition*this.transition*(3-2*this.transition),dst=this.target;for(const k of ['rain','fog','exposure','bloom'])this.current[k]=THREE.MathUtils.lerp(this.current[k],dst[k],t*.06);
    this.current.sky=dst.sky;
    const hour=this.minutes/60,daylight=Math.max(0,Math.sin((hour-5.5)/14*Math.PI));const dusk=Math.max(0,1-Math.abs(hour-18.4)/2.2);
    const base=new THREE.Color(dst.sky),day=this.day.clone().lerp(base,.66),night=this.night.clone().lerp(base,.55),sky=night.lerp(day,daylight*.72).lerp(this.sunset,dusk*.18);
    this.scene.background?.lerp(sky,Math.min(1,dt*.35));this.scene.fog.color.lerp(sky.clone().multiplyScalar(.68),Math.min(1,dt*.25));this.scene.fog.density=THREE.MathUtils.lerp(this.scene.fog.density,.00125*this.current.fog*(1-daylight*.16),dt*.4);
    this.hemi.intensity=THREE.MathUtils.lerp(this.hemi.intensity,.42+daylight*.95,dt*.45);this.moon.intensity=THREE.MathUtils.lerp(this.moon.intensity,.62+(1-daylight)*1.85,dt*.45);this.cityGlow.intensity=THREE.MathUtils.lerp(this.cityGlow.intensity,.15+(1-daylight)*.46+dusk*.2,dt*.45);
    this.renderer.toneMappingExposure=THREE.MathUtils.lerp(this.renderer.toneMappingExposure,this.current.exposure+daylight*.24,dt*.45);if(this.bloom)this.bloom.strength=THREE.MathUtils.lerp(this.bloom.strength,this.baseBloom*this.current.bloom*(1+(1-daylight)*.16),dt*.35);
    this.rain?.setIntensity(inTunnel?0:this.current.rain);return {hour,daylight,weather:this.target.label,rain:this.current.rain};
  }
  get timeLabel(){const h=Math.floor(this.minutes/60)%24,m=Math.floor(this.minutes%60);return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;}
  get weatherLabel(){return this.target.label;}
}
