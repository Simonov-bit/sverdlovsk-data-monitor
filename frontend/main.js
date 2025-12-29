// main.js — подгружает frontend/data/status.json и рисует карту
const DATA_URL = 'data/status.json';
const POINTS_CSV = 'data/points.csv';


let map = L.map('map').setView([56.8389, 60.6057], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
maxZoom: 18
}).addTo(map);


async function loadPointsCSV(){
const r = await fetch(POINTS_CSV);
const txt = await r.text();
const lines = txt.trim().split('\n');
const rows = lines.slice(1).map(l=>l.split(','));
return rows.map(r=>({id:r[0],name:r[1],lat:parseFloat(r[2]),lon:parseFloat(r[3])}));
}


function statusToClass(status){
if(status==='green') return 'status-green';
if(status==='yellow') return 'status-yellow';
return 'status-red';
}


async function refresh(){
const points = await loadPointsCSV();
const r = await fetch(DATA_URL + '?_='+Date.now());
const data = await r.json();


document.getElementById('rows').innerHTML = '';


points.forEach(p=>{
const info = data[p.id] || {};
const last = info.last || null;
const status = info.status || 'red';


const tr = document.createElement('tr');
const tdName = document.createElement('td'); tdName.textContent = p.name;
const tdStatus = document.createElement('td');
const dot = document.createElement('span'); dot.className = 'status-dot ' + statusToClass(status);
tdStatus.appendChild(dot); tdStatus.appendChild(document.createTextNode(status));
const tdLast = document.createElement('td'); tdLast.textContent = last || '-';


tr.appendChild(tdName); tr.appendChild(tdStatus); tr.appendChild(tdLast);
document.getElementById('rows').appendChild(tr);


// marker
const marker = L.circleMarker([p.lat,p.lon],{radius:8}).addTo(map);
marker.setStyle({color: status==='green'? 'green': status==='yellow'?'gold':'red'});
marker.bindPopup(`<b>${p.name}</b><br>Статус: ${status}<br>Последнее: ${last || '-'} `);
});
}


document.getElementById('refresh').addEventListener('click', refresh);
document.getElementById('filter').addEventListener('input', (e)=>{
const q = e.target.value.toLowerCase();
Array.from(document.querySelectorAll('#rows tr')).forEach(tr=>{
tr.style.display = tr.children[0].textContent.toLowerCase().includes(q) ? '' : 'none';
});
});


refresh();
