const sel = document.getElementById('theme-select');
const root = document.documentElement;

function applyTheme(value){
  root.setAttribute('data-theme', value);
  try { localStorage.setItem('hd_theme', value); } catch {}
}

let saved = null;
try { saved = localStorage.getItem('hd_theme'); } catch {}
const initial = saved || 'sakura';
applyTheme(initial);
if (sel) sel.value = initial;

sel?.addEventListener('change', e => applyTheme(e.target.value));
