// Mide las animaciones de cada escena (tweens de GSAP) y las manda a audio/harvest.json.
// Uso: 1) `npx hyperframes preview` en film/  2) python audio/receptor.py  3) abrir http://localhost:3002/api/projects/film/preview
//      4) pegar este archivo en la consola del navegador y esperar ~2 min ("posted" en window.__LOG)  5) python audio/sfx_animaciones.py
window.__HARV = {}; window.__LOG = [];
window.__abs = (el) => { let t = 0; let e = el; while (e) { if (e.dataset && e.dataset.compositionId && e.dataset.start !== undefined && e.dataset.compositionId !== 'main') t += parseFloat(e.dataset.start) || 0; e = e.parentElement; } return t; };
window.__desc = (el) => { if (!el) return '?'; const t = (el.textContent||'').trim().slice(0,24); const r = el.getBoundingClientRect ? el.getBoundingClientRect() : {width:0,height:0}; return (el.id ? '#' + el.id : (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : el.tagName)) + '|' + el.tagName + '|' + Math.round(r.width) + 'x' + Math.round(r.height) + '|' + t; };
window.__harvest = () => {
  for (const [key, tl] of Object.entries(window.__timelines)) {
    if (key === 'main' || key === 's99-subs' || key.startsWith('cursor-annotate') || window.__HARV[key]) continue;
    const host = document.querySelector('[data-composition-id="' + key + '"]'); if (!host) continue;
    const base = window.__abs(host), tweens = [];
    for (const tw of tl.getChildren(true, true, false)) {
      let t = tw.startTime(), p = tw.parent; while (p && p !== gsap.globalTimeline) { t += p.startTime(); p = p.parent; }
      const v = tw.vars || {}, keep = {};
      for (const k of ['opacity','x','y','scale','scaleX','scaleY','rotation','rotationX','rotationY','filter','clipPath','width','height','xPercent','yPercent','top','left','autoAlpha','strokeDashoffset','textContent']) if (k in v) keep[k] = (typeof v[k] === 'function') ? 'fn' : (typeof v[k] === 'object' ? 'obj' : v[k]);
      let tg = [], n = 0; try { tg = tw.targets().slice(0, 1).map(window.__desc); n = tw.targets().length; } catch (e) {}
      tweens.push({ l: +t.toFixed(3), d: +tw.duration().toFixed(3), tg, n, v: keep, from: !!(v.startAt) || (tw.data === 'from'), set: tw.duration() === 0 });
    }
    window.__HARV[key] = { base, dur: +tl.duration().toFixed(3), n: tweens.length, tweens };
  }
};
const hosts = [...document.querySelectorAll('[data-composition-id]')].filter(e => e.dataset.compositionId !== 'main' && e.parentElement && e.parentElement.dataset.compositionId === 'main');
const starts = [...new Set(hosts.map(h => parseFloat(h.dataset.start)).filter(x => !isNaN(x)))].sort((a,b)=>a-b);
(async () => {
  for (const s of starts) { window.__player.seek(s + 1.2); await new Promise(r=>setTimeout(r,3200)); window.__harvest(); }
  await fetch('http://127.0.0.1:8799/', {method:'POST', body: JSON.stringify(window.__HARV)}); window.__LOG.push('posted');
})();
