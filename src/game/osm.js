import * as THREE from 'three';
import { WORLD } from './config.js';

export function llToWorld(lat, lon) {
  return new THREE.Vector2(
    (lon - WORLD.center.lon) * WORLD.metersPerLon,
    -(lat - WORLD.center.lat) * WORLD.metersPerLat
  );
}

const roadWidth = (tags={}) => {
  const t = tags.highway;
  if (['primary','trunk'].includes(t)) return 12;
  if (['secondary'].includes(t)) return 10;
  if (['tertiary'].includes(t)) return 8;
  if (['residential','unclassified'].includes(t)) return 6.5;
  if (['service'].includes(t)) return 5;
  return 4;
};

export async function loadOSM(timeoutMs = 6500) {
  const b = WORLD.bbox;
  const q = `[out:json][timeout:20];(way[highway](${b.south},${b.west},${b.north},${b.east});way[building](${b.south},${b.west},${b.north},${b.east}););out geom;`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const body = new URLSearchParams({ data: q });
    const r = await fetch('https://overpass-api.de/api/interpreter', { method:'POST', body, signal:controller.signal });
    if (!r.ok) throw new Error(`Overpass ${r.status}`);
    const j = await r.json();
    return normalize(j.elements || []);
  } finally { clearTimeout(timer); }
}

function normalize(elements) {
  const roads=[]; const buildings=[];
  for (const e of elements) {
    if (!e.geometry?.length) continue;
    const pts=e.geometry.map(p=>llToWorld(p.lat,p.lon));
    if (e.tags?.highway) roads.push({ points:pts, width:roadWidth(e.tags), name:e.tags.name || '', tags:e.tags });
    if (e.tags?.building && pts.length>2) {
      let height = Number.parseFloat(e.tags.height);
      if (!Number.isFinite(height)) {
        const lv = Number.parseFloat(e.tags['building:levels']);
        height = Number.isFinite(lv) ? Math.max(3.2,lv*3.25) : 4.5 + (hash(e.id)%5)*3.1;
      }
      buildings.push({ points:pts, height:Math.min(height,46), tags:e.tags });
    }
  }
  return { roads, buildings, source:'osm' };
}

function hash(v){ let x=Number(v)||1; x=((x>>16)^x)*0x45d9f3b; x=((x>>16)^x)*0x45d9f3b; return Math.abs((x>>16)^x); }

export function fallbackYilan() {
  const roads=[]; const buildings=[];
  const xs=[-920,-720,-510,-300,-100,110,330,540,760,920];
  const zs=[-800,-610,-425,-245,-70,115,300,500,700,860];
  for (const x of xs) roads.push({points:[new THREE.Vector2(x,-980),new THREE.Vector2(x,980)],width:(Math.abs(x)<140?12:7),name:''});
  for (const z of zs) roads.push({points:[new THREE.Vector2(-1000,z),new THREE.Vector2(1000,z)],width:(Math.abs(z)<120?11:7),name:''});
  // 酒廠方向與車站周邊做較不規則的街廓，避免純棋盤感。
  roads.push({points:[new THREE.Vector2(-980,-120),new THREE.Vector2(-460,-40),new THREE.Vector2(60,80),new THREE.Vector2(940,160)],width:9,name:'舊城軸'});
  roads.push({points:[new THREE.Vector2(210,-980),new THREE.Vector2(255,-410),new THREE.Vector2(285,120),new THREE.Vector2(340,980)],width:10,name:'宜興軸'});
  for(let gx=0;gx<xs.length-1;gx++) for(let gz=0;gz<zs.length-1;gz++){
    const x0=xs[gx], x1=xs[gx+1], z0=zs[gz], z1=zs[gz+1];
    const count=2+((gx*17+gz*13)%5);
    for(let i=0;i<count;i++){
      const pad=18; const w=Math.max(18,(x1-x0-50)/(count>3?2:1))*0.62; const d=Math.max(16,(z1-z0-50)/(count>3?2:1))*0.55;
      const col=count>3?i%2:0, row=count>3?Math.floor(i/2):i;
      const cx=x0+pad+w/2+col*(w+16)+(Math.sin(gx*3+gz+i)*8);
      const cz=z0+pad+d/2+row*(d+14)+(Math.cos(gz*2+gx+i)*8);
      if(cx+w/2>x1-pad || cz+d/2>z1-pad) continue;
      const p=[new THREE.Vector2(cx-w/2,cz-d/2),new THREE.Vector2(cx+w/2,cz-d/2),new THREE.Vector2(cx+w/2,cz+d/2),new THREE.Vector2(cx-w/2,cz+d/2)];
      buildings.push({points:p,height:5+((gx*11+gz*7+i*3)%8)*2.1,tags:{building:'yes'}});
    }
  }
  return {roads,buildings,source:'fallback'};
}
