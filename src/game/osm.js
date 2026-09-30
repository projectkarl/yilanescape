import * as THREE from 'three';
import { WORLD } from './config.js';

export function llToWorld(lat, lon) {
  return new THREE.Vector2((lon-WORLD.center.lon)*WORLD.metersPerLon, -(lat-WORLD.center.lat)*WORLD.metersPerLat);
}

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const roadWidth=(tags={})=>{
  const t=tags.highway,lanes=clamp(Number.parseFloat(tags.lanes)||0,0,8);
  const byClass={motorway:15.2,motorway_link:8.4,trunk:14,trunk_link:8.2,primary:12.2,primary_link:8.2,secondary:10.4,secondary_link:7.8,tertiary:8.8,residential:6.6,unclassified:6.2,service:5.2,living_street:5.6};
  const base=byClass[t]||4.8;return lanes?Math.max(base,lanes*3.05+(t==='motorway'?1.8:.7)):base;
};

const ENDPOINTS=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
function queryText(){
  const b=WORLD.bbox,c=WORLD.coreBuildingBbox;
  return `[out:json][timeout:24];(
    way[highway~"^(motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|residential|unclassified|service|living_street)$"](${b.south},${b.west},${b.north},${b.east});
    way[building](${c.south},${c.west},${c.north},${c.east});
    way[railway=rail](${b.south},${b.west},${b.north},${b.east});
    way[waterway~"^(river|canal|stream)$"](${b.south},${b.west},${b.north},${b.east});
    node[amenity~"^(fuel|parking|restaurant|cafe|school|hospital|police|fire_station)$"](${c.south},${c.west},${c.north},${c.east});
    node[shop](${c.south},${c.west},${c.north},${c.east});
    node[public_transport](${c.south},${c.west},${c.north},${c.east});
  );out geom qt;`;
}
async function fetchEndpoint(url,timeoutMs){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);try{const body=new URLSearchParams({data:queryText()});const r=await fetch(url,{method:'POST',body,signal:controller.signal,headers:{Accept:'application/json'}});if(!r.ok)throw new Error(`Overpass ${r.status}`);const j=await r.json(),out=normalize(j.elements||[]);if(out.roads.length<45||out.buildings.length<120)throw new Error('OSM set too sparse');return out;}finally{clearTimeout(timer);}}
export async function loadOSM(timeoutMs=8500){const tasks=ENDPOINTS.map(url=>fetchEndpoint(url,timeoutMs));if(typeof Promise.any==='function')return Promise.any(tasks);let last;for(const t of tasks){try{return await t;}catch(e){last=e;}}throw last||new Error('OSM unavailable');}

function normalize(elements){
  const roads=[],buildings=[],railways=[],waterways=[],pois=[];
  for(const e of elements){
    const tags=e.tags||{};
    if(tags.highway&&e.geometry?.length>1){const pts=e.geometry.map(p=>llToWorld(p.lat,p.lon));roads.push({points:pts,width:roadWidth(tags),name:tags.name||tags.ref||'',tags});continue;}
    if(tags.building&&e.geometry?.length>2){const pts=e.geometry.map(p=>llToWorld(p.lat,p.lon));let height=Number.parseFloat(tags.height);if(!Number.isFinite(height)){const lv=Number.parseFloat(tags['building:levels']);height=Number.isFinite(lv)?Math.max(3.1,lv*3.15):5.4+(hash(e.id)%5)*2.75;}buildings.push({points:pts,height:Math.min(height,48),tags});continue;}
    if(tags.railway==='rail'&&e.geometry?.length>1){railways.push({points:e.geometry.map(p=>llToWorld(p.lat,p.lon)),tags});continue;}
    if(tags.waterway&&e.geometry?.length>1){waterways.push({points:e.geometry.map(p=>llToWorld(p.lat,p.lon)),tags});continue;}
    if(e.type==='node'&&Number.isFinite(e.lat)&&Number.isFinite(e.lon)&&(tags.shop||tags.amenity||tags.public_transport)){const p=llToWorld(e.lat,e.lon);pois.push({x:p.x,z:p.y,name:tags.name||tags['name:zh']||tags.shop||tags.amenity||'地點',kind:tags.shop||tags.amenity||tags.public_transport,tags});}
  }
  roads.sort((a,b)=>roadPriority(b)-roadPriority(a));buildings.sort((a,b)=>centroidSq(a.points)-centroidSq(b.points));pois.sort((a,b)=>a.x*a.x+a.z*a.z-(b.x*b.x+b.z*b.z));
  return {roads,buildings,railways,waterways,pois,source:'osm'};
}
function roadPriority(r){const h=r.tags?.highway||'',p={motorway:11,trunk:10,primary:9,secondary:8,tertiary:7,residential:5,unclassified:4,service:3,living_street:3}[h]||2;return p*100000+(r.points?.length||0);}
function centroidSq(pts){let x=0,y=0;for(const p of pts){x+=p.x;y+=p.y;}x/=pts.length;y/=pts.length;return x*x+y*y;}
function hash(v){let x=Number(v)||1;x=((x>>16)^x)*0x45d9f3b;x=((x>>16)^x)*0x45d9f3b;return Math.abs((x>>16)^x);}
function geoRoad(name,width,coords,tags={}){return {name,width,tags:{highway:width>=11?'primary':width>=8?'secondary':'residential',name,...tags},points:coords.map(([lat,lon])=>llToWorld(lat,lon))};}
function geoLine(name,coords,tags={}){return {name,tags,points:coords.map(([lat,lon])=>llToWorld(lat,lon))};}
function seeded(n){const x=Math.sin(n*12.9898)*43758.5453;return x-Math.floor(x);}

export function fallbackYilan(){
  // Offline layout follows the real Yilan urban street orientation and major named corridors.
  const roads=[
    geoRoad('中山路一至三段',12.2,[[24.7388,121.7520],[24.7442,121.7516],[24.7500,121.7513],[24.7560,121.7511],[24.7620,121.7509],[24.7708,121.7508]],{highway:'primary'}),
    geoRoad('宜興路',10.2,[[24.7390,121.7609],[24.7450,121.7606],[24.7510,121.7603],[24.7570,121.7600],[24.7640,121.7597],[24.7710,121.7595]],{highway:'secondary'}),
    geoRoad('光復路',9.2,[[24.7547,121.7410],[24.7547,121.7476],[24.7546,121.7545],[24.7546,121.7584],[24.7545,121.7656],[24.7544,121.7758]],{highway:'secondary'}),
    geoRoad('神農路',9.4,[[24.7462,121.7452],[24.7485,121.7496],[24.7512,121.7544],[24.7536,121.7583],[24.7561,121.7628],[24.7591,121.7677]],{highway:'secondary'}),
    geoRoad('民權路',9.2,[[24.7498,121.7405],[24.7503,121.7474],[24.7507,121.7548],[24.7510,121.7628],[24.7512,121.7710],[24.7513,121.7790]],{highway:'secondary'}),
    geoRoad('復興路',8.5,[[24.7456,121.7420],[24.7462,121.7483],[24.7467,121.7553],[24.7471,121.7625],[24.7475,121.7705]],{highway:'tertiary'}),
    geoRoad('泰山路',8.4,[[24.7580,121.7369],[24.7584,121.7436],[24.7588,121.7508],[24.7592,121.7580],[24.7598,121.7652]],{highway:'tertiary'}),
    geoRoad('女中路',7.8,[[24.7646,121.7402],[24.7642,121.7475],[24.7639,121.7548],[24.7636,121.7622],[24.7632,121.7705]],{highway:'tertiary'}),
    geoRoad('東港路',9.4,[[24.7539,121.7578],[24.7554,121.7643],[24.7571,121.7708],[24.7591,121.7778],[24.7610,121.7830]],{highway:'secondary'}),
    geoRoad('健康路',7.4,[[24.7425,121.7420],[24.7433,121.7492],[24.7442,121.7565],[24.7450,121.7640],[24.7456,121.7716]],{highway:'tertiary'}),
    geoRoad('縣民大道',10.4,[[24.7378,121.7422],[24.7401,121.7500],[24.7421,121.7580],[24.7442,121.7662],[24.7464,121.7750],[24.7482,121.7812]],{highway:'secondary'}),
    geoRoad('舊城南路',7.3,[[24.7520,121.7462],[24.7520,121.7522],[24.7519,121.7570]],{highway:'residential'}),
    geoRoad('舊城北路',7.3,[[24.7585,121.7458],[24.7585,121.7516],[24.7583,121.7574]],{highway:'residential'}),
    geoRoad('新民路',6.8,[[24.7524,121.7530],[24.7546,121.7540],[24.7570,121.7552],[24.7592,121.7560]],{highway:'residential'}),
    geoRoad('康樂路',6.6,[[24.7522,121.7568],[24.7546,121.7573],[24.7574,121.7580]],{highway:'residential'}),
  ];
  const lons=[121.7437,121.7465,121.7543,121.7568,121.7635,121.7666,121.7717,121.7752,121.7780];
  lons.forEach((lon,i)=>roads.push(geoRoad(`市區巷道 ${i+1}`,6.0,[[24.7432,lon],[24.7492,lon+.00010],[24.7552,lon-.00010],[24.7612,lon+.00008],[24.7660,lon]],{highway:'residential'})));
  const lats=[24.7483,24.7525,24.7567,24.7609];lats.forEach((lat,i)=>roads.push(geoRoad(`市區橫街 ${i+1}`,6.1,[[lat,121.7410],[lat+.00012,121.7505],[lat-.00008,121.7600],[lat+.00009,121.7718],[lat,121.7786]],{highway:'residential'})));

  const buildings=[];let seed=1;
  for(const r of roads){for(let i=0;i<r.points.length-1;i++){const a=r.points[i],b=r.points[i+1],dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz);if(len<42)continue;const ux=dx/len,uz=dz/len,px=uz,pz=-ux,steps=Math.min(15,Math.floor(len/46));for(let s=1;s<steps;s++)for(const side of [-1,1]){seed++;if(seeded(seed)<.17)continue;const t=s/steps,jitter=(seeded(seed+4)-.5)*16,cx=a.x+dx*t+ux*jitter+px*side*(r.width*.5+9+seeded(seed+8)*7),cz=a.y+dz*t+uz*jitter+pz*side*(r.width*.5+9+seeded(seed+9)*7),w=8+seeded(seed+1)*14,d=7+seeded(seed+2)*12,levels=2+Math.floor(seeded(seed+3)*5),h=levels*3.1,p=[new THREE.Vector2(cx-w/2,cz-d/2),new THREE.Vector2(cx+w/2,cz-d/2),new THREE.Vector2(cx+w/2,cz+d/2),new THREE.Vector2(cx-w/2,cz+d/2)];buildings.push({points:p,height:h,tags:{building:'yes','building:levels':String(levels),offline:'true'}});}}}
  const railways=[geoLine('宜蘭線鐵路',[[24.7440,121.7657],[24.7490,121.7621],[24.7546,121.7583],[24.7605,121.7541],[24.7670,121.7498]],{railway:'rail'})];
  const waterways=[];
  const pois=WORLD.landmarks.map(l=>{const p=llToWorld(l.lat,l.lon);return{x:p.x,z:p.y,name:l.name,kind:l.type,tags:{name:l.name}};});
  return {roads,buildings,railways,waterways,pois,source:'fallback'};
}
