const API = location.origin;
const form = document.getElementById('predict-form');
const outRaw = document.getElementById('predict-output');
const outPretty = document.getElementById('pretty-output');
const needle = document.getElementById('needle');

const presets = {
  low: {age:29,sex:0,cp:0,trestbps:112,chol:180,fbs:0,restecg:1,thalach:178,exang:0,oldpeak:0.1,slope:2,ca:0,thal:2},
  medium: {age:54,sex:1,cp:1,trestbps:140,chol:220,fbs:0,restecg:1,thalach:160,exang:0,oldpeak:1.2,slope:1,ca:0,thal:2},
  high: {age:66,sex:1,cp:3,trestbps:160,chol:300,fbs:1,restecg:2,thalach:120,exang:1,oldpeak:3.5,slope:0,ca:2,thal:3}
};

document.querySelectorAll('.presets button')?.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const p = presets[btn.dataset.preset];
    if (!p) return;
    // set radios/selects/inputs properly
    for (const [k,v] of Object.entries(p)) {
      const el = form.querySelector(`[name="${k}"]`);
      if (!el) continue;
      if (el.type === 'radio') {
        const radio = form.querySelector(`[name="${k}"][value="${v}"]`);
        if (radio) radio.checked = true;
      } else if (el.tagName === 'SELECT') {
        el.value = String(v);
      } else {
        el.value = v;
      }
    }
  });
});

function bandColor(band){
  if (!band) return '';
  const key = (band+'').toLowerCase();
  if (key.startsWith('low')) return '#4ade80';
  if (key.startsWith('med')) return '#facc15';
  return '#fb7185';
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const data = Object.fromEntries(fd.entries());

  // Convert to numbers; radios/selects come as strings
  const numericKeys = ['age','sex','cp','trestbps','chol','fbs','restecg','thalach','exang','oldpeak','slope','ca','thal'];
  for (const k of numericKeys) if (k in data) data[k] = Number(data[k]);

  outPretty.textContent = 'Predicting...';
  try {
    const res = await fetch(`${API}/predict/heart_disease`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    const json = await res.json();
    outRaw.textContent = JSON.stringify(json, null, 2);

    const prob = Math.max(0, Math.min(1, Number(json.probability ?? 0)));
    const pct = (prob*100).toFixed(1) + '%';
    const band = json.band || 'Unknown';
    const ver = json.version || json.model || '';
    if (needle) needle.style.left = (prob*100).toFixed(1) + '%';

    outPretty.innerHTML = `<div><b>${pct}</b> risk (${band})</div>` +
      (ver ? `<div class="muted">Model: ${ver}</div>` : '');
    outPretty.style.borderColor = bandColor(band) || 'var(--line)';
  } catch (err) {
    outPretty.textContent = 'Error: ' + err;
  }
});
