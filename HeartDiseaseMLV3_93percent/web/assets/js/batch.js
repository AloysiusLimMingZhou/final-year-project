
const API = location.origin;
const form = document.getElementById('batch-form');
const result = document.getElementById('batch-result');
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  result.textContent = 'Uploading...';
  try {
    const res = await fetch(`${API}/predict/batch`, { method: 'POST', body: fd });
    if (!res.ok) {
      const err = await res.json().catch(()=>({detail: res.statusText}));
      result.textContent = 'Error: ' + JSON.stringify(err);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'predictions.csv'; a.textContent = 'Download predictions.csv';
    result.innerHTML = ''; result.appendChild(a);
  } catch (err) { result.textContent = 'Error: ' + err; }
});
