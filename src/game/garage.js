export const CARS = [
  {
    id:'veloce-r', name:'VELOCE R', className:'SPORT', unlock:0,
    color:0xa50f1b, accent:0xff7d15, style:'super', drive:'RWD',
    power:610, weight:1480, topKmh:302, accel0100:3.6, handling:84, braking:82,
    physics:{maxSpeed:84, accel:35, brake:45, dragGas:.085, dragCoast:.30, steerRate:.0205, grip:1.00},
    desc:'低重心後驅跑車，轉向直接，適合市區窄街。'
  },
  {
    id:'strada-x', name:'STRADA X', className:'AWD GT', unlock:1500,
    color:0x155b9f, accent:0x5ec7ff, style:'gt', drive:'AWD',
    power:690, weight:1630, topKmh:318, accel0100:3.2, handling:80, braking:86,
    physics:{maxSpeed:88.4, accel:38, brake:48, dragGas:.080, dragCoast:.29, steerRate:.0195, grip:1.06},
    desc:'四驅高性能 GT，雨地穩定、出彎加速更強。'
  },
  {
    id:'aero-rs', name:'AERO RS', className:'TRACK', unlock:3500,
    color:0xe9e9ec, accent:0xff4438, style:'track', drive:'RWD',
    power:735, weight:1375, topKmh:326, accel0100:3.0, handling:94, braking:94,
    physics:{maxSpeed:90.6, accel:41, brake:54, dragGas:.072, dragCoast:.27, steerRate:.0225, grip:1.14},
    desc:'賽道取向空力套件，煞車與高速轉向最突出。'
  },
  {
    id:'noctis-12', name:'NOCTIS 12', className:'V12', unlock:6500,
    color:0x111317, accent:0xf2c14e, style:'hyper', drive:'AWD',
    power:905, weight:1510, topKmh:354, accel0100:2.8, handling:90, braking:91,
    physics:{maxSpeed:98.3, accel:46, brake:52, dragGas:.068, dragCoast:.25, steerRate:.0214, grip:1.12},
    desc:'旗艦 V12 Hypercar，高速性能與四驅循跡兼具。'
  },
  {
    id:'retro-9', name:'RETRO 9', className:'NEO CLASSIC', unlock:10000,
    color:0xd6aa3c, accent:0xff5c35, style:'retro', drive:'RWD',
    power:780, weight:1420, topKmh:338, accel0100:3.1, handling:88, braking:89,
    physics:{maxSpeed:93.9, accel:42, brake:50, dragGas:.074, dragCoast:.28, steerRate:.0218, grip:1.08},
    desc:'復古楔形比例搭配現代底盤，個性最鮮明。'
  },
  {
    id:'ion-gtx', name:'ION GTX', className:'E-HYPER', unlock:15000,
    color:0x0f3344, accent:0x76efff, style:'ev', drive:'AWD',
    power:1120, weight:1840, topKmh:365, accel0100:2.4, handling:92, braking:96,
    physics:{maxSpeed:101.4, accel:52, brake:58, dragGas:.060, dragCoast:.22, steerRate:.0208, grip:1.16},
    desc:'高扭力電動 Hyper GT，起步最快，重量也最高。'
  }
];

export const getCar = id => CARS.find(c=>c.id===id) || CARS[0];

export class Progression {
  constructor(){
    const raw=localStorage.getItem('yilanRedlineProgress');
    let saved={}; try{saved=raw?JSON.parse(raw):{}}catch{}
    this.rep=Number(saved.rep)||0;
    this.selected=saved.selected||CARS[0].id;
    this.bestHeat=Number(saved.bestHeat)||1;
    this.totalKm=Number(saved.totalKm)||0;
    this._acc=0;
  }
  unlocked(car){ return this.rep>=car.unlock; }
  addDriving(dt,speedKmh,heat){
    if(speedKmh<25)return;
    const km=speedKmh*dt/3600;
    this.totalKm+=km;
    this._acc += dt*(speedKmh/90)*(1+Math.max(0,heat-1)*.18);
    if(this._acc>=1){ const gain=Math.floor(this._acc*3); this.rep+=gain; this._acc=0; this.save(); }
    this.bestHeat=Math.max(this.bestHeat,Math.ceil(heat));
  }
  addEscape(heat){ this.rep+=Math.max(120,Math.round(heat*180)); this.bestHeat=Math.max(this.bestHeat,Math.ceil(heat)); this.save(); }
  select(id){ if(this.unlocked(getCar(id))){this.selected=id;this.save();return true;} return false; }
  save(){ localStorage.setItem('yilanRedlineProgress',JSON.stringify({rep:Math.floor(this.rep),selected:this.selected,bestHeat:this.bestHeat,totalKm:this.totalKm})); }
}
