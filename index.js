// Socket.io IP Configuracion.
const socket = io('http://10.247.92.188:3000'); 

// Constantes
const connText = document.getElementById('connection-text');
const updateTime = document.getElementById('update-time');
const settingsBtn = document.getElementById('settings-btn');
const modal = document.getElementById('settings-modal');
const closeModalBtn = document.querySelector('.close-modal');
const saveSettingsBtn = document.getElementById('save-settings');
const cancelSettingsBtn = document.getElementById('cancel-settings');
const themeBtn = document.querySelector('.theme-switch');
const themeIcon = themeBtn.querySelector('i');

const cardMap = {
    '#cpu': 'cpu-card',
    '#memoria': 'memoria-card',
    '#disco': 'disco-card',
    '#os': 'os-card',
    '#hardware': 'hardware-card',
    '#placa': 'placa-card',
    '#bios': 'bios-card',
    '#red': 'red-card'
};

// Función para cambiar tema
function toggleTheme() {
    const isDark = document.body.getAttribute('data-theme') !== 'light';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
}

// Inicializar tema
const savedTheme = localStorage.getItem('theme') || 'dark';
document.body.setAttribute('data-theme', savedTheme);
themeIcon.className = savedTheme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
themeBtn.addEventListener('click', toggleTheme);

// ----- Conexión y recepción -----
socket.on('connect', () => {
    connText.innerHTML = '<i class="fas fa-circle" style="color:#0f0"></i> Conectado';
<<<<<<< HEAD
=======
    // Obtenemos los datos del api y el server también emite cada 5s
>>>>>>> fd8ff4d585f9005ed44bf12acdd87e366378eaa0
    fetch('http://10.247.92.188:3000/api/sistema').then(r => r.json()).then(data => handleData(data)).catch(()=>{});
});
socket.on('disconnect', () => connText.innerHTML = '<i class="fas fa-circle" style="color:#f33"></i> Desconectado');
socket.on('datosSistema', (datos) => handleData(datos));

// Manejo común de datos (normaliza y actualiza tarjetas)
function handleData(datos){
    if(!datos) return;
    updateCard('cpu-card', datos.cpu || datos?.cpu);
    updateCard('memoria-card', datos.memoria || datos?.memoria);
    updateCard('disco-card', datos.particiones || datos?.particiones);
    updateCard('hardware-card', datos.hardware || datos?.hardware);
    updateCard('placa-card', datos.placaBase || datos?.placaBase);
    updateCard('bios-card', datos.bios || datos?.bios);
    updateCard('red-card', datos.red || datos?.red);
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
    if(id === 'cpu-card'){
        if(typeof payload === 'object' && payload.usoTotal) {
            const uso = parseFloat(payload.usoTotal);
            const statusClass = uso > 90 ? 'status-danger' : 
                              uso > 80 ? 'status-warning' : 
                              'status-normal';
            body.innerHTML = Object.entries(payload).map(([k,v]) => {
                if(k === 'usoTotal') {
                    return `<p class="${statusClass}"><strong>${k}:</strong> ${v}</p>`;
                }
                return `<p><strong>${k}:</strong> ${v}</p>`;
            }).join('');
            return;
        }
    }

    if(id === 'memoria-card'){
        if(typeof payload === 'object') {
            const total = parseFloat(payload.total);
            const usado = parseFloat(payload.usado);
            if(total && usado) {
                const porcentaje = (usado/total) * 100;
                const statusClass = porcentaje > 90 ? 'status-danger' : 
                                  porcentaje > 80 ? 'status-warning' : 
                                  'status-normal';
                body.innerHTML = Object.entries(payload).map(([k,v]) => {
                    if(k === 'usado') {
                        return `<p class="${statusClass}"><strong>${k}:</strong> ${v}</p>`;
                    }
                    return `<p><strong>${k}:</strong> ${v}</p>`;
                }).join('');
                return;
            }
        }
    }

    if(id === 'disco-card'){
        const sda1 = (payload && payload.sda1) ? payload.sda1 : null;
        const sda5 = (payload && payload.sda5) ? payload.sda5 : null;
        let html = '';
        if(sda1){
            const uso = parseFloat(sda1.usoPorcentaje);
            const statusClass = uso > 90 ? 'status-danger' : 
                              uso > 80 ? 'status-warning' : 
                              'status-normal';
            html += `<p class="${statusClass}"><strong>${sda1.puntoMontaje || sda1.mount || 'partición'}:</strong> ${sda1.filesystem || ''} — ${sda1.tamaño || ''} (${sda1.usoPorcentaje || ''})</p>`;
        }
        if(sda5){
            const uso = parseFloat(sda5.usoPorcentaje);
            const statusClass = uso > 90 ? 'status-danger' : 
                              uso > 80 ? 'status-warning' : 
                              'status-normal';
            html += `<p class="${statusClass}"><strong>SWAP:</strong> ${sda5.tamaño || ''} — usado ${sda5.usado || ''} (${sda5.usoPorcentaje || ''})</p>`;
        }
        body.innerHTML = html || '<p>Sin particiones detectadas</p>';
        return;
    }

    if(id === 'red-card'){
        let lista = [];
        if(Array.isArray(payload)) {
            lista = payload;
        } else if(typeof payload === 'object') {
            lista = Object.values(payload);
        } else {
            body.innerHTML = `<p>${String(payload)}</p>`;
            return;
        }
        const html = lista.map(iface => {
            const interfaz = iface.interfaz || iface.iface || 'N/D';
            const ip4 = iface.ip4 || 'N/D';
            const mac = iface.mac || 'N/D';
            const rx = (iface.recibidoMB !== undefined) ? iface.recibidoMB : (iface.rx ? iface.rx : '0.00');
            const tx = (iface.enviadoMB !== undefined) ? iface.enviadoMB : (iface.tx ? iface.tx : '0.00');
            return `<p><strong>${interfaz}</strong> — IP: ${ip4} — MAC: ${mac} — RX: ${rx} MB — TX: ${tx} MB</p>`;
        }).join('');
        body.innerHTML = html || '<p>Sin interfaces</p>';
        return;
    }

    if(typeof payload === 'object'){
        if(Array.isArray(payload)){
            body.innerHTML = payload.map((v,i) => `<p><strong>[${i}]</strong> ${typeof v === 'object' ? JSON.stringify(v) : String(v)}</p>`).join('');
            return;
        }
        body.innerHTML = Object.entries(payload).map(([k,v]) => {
            if(v === null || v === undefined) v = 'N/D';
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
    const defaults = {
        showCPU:true, showMemoria:true, showDisco:true, showOS:true,
        showHardware:true, showPlaca:true, showBios:true, showRed:true,
        updateInterval:5000
    };
    const cfg = Object.assign({}, defaults, s);
    const safeSetDisplay = (id, show) => {
        const el = document.getElementById(id);
        if(el) el.style.display = show ? '' : 'none';
    };
    safeSetDisplay('cpu-card', cfg.showCPU);
    safeSetDisplay('memoria-card', cfg.showMemoria);
    safeSetDisplay('disco-card', cfg.showDisco);
    safeSetDisplay('os-card', cfg.showOS);
    safeSetDisplay('hardware-card', cfg.showHardware);
    safeSetDisplay('placa-card', cfg.showPlaca);
    safeSetDisplay('bios-card', cfg.showBios);
    safeSetDisplay('red-card', cfg.showRed);
    if(window.updateTicker) clearInterval(window.updateTicker);
    window.updateTicker = setInterval(()=> {}, parseInt(cfg.updateInterval,10));
}
applyVisibilityFromSettings();

function showOnlyCardByHash(){
    const hash = location.hash || '';
    document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));
    if(hash && cardMap[hash]){
        Object.values(cardMap).forEach(id => {
            const el = document.getElementById(id);
            if(el) el.style.display = 'none';
        });
        const showEl = document.getElementById(cardMap[hash]);
        if(showEl) showEl.style.display = '';
        const nav = document.querySelector(`.nav-item[data-hash="${hash}"]`);
        if(nav) nav.classList.add('active');
    } else {
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
    document.getElementById('showHardware').checked = s.showHardware !== undefined ? s.showHardware : true;
    document.getElementById('showPlaca').checked = s.showPlaca !== undefined ? s.showPlaca : true;
    document.getElementById('showBios').checked = s.showBios !== undefined ? s.showBios : true;
    document.getElementById('showRed').checked = s.showRed !== undefined ? s.showRed : true;
    document.getElementById('updateInterval').value = s.updateInterval || 5000;
    modal.style.display = 'flex';
}

function closeSettings(){ 
    modal.style.display = 'none'; 
}

saveSettingsBtn.addEventListener('click', () => {
    const newS = {
        showCPU: !!document.getElementById('showCPU').checked,
        showMemoria: !!document.getElementById('showMemoria').checked,
        showDisco: !!document.getElementById('showDisco').checked,
        showOS: !!document.getElementById('showOS').checked,
        showHardware: !!document.getElementById('showHardware').checked,
        showPlaca: !!document.getElementById('showPlaca').checked,
        showBios: !!document.getElementById('showBios').checked,
        showRed: !!document.getElementById('showRed').checked,
        updateInterval: parseInt(document.getElementById('updateInterval').value,10) || 5000
    };
    localStorage.setItem('settings', JSON.stringify(newS));
    applyVisibilityFromSettings();
    closeSettings();
<<<<<<< HEAD
});
=======
});

>>>>>>> fd8ff4d585f9005ed44bf12acdd87e366378eaa0
