export const WORLD = {
  center: { lat: 24.7546, lon: 121.7583 },
  bbox: { south: 24.7360, west: 121.7335, north: 24.7745, east: 121.7855 },
  coreBuildingBbox: { south: 24.7410, west: 121.7385, north: 24.7695, east: 121.7795 },
  metersPerLat: 111320,
  metersPerLon: 101280,
  landmarks: [
    { name: '宜蘭車站', lat: 24.7546, lon: 121.7583, type: 'station' },
    { name: '幾米公園', lat: 24.7538, lon: 121.7584, type: 'park' },
    { name: '宜蘭酒廠', lat: 24.756303, lon: 121.749414, type: 'distillery' },
    { name: '舊城核心', lat: 24.7570, lon: 121.7522, type: 'oldtown' },
    { name: '宜蘭設治紀念館', lat: 24.755317, lon: 121.749501, type: 'oldtown' },
  ],
};

// v1.0: clarity first. No film grain, no fake fog veil, no mandatory bloom.
export const QUALITY = [
  { name:'MOBILE REAL', pixelRatio:1.05,maxDpr:1.35,shadow:1024,rain:520,traffic:18,pedestrians:26,buildings:430,lamps:42,detailBuildings:34,post:false },
  { name:'REALISM', pixelRatio:1.12,maxDpr:1.85,shadow:2048,rain:760,traffic:34,pedestrians:58,buildings:900,lamps:84,detailBuildings:72,post:false },
  { name:'PHOTO', pixelRatio:1.28,maxDpr:2.0,shadow:3072,rain:980,traffic:44,pedestrians:76,buildings:1250,lamps:108,detailBuildings:118,post:false },
  { name:'4K CLEAN', pixelRatio:1.48,maxDpr:2.0,shadow:4096,rain:1200,traffic:54,pedestrians:92,buildings:1600,lamps:132,detailBuildings:170,post:false,ultra:true },
];
