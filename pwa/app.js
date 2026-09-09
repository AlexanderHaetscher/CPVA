const DATA = {
  base: { x: [-20,-10,0,10,20,30,40,50], y: [0,2000,4000,6000,8000,10000], values: [[210,230,260,280,330,360,400,440],[270,300,330,360,410,450,500,560],[340,370,410,450,520,580,640,700],[410,460,520,580,660,740,840,960],[510,600,680,770,880,1020,1220,1520],[680,780,880,1020,1220,1480,null,null]] },
  mass: { x: [100,200,300,400,500,600,700,800,900,1000,1100,1200], y: [850,950,1050,1150,1200], values: [[100,100,100,200,230,280,310,330,360,400,430,500],[100,100,140,260,300,360,400,440,480,500,580,680],[100,110,210,300,370,430,520,590,630,680,760,860],[100,160,260,360,440,540,610,710,780,880,980,1180],[100,200,300,400,500,600,700,800,900,1000,1100,1200]] },
  wind: { x: [200,300,400,500,600,700,800,900,1000,1100,1200], y: [-5,0,5,10,15,20], values: [[240,350,460,570,680,790,900,1010,1120,1230,1340],[200,300,400,500,600,700,800,900,1000,1100,1200],[170,260,340,440,520,600,680,770,860,950,1040],[140,220,290,350,440,520,580,700,730,810,900],[110,170,260,310,380,440,510,600,660,750,840],[100,140,160,240,320,400,460,540,600,670,740]] },
  obstacle: { x: [100,200,300,400,500,600,700,800,900,1000,1100,1200], y: [0,50], values: [[100,200,300,400,500,600,700,800,900,1000,1100,1200],[220,340,450,580,740,860,1000,1160,1300,1400,1500,1600]] }
};
const FACTORS = {'Kein Gras':1,'Gras <5 cm':1.10,'Gras 5-10 cm':1.15,'Gras >10 cm':1.25};
const $ = (id) => document.getElementById(id);
const value = (id) => Number($(id).value);
function interpolation(table, xValue, yValue, label) {
  const {x,y,values} = table;
  if (!Number.isFinite(xValue) || !Number.isFinite(yValue)) throw Error(`${label}: Eingabe fehlt`);
  let xi = x.findIndex((v,i) => xValue >= v && (i === x.length-1 || xValue <= x[i+1]));
  let yi = y.findIndex((v,i) => yValue >= v && (i === y.length-1 || yValue <= y[i+1]));
  if (xi < 0 || yi < 0 || xValue < x[0] || xValue > x.at(-1) || yValue < y[0] || yValue > y.at(-1)) throw Error(`${label}: außerhalb des Tabellenbereichs`);
  if (table === DATA.base && yValue > 8000 && xValue > 30) throw Error('10.000 ft: nur bis 30 °C verfügbar');
  const x0=x[xi], x1=x[Math.min(xi+1,x.length-1)], y0=y[yi], y1=y[Math.min(yi+1,y.length-1)];
  const q11=values[yi][xi], q21=values[yi][Math.min(xi+1,x.length-1)], q12=values[Math.min(yi+1,y.length-1)][xi], q22=values[Math.min(yi+1,y.length-1)][Math.min(xi+1,x.length-1)];
  if ([q11,q21,q12,q22].some(v => v == null || !Number.isFinite(v))) throw Error(`${label}: für diese Kombination sind keine Werte hinterlegt`);
  const tx = x1 === x0 ? 0 : (xValue-x0)/(x1-x0), ty = y1 === y0 ? 0 : (yValue-y0)/(y1-y0);
  return q11*(1-tx)*(1-ty)+q21*tx*(1-ty)+q12*(1-tx)*ty+q22*tx*ty;
}
function calculate() {
  const pa=value('pressureAltitude'), temp=value('temperature'), mass=value('mass'), wind=value('wind'), obstacle=value('obstacleHeight');
  const base=interpolation(DATA.base,temp,pa,'Basisstrecke');
  const massDistance=interpolation(DATA.mass,base,mass,'Masse');
  const windDistance=interpolation(DATA.wind,massDistance,wind,'Wind');
  const obstacleDistance=interpolation(DATA.obstacle,windDistance,obstacle,'Hindernis');
  const final=Math.round(obstacleDistance*FACTORS[$('grass').value]*($('wet').value==='Ja'?1.1:1)*($('slope').value==='Ja'?1.1:1));
  return {final,base,massDistance,windDistance,obstacleDistance,grass:FACTORS[$('grass').value],wet:$('wet').value==='Ja'?1.1:1,slope:$('slope').value==='Ja'?1.1:1};
}
function render() {
  try {
    const r=calculate();
    $('resultValue').textContent=r.final.toLocaleString('de-DE'); $('resultStatus').textContent='Berechnung vollständig'; $('resultStatus').style.color='#236143';
    const rows=[['Basisstrecke',r.base],['Nach Masse',r.massDistance],['Nach Wind',r.windDistance],['Über Hindernis',r.obstacleDistance],['Grasfaktor',`${r.grass.toFixed(2)}×`],['Nässefaktor',`${r.wet.toFixed(2)}×`],['Steigungsfaktor',`${r.slope.toFixed(2)}×`]];
    $('steps').innerHTML=rows.map(([k,v])=>`<dt>${k}</dt><dd>${typeof v==='number'?v.toLocaleString('de-DE',{maximumFractionDigits:1}):v}${typeof v==='number'?' m':''}</dd>`).join('');
    document.querySelectorAll('input,select').forEach(el=>el.classList.remove('has-error'));
  } catch (error) { $('resultValue').textContent='—'; $('resultStatus').textContent=error.message; $('resultStatus').style.color='#a43a33'; }
}
document.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',render));
document.querySelectorAll('select').forEach(el=>el.addEventListener('change',render));
window.addEventListener('online',()=>{ $('offlineBadge').textContent='Online'; $('offlineBadge').style.background='#dceef5'; });
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
