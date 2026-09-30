export const WORLD = {
  center: { lat: 24.7546, lon: 121.7583 },
  bbox: { south: 24.7460, west: 121.7440, north: 24.7638, east: 121.7638 },
  metersPerLat: 111320,
  metersPerLon: 101280,
  landmarks: [
    { name: '宜蘭車站', lat: 24.7546, lon: 121.7583, type: 'station' },
    { name: '幾米公園', lat: 24.7538, lon: 121.7584, type: 'park' },
    { name: '宜蘭酒廠', lat: 24.756303, lon: 121.749414, type: 'distillery' },
    { name: '舊城核心', lat: 24.7570, lon: 121.7522, type: 'oldtown' },
  ],
};

export const QUALITY = [
  { name: 'ECO', pixelRatio: .8, shadow: 768, rain: 950, traffic: 14, pedestrians: 22, buildings: 320, lamps: 35, bloom: .34, reflections:false },
  { name: 'HIGH', pixelRatio: 1.15, shadow: 1536, rain: 1800, traffic: 28, pedestrians: 46, buildings: 650, lamps: 60, bloom: .52, reflections:true },
  { name: 'CINEMA', pixelRatio: 1.45, shadow: 2048, rain: 2900, traffic: 40, pedestrians: 68, buildings: 900, lamps: 85, bloom: .68, reflections:true },
  { name: '4K ULTRA', pixelRatio: 2.0, shadow: 4096, rain: 5200, traffic: 54, pedestrians: 96, buildings: 1300, lamps: 120, bloom: .76, reflections:true, ultra:true },
];
