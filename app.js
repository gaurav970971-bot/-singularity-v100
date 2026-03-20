let faults = 0;
let profit = 0;
let wins = 0;
let totalRounds = 0;
let step = 1;
let mem = [];
let pHistory = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

function sync() {
    const url = document.getElementById('urlIn').value;
    if (url) {
        document.getElementById('gameFrame').src = url;
    }
}

function compute() {
    const n = pHistory.length;
    let sx = 0, sy = 0, sxy = 0, sxx = 0;
    
    for (let i = 0; i < n; i++) {
        sx += i;
        sy += pHistory[i];
        sxy += i * pHistory[i];
        sxx += i * i;
    }
    
    const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    document.getElementById('gravHUD').innerText = slope.toFixed(2);

    let pred = slope >= 0 ? "ALPHA" : "BETA";
    const sig = document.getElementById('mainSignal');
    sig.innerText = pred;
    sig.style.color = pred === 'BETA' ? 'var(--ultra-purple)' : 'var(--aura-blue)';
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(pred));
}

function process(type) {
    const pred = document.getElementById('mainSignal').innerText;
    const base = parseInt(document.getElementById('base').value) || 10;
    const stake = base * Math.pow(3, step - 1);
    totalRounds++;
    
    if (type === 'WIN') {
        profit += (stake * 0.9);
        faults = 0;
        step = 1;
        wins++;
    } else {
        profit -= stake;
        faults++;
        step++;
        document.getElementById('appBody').classList.add('glitch-active');
        setTimeout(() => {
            document.getElementById('appBody').classList.remove('glitch-active');
        }, 400);
    }

    mem.push(type === 'WIN' ? pred : (pred === 'ALPHA' ? 'BETA' : 'ALPHA'));
    if (mem.length > 10) mem.shift();
    
    pHistory.push(profit);
    if (pHistory.length > 10) pHistory.shift();

    if (faults >= 3) {
        document.getElementById('lockout').style.display = "flex";
    }
    
    refreshUI();
    compute();
}

function refreshUI() {
    document.getElementById('powerHUD').innerText = Math.floor(profit);
    document.getElementById('winRateHUD').innerText = totalRounds > 0 
        ? ((wins / totalRounds) * 100).toFixed(1) + "%" 
        : "0%";
    document.getElementById('strikeHUD').innerText = faults + "/3";
    
    const nb = document.getElementById('nodes');
    nb.innerHTML = '';
    mem.forEach(m => {
        let d = document.createElement('div');
        d.className = `node node-${m}`;
        nb.appendChild(d);
    });
    
    const line = document.getElementById('vectorGraph');
    const min = Math.min(...pHistory);
    const max = Math.max(...pHistory);
    const rng = (max - min) || 50;
    let pts = pHistory.map((p, i) => `${i * 50},${100 - (((p - min) / rng) * 70 + 15)}`).join(' ');
    line.setAttribute("points", pts);
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {
        console.log('Service Worker registration failed');
    });
}

setInterval(() => {
    document.getElementById('logic').style.opacity = Math.random() > 0.9 ? "0.3" : "1";
}, 200);

refreshUI();
compute();
