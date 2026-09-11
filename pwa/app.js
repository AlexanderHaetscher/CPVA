const DATA = {
  base: { x: [-20,-10,0,10,20,30,40,50], y: [0,2000,4000,6000,8000,10000], values: [[210,230,260,280,330,360,400,440],[270,300,330,360,410,450,500,560],[340,370,410,450,520,580,640,700],[410,460,520,580,660,740,840,960],[510,600,680,770,880,1020,1220,1520],[680,780,880,1020,1220,1480,null,null]] },
  mass: { x: [100,200,300,400,500,600,700,800,900,1000,1100,1200], y: [850,950,1050,1150,1200], values: [[100,100,100,200,230,280,310,330,360,400,430,500],[100,100,140,260,300,360,400,440,480,500,580,680],[100,110,210,300,370,430,520,590,630,680,760,860],[100,160,260,360,440,540,610,710,780,880,980,1180],[100,200,300,400,500,600,700,800,900,1000,1100,1200]] },
  wind: { x: [200,300,400,500,600,700,800,900,1000,1100,1200], y: [-5,0,5,10,15,20], values: [[240,350,460,570,680,790,900,1010,1120,1230,1340],[200,300,400,500,600,700,800,900,1000,1100,1200],[170,260,340,440,520,600,680,770,860,950,1040],[140,220,290,350,440,520,580,700,730,810,900],[110,170,260,310,380,440,510,600,660,750,840],[100,140,160,240,320,400,460,540,600,670,740]] },
  obstacle: { x: [100,200,300,400,500,600,700,800,900,1000,1100,1200], y: [0,50], values: [[100,200,300,400,500,600,700,800,900,1000,1100,1200],[220,340,450,580,740,860,1000,1160,1300,1400,1500,1600]] }
};
const AIRCRAFT = { DA40: { name: 'Diamond DA40', maxMass: 1200, ready: true }, PANTHERA: { name: 'Panthera', ready: false }, VL3: { name: 'VL3', ready: false }, GYRO: { name: 'Gyro', ready: false } };
const FACTORS = {'Kein Gras':1,'Gras <5 cm':1.10,'Gras 5-10 cm':1.15,'Gras >10 cm':1.25};
const AIRPORTS_URL = 'https://raw.githubusercontent.com/mborsetti/airportsdata/main/airportsdata/airports.csv';
const WINDY_API_KEY = ''; // Nur lokal eintragen; niemals committen.
const $ = id => document.getElementById(id);
const value = id => Number($(id).value);
let airportRows;
let selectedAirport = null;

function interpolation(table, xValue, yValue, label) {
  const {x,y,values} = table;
  if (!Number.isFinite(xValue) || !Number.isFinite(yValue)) throw Error(`${label}: Eingabe fehlt`);
  const xi = x.findIndex((v,i) => xValue >= v && (i === x.length-1 || xValue <= x[i+1]));
  const yi = y.findIndex((v,i) => yValue >= v && (i === y.length-1 || yValue <= y[i+1]));
  if (xi < 0 || yi < 0 || xValue < x[0] || xValue > x.at(-1) || yValue < y[0] || yValue > y.at(-1)) throw Error(`${label}: außerhalb des Tabellenbereichs`);
  if (table === DATA.base && yValue > 8000 && xValue > 30) throw Error('10.000 ft: nur bis 30 °C verfügbar');
  const x0=x[xi], x1=x[Math.min(xi+1,x.length-1)], y0=y[yi], y1=y[Math.min(yi+1,y.length-1)];
  const q11=values[yi][xi], q21=values[yi][Math.min(xi+1,x.length-1)], q12=values[Math.min(yi+1,y.length-1)][xi], q22=values[Math.min(yi+1,y.length-1)][Math.min(xi+1,x.length-1)];
  if ([q11,q21,q12,q22].some(v => v == null || !Number.isFinite(v))) throw Error(`${label}: für diese Kombination sind keine Werte hinterlegt`);
  const tx=x1===x0?0:(xValue-x0)/(x1-x0), ty=y1===y0?0:(yValue-y0)/(y1-y0);
  return q11*(1-tx)*(1-ty)+q21*tx*(1-ty)+q12*(1-tx)*ty+q22*tx*ty;
}

function fuelKg() {
  const amount = value('fuelAmount');
  const litres = $('fuelUnit').value === 'gal' ? amount * 3.785411784 : amount;
  return litres * 0.72;
}
function updateMass() {
  const mass = ['emptyMass','pilotMass','copilotMass','rearMass','baggageMass'].reduce((sum,id) => sum + value(id), 0) + fuelKg();
  $('mass').value = mass.toFixed(1);
  const fuelUnitText = $('fuelUnit').value === 'gal' ? '1 US gal = 3,785 l' : '1 l';
  $('fuelKg').textContent = `≈ ${fuelKg().toLocaleString('de-DE',{maximumFractionDigits:1})} kg (${fuelUnitText}; 0,72 kg/l)`;
  return mass;
}
function setAltitudeMode() {
  const direct = document.querySelector('input[name="altitudeMode"]:checked').value === 'direct';
  const airportControls = [$('airport'), $('qnh'), $('qnhMode')];
  const directControls = [$('pressureAltitude')];
  airportControls.forEach(control => {
    control.disabled = direct;
    control.closest('label').classList.toggle('disabled-field', direct);
  });
  directControls.forEach(control => {
    control.disabled = !direct;
    control.closest('label').classList.toggle('disabled-field', !direct);
  });
  $('calculatedPressureField').classList.toggle('hidden', direct);
}
function pressureAltitude() {
  if (document.querySelector('input[name="altitudeMode"]:checked').value === 'direct') return value('pressureAltitude');
  if (!selectedAirport) throw Error('Startplatz: gültigen ICAO-Code eingeben');
  const qnh = value('qnh');
  if (!Number.isFinite(qnh) || qnh < 850 || qnh > 1100) throw Error('QNH: Wert zwischen 850 und 1100 hPa eingeben');
  const pa = Math.round(selectedAirport.elevation + (1013.25 - qnh) * 30);
  $('calculatedPressureAltitude').value = pa;
  return pa;
}
function densityAltitude(pa, temperature) {
  const isaTemperature = 15 - 2 * (pa / 1000);
  return Math.round(pa + 120 * (temperature - isaTemperature));
}
function calculate() {
  const aircraft = AIRCRAFT[$('aircraft').value];
  if (!aircraft.ready) throw Error(`${aircraft.name}: Tabellenwerte werden noch ergänzt`);
  const mass=updateMass(), pa=pressureAltitude(), temp=value('temperature'), wind=value('wind'), obstacle=value('obstacleHeight');
  const da=densityAltitude(pa,temp);
  densityAltitude.value = da;
  const base=interpolation(DATA.base,temp,pa,'Basisstrecke');
  const massDistance=interpolation(DATA.mass,base,mass,'Masse');
  const windDistance=interpolation(DATA.wind,massDistance,wind,'Wind');
  const obstacleDistance=interpolation(DATA.obstacle,windDistance,obstacle,'Hindernis');
  const factors={grass:FACTORS[$('grass').value],wet:$('wet').value==='Ja'?1.1:1,slope:$('slope').value==='Ja'?1.1:1};
  return {final:Math.round(obstacleDistance*factors.grass*factors.wet*factors.slope),base,mass,massDistance,windDistance,obstacleDistance,pa,da,...factors};
}
function render() {
  try {
    const r=calculate();
    $('resultValue').textContent=r.final.toLocaleString('de-DE');
    $('resultStatus').textContent='Berechnung vollständig'; $('resultStatus').style.color='#236143';
    const rows=[['Druckhöhe',`${r.pa.toLocaleString('de-DE')} ft`],['Dichtehöhe',r.da],['Startmasse',`${r.mass.toLocaleString('de-DE',{maximumFractionDigits:1})} kg`],['Basisstrecke',r.base],['Nach Masse',r.massDistance],['Nach Wind',r.windDistance],['Über Hindernis',r.obstacleDistance],['Grasfaktor',`${r.grass.toFixed(2)}×`],['Nässefaktor',`${r.wet.toFixed(2)}×`],['Steigungsfaktor',`${r.slope.toFixed(2)}×`]];
    $('steps').innerHTML=rows.map(([k,v])=>`<dt>${k}</dt><dd>${typeof v==='number'?v.toLocaleString('de-DE',{maximumFractionDigits:1})+' m':v}</dd>`).join('');
  } catch (error) { $('resultValue').textContent='—'; $('resultStatus').textContent=error.message; $('resultStatus').style.color='#a43a33'; }
}
function parseCsvRow(line) {
  return line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(cell => cell.replace(/^"|"$/g,'').replace(/""/g,'"'));
}
function airportDistanceKm(a,b) {
  if (!a || !b || !Number.isFinite(a.lat) || !Number.isFinite(a.lon) || !Number.isFinite(b.lat) || !Number.isFinite(b.lon)) return Number.POSITIVE_INFINITY;
  const toRad = value => value * Math.PI / 180;
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat), dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
  const hav = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(hav));
}
async function getAirportCatalog() {
  if (airportRows) return airportRows;
  const csv = await (await fetch(AIRPORTS_URL)).text();
  airportRows = csv.split(/\r?\n/).slice(1).filter(Boolean).map(parseCsvRow).map(row => ({
    icao: row[0],
    name: row[2],
    elevation: Number(row[6]),
    lat: Number(row[7]),
    lon: Number(row[8])
  })).filter(row => row.icao && Number.isFinite(row.lat) && Number.isFinite(row.lon));
  return airportRows;
}
async function loadAirport(icao) {
  const code=icao.trim().toUpperCase();
  if (!/^[A-Z]{4}$/.test(code)) { selectedAirport=null; $('airportStatus').textContent='Bitte einen vierstelligen ICAO-Code eingeben.'; render(); return; }
  $('airportStatus').textContent='Flugplatzdaten werden geladen …';
  try {
    const rows = await getAirportCatalog();
    const row = rows.find(item => item.icao.toUpperCase()===code);
    if (!row) { selectedAirport=null; $('airportStatus').textContent='ICAO-Code nicht in airportsdata gefunden.'; render(); return; }
    selectedAirport={icao:row.icao,name:row.name,elevation:Number(row.elevation),lat:row.lat,lon:row.lon};
    $('airportElevation').value=selectedAirport.elevation;
    $('airportStatus').textContent=`${selectedAirport.name} – ${selectedAirport.elevation} ft`;
    render();
  } catch (error) {
    selectedAirport=null;
    $('airportStatus').textContent=`Flugplatzdaten konnten nicht geladen werden: ${error.message}`;
    render();
  }
}
async function getNearbyQnh(code) {
  const rows = await getAirportCatalog();
  const origin = rows.find(item => item.icao.toUpperCase()===code);
  if (!origin) return null;
  const candidates = rows.filter(item => item.icao.toUpperCase() !== code).map(item => ({ ...item, distanceKm: airportDistanceKm(origin, item) })).filter(item => Number.isFinite(item.distanceKm)).sort((a,b) => a.distanceKm - b.distanceKm).slice(0, 25);
  for (const candidate of candidates) {
    try {
      const response = await fetch(`https://aviationweather.gov/api/data/metar?ids=${candidate.icao}&format=json`);
      if (!response.ok) continue;
      const reports = await response.json();
      if (reports[0] && Number.isFinite(reports[0].altim)) return { qnh: reports[0].altim, source: candidate.icao };
    } catch (error) {
      continue;
    }
  }
  return null;
}
async function getWindyPressure(code) {
  if (!WINDY_API_KEY || !selectedAirport || !Number.isFinite(selectedAirport.lat) || !Number.isFinite(selectedAirport.lon)) return null;
  const response = await fetch('https://api.windy.com/api/point-forecast/v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat: selectedAirport.lat, lon: selectedAirport.lon, model: 'iconD2', parameters: ['pressure'], levels: ['surface'], key: WINDY_API_KEY })
  });
  if (!response.ok) throw Error(`Windy-Dienst nicht erreichbar (${response.status})`);
  const data = await response.json();
  const pressurePa = Array.isArray(data['pressure-surface']) ? data['pressure-surface'].find(Number.isFinite) : null;
  if (!Number.isFinite(pressurePa)) return null;
  return { qnh: Math.round(pressurePa / 100), model: 'ICON-D2' };
}
async function loadQnh() {
  const code=$('airport').value.trim().toUpperCase();
  if ($('qnhMode').value !== 'auto' || !/^[A-Z]{4}$/.test(code)) return;
  $('qnhStatus').textContent='QNH wird aus METAR geladen …';
  try {
    const response=await fetch(`https://aviationweather.gov/api/data/metar?ids=${code}&format=json`);
    if (response.ok) {
      const reports=await response.json();
      if (reports[0] && Number.isFinite(reports[0].altim)) {
        $('qnh').value=reports[0].altim;
        $('qnhStatus').textContent=`Automatisch: ${reports[0].altim} hPa (Startplatz)`;
        render();
        return;
      }
    }
    const fallback = await getNearbyQnh(code);
    if (fallback) {
      $('qnh').value=fallback.qnh;
      $('qnhStatus').textContent=`Automatisch: ${fallback.qnh} hPa (Nachbarplatz ${fallback.source})`;
      render();
      return;
    }
    const windy = await getWindyPressure(code);
    if (windy) {
      $('qnh').value=windy.qnh;
      $('qnhStatus').textContent=`Automatisch: ${windy.qnh} hPa (Windy ${windy.model}, ${code})`;
      render();
      return;
    }
    throw Error('Kein aktuelles QNH verfügbar');
  } catch (error) { $('qnhStatus').textContent=`Automatische Abfrage fehlgeschlagen: ${error.message}. Bitte manuell eingeben.`; }
}
document.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',render));
document.querySelectorAll('select').forEach(el=>el.addEventListener('change',()=>{
  setAltitudeMode();
  if (el.id === 'aircraft') $('aircraftEyebrow').textContent = AIRCRAFT[el.value].name;
  if (['emptyMass','pilotMass','copilotMass','rearMass','baggageMass','fuelAmount','fuelUnit'].includes(el.id)) updateMass();
  render();
}));
document.querySelectorAll('input[name="altitudeMode"]').forEach(el=>el.addEventListener('change',()=>{ setAltitudeMode(); render(); }));
['emptyMass','pilotMass','copilotMass','rearMass','baggageMass','fuelAmount'].forEach(id=>$(id).addEventListener('input',updateMass));
$('airport').addEventListener('change',()=>{loadAirport($('airport').value); loadQnh();});
$('airport').addEventListener('blur',()=>{loadAirport($('airport').value); loadQnh();});
$('qnhMode').addEventListener('change',loadQnh);
setAltitudeMode(); updateMass(); render();
window.addEventListener('online',()=>{ $('offlineBadge').textContent='Online'; $('offlineBadge').style.background='#dceef5'; });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
