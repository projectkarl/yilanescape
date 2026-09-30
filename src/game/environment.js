import * as THREE from 'three';

// v1.0 starts in clear late-afternoon light so the city is readable. Weather can still change naturally.
const WEATHER=[
  {id:'clear',label:'晴朗',rain:0,fog:.04,exposure:1.08,sky:0x9bb6c2},
  {id:'overcast',label:'陰天',rain:0,fog:.07,exposure:1.02,sky:0x71858e},
  {id:'drizzle',label:'細雨',rain:.26,fog:.09,exposure:1.01,sky:0x657982},
  {id:'rain',label:'雨',rain:.58,fog:.12,exposure:.98,sky:0x50656e},
  {id:'storm',label:'豪雨',rain:.92,fog:.16,exposure:.94,sky:0x40545e},
];
export class EnvironmentCycle{
  constructor({scene,renderer,hemi,moon,cityGlow,rain,bloom=null,baseBloom=0}){this.scene=scene;this.renderer=renderer;this.hemi=hemi;this.moon=moon;this.cityGlow=cityGlow;this.rain=rain;this.bloom=bloom;this.baseBloom=baseBloom;this.minutes=15*60+50;this.timeScale=.26;this.weatherIndex=0;this.weatherTimer=105;this.transition=1;this.target=WEATHER[0];this.current={...this.target};this.sunset=new THREE.Color(0xc7865b);this.night=new THREE.Color(0x101a24);this.day=new THREE.Color(0xa8c3ce);}
  nextWeather(){this.weatherIndex=(this.weatherIndex+1)%WEATHER.length;this.target=WEATHER[this.weatherIndex];this.weatherTimer=70+Math.random()*95;this.transition=0;}
  update(dt,inTunnel=false){this.minutes=(this.minutes+dt*this.timeScale)%(24*60);this.weatherTimer-=dt;if(this.weatherTimer<=0)this.nextWeather();this.transition=Math.min(1,this.transition+dt*.10);const k=this.transition*this.transition*(3-2*this.transition),dst=this.target;for(const key of ['rain','fog','exposure'])this.current[key]=THREE.MathUtils.lerp(this.current[key],dst[key],Math.min(1,k*.11));const hour=this.minutes/60,daylight=Math.max(0,Math.sin((hour-5.45)/14.1*Math.PI)),dusk=Math.max(0,1-Math.abs(hour-18.25)/1.7),base=new THREE.Color(dst.sky),day=this.day.clone().lerp(base,.38),night=this.night.clone().lerp(base,.58),sky=night.lerp(day,daylight*.93).lerp(this.sunset,dusk*.15);this.scene.background?.lerp(sky,Math.min(1,dt*.55));if(this.scene.fog){this.scene.fog.color.lerp(sky.clone().multiplyScalar(.94),Math.min(1,dt*.35));const targetDensity=.000055*this.current.fog*(1-daylight*.08);this.scene.fog.density=THREE.MathUtils.lerp(this.scene.fog.density,targetDensity,Math.min(1,dt*.55));}this.hemi.intensity=THREE.MathUtils.lerp(this.hemi.intensity,.95+daylight*1.15,dt*.55);this.moon.intensity=THREE.MathUtils.lerp(this.moon.intensity,.22+(1-daylight)*.88,dt*.55);this.cityGlow.intensity=THREE.MathUtils.lerp(this.cityGlow.intensity,.08+(1-daylight)*.28+dusk*.10,dt*.55);this.renderer.toneMappingExposure=THREE.MathUtils.lerp(this.renderer.toneMappingExposure,this.current.exposure+daylight*.12,dt*.55);if(this.bloom)this.bloom.strength=0;this.rain?.setIntensity(inTunnel?0:this.current.rain);return{hour,daylight,weather:this.target.label,rain:this.current.rain};}
  get timeLabel(){const h=Math.floor(this.minutes/60)%24,m=Math.floor(this.minutes%60);return`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;}get weatherLabel(){return this.target.label;}
}
