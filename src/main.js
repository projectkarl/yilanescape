import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import './style.css';
import { QUALITY } from './game/config.js';
import { loadOSM, fallbackYilan } from './game/osm.js';
import { City } from './game/city.js';
import { Car } from './game/car.js';
import { Pursuit } from './game/police.js';
import { Traffic } from './game/traffic.js';
import { TrafficSignals } from './game/traffic_signals.js';
import { VehicleEffects } from './game/effects.js';
import { Pedestrians } from './game/pedestrians.js';
import { OnFootPlayer } from './game/onfoot.js';
import { FuelStations } from './game/fuel.js';
import { Highway5 } from './game/highway5.js';
import { Rain } from './game/rain.js';
import { Controls } from './game/controls.js';
import { HUD } from './game/hud.js';
import { AudioRig } from './game/audio.js';
import { EnvironmentCycle } from './game/environment.js';
import { Amenities } from './game/amenities.js';
import { CARS, getCar, Progression } from './game/garage.js';

const canvas=document.querySelector('#game');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.72;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x071019);scene.fog=new THREE.FogExp2(0x0a141b,.00155);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,3600);
const hemi=new THREE.HemisphereLight(0x7f9fb6,0x11100f,.72);scene.add(hemi);
const moon=new THREE.DirectionalLight(0xd8e9ff,2.25);moon.position.set(-160,240,-90);moon.castShadow=true;moon.shadow.camera.left=-190;moon.shadow.camera.right=190;moon.shadow.camera.top=190;moon.shadow.camera.bottom=-190;moon.shadow.camera.near=1;moon.shadow.camera.far=520;scene.add(moon);
const cityGlow=new THREE.DirectionalLight(0xffaa72,.42);cityGlow.position.set(90,50,100);scene.add(cityGlow);
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;pmrem.dispose();

let quality=innerWidth<800?0:1;
let cityData,city,highway,amenities,environment,activeCar,avatar,pursuit,traffic,signals,pedestrians,fuelStations,rain,controls,hud,effects,allRoads=[],allColliders=[];
let camMode=0,last=performance.now(),started=false,garageOpen=false,escapeAwarded=false,toast='',toastUntil=0,refueling=false,refuelStation=null,lastImpact=0,interactionLock=false;
const parkedCars=[];const audio=new AudioRig();const progress=new Progression();
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),QUALITY[quality].bloom,.42,.78);composer.addPass(bloom);composer.addPass(new OutputPass());

async function init(){
  applyQuality();
  try{cityData=await loadOSM();if(cityData.roads.length<20||cityData.buildings.length<40)throw new Error('OSM sparse');document.querySelector('#district').textContent='宜蘭車站 / 真實道路骨架';}
  catch(e){console.warn('OSM unavailable, using offline Yilan fallback',e);cityData=fallbackYilan();document.querySelector('#district').textContent='宜蘭車站 / 離線城市骨架';}

  city=new City(scene);city.build(cityData,QUALITY[quality].buildings,QUALITY[quality].lamps);
  amenities=new Amenities(scene);
  highway=new Highway5(scene);allRoads=[...cityData.roads,...highway.getRoads()];allColliders=[...city.colliders,...highway.getColliders()];
  spawnOwnedCar(progress.selected,[10,.04,-15],0);
  avatar=new OnFootPlayer(scene);
  pursuit=new Pursuit(scene);pursuit.setHeat(2);
  signals=new TrafficSignals(scene,cityData.roads);
  traffic=new Traffic(scene,allRoads,QUALITY[quality].traffic);
  pedestrians=new Pedestrians(scene,cityData.roads,QUALITY[quality].pedestrians);
  fuelStations=new FuelStations(scene);
  rain=new Rain(scene,QUALITY[quality].rain);environment=new EnvironmentCycle({scene,renderer,hemi,moon,cityGlow,rain,bloom,baseBloom:QUALITY[quality].bloom});controls=new Controls();hud=new HUD();effects=new VehicleEffects(scene);

  addEventListener('keydown',onKey);
  document.querySelector('#startGame').addEventListener('click',startGame,{once:true});
  document.querySelector('#closeGarage').addEventListener('click',closeGarage);
  document.querySelector('#garageMobile')?.addEventListener('click',openGarage);
  document.querySelector('#actionMobile')?.addEventListener('click',toggleVehicle);
  document.querySelector('#fuelMobile')?.addEventListener('click',tryRefuel);
  document.querySelector('#loadingState').textContent=cityData.source==='osm'?'宜蘭城市、國五與雪山隧道已建立':'離線宜蘭城市、國五與雪山隧道已建立';
  document.querySelector('#startGame').disabled=false;document.querySelector('#startGame').textContent='進入宜蘭市';
  renderGarage();camera.position.set(8,4,10);requestAnimationFrame(loop);
}

function currentEntity(){return activeCar||avatar;}
function spawnOwnedCar(id,pos,heading=0){
  const spec=getCar(id);if(activeCar)scene.remove(activeCar.group);activeCar=new Car(scene,{spec});activeCar.group.position.set(pos[0],pos[1]??.04,pos[2]);activeCar.heading=heading;activeCar.group.rotation.y=heading;document.querySelector('#carName').textContent=spec.name;
}
function streetSpec(data){
  const type=data.type||'sedan',van=type==='van',compact=type==='compact',scooter=type==='scooter',bus=type==='bus',pickup=type==='pickup';
  const names={van:'STREET VAN',compact:'CITY COMPACT',scooter:'YILAN SCOOTER',bus:'CITY BUS',pickup:'UTILITY PICKUP',sedan:'STREET SEDAN'};
  return {id:`street-${Date.now()}`,name:names[type]||'STREET VEHICLE',className:'STREET',color:data.color,accent:0xbfd8e6,style:scooter?'scooter':bus?'bus':pickup?'utility':van?'gt':'retro',drive:scooter?'RWD':bus?'RWD':'FWD',power:scooter?18:bus?280:pickup?210:van?185:compact?145:205,topKmh:scooter?108:bus?125:pickup?185:van?178:compact?165:198,handling:scooter?88:bus?44:pickup?64:van?62:compact?76:70,braking:scooter?74:bus?58:68,tankLiters:scooter?6.5:bus?120:pickup?70:van?62:50,initialFuel:data.fuel,consumption:scooter?2.6:bus?24:pickup?12.8:van?11.8:9.4,physics:{maxSpeed:scooter?30:bus?35:pickup?51:van?49:compact?46:55,accel:scooter?16:bus?12:pickup?20:van?18:compact?20:22,brake:scooter?35:bus?30:38,dragGas:.11,dragCoast:scooter?.40:.34,steerRate:scooter?.034:bus?.012:van?.017:.019,grip:scooter?.90:bus?.86:.94}};
}
function startGame(){started=true;audio.start();document.querySelector('#loading').classList.add('leave');setTimeout(()=>document.querySelector('#loading')?.remove(),750);document.querySelector('#hud').classList.remove('hidden');}
function say(msg,seconds=2){toast=msg;toastUntil=performance.now()+seconds*1000;}

function onKey(e){
  if(e.repeat&&['KeyE','KeyF','KeyG','KeyR','KeyC','KeyQ','KeyT'].includes(e.code))return;
  if(e.code==='KeyG'&&started){garageOpen?closeGarage():openGarage();return;}
  if(garageOpen&&e.code==='Escape'){closeGarage();return;}
  if(e.code==='KeyE'&&started&&!garageOpen){toggleVehicle();return;}
  if(e.code==='KeyF'&&started&&!garageOpen){tryRefuel();return;}
  if(e.code==='KeyR'&&!garageOpen){resetPlayer();return;}
  if(e.code==='KeyC'&&!garageOpen){camMode=(camMode+1)%3;return;}
  if(e.code==='KeyQ'&&!garageOpen){quality=(quality+1)%QUALITY.length;sessionStorage.setItem('yilanQuality',quality);location.reload();return;}
  if(e.code==='KeyT'&&!garageOpen){environment?.nextWeather?.();say(`天氣變化 · ${environment?.weatherLabel||''}`,2);return;}
  if(!started&&['KeyW','ArrowUp','Space'].includes(e.code))document.querySelector('#startGame')?.click();
}
function applyQuality(){
  const saved=Number(sessionStorage.getItem('yilanQuality'));if(Number.isInteger(saved)&&saved>=0&&saved<QUALITY.length)quality=saved;
  const q=QUALITY[quality];let ratio=Math.min(devicePixelRatio*q.pixelRatio,q.ultra?2.0:q.pixelRatio);if(q.ultra&&innerWidth>=3000)ratio=1;
  renderer.setPixelRatio(ratio);renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=quality>0;moon.shadow.mapSize.set(q.shadow,q.shadow);bloom.strength=q.bloom;document.querySelector('#qualityName').textContent=q.name;
}

function toggleVehicle(){
  if(!started||interactionLock)return;
  if(activeCar){
    refueling=false;refuelStation=null;if(activeCar.speedKmh>8){say('車輛需停穩才能下車');return;}
    interactionLock=true;controls.reset();activeCar.velocity=0;activeCar.setDoorOpen?.(true);audio.door?.();say('開門下車…',1);
    const leaving=activeCar;
    setTimeout(()=>{const side=new THREE.Vector3(Math.cos(leaving.heading)*1.85,0,-Math.sin(leaving.heading)*1.85),exit=leaving.group.position.clone().add(side);parkedCars.push(leaving);avatar.showAt(exit,leaving.heading);activeCar=null;leaving.setDoorOpen?.(false);interactionLock=false;controls.reset();say('已下車 · 走近車輛按 E 可換乘');},520);return;
  }
  const pos=avatar.group.position;let candidate=null,dist=4.8,type='';for(const c of parkedCars){const d=c.group.position.distanceTo(pos);if(d<dist){candidate=c;dist=d;type='parked';}}const t=traffic.nearest(pos,dist);if(t){candidate=t.car;dist=t.distance;type='traffic';}if(!candidate){say('附近沒有可上車的車輛');return;}
  interactionLock=true;controls.reset();
  if(type==='parked'){
    const idx=parkedCars.indexOf(candidate);if(idx>=0)parkedCars.splice(idx,1);activeCar=candidate;activeCar.velocity=0;activeCar.setDoorOpen?.(true);audio.door?.();say('上車中…',1);
    setTimeout(()=>{avatar.hide();document.querySelector('#carName').textContent=activeCar.spec?.name||'VEHICLE';activeCar.setDoorOpen?.(false);interactionLock=false;controls.reset();say('已上車');},480);
  }else{
    const data=traffic.take(candidate);if(!data){interactionLock=false;return;}pedestrians.addFleeingPerson(data.driverPos,data.road);const spec=streetSpec(data);activeCar=new Car(scene,{spec});activeCar.group.position.copy(data.position);activeCar.heading=data.heading;activeCar.group.rotation.y=data.heading;activeCar.setDoorOpen?.(true);audio.door?.();say(`${spec.name} · 換乘中…`,1.2);
    setTimeout(()=>{avatar.hide();activeCar.setDoorOpen?.(false);document.querySelector('#carName').textContent=spec.name;progress.rep+=35;progress.save();pursuit.setHeat(Math.min(6,pursuit.heat+.75));interactionLock=false;controls.reset();say('已奪取街車 · 追緝升高 · +35 REP',2.5);},520);
  }
}
function tryRefuel(){
  if(refueling){refueling=false;refuelStation=null;say('已停止加油');return;}
  if(!activeCar){say('需要駕車進入加油站');return;}
  if(activeCar.speedKmh>3){say('請先停妥車輛再加油');return;}
  const near=fuelStations.nearest(activeCar.group.position,10.5);if(!near){say('靠近油泵並停妥後按 F');return;}
  if(activeCar.fuelPct>.995){say('油箱已滿');return;}
  refueling=true;refuelStation=near.station;controls.reset();say(`${near.station.name} · 開始加油，再按 F 可停止`,2.6);
}
function resetPlayer(){
  refueling=false;refuelStation=null;
  if(activeCar){activeCar.reset([10,0,-15]);activeCar.refuel();}
  else{avatar.showAt(new THREE.Vector3(10,.02,-12),0);}
  say('已返回宜蘭車站區');
}

function openGarage(){garageOpen=true;controls?.reset?.();document.querySelector('#garage').classList.remove('hidden');renderGarage();}
function closeGarage(){garageOpen=false;document.querySelector('#garage').classList.add('hidden');}
function selectCar(id){
  const spec=getCar(id);if(!progress.unlocked(spec))return;
  const entity=currentEntity(),pos=entity.group.position.clone(),heading=entity.heading||0;progress.select(id);
  if(activeCar)scene.remove(activeCar.group);else avatar.hide();activeCar=null;spawnOwnedCar(id,[pos.x,.04,pos.z],heading);renderGarage();
}
function renderGarage(){
  const grid=document.querySelector('#carGrid'),detail=document.querySelector('#carDetail');if(!grid||!detail)return;
  document.querySelector('#garageRep').textContent=Math.floor(progress.rep).toLocaleString();const next=CARS.find(c=>!progress.unlocked(c));document.querySelector('#garageProgress').textContent=next?`${next.name} · ${Math.max(0,next.unlock-progress.rep).toLocaleString()} REP`:'全部車款已解鎖';grid.innerHTML='';
  for(const c of CARS){const unlocked=progress.unlocked(c),selected=progress.selected===c.id;const el=document.createElement('button');el.className=`car-card ${selected?'selected':''} ${unlocked?'':'locked'}`;el.dataset.id=c.id;el.innerHTML=`<div class="car-silhouette ${c.style}" style="--car:#${c.color.toString(16).padStart(6,'0')};--accent:#${c.accent.toString(16).padStart(6,'0')}"><i></i><b></b></div><div class="card-copy"><small>${c.className} · ${c.drive}</small><strong>${c.name}</strong><span>${unlocked?(selected?'目前使用':'可選擇'):`${c.unlock.toLocaleString()} REP 解鎖`}</span></div>`;el.addEventListener('click',()=>{showCarDetail(c);if(unlocked)selectCar(c.id);});grid.appendChild(el);}showCarDetail(getCar(progress.selected));
}
function showCarDetail(c){const detail=document.querySelector('#carDetail'),locked=!progress.unlocked(c);detail.innerHTML=`<div><small>${c.className} / ${c.drive}</small><h3>${c.name}</h3><p>${c.desc}</p></div><div class="car-stats"><span><i style="--v:${Math.min(100,c.power/12)}%"></i>POWER <b>${c.power} PS</b></span><span><i style="--v:${Math.min(100,c.topKmh/3.7)}%"></i>TOP SPEED <b>${c.topKmh} KM/H</b></span><span><i style="--v:${c.handling}%"></i>HANDLING <b>${c.handling}</b></span><span><i style="--v:${c.braking}%"></i>BRAKE <b>${c.braking}</b></span></div><div class="unlock-state ${locked?'locked':''}">${locked?`LOCKED · 還差 ${Math.max(0,c.unlock-progress.rep).toLocaleString()} REP`:'UNLOCKED'}</div>`;}

function interactionPrompt(){
  if(performance.now()<toastUntil)return toast;
  if(refueling&&activeCar&&refuelStation)return `加油中 ${Math.round(activeCar.fuelPct*100)}% · F 停止`;
  if(activeCar){const near=fuelStations.nearest(activeCar.group.position,13);if(near&&activeCar.speedKmh<5)return `F 加油 · ${near.station.name}`;if(activeCar.speedKmh<8)return 'E 下車';return activeCar.fuelPct<=.08?'燃料即將耗盡 · 尋找加油站':'';}
  const t=traffic.nearest(avatar.group.position,4.8);let parked=false;for(const c of parkedCars){if(c.group.position.distanceTo(avatar.group.position)<4.8){parked=true;break;}}if(t||parked)return 'E 上車／換乘';return '徒步中 · 靠近車輛按 E 上車';
}
function districtFor(pos){return highway.district(pos)||(Math.hypot(pos.x,pos.z)<1200?'宜蘭市 / 舊城與車站生活圈':'宜蘭市外圍');}

function loop(now){
  const dt=Math.min(.033,(now-last)/1000);last=now;const entity=currentEntity();
  if(entity){
    if(started&&!garageOpen){
      if(activeCar){
        const input=(refueling||interactionLock)?{gas:false,brake:true,left:false,right:false,handbrake:false}:controls.state;activeCar.update(dt,input,allColliders);
        if(refueling){const near=fuelStations.nearest(activeCar.group.position,10.5);if(!near||activeCar.speedKmh>3){refueling=false;refuelStation=null;say('加油已中止');}else{activeCar.fuel=Math.min(activeCar.tankLiters,activeCar.fuel+dt*7.5);if(activeCar.fuelPct>=.999){activeCar.refuel();refueling=false;refuelStation=null;say('油箱已加滿');}}}
      }else avatar.update(dt,interactionLock?{gas:false,brake:false,left:false,right:false,handbrake:false}:controls.state,city.colliders);
      for(const c of parkedCars)c.idle?.(dt);
      const target=currentEntity();signals.update(dt);pursuit.update(dt,target);traffic.update(dt,activeCar?activeCar.group.position:avatar.group.position,signals);pedestrians.update(dt,target.group.position);
      if(activeCar){const severity=traffic.resolvePlayerCollision(activeCar);if(severity>0&&now-lastImpact>260){effects.impact(activeCar.group.position,severity);audio.impact?.(severity);lastImpact=now;}}else{const hit=traffic.resolvePedestrianCollision(avatar);if(hit>0&&now-lastImpact>320){effects.impact(avatar.group.position,Math.max(1,hit*.7));audio.impact?.(hit*.6);say('遭車輛擦撞 · 迅速離開車道',1.8);lastImpact=now;}}
      for(const ev of traffic.drainEvents()){pedestrians.reactToCrash?.(ev.position,ev.severity);if(ev.severity>3.2)effects.glassBurst?.(ev.position,ev.severity);}
      const inTunnel=highway.insideTunnel(target.group.position);if(inTunnel){const laneX=highway.boreX-8.8;for(let i=0;i<pursuit.units.length;i++)pursuit.units[i].group.position.x=THREE.MathUtils.lerp(pursuit.units[i].group.position.x,laneX+(i%2?2.2:-2.2),Math.min(1,dt*2.5));}
      const worldState=environment.update(dt,inTunnel);activeCar?.setWeather?.(worldState.rain,inTunnel);effects.update(dt,activeCar,worldState.rain);if(!inTunnel)rain.update(dt,target.group.position);
      cameraFollow(dt,target,!activeCar);if(activeCar)progress.addDriving(dt,activeCar.speedKmh,pursuit.heat);
      const d=districtFor(target.group.position);hud.update(target,pursuit,allRoads,progress,{onFoot:!activeCar,fuelPct:activeCar?.fuelPct??0,vehicleName:activeCar?.spec?.name||'',prompt:interactionPrompt(),district:d,staminaPct:avatar?.staminaPct??1,time:environment.timeLabel,weather:inTunnel?'隧道':environment.weatherLabel});
      const nearest=pursuit.units.reduce((m,u)=>Math.min(m,u.group.position.distanceTo(target.group.position)),999);audio.update(activeCar?.speedKmh||0,pursuit.heat,nearest,worldState.rain,inTunnel);
      if(target.damage>=100){resetPlayer();target.damage=0;say('追緝失敗 · 已重新部署');}
      if(pursuit.search<.02&&!escapeAwarded){progress.addEscape(pursuit.heat);escapeAwarded=true;renderGarage();}if(pursuit.search>.55)escapeAwarded=false;
    }else{
      const idleTunnel=highway.insideTunnel(entity.group.position);environment.update(dt,idleTunnel);if(!idleTunnel)rain.update(dt,entity.group.position);
      if(garageOpen){const t=now*.00022;camera.position.set(entity.group.position.x+Math.sin(t)*8.5,entity.group.position.y+2.6,entity.group.position.z+Math.cos(t)*8.5);camera.lookAt(entity.group.position.clone().add(new THREE.Vector3(0,1,0)));}
      else{camera.position.x=entity.group.position.x+Math.sin(now*.00009)*34;camera.position.z=entity.group.position.z+22+Math.cos(now*.00009)*34;camera.position.y=9;camera.lookAt(entity.group.position.x,1.1,entity.group.position.z);}
    }
  }
  composer.render();requestAnimationFrame(loop);
}
function cameraFollow(dt,entity,onFoot=false){
  const h=entity.heading||0,speed=entity.speedKmh||0;camera.fov=THREE.MathUtils.lerp(camera.fov,onFoot?68:62+Math.min(10,speed*.035),dt*2.4);camera.updateProjectionMatrix();let targetPos,look;
  if(onFoot){const back=new THREE.Vector3(Math.sin(h)*5.2,2.8,Math.cos(h)*5.2);targetPos=entity.group.position.clone().add(back);look=entity.group.position.clone().add(new THREE.Vector3(-Math.sin(h)*3,1.2,-Math.cos(h)*3));camera.position.lerp(targetPos,1-Math.pow(.003,dt));camera.lookAt(look);return;}
  if(camMode===0){const back=new THREE.Vector3(Math.sin(h)*(8.2+speed*.006),3.6+Math.min(1.2,speed*.004),Math.cos(h)*(8.2+speed*.006));targetPos=entity.group.position.clone().add(back);targetPos.y+=1.3;look=entity.group.position.clone().add(new THREE.Vector3(-Math.sin(h)*10,1.0,-Math.cos(h)*10));camera.position.lerp(targetPos,1-Math.pow(.0038,dt));if(speed>145){camera.position.x+=(Math.random()-.5)*.018;camera.position.y+=(Math.random()-.5)*.012;}camera.lookAt(look);
  }else if(camMode===1){
    const cockpit=entity.cockpitWorld?.(new THREE.Vector3())||entity.group.position.clone().add(new THREE.Vector3(0,1.32,0));
    const cockpitLook=entity.cockpitLookWorld?.(new THREE.Vector3())||entity.group.position.clone().add(new THREE.Vector3(-Math.sin(h)*18,1.28,-Math.cos(h)*18));
    camera.position.lerp(cockpit,1-Math.pow(.0012,dt));camera.up.set(0,1,0);camera.lookAt(cockpitLook);
  }else{targetPos=entity.group.position.clone().add(new THREE.Vector3(Math.sin(h)*15,7.8,Math.cos(h)*15));camera.position.lerp(targetPos,1-Math.pow(.006,dt));camera.lookAt(entity.group.position.clone().add(new THREE.Vector3(0,1,0)));}
}

addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight)});
init();
