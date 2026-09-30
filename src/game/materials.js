import * as THREE from 'three';

function seeded(seed=1){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function texFromCanvas(canvas,{srgb=false,repeat=[1,1]}={}){const t=new THREE.CanvasTexture(canvas);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);t.anisotropy=8;t.needsUpdate=true;return t;}

export function createAsphaltPBR(size=1024){
  const color=document.createElement('canvas'),rough=document.createElement('canvas'),normal=document.createElement('canvas');
  color.width=color.height=rough.width=rough.height=normal.width=normal.height=size;
  const c=color.getContext('2d'),r=rough.getContext('2d'),n=normal.getContext('2d'),rnd=seeded(42);
  c.fillStyle='#303438';c.fillRect(0,0,size,size);
  // broad tonal variation only; never per-pixel television noise.
  for(let i=0;i<120;i++){
    const x=rnd()*size,y=rnd()*size,rad=18+rnd()*90,g=c.createRadialGradient(x,y,0,x,y,rad);
    const a=.012+rnd()*.018;g.addColorStop(0,`rgba(${rnd()>.5?255:0},${rnd()>.5?255:0},${rnd()>.5?255:0},${a})`);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(x-rad,y-rad,rad*2,rad*2);
  }
  // sparse aggregate flecks and repaired seams.
  for(let i=0;i<420;i++){const x=rnd()*size,y=rnd()*size,rad=.7+rnd()*1.8;c.fillStyle=`rgba(${90+Math.floor(rnd()*45)},${92+Math.floor(rnd()*45)},${94+Math.floor(rnd()*45)},${.08+rnd()*.12})`;c.beginPath();c.arc(x,y,rad,0,Math.PI*2);c.fill();}
  c.strokeStyle='rgba(18,21,24,.18)';c.lineWidth=1.4;
  for(let k=0;k<10;k++){c.beginPath();let x=rnd()*size,y=rnd()*size;c.moveTo(x,y);for(let j=0;j<6;j++){x+=(rnd()-.5)*120;y+=25+rnd()*70;c.lineTo(x,y);}c.stroke();}
  r.fillStyle='#b7b7b7';r.fillRect(0,0,size,size);r.globalAlpha=.16;
  for(let i=0;i<80;i++){const x=rnd()*size,y=rnd()*size,rad=25+rnd()*100,g=r.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,'#8f8f8f');g.addColorStop(1,'#b7b7b7');r.fillStyle=g;r.fillRect(x-rad,y-rad,rad*2,rad*2);}r.globalAlpha=1;
  n.fillStyle='rgb(128,128,255)';n.fillRect(0,0,size,size);
  n.strokeStyle='rgba(118,132,255,.22)';n.lineWidth=2;for(let k=0;k<12;k++){n.beginPath();let x=rnd()*size,y=rnd()*size;n.moveTo(x,y);for(let j=0;j<5;j++){x+=(rnd()-.5)*100;y+=30+rnd()*90;n.lineTo(x,y);}n.stroke();}
  return {map:texFromCanvas(color,{srgb:true,repeat:[7,7]}),roughnessMap:texFromCanvas(rough,{repeat:[7,7]}),normalMap:texFromCanvas(normal,{repeat:[7,7]})};
}

function facadeCanvas(kind,base='#d8d2c8',seed=1){
  const c=document.createElement('canvas');c.width=1024;c.height=1024;const x=c.getContext('2d'),rnd=seeded(seed);
  x.fillStyle=base;x.fillRect(0,0,1024,1024);
  if(kind==='tile'){
    const tw=34,th=22;x.strokeStyle='rgba(68,66,63,.24)';x.lineWidth=1;
    for(let yy=0;yy<1024;yy+=th){for(let xx=0;xx<1024;xx+=tw){x.strokeRect(xx,yy,tw,th);}}
    x.fillStyle='rgba(255,255,255,.035)';for(let i=0;i<60;i++)x.fillRect(rnd()*1024,rnd()*1024,10+rnd()*30,2);
  }else if(kind==='concrete'){
    x.strokeStyle='rgba(55,58,60,.13)';x.lineWidth=2;for(let i=0;i<8;i++){x.beginPath();x.moveTo(0,i*128+25);x.lineTo(1024,i*128+25);x.stroke();}
    for(let i=0;i<45;i++){const xx=rnd()*1024,yy=rnd()*1024,rr=5+rnd()*22;x.fillStyle=`rgba(30,34,37,${.012+rnd()*.024})`;x.beginPath();x.arc(xx,yy,rr,0,Math.PI*2);x.fill();}
  }else if(kind==='paint'){
    const grad=x.createLinearGradient(0,0,1024,0);grad.addColorStop(0,'rgba(255,255,255,.06)');grad.addColorStop(.55,'rgba(255,255,255,0)');grad.addColorStop(1,'rgba(0,0,0,.045)');x.fillStyle=grad;x.fillRect(0,0,1024,1024);
    x.fillStyle='rgba(70,65,58,.035)';for(let i=0;i<18;i++)x.fillRect(0,rnd()*1024,1024,1+rnd()*2);
  }else{
    x.strokeStyle='rgba(50,48,45,.16)';x.lineWidth=2;for(let yy=0;yy<1024;yy+=58){for(let xx=(yy/58%2)*48;xx<1024;xx+=96){x.strokeRect(xx,yy,96,58);}}
  }
  return texFromCanvas(c,{srgb:true,repeat:[1,1]});
}

export function createFacadeLibrary(){
  const defs=[
    ['tile','#b7aaa0',11],['tile','#8f9b96',12],['concrete','#a4a19b',13],['paint','#d0c8b6',14],['paint','#9ea6a8',15],['brick','#8f6958',16],['paint','#b9b0a4',17],['tile','#cbc5bc',18]
  ];
  return defs.map(([kind,base,seed])=>new THREE.MeshPhysicalMaterial({map:facadeCanvas(kind,base,seed),color:0xffffff,roughness:kind==='tile'?.62:.78,metalness:.02,clearcoat:kind==='tile'?.08:0,clearcoatRoughness:.5}));
}

export function createRoofMaterials(){
  return [
    new THREE.MeshStandardMaterial({color:0x686a67,roughness:.92}),
    new THREE.MeshStandardMaterial({color:0x50565a,roughness:.86,metalness:.10}),
    new THREE.MeshStandardMaterial({color:0x7d7469,roughness:.90}),
  ];
}

export function createGlassMaterial({lit=false}={}){
  return new THREE.MeshPhysicalMaterial({color:lit?0x6a6653:0x142c39,metalness:.15,roughness:.06,transmission:.15,transparent:true,opacity:lit?.74:.84,clearcoat:.55,clearcoatRoughness:.08});
}

export function makeTextTexture(text,{w=512,h=160,bg='#183a5a',fg='#fff',sub='',border=true}={}){
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,w,h);if(border){x.strokeStyle='rgba(255,255,255,.88)';x.lineWidth=7;x.strokeRect(5,5,w-10,h-10);}x.fillStyle=fg;x.textAlign='center';x.textBaseline='middle';x.font=`800 ${Math.floor(h*.34)}px system-ui, sans-serif`;x.fillText(text,w/2,h*.42);if(sub){x.font=`600 ${Math.floor(h*.16)}px system-ui, sans-serif`;x.fillStyle='rgba(255,255,255,.82)';x.fillText(sub,w/2,h*.75);}return texFromCanvas(c,{srgb:true});
}
