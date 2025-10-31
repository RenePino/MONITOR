// Socket.io IP Configuracion.
const socket = io('http://10.151.187.188:3000'); 

// Constantes
const connText = document.getElementById('connection-text');
const updateTime = document.getElementById('update-time');
const settingsBtn = document.getElementById('settings-btn');
const modal = document.getElementById('settings-modal');
const closeModalBtn = document.querySelector('.close-modal');
const saveSettingsBtn = document.getElementById('save-settings');
const cancelSettingsBtn = document.getElementById('cancel-settings');

const cardMap = {
    '#cpu': 'cpu-card',
    '#memoria': 'memoria-card',
    '#disco': 'disco-card',
    '#os': 'os-card'
};

// ----- Conexión y recepción -----
// Server emite 'datosSistema' (ver server.js). Aca lo escuchamos.
socket.on('connect', () => {
    connText.innerHTML = '<i class="fas fa-circle" style="color:#0f0"></i> Conectado';
    // Obtenemos los datos del api y el server también emite cada 5s
    fetch('/api/sistema').then(r => r.json()).then(data => handleData(data)).catch(()=>{});
});
socket.on('disconnect', () => connText.innerHTML = '<i class="fas fa-circle" style="color:#f33"></i> Desconectado');
socket.on('datosSistema', (datos) => handleData(datos));

// Manejo común de datos (normaliza y actualiza tarjetas)
function handleData(datos){
    if(!datos) return;
    // actualizar tarjetas
    updateCard('cpu-card', datos.cpu || datos?.cpu);
    updateCard('memoria-card', datos.memoria || datos?.memoria);
    updateCard('disco-card', datos.particiones || datos?.particiones);
    // sistemaOperativo u otra sección
    updateCard('os-card', datos.sistemaOperativo || datos?.sistemaOperativo || { hostname: datos.hostname });
    updateTime.textContent = `Última actualización: ${new Date().toLocaleString()}`;
}

// actualizador genérico
function updateCard(id, payload){
    const el = document.getElementById(id);
    if(!el) return;
    const body = el.querySelector('.data-body');
    if(!payload){ body.innerHTML = '<p>Sin datos</p>'; return; }

    // Formateos según estructura
    if(id === 'disco-card'){
        const p = payload.sda1 || payload.sda1 === null ? payload.sda1 : payload;
        const sda1 = (payload && payload.sda1) ? payload.sda1 : null;
        const sda5 = (payload && payload.sda5) ? payload.sda5 : null;
        let html = '';
        if(sda1){
            html += `<p><strong>${sda1.puntoMontaje || sda1.mount || 'partición'}:</strong> ${sda1.filesystem || ''} — ${sda1.tamaño || ''} (${sda1.usoPorcentaje || ''})</p>`;
        }
        if(sda5){
            html += `<p><strong>SWAP:</strong> ${sda5.tamaño || ''} — usado ${sda5.usado || ''} (${sda5.usoPorcentaje || ''})</p>`;
        }
        body.innerHTML = html || '<p>Sin particiones detectadas</p>';
        return;
    }

    // Si payload es objeto plano, mostrar claves
    if(typeof payload === 'object'){
        body.innerHTML = Object.entries(payload).map(([k,v]) => {
            if(v === null || v === undefined) v = 'N/D';
            // si es objeto anidado, mostrar JSON corto
            if(typeof v === 'object') v = JSON.stringify(v);
            return `<p><strong>${k}:</strong> ${v}</p>`;
        }).join('');
        return;
    }

    body.innerHTML = `<p>${String(payload)}</p>`;
}

// ----- Navegación (Home + tarjetas individuales) -----
function applyVisibilityFromSettings(){
    const s = JSON.parse(localStorage.getItem('settings') || '{}');
    const defaults = { showCPU:true, showMemoria:true, showDisco:true, showOS:true, updateInterval:5000 };
    const cfg = Object.assign({}, defaults, s);
    document.getElementById('cpu-card').style.display = cfg.showCPU ? '' : 'none';
    document.getElementById('memoria-card').style.display = cfg.showMemoria ? '' : 'none';
    document.getElementById('disco-card').style.display = cfg.showDisco ? '' : 'none';
    document.getElementById('os-card').style.display = cfg.showOS ? '' : 'none';
    // actualizar intervalo si existe
    if(window.updateTicker) clearInterval(window.updateTicker);
    window.updateTicker = setInterval(()=> { /* opcional: pedir actualización activa si el server soportara evento */ }, parseInt(cfg.updateInterval,10));
}
applyVisibilityFromSettings();

function showOnlyCardByHash(){
    const hash = location.hash || '';
    // quitar active
    document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));
    if(hash && cardMap[hash]){
        // ocultar todos y mostrar el elegido
        Object.values(cardMap).forEach(id => document.getElementById(id).style.display = 'none');
        document.getElementById(cardMap[hash]).style.display = '';
        // marcar activo
        const nav = document.querySelector(`.nav-item[data-hash="${hash}"]`);
        if(nav) nav.classList.add('active');
    } else {
        // Home: mostrar según settings
        const homeNav = document.querySelector(`.nav-item[data-hash=""]`);
        if(homeNav) homeNav.classList.add('active');
        applyVisibilityFromSettings();
    }
}
window.addEventListener('hashchange', showOnlyCardByHash);
document.querySelectorAll('.nav-item[data-hash]').forEach(a => {
    a.addEventListener('click', (e) => {
        const h = a.getAttribute('data-hash') || '';
        location.hash = h;
    });
});
showOnlyCardByHash();

// ----- Modal configuración -----
settingsBtn.addEventListener('click', openSettings);
closeModalBtn.addEventListener('click', closeSettings);
cancelSettingsBtn.addEventListener('click', closeSettings);
window.addEventListener('click', (e) => { if(e.target === modal) closeSettings(); });

function openSettings(){
    const s = JSON.parse(localStorage.getItem('settings') || '{}');
    document.getElementById('showCPU').checked = s.showCPU !== undefined ? s.showCPU : true;
    document.getElementById('showMemoria').checked = s.showMemoria !== undefined ? s.showMemoria : true;
    document.getElementById('showDisco').checked = s.showDisco !== undefined ? s.showDisco : true;
    document.getElementById('showOS').checked = s.showOS !== undefined ? s.showOS : true;
    document.getElementById('updateInterval').value = s.updateInterval || 5000;
    modal.style.display = 'flex';
}
function closeSettings(){ modal.style.display = 'none'; }

saveSettingsBtn.addEventListener('click', () => {
    const newS = {
        showCPU: !!document.getElementById('showCPU').checked,
        showMemoria: !!document.getElementById('showMemoria').checked,
        showDisco: !!document.getElementById('showDisco').checked,
        showOS: !!document.getElementById('showOS').checked,
        updateInterval: parseInt(document.getElementById('updateInterval').value,10) || 5000
    };
    localStorage.setItem('settings', JSON.stringify(newS));
    applyVisibilityFromSettings();
    closeSettings();
});
