const API = location.origin;

/* ---------- About / Active ---------- */
const refreshBtn = document.getElementById('refresh-health');
const healthOut  = document.getElementById('health-output');

async function refreshActive() {
  if (!healthOut) return;
  healthOut.textContent = 'Loading...';
  try {
    const res  = await fetch(`${API}/healthz`);
    const json = await res.json();
    healthOut.textContent = JSON.stringify(json, null, 2);
  } catch (e) {
    healthOut.textContent = 'Error loading /healthz: ' + e;
  }
}
refreshBtn?.addEventListener('click', refreshActive);

/* ---------- Artifacts list + Activate ---------- */
const listBtn = document.getElementById('list-artifacts');
const ul      = document.getElementById('artifact-list');

async function listArtifacts() {
  if (!ul) return;
  ul.innerHTML = 'Loading...';
  try {
    const res  = await fetch(`${API}/admin/list_artifacts`);
    const json = await res.json();
    const items = json?.artifacts ?? json ?? [];
    ul.innerHTML = '';

    // get currently active model to highlight
    let activePath = null;
    try {
      const health = await (await fetch(`${API}/healthz`)).json();
      activePath = health?.artifact || health?.active || null;
    } catch {}

    items.forEach((p) => {
      const li  = document.createElement('li');
      const fname = String(p).split(/[/\\]/).pop();

      const btn = document.createElement('button');
      if (activePath && String(activePath) === String(p)) {   // exact match
        btn.textContent = 'Active';
        btn.disabled = true;
        btn.className = 'primary';
      } else {
        btn.textContent = 'Activate';
        btn.className = 'ghost';
        btn.addEventListener('click', () => activateArtifact(p, fname));
      }

      li.textContent = p + ' ';
      li.appendChild(btn);
      ul.appendChild(li);
    });

  } catch (e) {
    ul.innerHTML = 'Error: ' + e;
  }
}
listBtn?.addEventListener('click', listArtifacts);

async function activateArtifact(path, fallbackName) {
  let resp, json;

  try {
    resp = await fetch(`${API}/admin/activate_model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artifact: path }) 
    });

    if (resp.status === 405 || resp.status === 404) {
      const url = new URL(`${API}/admin/activate_model`);
      url.searchParams.set('artifact', path);
      resp = await fetch(url.toString(), { method: 'GET' });
    }

    if (resp.status === 404) {
      const label = (fallbackName || '').replace(/\.pkl$/i, '');
      resp = await fetch(`${API}/admin/activate_by_label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label })
      });
    }

    json = await resp.json();
  } catch (e) {
    alert('Activation failed: ' + e);
    return;
  }

  const name =
    json?.active_label ||
    json?.label ||
    json?.version ||
    json?.artifact ||
    json?.active ||
    fallbackName ||
    'model';

  alert(`Activated: ${name}`);

  // refresh everything
  await refreshActive();
  await listArtifacts();
  await runCompare();   // 👈 refresh compare output after activation
}

/* ---------- Compare Models (Top N + Sort) ---------- */
const compareBtn  = document.getElementById('compare-btn');
const sortSel     = document.getElementById('sort-by');
const topNEl      = document.getElementById('top-n');
const compareOut  = document.getElementById('compare-output');

compareBtn?.addEventListener('click', runCompare);

async function runCompare() {
  if (!compareOut) return;
  compareOut.textContent = 'Loading...';

  const url = new URL(`${API}/admin/compare_models`);
  if (sortSel?.value) url.searchParams.set('sort_by', sortSel.value);

  const topN = (topNEl?.value || '').trim();
  if (topN) url.searchParams.set('top_n', topN);

  try {
    const res  = await fetch(url.toString());
    const json = await res.json();

    if (Array.isArray(json?.rows) && sortSel?.value) {
      const key = sortSel.value;
      json.rows.sort((a, b) => Number(b[key] ?? 0) - Number(a[key] ?? 0));
      if (topN && !isNaN(Number(topN))) {
        json.rows = json.rows.slice(0, Number(topN));
      }
    }

    compareOut.textContent = JSON.stringify(json, null, 2);
  } catch (e) {
    compareOut.textContent = 'Error: ' + e;
  }
}

/* ---------- Generate Plot (bar only) ---------- */
const plotBtn    = document.getElementById('plot-btn');
const plotMetric = document.getElementById('plot-metric');
const plotArea   = document.getElementById('plot-area');

plotBtn?.addEventListener('click', async () => {
  if (!plotArea) return;
  plotArea.innerHTML = 'Generating plot...';

  const preferred = new URL(`${API}/admin/compare_models_plot`);
  preferred.searchParams.set('metric', plotMetric.value);
  preferred.searchParams.set('_t', Date.now());

  const fallback = new URL(`${API}/admin/compare_plot`);
  fallback.searchParams.set('metric', plotMetric.value);
  fallback.searchParams.set('_t', Date.now());

  const tryImg = (url) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.alt = 'comparison plot';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('image load failed: ' + url));
      img.src = url.toString();
    });

  try {
    const img = await tryImg(preferred);
    plotArea.innerHTML = '';
    plotArea.appendChild(img);
  } catch {
    try {
      const img2 = await tryImg(fallback);
      plotArea.innerHTML = '';
      plotArea.appendChild(img2);
    } catch {
      plotArea.innerHTML = `<div class="muted">Plot endpoint not found. You can still use <b>Compare Models</b>. Once you add a plot route to the backend, this button will work.</div>`;
    }
  }
});
