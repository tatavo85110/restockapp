/* =========================================================
   Restock — application mobile (HTML/CSS/JS sans framework)
   ========================================================= */
(function () {
  const app = document.getElementById('app');
  const S = window.RStore;

  /* ================= Outils ================= */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nf = (n, d = 1) => Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: d });
  const euro = (n) => Number(n || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: n >= 100 ? 0 : 2 });
  const unitLabel = (u, q) => (u === 'pièce' || u === 'bouteille') && Math.abs(q) >= 2 ? u + 's' : u;
  const qtyStr = (q, u) => nf(q) + ' ' + unitLabel(u, q);
  const clean = (name) => String(name || '').replace(/\s*\(fictif\)\s*/i, '').trim();
  const initials = (name) => clean(name).replace(/[&']/g, ' ').split(/\s+/).filter((w) => w.length > 2 || /^[A-ZÉ]/.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const parseD = (iso) => { const [y, m, d] = String(iso).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  function dayLabel(iso) {
    if (!iso) return '';
    const d = parseD(iso); const t = new Date(); t.setHours(0, 0, 0, 0);
    const diff = Math.round((t - d) / 864e5);
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Hier';
    if (diff > 1 && diff < 6) return DAYS[d.getDay()].replace(/^./, (c) => c.toUpperCase());
    return d.getDate() + ' ' + MONTHS[d.getMonth()];
  }
  function todayLong() { const d = new Date(); return (DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][d.getMonth()]).replace(/^./, (c) => c.toUpperCase()); }
  function greeting() { const h = new Date().getHours(); return h < 18 && h >= 5 ? 'Bonjour' : 'Bonsoir'; }
  // « Mar, Jeu, Sam » / « Lun à Sam » / « Tous les jours » → indices lundi=0
  const DAY_NAMES = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  function nextDelivery(sup, from) {
    if (!sup) return null; const days = parseDays(sup.days); const d = new Date(from ? from + 'T12:00:00' : Date.now()); d.setDate(d.getDate() + Math.max(1, Number(sup.delay) || 1));
    if (!days.length) return d; for (let i = 0; i < 8; i++) { if (days.includes((d.getDay() + 6) % 7)) return d; d.setDate(d.getDate() + 1); } return d;
  }
  const deliveryStr = (sup, from) => { const d = nextDelivery(sup, from); return d ? d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : '?'; };
  const daysStr = (sup) => { const d = parseDays(sup && sup.days); return !d.length ? '' : d.length === 7 ? 'livré tous les jours' : 'livré le ' + d.map((i) => DAY_NAMES[i]).join(', '); };
  function parseDays(txt) {
    const map = { lun: 0, mar: 1, mer: 2, jeu: 3, ven: 4, sam: 5, dim: 6 };
    const t = String(txt || '').toLowerCase();
    if (t.includes('tous')) return [0, 1, 2, 3, 4, 5, 6];
    const range = t.match(/(lun|mar|mer|jeu|ven|sam|dim)\w*\s*(?:à|-)\s*(lun|mar|mer|jeu|ven|sam|dim)/);
    if (range) { const out = []; for (let i = map[range[1]]; i <= map[range[2]]; i++) out.push(i); return out; }
    return Object.keys(map).filter((k) => t.includes(k)).map((k) => map[k]);
  }
  const todayIdx = () => (new Date().getDay() + 6) % 7;
  const haptic = (ms = 8) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
  const SUP_COLORS = [['#FDEEE4', '#C94A0C'], ['#FFF4D6', '#7A4B00'], ['#EAF4EE', '#1E5C38'], ['#EEF3FC', '#1F4FA8'], ['#F3EEE8', '#5C4A40'], ['#FCEBF1', '#9B2C5A']];
  const supColor = (id) => { let h = 0; String(id).split('').forEach((c) => (h = (h * 31 + c.charCodeAt(0)) | 0)); return SUP_COLORS[Math.abs(h) % SUP_COLORS.length]; };
  const supAvatar = (s, size = 40) => { const [bg, fg] = supColor(s ? s.id : 'x'); return `<span class="avatar" style="width:${size}px;height:${size}px;background:${bg};color:${fg};font-size:${size * 0.34}px">${esc(s ? initials(s.name) : '?')}</span>`; };

  /* ================= Icônes (trait 1,75 px) ================= */
  const P = {
    home: '<path d="M4 10.5 12 4l8 6.5V20H4z"/><path d="M10 20v-5h4v5"/>',
    box: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
    scan: '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><path d="M8 12h8"/>',
    clip: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h4"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5h4"/>',
    receipt: '<path d="M6 3h12v18l-2.5-1.5L13 21l-2-1.5L9 21l-3-1.5z"/><path d="M9 8h6M9 12h4"/>',
    truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.5"/><circle cx="17" cy="17.5" r="1.5"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    chev: '<path d="M9 5l7 7-7 7"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    camera: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.5-2h5L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.5"/>',
    image: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M20 16l-5-5-8 8"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    warn: '<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17v.5"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    arrowIn: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M5 20h14"/>',
    arrowOut: '<path d="M12 20V8M7 13l5-5 5 5"/><path d="M5 4h14"/>',
    sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    logout: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 13a8 8 0 0 0 14.5 4.5L20 16"/><path d="M4 4v4h4M20 20v-4h-4"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
    tally: '<path d="M8 6h12M8 12h12M8 18h12"/><path d="M3.5 6l1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/>',
    upload: '<path d="M12 20V9M7 14l5-5 5 5"/><path d="M5 4h14"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    shield: '<path d="M12 3l7.5 3v6c0 4.5-3.2 7.8-7.5 9-4.3-1.2-7.5-4.5-7.5-9V6z"/><path d="M9 12l2 2 4-4"/>',
    doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    team: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.8-3.4 3-4.8 5.5-4.8s4.7 1.4 5.5 4.8"/><circle cx="17" cy="9.5" r="2.5"/><path d="M16 14.4c2.3 0 4 1.3 4.6 4.1"/>',
    history: '<path d="M4 12a8 8 0 1 0 2.5-5.8L4 8.5"/><path d="M4 4v4.5h4.5M12 8v4l3 2"/>'
  };
  const ic = (n, cls = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="${cls}">${P[n] || ''}</svg>`;
  const G_LOGO = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" fill="#4285F4"/><path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" fill="#34A853"/><path d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2z" fill="#FBBC05"/><path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1z" fill="#EA4335"/></svg>';

  /* ================= Coco, la cocotte ================= */
  function coco(mood = 'idle', size = 180, opts = {}) {
    const steam = opts.steam || '#CDBBA9';
    const eyes = mood === 'joy'
      ? '<path d="M72 132q9-11 18 0M110 132q9-11 18 0" fill="none" stroke="#2A1C16" stroke-width="6" stroke-linecap="round"/>'
      : `<g class="c-pupils"><ellipse cx="81" cy="128" rx="6.5" ry="7.5" fill="#2A1C16"/><ellipse cx="119" cy="128" rx="6.5" ry="7.5" fill="#2A1C16"/><circle cx="83.5" cy="125" r="2" fill="#fff"/><circle cx="121.5" cy="125" r="2" fill="#fff"/></g>`;
    const mouth = mood === 'joy'
      ? '<path d="M86 142q14 18 28 0z" fill="#2A1C16" stroke="#2A1C16" stroke-width="5" stroke-linejoin="round"/><path d="M93 149q7 5 14 0" fill="#FF8A80"/>'
      : mood === 'worry'
        ? '<path d="M90 150q10-7 20 0" fill="none" stroke="#2A1C16" stroke-width="5.5" stroke-linecap="round"/><path d="M70 114l14 4M130 114l-14 4" stroke="#2A1C16" stroke-width="4.5" stroke-linecap="round"/>'
        : mood === 'read'
          ? '<path d="M93 146q7 6 14 0" fill="none" stroke="#2A1C16" stroke-width="5.5" stroke-linecap="round"/>'
          : '<path d="M88 142q12 13 24 0" fill="none" stroke="#2A1C16" stroke-width="6" stroke-linecap="round"/>';
    const arm = mood === 'wave'
      ? '<g class="c-arm-wave"><path d="M160 120q16-6 20-26" fill="none" stroke="#2A1C16" stroke-width="7" stroke-linecap="round"/><circle cx="181" cy="88" r="9" fill="#FFF3E0" stroke="#2A1C16" stroke-width="5"/></g>'
      : '';
    const glasses = mood === 'read'
      ? '<g fill="none" stroke="#2A1C16" stroke-width="4"><circle cx="81" cy="128" r="13"/><circle cx="119" cy="128" r="13"/><path d="M94 127h12"/></g>'
      : '';
    return `<svg class="coco ${mood}" viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="Coco, la cocotte de Restock">
      <ellipse class="c-shadow" cx="100" cy="188" rx="52" ry="7" fill="#2A1C16" opacity=".22"/>
      <g class="c-steam" fill="none" stroke="${steam}" stroke-width="6" stroke-linecap="round">
        <path d="M78 50q-9-10 0-20t0-22"/><path d="M100 44q-9-10 0-20t0-22"/><path d="M122 50q-9-10 0-20t0-22"/>
      </g>
      <g class="c-body">
        <rect x="18" y="106" width="30" height="20" rx="10" fill="#F26A21" stroke="#2A1C16" stroke-width="7"/>
        <rect x="152" y="106" width="30" height="20" rx="10" fill="#F26A21" stroke="#2A1C16" stroke-width="7"/>
        ${arm}
        <rect x="38" y="88" width="124" height="90" rx="32" fill="#F26A21" stroke="#2A1C16" stroke-width="7"/>
        <rect x="56" y="100" width="88" height="7" rx="3.5" fill="#FF9B5E"/>
        <ellipse cx="64" cy="146" rx="9" ry="5.5" fill="#FFB38A"/><ellipse cx="136" cy="146" rx="9" ry="5.5" fill="#FFB38A"/>
        <g class="c-eyes">${eyes}</g>
        ${glasses}
        ${mouth}
        <g class="c-lid">
          <path d="M44 86Q100 40 156 86Z" fill="#E0561A" stroke="#2A1C16" stroke-width="7" stroke-linejoin="round"/>
          <rect x="34" y="80" width="132" height="13" rx="6.5" fill="#E0561A" stroke="#2A1C16" stroke-width="7"/>
          <rect x="87" y="47" width="26" height="15" rx="7" fill="#2A1C16"/>
          <path d="M70 72q14-12 30-14" fill="none" stroke="#FF9B5E" stroke-width="5" stroke-linecap="round"/>
        </g>
      </g>
    </svg>`;
  }

  /* ================= Micro-interactions globales ================= */
  document.addEventListener('pointerdown', (e) => {
    const host = e.target.closest('.ripple-host');
    if (!host) return;
    const r = host.getBoundingClientRect();
    const d = Math.max(r.width, r.height);
    const s = document.createElement('span');
    s.className = 'ripple';
    s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    host.appendChild(s);
    setTimeout(() => s.remove(), 650);
  }, { passive: true });
  document.addEventListener('click', (e) => { if (e.target.closest('button, a, .press')) haptic(6); }, true);

  function toast(msg, kind = 'ok') {
    app.querySelectorAll('.toast').forEach((t) => t.remove());
    const t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status');
    t.innerHTML = `<span class="t-ico ${kind === 'ok' ? '' : 'orange'}">${ic(kind === 'ok' ? 'check' : kind === 'warn' ? 'warn' : 'spark')}</span><span>${msg}</span>`;
    app.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, 2600);
  }

  function countUp(root) {
    root.querySelectorAll('[data-count]').forEach((el) => {
      const to = parseFloat(el.dataset.count); const dec = to % 1 ? 1 : 0;
      const dur = 900; const t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur); const v = to * (1 - Math.pow(1 - k, 3));
        el.textContent = nf(dec ? v : Math.round(v), dec);
        if (k < 1) requestAnimationFrame(step);
      };
      el.textContent = '0'; requestAnimationFrame(step);
    });
  }

  function confetti() {
    const box = document.createElement('div'); box.className = 'confetti';
    const colors = ['#F26A21', '#2F7D4F', '#E0A800', '#F7A779', '#2A1C16', '#1F4FA8'];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement('i');
      c.style.left = Math.random() * 100 + '%';
      c.style.background = colors[i % colors.length];
      c.style.setProperty('--x', (Math.random() * 160 - 80) + 'px');
      c.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
      c.style.animationDuration = 1.6 + Math.random() * 1.6 + 's';
      c.style.animationDelay = Math.random() * 0.4 + 's';
      if (i % 3 === 0) c.style.borderRadius = '50%';
      box.appendChild(c);
    }
    app.appendChild(box); setTimeout(() => box.remove(), 4000);
  }

  function btnLoading(btn, p) {
    btn.classList.add('loading');
    return p.then((v) => { btn.classList.remove('loading'); return v; }, (e) => { btn.classList.remove('loading'); throw e; });
  }
  function btnDone(btn, label) {
    btn.classList.add('done'); btn.innerHTML = ic('check') + esc(label);
  }
  const fail = (e) => { console.error(e); toast(esc(e.message || 'Une erreur est survenue'), 'warn'); };

  function sheet(html, onMount, onClose) {
    const back = document.createElement('div'); back.className = 'sheet-backdrop';
    const sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog');
    sh.innerHTML = '<div class="grab"></div>' + html;
    app.append(back, sh);
    const close = () => { if (sh.classList.contains('out')) return; back.classList.add('out'); sh.classList.add('out'); setTimeout(() => { back.remove(); sh.remove(); onClose && onClose(); }, 300); };
    back.addEventListener('click', close);
    // glisser vers le bas pour fermer
    let y0 = null;
    sh.addEventListener('touchstart', (e) => { if (sh.scrollTop <= 0) y0 = e.touches[0].clientY; }, { passive: true });
    sh.addEventListener('touchmove', (e) => { if (y0 == null) return; const dy = e.touches[0].clientY - y0; if (dy > 0) { sh.style.transform = `translateY(${dy}px)`; sh.style.animation = 'none'; } }, { passive: true });
    sh.addEventListener('touchend', (e) => { if (y0 == null) return; const dy = e.changedTouches[0].clientY - y0; y0 = null; if (dy > 90) close(); else { sh.style.transition = 'transform .3s var(--ease)'; sh.style.transform = ''; setTimeout(() => (sh.style.transition = ''), 300); } });
    onMount && onMount(sh, close);
    return close;
  }

  /* ================= Routeur avec transitions ================= */
  const TABS = ['home', 'stock', 'inventory', 'orders', 'profile'];
  const routes = {};
  let current = null; let stack = []; let nextTransition = null;
  const go = (path, t) => { nextTransition = t || null; if (location.hash === '#' + path) render(); else location.hash = path; };
  const back = (fallback = '/home') => { if (stack.length > 1) history.back(); else go(fallback, 'pop'); };

  const nav = document.createElement('nav');
  nav.className = 'nav hidden'; nav.setAttribute('aria-label', 'Navigation principale');
  const navItem = (tab, href, icon, label, extra = '') => `<a class="nav-item ${extra}" data-tab="${tab}" href="${href}"><span class="ni">${ic(icon)}<b class="nb" data-nb="${tab}"></b></span><span class="nl">${label}</span></a>`;
  nav.innerHTML = `
    <a class="nav-brand" href="#/home" aria-label="Accueil Restock">${coco('idle', 40)}<span class="wordmark"><b>re</b>stock</span></a>
    ${navItem('home', '#/home', 'home', 'Accueil')}
    ${navItem('stock', '#/stock', 'box', 'Stock')}
    <a class="nav-scan" href="#/scan" aria-label="Scanner un bon"><span class="ns-btn">${ic('scan')}</span><span class="nav-scan-l">Scanner<i> un bon</i></span></a>
    ${navItem('inventory', '#/inventory', 'tally', 'Inventaire')}
    ${navItem('orders', '#/orders', 'clip', 'Commandes')}
    ${navItem('profile', '#/profile', 'user', 'Profil', 'nav-desk')}
    <div class="nav-foot"><span class="avatar">LE</span><span>L'Entrecôte Nantes<small>Restock · v2</small></span></div>`;
  function navBadges() {
    if (!DB.ready) return;
    const set = (k, n, kind) => { const b = nav.querySelector(`[data-nb="${k}"]`); if (!b) return; b.textContent = n > 9 ? '9+' : n || ''; b.className = 'nb' + (n ? ' on ' + (kind || '') : ''); };
    set('stock', DB.products.filter((p) => DB.level(p) !== 'ok').length, 'warn');
    set('orders', DB.orders.filter((o) => o.status === 'Brouillon').length);
    set('inventory', DB.pendingSales ? DB.pendingSales().length : 0, 'ia');
  }
  DB.on && DB.on(navBadges);
  app.appendChild(nav);
  nav.querySelector('.nav-scan').addEventListener('click', () => (nextTransition = 'up'));
  function setNav(tab, show) {
    nav.classList.toggle('hidden', !show);
    nav.querySelectorAll('.nav-item').forEach((a) => {
      const on = a.dataset.tab === tab;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    navBadges();
  }

  function parse() {
    const h = location.hash.replace(/^#/, '') || '/';
    const [, name = '', param = ''] = h.split('/');
    return { path: h, name, param: decodeURIComponent(param) };
  }

  function render(opts = {}) {
    const r = parse();
    let def = routes[r.name];
    if (!def) { go(startRoute()); return; }
    if (def.auth && !S.get('user', null)) { go('/login'); return; }

    // sens de la transition
    let tr = nextTransition; nextTransition = null;
    if (!tr) {
      if (opts.silent) tr = 'none';
      else if (stack.length > 1 && stack[stack.length - 2] === r.path) tr = 'pop';
      else if (current && TABS.includes(current.name) && TABS.includes(r.name)) tr = 'fade';
      else if (!current) tr = 'fade';
      else tr = 'push';
    }
    if (!opts.silent) {
      if (tr === 'pop') stack.pop();
      else if (TABS.includes(r.name) && (!current || TABS.includes(current.name))) stack = [r.path];
      else if (stack[stack.length - 1] !== r.path) stack.push(r.path);
    }
    if (tr === 'pop' && current && current.name === 'scan') tr = 'down';

    const el = document.createElement('section');
    el.className = 'screen ' + (def.cls || '');
    if (opts.silent) el.classList.add('quiet');
    el.dataset.route = r.name;
    let out;
    try { out = def.render(r.param, el) || ''; } catch (e) { console.error(e); out = `<div class="empty">Oups, cet écran n'a pas pu s'afficher.<br><small>${esc(e.message)}</small></div>`; }
    el.innerHTML = typeof out === 'string' ? out : out.html;
    const old = app.querySelector('.screen:not(.leaving)');
    if (opts.silent && old) el.scrollTop = 0;
    app.insertBefore(el, nav);
    if (opts.silent && old) { const st = old.scrollTop; el.scrollTop = st; }

    const map = { push: ['enter-push', 'leave-push'], pop: ['enter-pop', 'leave-pop'], fade: ['enter-fade', 'leave-fade'], up: ['enter-up', 'leave-fade'], down: ['enter-fade', 'leave-down'], none: ['', ''] };
    const [inC, outC] = map[tr] || map.fade;
    if (inC) el.classList.add(inC);
    if (old) {
      if (outC) { old.classList.add('leaving', outC); setTimeout(() => old.remove(), 450); } else old.remove();
    }
    if (current && current.cleanup) { try { current.cleanup(); } catch (e) {} }
    current = { name: r.name, param: r.param, el, cleanup: null };
    const desk = document.documentElement.classList.contains('desktop');
    const side = desk && (!!def.tab || (!!def.auth && !!S.get('user', null)));
    app.classList.toggle('side', side);
    setNav(def.tab || null, !!def.tab || side);
    if (def.mount) current.cleanup = def.mount(el, r.param) || null;
    if (!opts.silent) countUp(el);
    if (def.ptr) pullToRefresh(el);
  }
  window.addEventListener('hashchange', () => render());
  // re-rendu discret quand les données changent
  DB.on(() => { if (current && routes[current.name] && routes[current.name].live) render({ silent: true }); });

  function startRoute() {
    if (!S.get('onboarded', false)) return '/onboarding';
    if (!S.get('user', null)) return '/login';
    return '/home';
  }

  /* ---------- Tirer pour rafraîchir (Coco fait tourner la vapeur) ---------- */
  function pullToRefresh(el) {
    const ptr = document.createElement('div'); ptr.className = 'ptr';
    ptr.innerHTML = `<div class="ptr-inner">${coco('idle', 60)}</div>`;
    el.prepend(ptr);
    const inner = ptr.firstElementChild;
    let y0 = null, dy = 0, busy = false;
    el.addEventListener('touchstart', (e) => { if (el.scrollTop <= 0 && !busy) y0 = e.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchmove', (e) => {
      if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0);
      if (dy <= 0) return;
      const k = Math.min(1, dy / 110);
      inner.style.transition = 'none'; inner.style.opacity = k;
      inner.style.transform = `translateY(${Math.min(dy * 0.6, 90)}px) rotate(${dy * 1.2}deg) scale(${0.6 + k * 0.4})`;
    }, { passive: true });
    el.addEventListener('touchend', async () => {
      if (y0 == null) return; y0 = null;
      inner.style.transition = '';
      if (dy > 110) {
        busy = true; haptic(15);
        inner.style.transform = 'translateY(80px)';
        inner.querySelector('.coco').classList.add('read');
        await DB.load();
        toast(DB.error ? 'Hors ligne · données de démo' : DB.mode === 'live' ? 'Stock à jour depuis Airtable' : 'Données rafraîchies', DB.error ? 'warn' : 'ok');
        busy = false;
      }
      inner.style.opacity = 0; inner.style.transform = ''; dy = 0;
    });
  }

  /* ================= Fragments réutilisables ================= */
  const pill = (kind, label) => `<span class="pill ${kind}"><i></i>${esc(label)}</span>`;
  const levelPill = (lv) => pill(lv, lv === 'crit' ? 'Critique' : lv === 'low' ? 'Bas' : 'OK');
  const bonPill = (st) => pill(st === 'Validé' ? 'ok' : st === 'Erreur' ? 'crit' : st === 'À lire' ? 'ia' : 'low', st);
  const orderPill = (st) => pill(st === 'Reçue' ? 'ok' : st === 'Envoyée' ? 'sent' : 'draft', st);
  const backBtn = (label = 'Retour') => `<button class="icon-btn press" data-back aria-label="${label}">${ic('back')}</button>`;
  const skeletonList = (n = 5) => `<div class="list">${Array.from({ length: n }, () => `<div class="sk-row"><div class="skeleton" style="width:38px;height:38px;border-radius:99px"></div><div style="flex:1;display:flex;flex-direction:column;gap:7px"><div class="skeleton" style="height:12px;width:60%"></div><div class="skeleton" style="height:10px;width:38%"></div></div><div class="skeleton" style="width:44px;height:14px"></div></div>`).join('')}</div>`;
  function bindBack(el) { el.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => back())); }
  function bindLinks(el) { el.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go, b.dataset.tr))); }
  const productRow = (p, i = 0) => {
    const lv = DB.level(p); const pct = Math.max(4, Math.min(100, Math.round((p.qty / Math.max(0.1, p.seuil * 2)) * 100)));
    const s = DB.supplier(p.supplierId);
    return `<button class="row press-soft ripple-host" data-go="/product/${p.id}">
      <span class="dot ${lv}"></span>
      <span class="grow"><span class="title">${esc(p.name)}</span><span class="meta">${esc(clean(s && s.name))}</span></span>
      <span style="display:flex;flex-direction:column;align-items:flex-end;gap:6px"><b class="num" style="font-size:15px">${qtyStr(p.qty, p.unit)}</b><span class="bar ${lv}"><i style="width:${pct}%;--d:${0.15 + Math.min(i, 10) * 0.04}s"></i></span></span>
    </button>`;
  };

  /* ---------- Glisser vers la gauche pour supprimer (comme Messages sur iPhone) ---------- */
  function swipeToDelete(container) {
    container.querySelectorAll('.row[data-go^="/product/"]').forEach((row) => {
      const id = row.dataset.go.split('/')[2]; const p = DB.product(id); if (!p) return;
      const wrap = document.createElement('div'); wrap.className = 'swipe';
      row.replaceWith(wrap);
      wrap.innerHTML = `<button class="swipe-act" aria-label="Supprimer ${esc(p.name)}">${ic('trash')}<span>Supprimer</span></button>`;
      wrap.appendChild(row);
      const W = 104; let x0 = null, y0 = 0, dx = 0, open = false, horiz = null;
      const set = (x, anim) => { row.style.transition = anim ? 'transform .3s var(--ease)' : 'none'; row.style.transform = x ? `translateX(${x}px)` : ''; };
      const closeAll = () => container.querySelectorAll('.swipe.open').forEach((w) => { if (w !== wrap) { w.classList.remove('open'); const r = w.querySelector('.row'); r.style.transition = 'transform .3s var(--ease)'; r.style.transform = ''; } });
      row.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; horiz = null; dx = 0; }, { passive: true });
      row.addEventListener('touchmove', (e) => {
        if (x0 == null) return; const mx = e.touches[0].clientX - x0; const my = e.touches[0].clientY - y0;
        if (horiz == null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) horiz = Math.abs(mx) > Math.abs(my);
        if (!horiz) return;
        dx = Math.min(0, Math.max(-W * 1.6, (open ? -W : 0) + mx)); set(dx, false);
      }, { passive: true });
      row.addEventListener('touchend', () => {
        if (x0 == null) return; x0 = null; if (!horiz) return;
        open = dx < -W / 2; wrap.classList.toggle('open', open); set(open ? -W : 0, true); if (open) { closeAll(); haptic(10); }
      });
      row.addEventListener('click', (e) => { if (open || horiz) { e.stopImmediatePropagation(); e.preventDefault(); if (open) { open = false; wrap.classList.remove('open'); set(0, true); } horiz = null; } }, true);
      wrap.querySelector('.swipe-act').addEventListener('click', async () => {
        haptic(20); wrap.classList.add('removing');
        try { await DB.archiveProduct(id); toast(esc(p.name) + ' retiré du stock'); }
        catch (e) { wrap.classList.remove('removing'); set(0, true); fail(e); }
      });
    });
  }

  /* ================= Écrans ================= */

  /* ---------- Splash ---------- */
  routes[''] = routes.splash = {
    cls: 'full',
    render: () => `<div class="splash">${coco('idle', 170, { steam: 'rgba(255,255,255,.8)' })}<div class="wordmark"><b style="color:#fff">re</b>stock</div><div class="tag">Le stock qui se remplit tout seul</div><div class="splash-dots"><i></i><i></i><i></i></div></div>`,
    mount: () => { const t = setTimeout(() => go('/onboarding', 'fade'), 1900); return () => clearTimeout(t); }
  };

  /* ---------- Onboarding ---------- */
  const ONB = [
    { mood: 'wave', bg: '#FFE2CC', title: 'Photographiez<br><em>le bon,</em>', text: 'Coco lit la livraison et remplit le stock. Fini la saisie à la main après chaque livraison.' },
    { mood: 'worry', bg: '#FFF4D6', title: 'Une alerte<br><em>avant la rupture</em>', text: 'Chaque matin à 7 h, Restock vous dit ce qui passe sous le seuil, avant le service.' },
    { mood: 'joy', bg: '#EAF4EE', title: 'Les commandes<br><em>se préparent seules</em>', text: 'Une commande par fournisseur, prête à relire et à envoyer en un geste.' }
  ];
  routes.onboarding = {
    cls: 'full',
    render: () => `<div class="onb">
      <div class="onb-top"><span class="wordmark"><b>re</b>stock</span><button class="link press" data-skip style="padding:10px 4px;font-weight:700">Passer</button></div>
      <div class="onb-track">${ONB.map((s, i) => `<div class="onb-slide ${i === 0 ? 'current' : ''}"><div class="onb-blob" style="background:${s.bg}">${coco(s.mood, 220)}</div><h1>${s.title}</h1><p>${s.text}</p></div>`).join('')}</div>
      <div class="onb-bottom"><div class="onb-dots">${ONB.map((_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('')}</div><button class="btn btn-primary press ripple-host" data-next>Suivant</button></div>
    </div>`,
    mount: (el) => {
      let i = 0; const track = el.querySelector('.onb-track'); const slides = el.querySelectorAll('.onb-slide'); const dots = el.querySelectorAll('.onb-dots i'); const next = el.querySelector('[data-next]');
      const finish = () => { S.set('onboarded', true); go(S.get('user', null) ? '/home' : '/login', 'push'); };
      const show = (n) => {
        i = Math.max(0, Math.min(ONB.length - 1, n));
        track.style.transform = `translateX(${-i * 100}%)`;
        slides.forEach((s, k) => { s.classList.toggle('current', k === i); });
        dots.forEach((d, k) => d.classList.toggle('on', k === i));
        next.textContent = i === ONB.length - 1 ? 'Commencer' : 'Suivant';
      };
      next.addEventListener('click', () => (i === ONB.length - 1 ? finish() : show(i + 1)));
      el.querySelector('[data-skip]').addEventListener('click', finish);
      let x0 = null, dx = 0;
      track.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; track.style.transition = 'none'; }, { passive: true });
      track.addEventListener('touchmove', (e) => { if (x0 == null) return; dx = e.touches[0].clientX - x0; track.style.transform = `translateX(calc(${-i * 100}% + ${dx * 0.9}px))`; }, { passive: true });
      track.addEventListener('touchend', () => { track.style.transition = ''; if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1)); else show(i); x0 = null; dx = 0; });
    }
  };

  /* ---------- Connexion ---------- */
  routes.login = {
    cls: 'full',
    render: () => `
      <div class="login-head">
        <div class="wordmark">restock</div>
        ${coco('wave', 190, { steam: 'rgba(255,255,255,.75)' })}
        <div class="bubble">Salut chef ! 👋</div>
      </div>
      <div class="login-body stagger">
        <h1>Bonjour chef !</h1>
        <p class="page-sub">Connecte-toi avec l'e-mail de ton restaurant pour retrouver ton stock.</p>
        <form class="field" novalidate data-form>
          <label for="email">E-mail</label>
          <input id="email" type="email" inputmode="email" autocomplete="email" placeholder="toi@restaurant.fr" value="${esc(S.get('lastEmail', ''))}">
          <span class="err" aria-live="polite"></span>
          <button class="btn btn-primary press ripple-host" style="margin-top:10px" type="submit">Continuer</button>
        </form>
        <div class="or">ou</div>
        <button class="btn btn-dark press ripple-host" data-google><span class="g-ico">${G_LOGO}</span>Continuer avec Google</button>
        <p style="text-align:center;font-size:13px;color:var(--ink-2);margin:18px 0 0">Tes données restent privées à ton restaurant.<br>
        <button class="link press" data-settings style="margin-top:8px;display:inline-flex;align-items:center;gap:6px">${ic('link')}<span>${DB.mode === 'live' ? 'Connecté à Airtable' : 'Connexion Airtable'}</span></button></p>
      </div>`,
    mount: (el) => {
      const form = el.querySelector('[data-form]'); const input = el.querySelector('#email'); const err = el.querySelector('.err'); const btn = form.querySelector('button');
      const enter = (user) => {
        S.set('user', user); haptic(20);
        const head = el.querySelector('.login-head .coco'); head.classList.remove('wave'); head.classList.add('joy');
        setTimeout(() => go('/home', 'push'), 650);
      };
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const v = input.value.trim();
        form.classList.remove('error'); void form.offsetWidth;
        if (!/^\S+@\S+\.\S+$/.test(v)) { form.classList.add('error'); err.textContent = 'Entre une adresse e-mail valide.'; haptic(30); return; }
        err.textContent = ''; S.set('lastEmail', v);
        try {
          const u = await btnLoading(btn, DB.checkUser(v));
          if (!u) { form.classList.add('error'); err.textContent = "Cet e-mail n'est pas dans l'équipe du restaurant (table Utilisateurs)."; haptic(30); return; }
          btnDone(btn, 'Bienvenue ' + clean(u.name).split(' ')[0]); enter(Object.assign({ email: v }, u));
        } catch (e2) { fail(e2); }
      });
      el.querySelector('[data-google]').addEventListener('click', (e) => {
        const b = e.currentTarget;
        if (input.value.trim()) { form.requestSubmit(); return; }
        input.focus(); err.textContent = "Saisis l'e-mail Google du restaurant, je vérifie qu'il fait partie de l'équipe."; b.classList.add('is-pressed'); setTimeout(() => b.classList.remove('is-pressed'), 200);
      });
      el.querySelector('[data-settings]').addEventListener('click', openAirtableSettings);
    }
  };

  /* ---------- Réglages Airtable (tiroir) ---------- */
  function openAirtableSettings() {
    const has = !!S.get('token', '');
    sheet(`<h3>Connexion Airtable</h3>
      <p class="page-sub" style="margin-top:4px">Colle ici ton jeton personnel Airtable (droits lecture + écriture sur la base Restock). Il reste uniquement sur cet appareil.</p>
      <div class="field"><label for="tok">Jeton (commence par « pat »)</label><input id="tok" type="password" autocomplete="off" placeholder="pat…" value="${has ? '••••••••••••' : ''}"><span class="err"></span></div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:12px;font-size:14px;color:var(--ink-2)">${DB.mode === 'live' && !DB.error ? pill('ok', 'Connecté') : DB.error ? pill('crit', 'Erreur') : pill('draft', 'Mode démo')}<span style="flex:1">${DB.error ? esc(DB.error) : DB.mode === 'live' ? 'Les données viennent de ta base.' : 'Données de démo de L\'Entrecôte.'}</span></div>
      <div class="btn-row" style="margin-top:18px">${has ? '<button class="btn btn-ghost press" data-off>Mode démo</button>' : ''}<button class="btn btn-primary press ripple-host" data-save>Connecter</button></div>`,
    (sh, close) => {
      const inp = sh.querySelector('#tok'); const err = sh.querySelector('.err');
      inp.addEventListener('focus', () => { if (inp.value.startsWith('•')) inp.value = ''; });
      sh.querySelector('[data-save]').addEventListener('click', async (e) => {
        const v = inp.value.trim();
        if (!/^pat\w{10,}/.test(v)) { err.textContent = 'Ce jeton ne ressemble pas à un jeton Airtable (pat…).'; inp.parentElement.classList.add('error'); return; }
        await btnLoading(e.currentTarget, DB.setToken(v));
        if (DB.error) { err.textContent = 'Connexion refusée : ' + DB.error; S.del('token'); DB.mode = 'demo'; return; }
        close(); toast('Connecté à ta base Airtable'); render({ silent: true });
      });
      const off = sh.querySelector('[data-off]');
      off && off.addEventListener('click', async () => { await DB.setToken(''); close(); toast('Mode démo activé', 'info'); render({ silent: true }); });
    });
  }

  /* ---------- Accueil ---------- */
  routes.home = {
    tab: 'home', auth: true, live: true, ptr: true,
    render: () => {
      const user = S.get('user', {}) || {};
      const head = `<div class="topbar"><span class="wordmark"><b>re</b>stock</span><div style="display:flex;gap:8px">
        <button class="icon-btn press bell-ring" data-go="/alerts" aria-label="Alertes">${ic('bell')}${DB.ready && DB.products.some((p) => DB.level(p) !== 'ok') ? '<span class="badge-dot"></span>' : ''}</button>
        <button class="avatar press" data-go="/profile" aria-label="Profil" style="border:0">${esc(DB.restaurant.initials || 'LE')}</button></div></div>
        <div style="margin-top:14px"><span style="font-size:14px;color:var(--ink-2)">${todayLong()}</span><h1 class="page-title" style="margin-top:2px;font-size:27px">${greeting()}, ${esc(clean(DB.restaurant.name).replace(/ Nantes$/, ''))}</h1></div>`;
      if (!DB.ready) return head + `<div style="margin-top:18px" class="skeleton" ><div style="height:170px"></div></div><div class="stats">${'<div class="skeleton" style="height:76px;border-radius:20px"></div>'.repeat(4)}</div><div style="margin-top:24px">${skeletonList(3)}</div>`;
      const low = DB.products.filter((p) => DB.level(p) !== 'ok');
      const notOrdered = low.filter((p) => !DB.inOrder(p));
      const drafts = DB.orders.filter((o) => o.status === 'Brouillon');
      const toValidate = DB.bons.filter((b) => b.status === 'À valider');
      const today = todayIdx();
      const deliveries = DB.suppliers.filter((s) => parseDays(s.days).includes(today) && DB.orders.some((o) => o.supplierId === s.id && o.status === 'Envoyée'));
      const heroTitle = low.length === 0 ? `Tout est au-dessus du seuil<br><em>bon service !</em>`
        : notOrdered.length === 0 ? `${low.length} produit${low.length > 1 ? 's' : ''} sous le seuil<br><em>tous déjà en commande</em>`
          : `${notOrdered.length} produit${notOrdered.length > 1 ? 's' : ''} à recommander<br><em>avant le service de midi</em>`;
      const stat = (n, label, icon, bg, fg, go) => `<button class="card stat press ripple-host" data-go="${go}"><span class="ico" style="background:${bg};color:${fg}">${ic(icon)}</span><span><strong class="num" data-count="${n}">${n}</strong><span>${label}</span></span></button>`;
      return `${head}
        ${DB.error ? `<div class="card card-pad" style="margin-top:14px;display:flex;gap:10px;align-items:center;font-size:14px;border-color:var(--low)">${ic('warn')}<span style="flex:1">Airtable injoignable, données de démo affichées.</span><button class="link" data-airtable>Réglages</button></div>` : ''}
        <div class="stagger" style="margin-top:18px">
          <div class="hero">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;position:relative">
              <div><div style="font-size:13px;color:var(--ink-2)">Alerte de ${S.get('alertTime', '07:00').replace(':', ' h ')}</div><div class="hero-title" style="margin-top:4px">${heroTitle}</div></div>
              ${notOrdered.length ? pill('sent new', 'Nouveau') : pill('ok', 'OK')}
            </div>
            <div class="btn-row" style="position:relative">
              <button class="btn btn-primary btn-sm press ripple-host" data-go="/alerts">Voir les alertes</button>
              <button class="btn btn-ghost btn-sm press ripple-host" data-go="/orders">${drafts.length} commande${drafts.length > 1 ? 's' : ''} prête${drafts.length > 1 ? 's' : ''}</button>
            </div>
          </div>
          <div class="stats">
            ${stat(DB.products.length, 'Produits suivis', 'box', '#FDEEE4', '#C94A0C', '/stock')}
            ${stat(toValidate.length, 'Bon' + (toValidate.length > 1 ? 's' : '') + ' à valider', 'receipt', '#FFF4D6', '#7A4B00', toValidate[0] ? '/validate/' + toValidate[0].id : '/bons')}
            ${stat(drafts.length, 'Commande' + (drafts.length > 1 ? 's' : '') + ' brouillon', 'clip', '#F3EEE8', '#1F1410', '/orders')}
            ${stat(deliveries.length, 'Livraison' + (deliveries.length > 1 ? 's' : '') + " aujourd'hui", 'truck', '#EAF4EE', '#1E5C38', '/suppliers')}
          </div>
          <div>
            <div class="section-head"><h2>Dernières livraisons</h2><a href="#/bons">Tout voir</a></div>
            <div class="list">${DB.bons.slice(0, 4).map((b) => { const s = DB.supplier(b.supplierId); return `<button class="row press-soft ripple-host" data-bon="${b.id}">${supAvatar(s, 38)}<span class="grow"><span class="title">${esc(clean(s ? s.name : 'Bon n° ' + b.ref))}</span><span class="meta">${dayLabel(b.date)} · ${b.lineCount} ligne${b.lineCount > 1 ? 's' : ''}</span></span>${bonPill(b.status)}</button>`; }).join('') || '<div class="empty">Aucun bon pour l\'instant.</div>'}</div>
          </div>
        </div>`;
    },
    mount: (el) => { bindLinks(el); bindBons(el); const a = el.querySelector('[data-airtable]'); a && a.addEventListener('click', openAirtableSettings); }
  };
  function bindBons(el) {
    el.querySelectorAll('[data-bon]').forEach((b) => b.addEventListener('click', () => {
      const bon = DB.bon(b.dataset.bon);
      if (!bon) return;
      if (bon.status === 'À valider') go('/validate/' + bon.id);
      else if (bon.status === 'À lire') go('/reading/' + bon.id);
      else if (bon.status === 'Erreur') toast("Ce bon n'a pas pu être lu : reprends-le en photo.", 'warn');
      else go('/validate/' + bon.id);
    }));
  }

  /* ---------- Alertes (notifications) ---------- */
  // Récapitulatif de ce qui vient d'être ajouté aux commandes, avec un lien direct
  function addedSheet(items) {
    const bySup = {};
    items.forEach((it) => { const p = DB.product(it.id); if (!p) return; (bySup[p.supplierId] = bySup[p.supplierId] || []).push({ p, colis: it.colis }); });
    sheet(`<div style="display:flex;gap:12px;align-items:center"><div style="flex:none">${coco('joy', 56)}</div><div><h3>Ajouté aux commandes</h3><div style="font-size:13px;color:var(--ink-2)">${items.length} produit${items.length > 1 ? 's' : ''} · ${Object.keys(bySup).length} fournisseur${Object.keys(bySup).length > 1 ? 's' : ''}</div></div></div>
      <div class="stack-cards" style="margin-top:14px">${Object.entries(bySup).map(([sid, list]) => { const s = DB.supplier(sid); return `<div class="list"><div class="row" style="background:var(--neutral-bg)">${supAvatar(s, 30)}<span class="grow"><span class="title">${esc(clean(s && s.name))}</span></span></div>${list.map((x) => `<div class="row"><span class="grow"><span class="title">${esc(x.p.name)}</span></span><b class="num">+${x.colis} colis</b></div>`).join('')}</div>`; }).join('')}</div>
      <button class="btn btn-primary press ripple-host" style="margin-top:16px" data-see>${ic('clip')}Voir les commandes</button>`,
    (sh, close) => sh.querySelector('[data-see]').addEventListener('click', () => { close(); ordersTab = 'Brouillon'; go('/orders'); }));
  }

  routes.alerts = {
    auth: true, live: true, cls: 'no-nav',
    render: () => {
      const low = DB.products.filter((p) => DB.level(p) !== 'ok').sort((a, b) => a.qty / a.seuil - b.qty / b.seuil);
      const notOrdered = low.filter((p) => !DB.inOrder(p));
      const drafts = DB.orders.filter((o) => o.status === 'Brouillon');
      const hour = S.get('alertTime', '07:00').replace(':', ' h ');
      return `<div class="back-row">${backBtn()}<span class="pill draft"><i></i>Aujourd'hui · ${low.length}</span></div>
        <h1 class="page-title">Alertes</h1>
        <div class="stagger">
          <div class="card card-pad" style="display:flex;gap:14px;align-items:center;margin-top:14px">
            <div style="flex:none">${coco(low.length ? 'worry' : 'joy', 64)}</div>
            <div style="font-size:14.5px;line-height:1.45"><b>Récap envoyé à ${hour}</b><br><span style="color:var(--ink-2)">par e-mail à l'équipe de cuisine</span></div>
          </div>
          <div class="section-head"><h2>Sous le seuil d'alerte</h2></div>
          <div class="stack-cards alert-grid">${low.map((p) => {
            const lv = DB.level(p); const s = DB.supplier(p.supplierId); const colis = Math.max(1, DB.toOrderColis(p)); const inO = DB.inOrder(p);
            return `<div class="card card-pad alert-card" data-p="${p.id}">
              <button class="alert-head press-soft" data-go="/product/${p.id}"><div style="min-width:0;flex:1;text-align:left"><div style="font-weight:700;font-size:16px">${esc(p.name)}</div><div style="font-size:13px;color:var(--ink-2)">${esc(clean(s && s.name))}</div></div>${levelPill(lv)}${ic('chev', 'chev')}</button>
              <div style="display:flex;align-items:baseline;gap:6px;margin-top:8px"><b class="num" style="font-size:24px">${nf(p.qty)}</b><span style="color:var(--ink-2)">${unitLabel(p.unit, p.qty)} en stock</span></div>
              <div class="alert-seuil"><span>Seuil d'alerte</span><div class="stepper sm"><button data-sd="-1" aria-label="Baisser le seuil">${ic('minus')}</button><output class="num" data-so>${qtyStr(p.seuil, p.unit)}</output><button data-sd="1" aria-label="Monter le seuil">${ic('plus')}</button></div></div>
              ${inO ? `<button class="btn btn-ghost btn-sm press" style="margin-top:12px" data-go="/orders">${ic('check')}Déjà en commande · voir</button>`
                : `<button class="btn btn-primary btn-sm press ripple-host" style="margin-top:12px" data-order="${colis}">${ic('plus')}Commander ${colis} colis</button>`}
            </div>`;
          }).join('') || `<div class="empty">${coco('joy', 90)}<b>Rien sous le seuil</b>Coco veille sur ton stock.</div>`}</div>
          ${low.length ? `<div class="ia-banner">${ic('spark')}<span>${notOrdered.length ? `${notOrdered.length} produit${notOrdered.length > 1 ? 's' : ''} pas encore en commande.` : 'Restock a déjà préparé les commandes, une par fournisseur.'}</span></div>
          <div style="margin-top:16px">${notOrdered.length > 1 ? `<button class="btn btn-primary press ripple-host" data-prepare>Tout commander (${notOrdered.length} produits)</button>` : `<button class="btn btn-ghost press ripple-host" data-go="/orders">Relire les ${drafts.length} commande${drafts.length > 1 ? 's' : ''}</button>`}</div>` : ''}
        </div>`;
    },
    mount: (el) => {
      bindBack(el); bindLinks(el);
      el.querySelectorAll('[data-p]').forEach((card) => {
        const p = DB.product(card.dataset.p); if (!p) return;
        let val = p.seuil, pending = null; const out = card.querySelector('[data-so]');
        const step = p.seuil >= 20 ? 5 : p.seuil >= 4 ? 1 : 0.5;
        card.querySelectorAll('[data-sd]').forEach((b) => b.addEventListener('click', () => {
          val = Math.max(0, Math.round((val + step * Number(b.dataset.sd)) * 10) / 10);
          out.textContent = qtyStr(val, p.unit); haptic(6);
          clearTimeout(pending);
          pending = setTimeout(() => DB.setSeuil(p.id, val).then(() => toast('Seuil de ' + esc(p.name) + ' : ' + qtyStr(val, p.unit))).catch(fail), 700);
        }));
        const ob = card.querySelector('[data-order]');
        ob && ob.addEventListener('click', async () => {
          const colis = Number(ob.dataset.order);
          try { await btnLoading(ob, DB.addToOrder(p.id, colis)); haptic(20); addedSheet([{ id: p.id, colis }]); render({ silent: true }); } catch (e) { fail(e); }
        });
      });
      const b = el.querySelector('[data-prepare]');
      b && b.addEventListener('click', async () => {
        const list = DB.products.filter((p) => DB.level(p) !== 'ok' && !DB.inOrder(p)).map((p) => ({ id: p.id, colis: Math.max(1, DB.toOrderColis(p)) }));
        try {
          await btnLoading(b, (async () => { for (const it of list) await DB.addToOrder(it.id, it.colis); })());
          confetti(); addedSheet(list);
        } catch (e) { fail(e); }
      });
    }
  };

  /* ---------- Stock ---------- */
  let stockState = { filter: 'Tous', q: '' };
  routes.stock = {
    tab: 'stock', auth: true, live: true, ptr: true,
    render: () => {
      const cats = [...new Set(DB.products.map((p) => p.cat))].sort((a, b) => a.localeCompare(b, 'fr'));
      const filters = ['Tous', 'À recommander', ...cats];
      const lowCount = DB.products.filter((p) => DB.level(p) !== 'ok').length;
      return `<div class="topbar"><h1 class="page-title" style="margin:0">Stock</h1><button class="btn btn-ghost btn-sm press" style="width:auto" data-new>${ic('plus')}Produit</button></div>
        <label class="search ${stockState.q ? 'has-value' : ''}">${ic('search')}<input type="search" placeholder="Rechercher un produit" value="${esc(stockState.q)}" aria-label="Rechercher un produit"><button class="clear press" aria-label="Effacer" type="button">${ic('x')}</button></label>
        <div class="chips" role="tablist">${filters.map((f) => `<button class="chip ${f === stockState.filter ? 'active' : ''}" data-f="${esc(f)}" role="tab" aria-selected="${f === stockState.filter}">${esc(f)}${f === 'À recommander' && lowCount ? `<span class="count">${lowCount}</span>` : ''}</button>`).join('')}</div>
        <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--ink-2);margin:16px 2px 8px"><span data-count-label></span><span>Trié par urgence</span></div>
        <div data-list>${DB.ready ? '' : skeletonList(7)}</div>`;
    },
    mount: (el) => {
      const list = el.querySelector('[data-list]'); const input = el.querySelector('input'); const box = el.querySelector('.search'); const label = el.querySelector('[data-count-label]');
      const draw = (animate) => {
        if (!DB.ready) return;
        const q = stockState.q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        const order = { crit: 0, low: 1, ok: 2 };
        const items = DB.products
          .filter((p) => stockState.filter === 'Tous' || (stockState.filter === 'À recommander' ? DB.level(p) !== 'ok' : p.cat === stockState.filter))
          .filter((p) => !q || p.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q))
          .sort((a, b) => order[DB.level(a)] - order[DB.level(b)] || a.qty / a.seuil - b.qty / b.seuil);
        label.textContent = items.length + ' produit' + (items.length > 1 ? 's' : '');
        list.innerHTML = items.length ? `<div class="list ${animate ? 'stagger' : ''}">${items.map(productRow).join('')}</div><p class="hint-swipe">Glisse un produit vers la gauche pour le retirer du stock.</p>` : `<div class="empty">${coco('read', 80)}<b>Aucun produit trouvé</b>Essaie un autre mot.</div>`;
        bindLinks(list); swipeToDelete(list);
      };
      draw(!el.classList.contains('quiet'));
      el.querySelector('[data-new]').addEventListener('click', () => openNewProduct({}, (p) => go('/product/' + p.id)));
      input.addEventListener('input', () => { stockState.q = input.value; box.classList.toggle('has-value', !!input.value); draw(false); });
      box.querySelector('.clear').addEventListener('click', (e) => { e.preventDefault(); input.value = ''; stockState.q = ''; box.classList.remove('has-value'); draw(true); input.focus(); });
      el.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => {
        stockState.filter = c.dataset.f;
        el.querySelectorAll('.chip').forEach((x) => { const on = x === c; x.classList.toggle('active', on); x.setAttribute('aria-selected', on); });
        c.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        draw(true);
      }));
    }
  };

  /* ---------- Fiche produit ---------- */
  routes.product = {
    auth: true, live: true, cls: 'no-nav',
    render: (id) => {
      const p = DB.product(id);
      if (!p) return DB.ready ? `<div class="back-row">${backBtn()}</div><div class="empty">Produit introuvable.</div>` : `<div class="back-row">${backBtn()}</div>${skeletonList(4)}`;
      const s = DB.supplier(p.supplierId); const lv = DB.level(p);
      const max = Math.max(p.seuil * 2, p.qty * 1.1, 1); const k = Math.min(1, p.qty / max); const ks = Math.min(1, p.seuil / max);
      const L = 283; // longueur de l'arc
      const col = lv === 'crit' ? '#C62828' : lv === 'low' ? '#E0A800' : '#2F7D4F';
      const colis = Math.max(1, DB.toOrderColis(p) || Math.ceil((p.conso * 7) / p.cond));
      const sAng = Math.PI * (1 - ks); const sx = 115 + 90 * Math.cos(sAng); const sy = 115 - 90 * Math.sin(sAng);
      return `<div class="back-row">${backBtn()}<button class="btn btn-ghost btn-sm press" style="width:auto" data-adjust>${ic('sliders')}Ajuster</button></div>
        <div class="stagger">
          <div style="margin-top:14px"><div class="eyebrow" style="color:var(--orange-deep)">${esc(p.cat)} · ${esc(clean(s && s.name))}</div><h1 class="page-title" style="margin-top:4px">${esc(p.name)}</h1></div>
          <div class="card" style="margin-top:16px;padding:18px 16px 16px">
            <div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:14px;color:var(--ink-2)">En stock</span>${levelPill(lv)}</div>
            <div class="gauge-wrap"><svg viewBox="0 0 230 130"><path d="M25 115a90 90 0 0 1 180 0" fill="none" stroke="#F3EEE8" stroke-width="16" stroke-linecap="round"/><path class="gauge-arc" d="M25 115a90 90 0 0 1 180 0" fill="none" stroke="${col}" stroke-width="16" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="${L}" data-to="${L * (1 - k)}"/><circle cx="${sx}" cy="${sy}" r="5" fill="#fff" stroke="#2A1C16" stroke-width="2.5"/></svg>
              <div class="gauge-center"><strong class="num"><span data-count="${p.qty}">${nf(p.qty)}</span> <small style="font-size:20px">${esc(unitLabel(p.unit, p.qty))}</small></strong><span>Seuil ${qtyStr(p.seuil, p.unit)}</span></div></div>
          </div>
          <div class="card card-pad" style="margin-top:12px;display:flex;align-items:center;justify-content:space-between;gap:12px">
            <div><div style="font-weight:700">Seuil d'alerte</div><div style="font-size:13px;color:var(--ink-2)">Alerte à 7 h en dessous</div></div>
            <div class="stepper"><button data-seuil="-1" aria-label="Baisser le seuil">${ic('minus')}</button><output class="num" data-seuil-out>${qtyStr(p.seuil, p.unit)}</output><button data-seuil="1" aria-label="Monter le seuil">${ic('plus')}</button></div>
          </div>
          <div class="kv"><div class="card"><small>Prix</small><b>${euro(p.price)} / ${esc(p.unit)}</b></div><div class="card"><small>Conso / sem.</small><b>≈ ${qtyStr(Math.round(p.conso * 7 * 10) / 10, p.unit)}</b></div><div class="card"><small>Colis</small><b>${nf(p.cond)} ${esc(unitLabel(p.unit, p.cond))}</b></div></div>
          <div><div class="section-head"><h2>Mouvements récents</h2><span style="font-size:13px;color:var(--ink-2)">Livre : ${esc(s ? s.days : '—')}</span></div><div data-moves>${skeletonList(3)}</div></div>
          <div class="sticky-foot">${DB.inOrder(p) ? `<button class="btn btn-ghost press ripple-host" data-go="/orders">${ic('clip')}Déjà en commande · voir</button>` : `<button class="btn btn-primary press ripple-host" data-order>Ajouter ${colis} colis à la commande</button>`}</div>
        </div>`;
    },
    mount: (el, id) => {
      const p = DB.product(id); bindBack(el); bindLinks(el);
      if (!p) return;
      requestAnimationFrame(() => setTimeout(() => { const a = el.querySelector('.gauge-arc'); if (a) a.style.strokeDashoffset = a.dataset.to; }, el.classList.contains('quiet') ? 0 : 250));
      const out = el.querySelector('[data-seuil-out]');
      let pending = null; let val = p.seuil;
      const step = p.seuil >= 20 ? 5 : p.seuil >= 4 ? 1 : 0.5;
      el.querySelectorAll('[data-seuil]').forEach((b) => b.addEventListener('click', () => {
        val = Math.max(0, Math.round((val + step * Number(b.dataset.seuil)) * 10) / 10);
        out.textContent = qtyStr(val, p.unit); out.classList.remove('bump'); void out.offsetWidth; out.classList.add('bump');
        clearTimeout(pending);
        pending = setTimeout(() => DB.setSeuil(p.id, val).then(() => toast('Seuil enregistré : ' + qtyStr(val, p.unit))).catch(fail), 900);
      }));
      DB.getMoves(id).then((moves) => {
        const box = el.querySelector('[data-moves]'); if (!box) return;
        box.innerHTML = moves.length ? `<div class="list stagger">${moves.slice(0, 6).map((m) => {
          const plus = m.qty >= 0; const lab = m.type === 'Entrée' ? (m.origin === 'Bon de réception' ? 'Livraison' : 'Entrée') : m.type === 'Sortie' ? 'Sortie cuisine' : 'Inventaire corrigé';
          return `<div class="row move"><span class="m-ico" style="background:${plus ? 'var(--ok-bg)' : 'var(--neutral-bg)'};color:${plus ? 'var(--ok)' : 'var(--ink-2)'}">${ic(m.type === 'Inventaire' ? 'clip' : plus ? 'arrowIn' : 'arrowOut')}</span><span class="grow"><span class="title">${lab}</span><span class="meta">${dayLabel(m.date)} · ${esc(m.origin)}</span></span><span class="sign num ${plus ? 'plus' : 'minus'}">${plus ? '+' : '−'}${qtyStr(Math.abs(m.qty), p.unit)}</span></div>`;
        }).join('')}</div>` : '<div class="card empty" style="padding:20px">Aucun mouvement enregistré.</div>';
      }).catch((e) => { const box = el.querySelector('[data-moves]'); if (box) box.innerHTML = `<div class="card empty" style="padding:20px">${esc(e.message)}</div>`; });
      const ob = el.querySelector('[data-order]');
      ob && ob.addEventListener('click', async () => {
        const colis = Math.max(1, DB.toOrderColis(p) || Math.ceil((p.conso * 7) / p.cond));
        try { await btnLoading(ob, DB.addToOrder(p.id, colis)); haptic(20); toast(`${colis} colis ajouté${colis > 1 ? 's' : ''} · ${esc(clean(DB.supplier(p.supplierId).name))}`); }
        catch (e) { fail(e); }
      });
      el.querySelector('[data-adjust]').addEventListener('click', () => openAdjust(p));
    }
  };
  function openAdjust(p) {
    let mode = 'Sortie'; let qty = Math.max(1, Math.round(p.conso));
    sheet(`<h3>Ajuster le stock</h3><p class="page-sub" style="margin-top:4px">${esc(p.name)} · ${qtyStr(p.qty, p.unit)} en stock</p>
      <div class="tabs" data-tabs style="grid-template-columns:repeat(2,1fr)"><span class="tab-indicator" style="width:calc(50% - 4px)"></span><button class="tab active" data-m="Sortie">Sortie cuisine</button><button class="tab" data-m="Inventaire">Inventaire</button></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:18px"><span data-hint style="color:var(--ink-2);font-size:14px">Quantité utilisée</span><div class="stepper"><button data-d="-1">${ic('minus')}</button><output class="num" data-q>${qtyStr(qty, p.unit)}</output><button data-d="1">${ic('plus')}</button></div></div>
      <button class="btn btn-primary press ripple-host" style="margin-top:20px" data-ok>Enregistrer</button>`,
    (sh, close) => {
      const out = sh.querySelector('[data-q]'); const hint = sh.querySelector('[data-hint]'); const ind = sh.querySelector('.tab-indicator');
      const draw = () => { out.textContent = qtyStr(qty, p.unit); out.classList.remove('bump'); void out.offsetWidth; out.classList.add('bump'); };
      sh.querySelectorAll('[data-m]').forEach((t, i) => t.addEventListener('click', () => {
        mode = t.dataset.m; sh.querySelectorAll('[data-m]').forEach((x) => x.classList.toggle('active', x === t));
        ind.style.transform = `translateX(${i * 100}%)`;
        hint.textContent = mode === 'Sortie' ? 'Quantité utilisée' : 'Quantité comptée'; qty = mode === 'Sortie' ? Math.max(1, Math.round(p.conso)) : p.qty; draw();
      }));
      sh.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => { const st = p.unit === 'kg' || p.unit === 'L' ? (qty < 5 ? 0.5 : 1) : 1; qty = Math.max(0, Math.round((qty + st * Number(b.dataset.d)) * 10) / 10); draw(); }));
      sh.querySelector('[data-ok]').addEventListener('click', async (e) => {
        const delta = mode === 'Sortie' ? -qty : Math.round((qty - p.qty) * 10) / 10;
        if (!delta) { close(); return; }
        try { await btnLoading(e.currentTarget, DB.addMove(p.id, delta, mode)); close(); toast(mode === 'Sortie' ? 'Sortie enregistrée' : 'Inventaire corrigé'); } catch (err) { fail(err); }
      });
    });
  }

  /* ---------- Scanner un bon ---------- */
  routes.scan = {
    tab: null, auth: true, cls: 'no-nav',
    render: () => {
      const recent = DB.bons.slice(0, 5);
      return `<div class="back-row">${backBtn('Fermer')}<span></span></div>
        <h1 class="page-title">Scanner un bon</h1>
        <p class="page-sub">Prends le bon de livraison en photo : Restock lit les produits et met le stock à jour.</p>
        <div class="scan-zone">
          <div class="scan-frame"></div><span class="scan-corner tl"></span><span class="scan-corner tr"></span><span class="scan-corner bl"></span><span class="scan-corner br"></span>
          <div class="scan-line"></div>
          <label class="scan-cta press"><input type="file" accept="image/*" capture="environment" hidden data-file><span class="shutter">${ic('camera')}</span><strong>Prendre la photo</strong><span>ou <u data-pick>choisir une image</u></span></label>
          <input type="file" accept="image/*" hidden data-file2>
        </div>
        ${DB.mode === 'demo' ? '<p style="font-size:13px;color:var(--ink-2);text-align:center;margin:10px 0 0">Mode démo : n\'importe quelle photo lance une lecture simulée.</p>' : ''}
        <div class="section-head"><h2 class="eyebrow" style="font-size:12.5px">Historique des bons</h2><a href="#/bons">Tout voir</a></div>
        <div class="list stagger">${recent.map((b) => { const s = DB.supplier(b.supplierId); return `<button class="row press-soft ripple-host" data-bon="${b.id}"><span class="grow"><span class="title">${esc(clean(s ? s.name : 'Bon n° ' + b.ref))}</span><span class="meta">${dayLabel(b.date)} · ${b.lineCount} ligne${b.lineCount > 1 ? 's' : ''}</span></span>${bonPill(b.status)}</button>`; }).join('')}</div>`;
    },
    mount: (el) => {
      bindBack(el); bindBons(el);
      const f1 = el.querySelector('[data-file]'); const f2 = el.querySelector('[data-file2]');
      el.querySelector('[data-pick]').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); f2.click(); });
      const onFile = async (input) => {
        const file = input.files && input.files[0]; if (!file) return;
        const fl = document.createElement('div'); fl.className = 'flash'; app.appendChild(fl); setTimeout(() => fl.remove(), 600); haptic(25);
        S.set('lastPhoto', null);
        try { const url = URL.createObjectURL(file); window.__lastPhoto = url; } catch (e) {}
        const cta = el.querySelector('.scan-cta'); cta.innerHTML = `<span class="shutter" style="animation:none">${ic('refresh', 'spin')}</span><strong>Envoi du bon…</strong><span>${DB.mode === 'live' ? 'vers Airtable' : 'préparation'}</span>`;
        cta.querySelector('svg').style.animation = 'spin 1s linear infinite';
        try { const bon = await DB.createBon(file); go('/reading/' + bon.id, 'push'); }
        catch (e) { fail(e); render({ silent: true }); }
      };
      f1.addEventListener('change', () => onFile(f1)); f2.addEventListener('change', () => onFile(f2));
    }
  };

  /* ---------- Lecture IA du bon (attente de Make) ---------- */
  routes.reading = {
    auth: true, cls: 'no-nav',
    render: (id) => {
      const bon = DB.bon(id); const s = bon && DB.supplier(bon.supplierId);
      const photo = window.__lastPhoto;
      return `<div class="reading">
        <div class="back-row">${backBtn()}<span class="pill ia"><i></i>Lecture IA</span></div>
        <div style="position:relative;margin-top:14px">
          ${photo ? `<div class="paper" style="padding:0;height:210px"><img src="${photo}" alt="Photo du bon" style="width:100%;height:100%;object-fit:cover;display:block"><div class="laser"></div></div>`
            : `<div class="paper"><div class="laser"></div><div class="p-head">${esc((clean(s && s.name) || 'Bon de livraison').toUpperCase())}</div><div class="p-sub">BL n° ${bon ? bon.ref : '…'} · ${new Date().toLocaleDateString('fr-FR')}</div>
              ${['', '', '', ''].map((_, i) => `<div class="p-line" data-pl="${i}"><span class="skeleton" style="height:9px;width:${50 + i * 9}%;display:inline-block"></span><span class="skeleton" style="height:9px;width:34px;display:inline-block"></span></div>`).join('')}
              <div class="p-total"><span>Total HT</span><span>…</span></div></div>`}
          <div style="position:absolute;right:6px;bottom:-34px">${coco('read', 110)}</div>
        </div>
        <h2 style="margin:44px 0 0;font-size:22px">Coco lit votre bon…</h2>
        <p class="page-sub" style="margin-top:4px" data-sub>Quelques secondes, restez sur l'écran.</p>
        <div class="progress"><i data-prog style="width:8%"></i></div>
        <div class="steps">
          <div class="card step active" data-st="0"><span class="s-ico"></span><span class="grow"><small>Photo envoyée</small><b>${DB.mode === 'live' ? 'Dans Airtable' : 'Bon reçu'}</b></span></div>
          <div class="card step" data-st="1"><span class="s-ico"></span><span class="grow"><small>Fournisseur reconnu</small><b data-sup>…</b></span></div>
          <div class="card step" data-st="2"><span class="s-ico"></span><span class="grow"><small>Lecture des lignes</small><b data-lines>…</b></span></div>
        </div>
        <div style="margin-top:auto;padding-top:20px" data-actions></div>
      </div>`;
    },
    mount: (el, id) => {
      bindBack(el);
      let alive = true; const t0 = Date.now();
      const prog = el.querySelector('[data-prog]'); const sub = el.querySelector('[data-sub]');
      const setStep = (n, ok) => { const st = el.querySelector(`[data-st="${n}"]`); if (!st) return; st.classList.toggle('active', !ok); st.classList.toggle('ok', !!ok); if (ok) st.querySelector('.s-ico').innerHTML = ic('check'); };
      setTimeout(() => { if (!alive) return; setStep(0, true); setStep(1, false); prog.style.width = '30%'; }, 900);
      const fakeLines = () => { el.querySelectorAll('[data-pl]').forEach((l, i) => setTimeout(() => alive && l.classList.add('hit'), i * 500)); };
      fakeLines();
      const tick = async () => {
        if (!alive) return;
        let bon;
        try { bon = await DB.refreshBon(id); } catch (e) { sub.textContent = e.message; }
        if (!alive) return;
        const elapsed = (Date.now() - t0) / 1000;
        prog.style.width = Math.min(90, 30 + elapsed * 3) + '%';
        if (bon && bon.supplierId) { setStep(1, true); setStep(2, false); el.querySelector('[data-sup]').textContent = clean(DB.supplier(bon.supplierId).name); }
        if (bon && bon.status === 'À valider') {
          prog.style.width = '100%'; setStep(1, true); setStep(2, true);
          el.querySelector('[data-lines]').textContent = bon.lineCount + ' ligne' + (bon.lineCount > 1 ? 's' : '') + ' lue' + (bon.lineCount > 1 ? 's' : '');
          el.querySelectorAll('[data-pl]').forEach((l) => { l.classList.remove('hit'); l.classList.add('done'); });
          const c = el.querySelector('.coco'); c.classList.remove('read'); c.classList.add('joy'); haptic(20);
          sub.textContent = 'Lecture terminée !';
          setTimeout(() => alive && go('/validate/' + id, 'push'), 1100);
          return;
        }
        if (bon && bon.status === 'Erreur') {
          setStep(2, false); sub.textContent = "Coco n'a pas réussi à lire ce bon (photo floue ?).";
          el.querySelector('.coco').classList.replace('read', 'worry');
          el.querySelector('[data-actions]').innerHTML = `<button class="btn btn-primary press ripple-host" data-go="/scan">Reprendre la photo</button>`; bindLinks(el);
          return;
        }
        if (elapsed > 25 && !el.querySelector('[data-actions] button')) {
          sub.innerHTML = "La lecture prend du temps. Vérifie que le scénario Make « Lecture IA du bon » tourne (Run once).";
          el.querySelector('[data-actions]').innerHTML = `<button class="btn btn-ghost press ripple-host" data-go="/home">Revenir plus tard</button>`; bindLinks(el);
        }
        setTimeout(tick, DB.mode === 'live' ? 3000 : 900);
      };
      setTimeout(tick, 1200);
      return () => { alive = false; };
    }
  };

  /* ---------- Validation des lignes ---------- */
  let valState = {};
  routes.validate = {
    auth: true, cls: 'no-nav',
    render: (id) => {
      const bon = DB.bon(id); const s = bon && DB.supplier(bon.supplierId);
      const readonly = bon && bon.status === 'Validé';
      return `<div class="back-row">${backBtn()}${bon ? bonPill(bon.status) : ''}</div>
        <h1 class="page-title" style="font-size:26px">Bon n° ${bon ? bon.ref : '…'}</h1>
        <p class="page-sub" style="margin-top:2px">${esc(clean(s && s.name) || 'Fournisseur à confirmer')} · ${bon ? dayLabel(bon.date) : ''}</p>
        <div data-body>${skeletonList(3)}</div>`;
    },
    mount: (el, id) => {
      bindBack(el);
      const bon = DB.bon(id); if (!bon) return;
      const readonly = bon.status === 'Validé';
      let lines = [];
      const body = el.querySelector('[data-body]');
      const total = () => lines.reduce((t, l) => { const p = l.productId && DB.product(l.productId); return t + (p ? l.qty * p.cond * p.price : 0); }, 0);
      const draw = () => {
        const flagged = lines.filter((l) => l.flag && !l.ok).length;
        const unknown = lines.filter((l) => !l.productId).length;
        body.innerHTML = `
          ${readonly ? '' : `<div class="ia-banner">${ic('spark')}<span>L'IA a lu <b>${lines.length} ligne${lines.length > 1 ? 's' : ''}</b>.${flagged ? ` ${flagged === 1 ? 'Une quantité semble inhabituelle' : flagged + ' quantités semblent inhabituelles'}, vérifie avant de valider.` : ''}${unknown ? ` ${unknown} produit${unknown > 1 ? 's' : ''} à associer.` : ''}${!flagged && !unknown ? ' Tout semble correct.' : ''}</span></div>`}
          <div class="stack-cards ${el.classList.contains('quiet') ? '' : 'stagger'}" style="margin-top:14px">${lines.map((l, i) => {
            const p = l.productId && DB.product(l.productId);
            const units = p ? l.qty * p.cond : 0;
            return `<div class="card line-card ${l.flag && !l.ok ? 'flag' : ''}" data-i="${i}">
              <div class="lc-top"><div style="min-width:0;flex:1"><div class="lc-name">${p ? esc(p.name) : '<span style="color:var(--crit-ink)">Produit non reconnu</span>'}</div><div class="lc-price">${esc(l.label)}${p ? ' · ' + euro(p.price) + ' / ' + esc(p.unit) : ''}</div></div>
              ${readonly ? `<b class="num">${nf(l.qty)} colis</b>` : `<div class="stepper"><button data-q="-1" aria-label="Moins">${ic('minus')}</button><output class="num">${nf(l.qty)} colis</output><button data-q="1" aria-label="Plus">${ic('plus')}</button></div>`}</div>
              ${p ? `<div style="font-size:13px;color:var(--ink-2);margin-top:8px">= <b style="color:var(--ink)">+${qtyStr(units, p.unit)}</b> en stock</div>` : readonly ? '' : `<button class="btn btn-ghost btn-sm press" style="margin-top:10px" data-assoc>${ic('link')}Associer à un produit</button> <button class="btn btn-primary btn-sm press" style="margin-top:10px" data-create>${ic('plus')}Créer ce produit</button>`}
              ${l.flag && !l.ok && !readonly ? `<div class="flag-note">${ic('warn')}<span style="flex:1">D'habitude ${l.usual} colis par livraison. Bien ${nf(l.qty)} ?</span><button class="link" data-okflag>Oui</button></div>` : ''}
            </div>`;
          }).join('')}</div>
          ${readonly ? '' : `<button class="btn btn-ghost press" style="margin-top:12px;border-style:dashed" data-add>${ic('plus')}Ajouter une ligne oubliée</button>`}
          <div class="sticky-foot">
            <div class="sum-row"><span>${lines.filter((l) => l.productId).length} produit${lines.filter((l) => l.productId).length > 1 ? 's' : ''} ${readonly ? 'mis' : 'ajoutés'} au stock</span><b class="num">${euro(total())} HT</b></div>
            ${readonly ? `<button class="btn btn-ghost press" data-back2>Retour</button>` : `<button class="btn btn-primary press ripple-host" data-validate ${lines.some((l) => l.productId) ? '' : 'disabled'}>Valider et mettre en stock</button>`}
          </div>`;
        el.classList.add('quiet');
        body.querySelectorAll('[data-i]').forEach((card) => {
          const l = lines[Number(card.dataset.i)];
          card.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => {
            l.qty = Math.max(0, l.qty + Number(b.dataset.q));
            if (l.qty === 0) { card.classList.add('removing'); haptic(15); setTimeout(() => { lines.splice(lines.indexOf(l), 1); draw(); }, 340); return; }
            const o = card.querySelector('output'); o.textContent = nf(l.qty) + ' colis'; o.classList.remove('bump'); void o.offsetWidth; o.classList.add('bump');
            const p = l.productId && DB.product(l.productId);
            if (p) { card.querySelector('div[style*="margin-top:8px"] b').textContent = '+' + qtyStr(l.qty * p.cond, p.unit); }
            if (l.flag && l.qty <= l.usual * 2) { l.ok = true; draw(); }
            body.querySelector('.sum-row b').textContent = euro(total()) + ' HT';
          }));
          const ok = card.querySelector('[data-okflag]'); ok && ok.addEventListener('click', () => { l.ok = true; haptic(10); draw(); });
          const as = card.querySelector('[data-assoc]'); as && as.addEventListener('click', () => pickProduct(bon.supplierId, (pid) => { l.productId = pid; draw(); }, false, { name: l.label }));
          const cr = card.querySelector('[data-create]'); cr && cr.addEventListener('click', () => openNewProduct({ supplierId: bon.supplierId, name: l.label }, (np) => { l.productId = np.id; draw(); }));
        });
        const add = body.querySelector('[data-add]');
        add && add.addEventListener('click', () => pickProduct(bon.supplierId, async (pid) => {
          try { const line = await DB.addBonLine(id, pid, 1); lines.push(line); draw(); toast('Ligne ajoutée'); } catch (e) { fail(e); }
        }));
        const b2 = body.querySelector('[data-back2]'); b2 && b2.addEventListener('click', () => back());
        const v = body.querySelector('[data-validate]');
        v && v.addEventListener('click', async () => {
          try {
            const entries = await btnLoading(v, DB.validateBon(id, lines));
            valState[id] = entries.map((e) => ({ name: e.p.name, units: e.units, unit: e.p.unit }));
            go('/done/' + id, 'push');
          } catch (e) { fail(e); }
        });
      };
      DB.getBonLines(id).then((ls) => { lines = ls.map((l) => Object.assign({}, l)); el.classList.remove('quiet'); draw(); }).catch((e) => { body.innerHTML = `<div class="empty">${esc(e.message)}</div>`; });
    }
  };
  function pickProduct(supplierId, cb, all0, pre) {
    const list = DB.products.filter((p) => !supplierId || p.supplierId === supplierId);
    const all = all0 ? DB.products : (list.length ? list : DB.products);
    sheet(`<h3>Choisir le produit</h3><label class="search" style="margin-top:12px">${ic('search')}<input placeholder="Rechercher"></label>
      <button class="btn btn-ghost press" style="margin-top:10px;border-style:dashed" data-new>${ic('plus')}Créer un nouveau produit</button><div class="list" style="margin-top:12px" data-pl>${all.map((p) => `<button class="row press-soft" data-pid="${p.id}"><span class="grow"><span class="title">${esc(p.name)}</span><span class="meta">Colis de ${nf(p.cond)} ${esc(unitLabel(p.unit, p.cond))}</span></span>${ic('chev', 'chev')}</button>`).join('')}</div>`,
      (sh, close) => {
        sh.querySelectorAll('[data-pid]').forEach((b) => b.addEventListener('click', () => { close(); cb(b.dataset.pid); }));
        sh.querySelector('[data-new]').addEventListener('click', () => { const q = sh.querySelector('input').value.trim(); close(); setTimeout(() => openNewProduct(Object.assign({ supplierId, name: q }, pre || {}), (p) => cb(p.id)), 280); });
        const inp = sh.querySelector('input');
        inp.addEventListener('input', () => { const q = inp.value.toLowerCase(); sh.querySelectorAll('[data-pid]').forEach((b) => (b.style.display = b.textContent.toLowerCase().includes(q) ? '' : 'none')); });
      });
  }

  /* ---------- Bon validé (succès) ---------- */
  routes.done = {
    auth: true, cls: 'no-nav',
    render: (id) => {
      const bon = DB.bon(id); const s = bon && DB.supplier(bon.supplierId);
      const items = valState[id] || [];
      return `<div class="success">
        <div class="pop-in">${coco('joy', 200)}</div>
        <h1>Stock mis à jour !</h1>
        <p>Le bon ${s ? 'de ' + esc(clean(s.name)) : 'n° ' + (bon ? bon.ref : '')} est enregistré.</p>
      </div>
      <div class="list stagger" style="margin-top:22px">${items.map((it) => `<div class="row"><span class="m-ico" style="background:var(--ok-bg);color:var(--ok)">${ic('arrowIn')}</span><span class="grow"><span class="title">${esc(it.name)}</span></span><b class="num" style="color:var(--ok)">+${qtyStr(it.units, it.unit)}</b></div>`).join('')}</div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:22px">
        <button class="btn btn-primary press ripple-host" data-go="/home" data-tr="fade">Retour à l'accueil</button>
        <button class="btn btn-ghost press ripple-host" data-go="/scan" data-tr="up">Scanner un autre bon</button>
      </div>`;
    },
    mount: (el) => { bindLinks(el); setTimeout(confetti, 250); haptic([20, 40, 20]); stack = ['/home']; }
  };

  /* ---------- Historique des bons ---------- */
  routes.bons = {
    auth: true, live: true, cls: 'no-nav',
    render: () => `<div class="back-row">${backBtn()}<button class="btn btn-primary btn-sm press" style="width:auto" data-go="/scan" data-tr="up">${ic('camera')}Scanner</button></div>
      <h1 class="page-title">Bons de livraison</h1>
      <div class="list stagger" style="margin-top:16px">${DB.bons.map((b) => { const s = DB.supplier(b.supplierId); return `<button class="row press-soft ripple-host" data-bon="${b.id}">${supAvatar(s, 38)}<span class="grow"><span class="title">${esc(clean(s ? s.name : 'Bon n° ' + b.ref))}</span><span class="meta">N° ${b.ref} · ${dayLabel(b.date)} · ${b.lineCount} ligne${b.lineCount > 1 ? 's' : ''}</span></span>${bonPill(b.status)}</button>`; }).join('')}</div>`,
    mount: (el) => { bindBack(el); bindLinks(el); bindBons(el); }
  };

  /* ---------- Commandes ---------- */
  let ordersTab = 'Brouillon';
  routes.orders = {
    tab: 'orders', auth: true, live: true, ptr: true,
    render: () => {
      const tabs = ['Brouillon', 'Envoyée', 'Reçue'];
      const count = (t) => DB.orders.filter((o) => o.status === t).length;
      const idx = tabs.indexOf(ordersTab);
      return `<div class="topbar"><h1 class="page-title" style="margin:0">Commandes</h1><button class="btn btn-ghost btn-sm press" style="width:auto" data-go="/suppliers">${ic('truck')}Fournisseurs</button></div>
        <div class="tabs" role="tablist"><span class="tab-indicator" style="width:calc(33.333% - 2.67px);transform:translateX(${idx * 100}%)"></span>${tabs.map((t) => `<button class="tab ${t === ordersTab ? 'active' : ''}" data-t="${t}" role="tab" aria-selected="${t === ordersTab}">${t === 'Brouillon' ? 'Brouillons' : t === 'Envoyée' ? 'Envoyées' : 'Reçues'}${t !== 'Reçue' ? ' · ' + count(t) : ''}</button>`).join('')}</div>
        <div data-orders style="margin-top:14px"></div>`;
    },
    mount: (el) => {
      bindLinks(el);
      const box = el.querySelector('[data-orders]'); const ind = el.querySelector('.tab-indicator');
      const draw = (anim) => {
        if (!DB.ready) { box.innerHTML = skeletonList(3); return; }
        const list = DB.orders.filter((o) => o.status === ordersTab);
        box.innerHTML = list.length ? `<div class="stack-cards ${anim ? 'stagger' : ''}">${list.map((o) => {
          const s = DB.supplier(o.supplierId);
          const when = o.status === 'Brouillon' ? `Livraison prévue ${deliveryStr(s)}` : o.status === 'Envoyée' ? `Envoyée ${dayLabel(o.date).toLowerCase()} · arrive ${deliveryStr(s, o.date)}` : 'Reçue ' + dayLabel(o.date).toLowerCase();
          return `<div class="card order" data-o="${o.id}">
            <div class="o-head">${supAvatar(s, 42)}<div style="flex:1;min-width:0"><div class="title" style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(clean(s && s.name))}</div><div style="font-size:13px;color:var(--ink-2)">N° ${o.ref} · ${when}</div></div>${orderPill(o.status)}</div>
            ${o.status !== 'Reçue' && daysStr(s) ? `<div class="o-days">${ic('truck')}<span>${esc(clean(s.name).split(' ')[0])} : ${daysStr(s)}</span></div>` : ''}<div class="o-lines">${o.lines.map((l) => { const p = DB.product(l.productId); return `<div data-l="${l.id}"><span>${esc(p ? p.name : 'Produit')}</span>${o.status === 'Brouillon' ? `<span class="stepper" style="padding:2px;gap:2px"><button data-lq="-1" style="width:28px;height:28px" aria-label="Moins">${ic('minus')}</button><output class="num" style="min-width:52px;font-size:14px">${l.qty} colis</output><button data-lq="1" style="width:28px;height:28px" aria-label="Plus">${ic('plus')}</button></span>` : `<b class="num">${l.qty} colis</b>`}</div>`; }).join('') || '<div style="color:var(--ink-2)">Aucune ligne</div>'}</div>
            <div class="o-total"><span>Estimation</span><b class="num" data-total>${euro(DB.orderTotal(o))} HT</b></div>
            ${o.status === 'Brouillon' ? `<button class="btn btn-primary press ripple-host" data-send>${ic('mail')}Envoyer par e-mail</button>`
              : o.status === 'Envoyée' ? `<div class="btn-row">${o.email ? `<button class="btn btn-ghost btn-sm press" data-mail>${ic('mail')}Voir l'e-mail</button>` : ''}<button class="btn btn-dark btn-sm press ripple-host" data-recv>${ic('check')}Marquer reçue</button></div>` : ''}
          </div>`;
        }).join('')}</div>` : `<div class="empty">${coco(ordersTab === 'Brouillon' ? 'joy' : 'idle', 90)}<b>${ordersTab === 'Brouillon' ? 'Aucun brouillon' : 'Rien ici pour l\'instant'}</b>${ordersTab === 'Brouillon' ? 'Les commandes se préparent depuis les alertes.' : ''}</div>`;
        box.querySelectorAll('[data-o]').forEach((card) => {
          const o = DB.order(card.dataset.o);
          card.querySelectorAll('[data-l]').forEach((row) => row.querySelectorAll('[data-lq]').forEach((b) => b.addEventListener('click', async () => {
            const l = o.lines.find((x) => x.id === row.dataset.l); const q = l.qty + Number(b.dataset.lq);
            const out = row.querySelector('output');
            if (q <= 0) { row.classList.add('removing'); }
            else { out.textContent = q + ' colis'; out.classList.remove('bump'); void out.offsetWidth; out.classList.add('bump'); }
            try { await DB.setOrderLineQty(o.id, l.id, q); } catch (e) { fail(e); }
          })));
          const send = card.querySelector('[data-send]');
          send && send.addEventListener('click', async () => {
            try {
              await btnLoading(send, DB.setOrderStatus(o.id, 'Envoyée').catch((e) => { throw e; }));
            } catch (e) { fail(e); return; }
            btnDone(send, 'Envoyée !'); haptic([15, 30, 15]);
            setTimeout(() => { card.classList.add('leaving'); setTimeout(() => { toast('Commande envoyée à ' + esc(clean(DB.supplier(o.supplierId).name))); render({ silent: true }); }, 480); }, 700);
          });
          const recv = card.querySelector('[data-recv]');
          recv && recv.addEventListener('click', async () => {
            try { await btnLoading(recv, DB.setOrderStatus(o.id, 'Reçue')); } catch (e) { fail(e); return; }
            card.classList.add('leaving'); setTimeout(() => { toast('Commande reçue · pense à scanner le bon'); render({ silent: true }); }, 480);
          });
          const mail = card.querySelector('[data-mail]');
          mail && mail.addEventListener('click', () => sheet(`<h3>E-mail de commande</h3><pre style="white-space:pre-wrap;font:inherit;font-size:14px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px;margin-top:12px;line-height:1.5">${esc(o.email)}</pre>`));
        });
      };
      draw(!el.classList.contains('quiet'));
      el.querySelectorAll('.tab').forEach((t, i) => t.addEventListener('click', () => {
        ordersTab = t.dataset.t; ind.style.transform = `translateX(${i * 100}%)`;
        el.querySelectorAll('.tab').forEach((x) => { const on = x === t; x.classList.toggle('active', on); x.setAttribute('aria-selected', on); });
        draw(true);
      }));
      // glisser horizontalement pour changer d'onglet
      let x0 = null;
      box.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
      box.addEventListener('touchend', (e) => {
        if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
        if (Math.abs(dx) < 70) return;
        const tabs = ['Brouillon', 'Envoyée', 'Reçue']; const n = tabs.indexOf(ordersTab) + (dx < 0 ? 1 : -1);
        if (n >= 0 && n < 3) el.querySelectorAll('.tab')[n].click();
      });
    }
  };

  /* ---------- Fournisseurs ---------- */
  routes.suppliers = {
    auth: true, live: true, cls: 'no-nav',
    render: () => {
      const week = ['L', 'M', 'M', 'J', 'V', 'S', 'D']; const t = todayIdx();
      return `<div class="back-row">${backBtn()}<button class="btn btn-ghost btn-sm press" style="width:auto" data-add>${ic('plus')}Ajouter</button></div><h1 class="page-title">Fournisseurs</h1>
        <p class="page-sub">${DB.suppliers.length} fournisseurs · les jours de livraison en foncé.</p>
        <div class="stack-cards stagger" style="margin-top:16px">
          <button class="card card-pad add-sup press-soft" data-add><span class="m-ico">${ic('plus')}</span><span class="grow" style="display:flex;flex-direction:column;text-align:left"><b>Ajouter un fournisseur</b><span style="font-size:13px;color:var(--ink-2)">Nom, e-mail de commande, jours de livraison</span></span>${ic('chev', 'chev')}</button>${DB.suppliers.map((s) => {
          const days = parseDays(s.days); const n = DB.products.filter((p) => p.supplierId === s.id).length; const alerts = DB.products.filter((p) => p.supplierId === s.id && DB.level(p) !== 'ok').length;
          return `<div class="card card-pad press-soft" data-s="${s.id}"><div style="display:flex;gap:12px;align-items:center">${supAvatar(s, 44)}<div style="flex:1;min-width:0"><div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(clean(s.name))}</div><div style="font-size:13px;color:var(--ink-2)">${esc(s.cat)} · ${n} produit${n > 1 ? 's' : ''}${alerts ? ` · <span style="color:var(--crit-ink)">${alerts} alerte${alerts > 1 ? 's' : ''}</span>` : ''}</div></div>${s.email ? `<a class="icon-btn press" href="mailto:${esc(s.email)}" aria-label="Écrire à ${esc(clean(s.name))}">${ic('mail')}</a>` : ''}</div>
            <div class="days">${week.map((l, i) => `<span class="${days.includes(i) ? 'on' : ''} ${i === t ? 'today' : ''}">${l}</span>`).join('')}<span style="background:none;width:auto;color:var(--ink-2);font-weight:500;margin-left:auto">Délai ${s.delay} j</span></div></div>`;
        }).join('')}</div>`;
    },
    mount: (el) => {
      bindBack(el);
      el.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => openNewSupplier()));
      el.querySelectorAll('[data-s]').forEach((c) => c.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        const s = DB.supplier(c.dataset.s); const prods = DB.products.filter((p) => p.supplierId === s.id);
        const full = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']; let cur = parseDays(s.days);
        sheet(`<div style="display:flex;gap:12px;align-items:center">${supAvatar(s, 48)}<div><h3>${esc(clean(s.name))}</h3><div style="font-size:13px;color:var(--ink-2)">${esc(s.email)}</div></div></div>
          <div class="section-head" style="margin-top:16px"><h2>Jours de livraison</h2><span style="font-size:13px;color:var(--ink-2)">Délai ${s.delay} j</span></div>
          <div class="day-pick">${full.map((l, i) => `<button class="${cur.includes(i) ? 'on' : ''}" data-day="${i}" aria-pressed="${cur.includes(i)}">${l}</button>`).join('')}</div>
          <p style="font-size:13px;color:var(--ink-2);margin:8px 2px 0" data-next>Prochaine livraison si tu commandes aujourd'hui : <b>${deliveryStr(s)}</b></p>
          <div class="section-head"><h2>Produits</h2></div><div class="list">${prods.map(productRow).join('')}</div>`,
          (sh, close) => {
            sh.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { close(); go(b.dataset.go); }));
            sh.querySelectorAll('[data-day]').forEach((b) => b.addEventListener('click', async () => {
              const i = Number(b.dataset.day); cur = cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i].sort();
              b.classList.toggle('on'); b.setAttribute('aria-pressed', cur.includes(i)); haptic(6);
              const txt = cur.length === 7 ? 'Tous les jours' : cur.map((x) => full[x]).join(', ');
              try { await DB.setSupplierDays(s.id, txt); sh.querySelector('[data-next] b').textContent = deliveryStr(s); } catch (e) { fail(e); }
            }));
          }, () => render({ silent: true }));
      }));
    }
  };

  /* ---------- Nouveau fournisseur (synchronisé avec Airtable) ---------- */
  function openNewSupplier() {
    const cats = [...new Set(DB.suppliers.map((s) => s.cat).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
    const full = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']; let cur = [];
    sheet(`<h3>Nouveau fournisseur</h3><p class="page-sub" style="margin-top:4px">Il sera ajouté à ta base Airtable et proposé pour les produits et les commandes.</p>
      <div class="field"><label for="ns-name">Nom du fournisseur</label><input id="ns-name" placeholder="ex. Boucherie Martin" autocomplete="organization"><span class="err"></span></div>
      <div class="field"><label for="ns-mail">E-mail de commande</label><input id="ns-mail" type="email" inputmode="email" placeholder="commandes@fournisseur.fr"><span class="err"></span></div>
      <div class="field"><label for="ns-cat">Catégorie</label><input id="ns-cat" list="ns-cats" placeholder="ex. Viandes"><datalist id="ns-cats">${cats.map((c) => `<option value="${esc(c)}">`).join('')}</datalist></div>
      <div class="field"><label>Jours de livraison</label><div class="day-pick">${full.map((l, i) => `<button data-day="${i}" aria-pressed="false">${l}</button>`).join('')}</div></div>
      <div class="field"><label for="ns-delay">Délai de livraison (jours)</label><input id="ns-delay" type="number" inputmode="numeric" min="0" max="30" value="1"></div>
      <button class="btn btn-primary press ripple-host" style="margin-top:8px" data-ok>${ic('plus')}Ajouter le fournisseur</button>`,
    (sh, close) => {
      sh.querySelectorAll('[data-day]').forEach((b) => b.addEventListener('click', () => { const i = Number(b.dataset.day); cur = cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i].sort(); b.classList.toggle('on'); b.setAttribute('aria-pressed', cur.includes(i)); haptic(6); }));
      const ok = sh.querySelector('[data-ok]');
      ok.addEventListener('click', async () => {
        const name = sh.querySelector('#ns-name').value.trim(), email = sh.querySelector('#ns-mail').value.trim();
        const setErr = (id, m) => { const f = sh.querySelector(id).closest('.field'); f.classList.toggle('invalid', !!m); f.querySelector('.err').textContent = m || ''; };
        setErr('#ns-name', name ? '' : 'Indique un nom'); setErr('#ns-mail', !email || /^\S+@\S+\.\S+$/.test(email) ? '' : 'E-mail invalide');
        if (!name || (email && !/^\S+@\S+\.\S+$/.test(email))) { haptic(20); return; }
        if (DB.suppliers.some((x) => norm(x.name) === norm(name))) { setErr('#ns-name', 'Ce fournisseur existe déjà'); return; }
        const days = cur.length === 7 ? 'Tous les jours' : cur.map((x) => full[x]).join(', ');
        try { await btnLoading(ok, DB.upsertSupplier({ name, email, cat: sh.querySelector('#ns-cat').value.trim(), days, delay: num(sh.querySelector('#ns-delay').value) || 1 })); DB.emit(); close(); haptic([15, 30, 15]); toast(`${name} ajouté`); render({ silent: true }); } catch (e) { fail(e); }
      });
      setTimeout(() => sh.querySelector('#ns-name').focus(), 350);
    });
  }

  /* ---------- Nouveau produit (depuis un bon, le stock…) synchronisé avec Airtable ---------- */
  function openNewProduct(pre, cb) {
    const cats = [...new Set(DB.products.map((p) => p.cat))].sort((a, b) => a.localeCompare(b, 'fr'));
    const units = ['kg', 'L', 'pièce', 'bouteille'];
    sheet(`<h3>Nouveau produit</h3><p class="page-sub" style="margin-top:4px">Il sera ajouté à ta base et proposé sur les prochains bons.</p>
      <div class="field"><label for="np-name">Nom du produit</label><input id="np-name" placeholder="ex. Jus d'orange 1L" value="${esc(pre.name || '')}"><span class="err"></span></div>
      <div class="field"><label for="np-sup">Fournisseur</label><select id="np-sup">${DB.suppliers.map((s) => `<option value="${s.id}" ${s.id === pre.supplierId ? 'selected' : ''}>${esc(clean(s.name))}</option>`).join('')}</select></div>
      <div class="grid2"><div class="field"><label for="np-cat">Catégorie</label><select id="np-cat">${cats.map((c) => `<option ${c === pre.cat ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
        <div class="field"><label for="np-unit">Unité de stock</label><select id="np-unit">${units.map((u) => `<option>${u}</option>`).join('')}</select></div></div>
      <div class="grid2"><div class="field"><label for="np-cond">Unités par colis</label><input id="np-cond" type="number" inputmode="decimal" min="1" value="6"></div>
        <div class="field"><label for="np-seuil">Seuil d'alerte</label><input id="np-seuil" type="number" inputmode="decimal" min="0" value="6"></div></div>
      <div class="field"><label for="np-price">Prix d'achat HT / unité (facultatif)</label><input id="np-price" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0,00"></div>
      <button class="btn btn-primary press ripple-host" style="margin-top:18px" data-ok>${ic('plus')}Créer le produit</button>`,
    (sh, close) => {
      const v = (id) => sh.querySelector('#' + id).value;
      sh.querySelector('[data-ok]').addEventListener('click', async (e) => {
        const name = v('np-name').trim();
        if (name.length < 2) { const f = sh.querySelector('#np-name').parentElement; f.classList.add('error'); f.querySelector('.err').textContent = 'Donne un nom au produit.'; return; }
        try {
          const p = await btnLoading(e.currentTarget, DB.createProduct({ name, supplierId: v('np-sup'), cat: v('np-cat'), unit: v('np-unit'), cond: v('np-cond'), seuil: v('np-seuil'), price: String(v('np-price')).replace(',', '.') }));
          close(); haptic(20); toast(esc(name) + (DB.mode === 'live' ? ' ajouté à Airtable' : ' créé')); cb && cb(p);
        } catch (err) { fail(err); }
      });
    });
  }

  /* ---------- Inventaire de fin de journée ---------- */
  let invState = { filter: 'À vérifier', counts: {} };
  const csvCell = (v) => { const s = String(v == null ? '' : v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  function downloadCSV(name, rows) {
    const txt = '﻿' + rows.map((r) => r.map(csvCell).join(';')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function parseCSV(text) {
    text = text.replace(/^﻿/, ''); const sep = (text.split('\n')[0].match(/;/g) || []).length >= (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
      else if (c === '"') q = true; else if (c === sep) { row.push(cur); cur = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; } else cur += c;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    return rows.filter((r) => r.some((x) => x.trim()));
  }
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s*\(fictif\)/, '').trim();
  const num = (s) => parseFloat(String(s).replace(/\s/g, '').replace(',', '.'));
  function pickFile(accept, cb) { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.onchange = () => { const f = i.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => cb(String(r.result), f.name); r.readAsText(f, 'utf-8'); }; i.click(); }

  /* Lire un fichier Excel (.xlsx) ou CSV : renvoie les lignes à partir de l'en-tête trouvé */
  let xlsxP = null;
  const loadXLSX = () => xlsxP || (xlsxP = new Promise((res, rej) => { if (window.XLSX) return res(window.XLSX); const sc = document.createElement('script'); sc.src = 'vendor/xlsx.full.min.js'; sc.onload = () => res(window.XLSX); sc.onerror = () => { xlsxP = null; rej(new Error('Lecture Excel indisponible (connexion ?)')); }; document.head.appendChild(sc); }));
  function pickTable(sheetHint, keys, cb) {
    const i = document.createElement('input'); i.type = 'file'; /* pas de filtre : sur iPhone/Android un filtre grise souvent les fichiers Excel */
    const fromHeader = (rows) => { const k = rows.findIndex((r) => r.some((c) => keys.some((key) => norm(c).startsWith(key)))); return k < 0 ? null : rows.slice(k).map((r) => r.map((c) => (c == null ? '' : String(c)))); };
    i.onchange = async () => {
      const f = i.files[0]; if (!f) return;
      try {
        let rows = null;
        if (!/\.(xlsx?|csv|txt)$/i.test(f.name)) { toast('Choisis un fichier Excel (.xlsx) ou CSV', 'warn'); return; }
        if (/\.xlsx?$/i.test(f.name)) {
          const X = await loadXLSX(); const wb = X.read(await f.arrayBuffer(), { type: 'array' });
          const names = [...wb.SheetNames].sort((a, b) => (norm(b).includes(sheetHint) ? 1 : 0) - (norm(a).includes(sheetHint) ? 1 : 0));
          for (const n of names) { rows = fromHeader(X.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '' })); if (rows) break; }
        } else rows = fromHeader(parseCSV(await f.text()));
        if (!rows) { toast('Colonnes introuvables dans ce fichier', 'warn'); return; }
        cb(rows);
      } catch (e) { fail(e); }
    };
    i.click();
  }

  const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  /* Lire toutes les feuilles d'un classeur (ou un CSV) */
  function pickBook(cb) {
    const i = document.createElement('input'); i.type = 'file';
    i.onchange = async () => {
      const f = i.files[0]; if (!f) return;
      if (!/\.(xlsx?|csv|txt)$/i.test(f.name)) { toast('Choisis un fichier Excel (.xlsx) ou CSV', 'warn'); return; }
      try {
        let book;
        if (/\.xlsx?$/i.test(f.name)) { const X = await loadXLSX(); const wb = X.read(await f.arrayBuffer(), { type: 'array' }); book = wb.SheetNames.map((n) => ({ name: n, rows: X.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '' }) })); }
        else book = [{ name: f.name, rows: parseCSV(await f.text()) }];
        book.forEach((sh) => (sh.rows = sh.rows.map((r) => r.map((c) => (c == null ? '' : String(c))))));
        cb(book, f.name);
      } catch (e) { fail(e); }
    };
    i.click();
  }
  /* Trouve un tableau dont l'en-tête contient toutes les colonnes demandées (tests sur le nom normalisé) */
  function findTable(book, tests) {
    for (const sh of book) {
      const k = sh.rows.findIndex((r) => tests.every((t) => r.some((c) => t(norm(c)))));
      if (k >= 0) { const head = sh.rows[k].map(norm); return { sheet: sh.name, head, rows: sh.rows.slice(k + 1), col: (t) => head.findIndex(t) }; }
    }
    return null;
  }
  /* Une seule importation pour les 3 étapes de fin de journée */
  function importDay() {
    pickBook((book, fname) => {
      const sales = findTable(book, [(h) => h.startsWith('quantite vendue') || (h.includes('quantit') && h.includes('vend')), (h) => h.startsWith('code') || h.startsWith('plat')]);
      const losses = findTable(book, [(h) => h.startsWith('motif'), (h) => h.includes('perdu') || h.startsWith('quantit')]);
      const inv = findTable(book, [(h) => h.startsWith('produit'), (h) => h.includes('compt')]);
      const findPlat = (code, name) => DB.plats.find((x) => (code && x.code && norm(x.code) === norm(code)) || (name && norm(x.name) === norm(name)));
      const findProd = (name) => { const n = norm(name); return n ? DB.products.find((x) => norm(x.name) === n) || DB.products.find((x) => norm(x.name).startsWith(n)) : null; };
      let miss = 0;
      // Étape 1 : ventes
      const saleItems = [];
      if (sales) {
        const iC = sales.col((h) => h.startsWith('code')), iP = sales.col((h) => h === 'plat' || h.startsWith('plat')), iQ = sales.col((h) => h.startsWith('quantite vendue') || (h.includes('quantit') && h.includes('vend')));
        sales.rows.forEach((r) => { const q = num(r[iQ]); if (isNaN(q) || q <= 0) return; const pl = findPlat(iC >= 0 ? r[iC] : '', iP >= 0 ? r[iP] : ''); if (!pl) { const lbl = norm(String(r[iP] || r[iC] || '')); if (lbl && !lbl.startsWith('total')) miss++; return; } const ex = saleItems.find((x) => x.platId === pl.id); if (ex) ex.qty += Math.round(q); else saleItems.push({ platId: pl.id, qty: Math.round(q) }); });
      }
      // Étape 2 : pertes
      const lossItems = [];
      if (losses) {
        const iN = losses.col((h) => h.startsWith('produit') || h.startsWith('plat') || h === 'nom'), iQ = losses.col((h) => h.includes('perdu') || h.startsWith('quantit')), iM = losses.col((h) => h.startsWith('motif'));
        losses.rows.forEach((r) => { const q = num(r[iQ]); if (isNaN(q) || q <= 0 || !String(r[iN] || '').trim()) return; const reason = REASONS.find((x) => norm(x) === norm(r[iM])) || REASONS.find((x) => norm(r[iM]) && norm(x).startsWith(norm(r[iM]).split(/[ \/]/)[0])) || 'Autre';
          const pr = findProd(r[iN]); if (pr) { lossItems.push({ productId: pr.id, qty: q, reason, label: pr.name, unit: pr.unit }); return; }
          const pl = findPlat('', r[iN]); if (pl) { lossItems.push({ platId: pl.id, qty: q, reason, label: pl.name + ' refait', unit: 'assiette' }); return; } miss++; });
      }
      // Étape 3 : comptage
      const counts = {};
      if (inv) {
        const iN = inv.col((h) => h.startsWith('produit')), iQ = inv.col((h) => h.includes('compt'));
        inv.rows.forEach((r) => { if (!String(r[iN] || '').trim()) return; const q = num(r[iQ]); if (isNaN(q)) return; const pr = DB.products.find((x) => norm(x.name) === norm(r[iN])); if (pr) counts[pr.id] = q; else miss++; });
      }
      const nSold = saleItems.reduce((t, x) => t + x.qty, 0), nCount = Object.keys(counts).length;
      if (!nSold && !lossItems.length && !nCount) { toast('Rien trouvé : il faut un onglet ventes, pertes ou inventaire', 'warn'); return; }
      const already = DB.sales.filter((x) => x.done && x.date === todayStr()).length;
      const line = (n, ok, title, meta) => `<div class="row"><span class="m-ico" style="background:${ok ? 'var(--ok-bg)' : 'var(--neutral-bg)'};color:${ok ? 'var(--ok)' : 'var(--ink-3)'}">${ok ? ic('check') : ic('minus')}</span><span class="grow"><span class="title">${n}. ${title}</span><span class="meta">${meta}</span></span></div>`;
      sheet(`<h3>Importer la journée</h3><p class="page-sub" style="margin-top:4px">${esc(fname)}</p>
        <div class="list day-sum" style="margin-top:12px">
          ${line(1, nSold, 'Ventes de la caisse', nSold ? `${nSold} plat${nSold > 1 ? 's' : ''} vendu${nSold > 1 ? 's' : ''} · les ingrédients seront retirés du stock` : 'Aucun onglet de ventes trouvé')}
          ${line(2, lossItems.length, 'Pertes et erreurs du jour', lossItems.length ? lossItems.map((l) => `${esc(l.label)} −${nf(l.qty)} ${esc(unitLabel(l.unit, l.qty))} (${esc(l.reason)})`).join('<br>') : 'Aucun onglet de pertes trouvé')}
          ${line(3, nCount, 'Vérifier les quantités', nCount ? `${nCount} quantité${nCount > 1 ? 's' : ''} comptée${nCount > 1 ? 's' : ''} · les écarts restants s'affichent pour validation` : 'Aucun onglet d\'inventaire trouvé')}
        </div>
        ${already && nSold ? `<p style="font-size:13.5px;color:var(--crit-ink);margin:12px 2px 0">Attention : des ventes sont déjà enregistrées aujourd'hui. Elles seront ajoutées une deuxième fois.</p>` : ''}
        ${miss ? `<p style="font-size:13px;color:var(--ink-2);margin:10px 2px 0">${miss} ligne${miss > 1 ? 's' : ''} non reconnue${miss > 1 ? 's' : ''}, ignorée${miss > 1 ? 's' : ''}.</p>` : ''}
        <button class="btn btn-primary press ripple-host" style="margin-top:14px" data-apply>Tout appliquer</button>`,
      (sh, close) => {
        const b = sh.querySelector('[data-apply]');
        b.addEventListener('click', async () => {
          try {
            await btnLoading(b, (async () => {
              if (saleItems.length) await DB.recordSales(saleItems, 'Import Excel');
              for (const l of lossItems) await DB.declareLoss(l.platId ? { platId: l.platId, qty: l.qty, reason: l.reason } : { productId: l.productId, qty: l.qty, reason: l.reason });
            })());
            invState.counts = counts; invState.filter = 'Tous'; salesDraft = {};
            close(); haptic([15, 30, 15]); render({ silent: true });
            const left = Object.entries(counts).filter(([id, q]) => { const p = DB.product(id); return p && Math.abs(q - p.qty) > 0.001; }).length;
            toast(`Journée importée · ${left} écart${left > 1 ? 's' : ''} à valider en étape 3`);
          } catch (e) { fail(e); }
        });
      });
    });
  }

  routes.inventory = {
    tab: 'inventory', auth: true, live: true,
    render: () => {
      const pending = DB.pendingSales().length;
      const _d = new Date(); const todayISO = _d.getFullYear() + '-' + String(_d.getMonth() + 1).padStart(2, '0') + '-' + String(_d.getDate()).padStart(2, '0');
      const soldN = DB.sales.filter((x) => x.done && x.date === todayISO).reduce((t, x) => t + (Number(x.qty) || 0), 0);
      const draftN = Object.values(salesDraft).reduce((t, q) => t + (q || 0), 0);
      const filters = ['À vérifier', 'Tous', ...[...new Set(DB.products.map((p) => p.cat))].sort((a, b) => a.localeCompare(b, 'fr'))];
      return `<div class="topbar"><h1 class="page-title" style="margin:0">Inventaire</h1><button class="btn btn-ghost btn-sm press" style="width:auto" data-tools>${ic('download')}Excel</button></div>
        <p class="page-sub">Fin de journée : 3 étapes pour que le stock de demain matin soit juste.</p>
        <button class="card card-pad day-import press-soft" data-day style="width:100%;text-align:left;display:flex;gap:12px;align-items:center;margin-top:12px">
          <span class="m-ico" style="background:var(--orange-soft);color:var(--orange-deep)">${ic('upload')}</span>
          <span class="grow" style="display:flex;flex-direction:column"><b>Importer la journée (Excel)</b><span style="font-size:13px;color:var(--ink-2)">Un seul fichier remplit les étapes 1, 2 et 3</span></span>${ic('chev', 'chev')}</button>
        <div class="step-h"><span>1</span>Ventes de la caisse</div>
        <button class="card card-pad sales-card press-soft" data-go="/sales" style="width:100%;text-align:left">
          <span class="m-ico" style="background:var(--ia-bg);color:var(--ia)">${ic('receipt')}</span>
          <span class="grow" style="display:flex;flex-direction:column"><b>Ventes du service</b><span style="font-size:13px;color:var(--ink-2)">${pending ? `${pending} vente${pending > 1 ? 's' : ''} de la caisse à déduire` : draftN ? `${draftN} plat${draftN > 1 ? 's' : ''} importé${draftN > 1 ? 's' : ''}, à enregistrer` : soldN ? `${soldN} plat${soldN > 1 ? 's' : ''} vendu${soldN > 1 ? 's' : ''} aujourd'hui, déduit${soldN > 1 ? 's' : ''} du stock` : 'Aucune vente enregistrée aujourd\'hui'}</span></span>
          ${pending ? pill('sent new', String(pending)) : draftN ? pill('draft', String(draftN)) : soldN ? pill('ok', String(soldN)) : ''}${ic('chev', 'chev')}</button>
        <div class="step-h"><span>2</span>Pertes et erreurs du jour</div>
        <div class="card card-pad">
          <p style="margin:0 0 10px;font-size:14px;color:var(--ink-2);line-height:1.45">Un steak brûlé, une bouteille cassée, un plat refait, le repas du personnel… Déclare-le pour que le stock reste juste.</p>
          <button class="btn btn-primary press ripple-host" data-loss>${ic('minus')}Déclarer une perte</button>
          ${(() => { const L = DB.lossesToday(); return L.length ? `<div class="loss-list">${L.map((l) => `<div class="loss"><span class="grow"><b>${esc(l.label)}</b><span>${esc(l.reason)} · ${l.at}</span></span><b class="num">−${nf(l.qty)} ${esc(unitLabel(l.unit, l.qty))}</b></div>`).join('')}<div class="loss-total">Valeur perdue aujourd'hui <b class="num">${euro(L.reduce((t, l) => t + (l.value || 0), 0))}</b></div></div>` : ''; })()}
        </div>
        <div class="step-h"><span>3</span>Vérifier les quantités</div>
        <div class="chips" role="tablist" style="margin-top:0">${filters.map((f) => `<button class="chip ${f === invState.filter ? 'active' : ''}" data-f="${esc(f)}">${esc(f)}</button>`).join('')}</div>
        <p class="hint-swipe" style="margin:10px 2px 8px" data-hint></p>
        <div data-list>${DB.ready ? '' : skeletonList(6)}</div>
        <div class="sticky-foot" data-foot style="display:none"><button class="btn btn-primary press ripple-host" data-save></button></div>`;
    },
    mount: (el) => {
      bindLinks(el);
      const list = el.querySelector('[data-list]'); const foot = el.querySelector('[data-foot]'); const save = el.querySelector('[data-save]'); const hint = el.querySelector('[data-hint]');
      const changed = () => Object.entries(invState.counts).filter(([id, q]) => { const p = DB.product(id); return p && Math.abs(q - p.qty) > 0.001; });
      const updFoot = () => { const n = changed().length; foot.style.display = n ? '' : 'none'; save.textContent = `Enregistrer l'inventaire (${n} écart${n > 1 ? 's' : ''})`; };
      const draw = () => {
        if (!DB.ready) return;
        // « À vérifier » : produits sous le seuil + ceux qui coûtent le plus (pas besoin de compter les gousses d'ail)
        const byValue = [...DB.products].sort((a, b) => b.qty * b.price - a.qty * a.price).slice(0, 8).map((p) => p.id);
        const items = DB.products.filter((p) => invState.filter === 'Tous' || (invState.filter === 'À vérifier' ? DB.level(p) !== 'ok' || byValue.includes(p.id) : p.cat === invState.filter)).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
        hint.textContent = invState.filter === 'À vérifier' ? `${items.length} produits sensibles : sous le seuil ou les plus chers en stock.` : `${items.length} produits`;
        list.innerHTML = `<div class="list inv-list">${items.map((p) => { const q = invState.counts[p.id] != null ? invState.counts[p.id] : p.qty; const diff = Math.round((q - p.qty) * 10) / 10;
          return `<div class="row inv-row" data-id="${p.id}"><span class="dot ${DB.level(p)}"></span><span class="grow"><span class="title">${esc(p.name)}</span><span class="meta">Théorique ${qtyStr(p.qty, p.unit)}${diff ? ` · <b style="color:${diff < 0 ? 'var(--crit-ink)' : 'var(--ok-ink)'}">${diff > 0 ? '+' : '−'}${nf(Math.abs(diff))}</b>` : ''}</span></span>
            <label class="inv-input"><input type="number" inputmode="decimal" step="0.1" min="0" value="${nf(q).replace(/\s/g, '').replace(',', '.')}" aria-label="Quantité comptée ${esc(p.name)}"><span>${esc(unitLabel(p.unit, 2))}</span></label></div>`; }).join('')}</div>`;
        list.querySelectorAll('[data-id]').forEach((row) => {
          const inp = row.querySelector('input'); const p = DB.product(row.dataset.id);
          inp.addEventListener('focus', () => inp.select());
          inp.addEventListener('change', () => { const v = num(inp.value); if (isNaN(v)) return; invState.counts[p.id] = v; row.classList.toggle('changed', Math.abs(v - p.qty) > 0.001); const d = Math.round((v - p.qty) * 10) / 10; row.querySelector('.meta').innerHTML = `Théorique ${qtyStr(p.qty, p.unit)}${d ? ` · <b style="color:${d < 0 ? 'var(--crit-ink)' : 'var(--ok-ink)'}">${d > 0 ? '+' : '−'}${nf(Math.abs(d))}</b>` : ''}`; updFoot(); });
          if (invState.counts[p.id] != null && Math.abs(invState.counts[p.id] - p.qty) > 0.001) row.classList.add('changed');
        });
        updFoot();
      };
      draw();
      el.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => { invState.filter = c.dataset.f; el.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x === c)); draw(); }));
      save.addEventListener('click', async () => {
        const counts = changed().map(([id, qty]) => ({ id, qty }));
        try { const n = await btnLoading(save, DB.saveInventory(counts)); invState.counts = {}; haptic([15, 30, 15]); toast(`Inventaire enregistré · ${n} correction${n > 1 ? 's' : ''}`); render({ silent: true }); } catch (e) { fail(e); }
      });
      el.querySelector('[data-loss]').addEventListener('click', () => openLoss());
      el.querySelector('[data-day]').addEventListener('click', () => importDay());
      el.querySelector('[data-tools]').addEventListener('click', () => sheet(`<h3>Excel / Google Sheets</h3><p class="page-sub" style="margin-top:4px">Pour aller plus vite, compte sur un tableur puis importe le fichier. Format CSV (s'ouvre dans Excel et Google Sheets).</p>
        <div class="list" style="margin-top:14px">
          <button class="row press-soft" data-exp><span class="m-ico" style="background:var(--ok-bg);color:var(--ok)">${ic('download')}</span><span class="grow"><span class="title">Exporter le stock</span><span class="meta">Feuille d'inventaire à remplir (colonne « Quantité comptée »)</span></span></button>
          <button class="row press-soft" data-imp><span class="m-ico" style="background:var(--orange-soft);color:var(--orange-deep)">${ic('upload')}</span><span class="grow"><span class="title">Importer l'inventaire</span><span class="meta">Excel (.xlsx) ou CSV rempli : les écarts apparaissent avant d'enregistrer</span></span></button>
        </div>`, (sh, close) => {
        sh.querySelector('[data-exp]').addEventListener('click', () => {
          downloadCSV('inventaire-restock-' + new Date().toISOString().slice(0, 10) + '.csv', [['Produit', 'Catégorie', 'Fournisseur', 'Unité', 'Stock théorique', 'Quantité comptée', 'Seuil d\'alerte', 'Prix HT']].concat(DB.products.map((p) => [p.name, p.cat, clean(DB.supplier(p.supplierId) && DB.supplier(p.supplierId).name), p.unit, String(p.qty).replace('.', ','), '', String(p.seuil).replace('.', ','), String(p.price).replace('.', ',')])));
          close(); toast('Fichier exporté');
        });
        sh.querySelector('[data-imp]').addEventListener('click', () => pickTable('inventaire', ['produit'], (rows) => {
          const head = rows.shift().map(norm);
          const iName = head.findIndex((h) => h.startsWith('produit') || h === 'nom'); const iQty = head.findIndex((h) => h.includes('compt')) >= 0 ? head.findIndex((h) => h.includes('compt')) : head.findIndex((h) => h.includes('quantit'));
          if (iName < 0 || iQty < 0) { toast('Colonnes « Produit » et « Quantité comptée » introuvables', 'warn'); return; }
          let n = 0, miss = 0;
          rows.forEach((r) => { if (!String(r[iName]).trim()) return; const q = num(r[iQty]); if (isNaN(q)) return; const p = DB.products.find((x) => norm(x.name) === norm(r[iName])); if (p) { invState.counts[p.id] = q; n++; } else miss++; });
          invState.filter = 'Tous'; close(); render({ silent: true }); toast(`${n} quantité${n > 1 ? 's' : ''} importée${n > 1 ? 's' : ''}${miss ? ` · ${miss} produit${miss > 1 ? 's' : ''} inconnu${miss > 1 ? 's' : ''}` : ''}`, miss ? 'info' : 'ok');
        }));
      }));
    }
  };

  /* ---------- Déclarer une perte (steak brûlé, casse…) ---------- */
  const REASONS = ['Brûlé / raté', 'Cassé / renversé', 'Périmé / abîmé', 'Repas du personnel', 'Offert', 'Erreur de saisie', 'Autre'];
  function openLoss() {
    const st = { mode: 'produit', id: null, qty: 1, reason: REASONS[0] };
    const quick = ['Faux-filet', 'Frites', 'Pommes', 'Bordeaux', 'Crème', 'Glace'];
    sheet(`<h3>Déclarer une perte</h3>
      <div class="seg" role="tablist"><button class="on" data-m="produit">Un produit</button><button data-m="plat">Un plat entier refait</button></div>
      <div class="field" style="margin-top:14px"><label>Quoi ?</label><button class="pick press-soft" data-pick><span data-pl>Choisir…</span>${ic('chev', 'chev')}</button></div>
      <div class="field"><label>Combien ?</label><div style="display:flex;align-items:center;gap:12px"><div class="stepper"><button data-q="-1" aria-label="Moins">${ic('minus')}</button><output class="num" data-qo>1</output><button data-q="1" aria-label="Plus">${ic('plus')}</button></div><input type="number" inputmode="decimal" step="0.05" min="0" class="time-input" style="min-width:0;width:96px" data-qi value="1" aria-label="Quantité"><span data-u style="color:var(--ink-2);font-weight:600"></span></div></div>
      <div class="field"><label>Pourquoi ?</label><div class="reason-chips">${REASONS.map((r, i) => `<button class="chip ${i === 0 ? 'active' : ''}" data-r="${esc(r)}">${esc(r)}</button>`).join('')}</div></div>
      <p data-impact style="font-size:13.5px;color:var(--ink-2);margin:12px 2px 0"></p>
      <button class="btn btn-primary press ripple-host" style="margin-top:14px" data-ok disabled>Retirer du stock</button>`,
    (sh, close) => {
      const pl = sh.querySelector('[data-pl]'), qo = sh.querySelector('[data-qo]'), qi = sh.querySelector('[data-qi]'), u = sh.querySelector('[data-u]'), imp = sh.querySelector('[data-impact]'), ok = sh.querySelector('[data-ok]');
      const upd = () => {
        qo.textContent = nf(st.qty, 2); if (document.activeElement !== qi) qi.value = st.qty;
        let label = 'Choisir…', unit = '', txt = '';
        if (st.id && st.mode === 'produit') { const p = DB.product(st.id); label = p.name; unit = unitLabel(p.unit, st.qty); txt = `Stock : ${qtyStr(p.qty, p.unit)} → <b>${qtyStr(Math.max(0, Math.round((p.qty - st.qty) * 100) / 100), p.unit)}</b> · ${euro(st.qty * p.price)} perdus`; }
        if (st.id && st.mode === 'plat') { const P = DB.plat(st.id); label = P.name; unit = st.qty > 1 ? 'assiettes' : 'assiette'; const usage = DB.usage([{ platId: P.id, qty: st.qty }]); const v = Object.entries(usage).reduce((t, [id, q]) => { const p = DB.product(id); return t + (p ? p.price * q : 0); }, 0); txt = `Retire les ${Object.keys(usage).length} ingrédients de la recette · ${euro(v)} perdus`; }
        pl.textContent = label; u.textContent = unit; imp.innerHTML = txt; ok.disabled = !(st.id && st.qty > 0);
      };
      sh.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { st.mode = b.dataset.m; st.id = null; st.qty = 1; sh.querySelectorAll('[data-m]').forEach((x) => x.classList.toggle('on', x === b)); upd(); }));
      sh.querySelector('[data-pick]').addEventListener('click', () => {
        if (st.mode === 'produit') {
          const items = [...DB.products].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
          sheet(`<h3>Quel produit ?</h3><label class="search" style="margin-top:12px">${ic('search')}<input placeholder="Rechercher (ex. faux-filet)"></label><div class="list" style="margin-top:12px">${items.map((p) => `<button class="row press-soft" data-pid="${p.id}"><span class="grow"><span class="title">${esc(p.name)}</span><span class="meta">En stock : ${qtyStr(p.qty, p.unit)}</span></span></button>`).join('')}</div>`, (s2, c2) => {
            const inp = s2.querySelector('input'); inp.addEventListener('input', () => { const q = norm(inp.value); s2.querySelectorAll('[data-pid]').forEach((b) => (b.style.display = norm(b.textContent).includes(q) ? '' : 'none')); });
            s2.querySelectorAll('[data-pid]').forEach((b) => b.addEventListener('click', () => { st.id = b.dataset.pid; const p = DB.product(st.id); st.qty = p.unit === 'kg' || p.unit === 'L' ? 0.2 : 1; c2(); upd(); }));
          });
        } else {
          sheet(`<h3>Quel plat ?</h3><div class="list" style="margin-top:12px">${DB.plats.map((P) => `<button class="row press-soft" data-plid="${P.id}"><span class="grow"><span class="title">${esc(P.name)}</span><span class="meta">${P.recipe.length} ingrédients</span></span></button>`).join('')}</div>`, (s2, c2) => s2.querySelectorAll('[data-plid]').forEach((b) => b.addEventListener('click', () => { st.id = b.dataset.plid; st.qty = 1; c2(); upd(); })));
        }
      });
      sh.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => { const p = st.mode === 'produit' && st.id && DB.product(st.id); const step = p && (p.unit === 'kg' || p.unit === 'L') ? 0.1 : 1; st.qty = Math.max(0, Math.round((st.qty + step * Number(b.dataset.q)) * 100) / 100); haptic(6); upd(); }));
      qi.addEventListener('input', () => { const v = num(qi.value); if (!isNaN(v)) { st.qty = v; upd(); } });
      sh.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => { st.reason = b.dataset.r; sh.querySelectorAll('[data-r]').forEach((x) => x.classList.toggle('active', x === b)); }));
      ok.addEventListener('click', async () => {
        try { await btnLoading(ok, DB.declareLoss(st.mode === 'plat' ? { platId: st.id, qty: st.qty, reason: st.reason } : { productId: st.id, qty: st.qty, reason: st.reason })); close(); haptic([15, 30, 15]); toast('Perte enregistrée, stock corrigé'); render({ silent: true }); } catch (e) { fail(e); }
      });
      upd();
    });
  }

  /* ---------- Ventes du service : caisse → recettes → stock ---------- */
  let salesDraft = {};
  routes.sales = {
    auth: true, live: true, cls: 'no-nav',
    render: () => {
      const pending = DB.pendingSales();
      const today = DB.sales.filter((x) => x.done && x.date === new Date().toISOString().slice(0, 10));
      const cats = ['Plat', 'Dessert', 'Boisson'];
      return `<div class="back-row">${backBtn()}<button class="btn btn-ghost btn-sm press" style="width:auto" data-go="/recipes">${ic('doc')}Recettes</button></div>
        <h1 class="page-title">Ventes du service</h1>
        <p class="page-sub">Chaque plat vendu retire ses ingrédients du stock, d'après sa fiche recette.</p>
        <div class="stagger">
          <div class="card card-pad" style="margin-top:14px;display:flex;gap:12px;align-items:center">
            <span class="m-ico" style="background:var(--ia-bg);color:var(--ia)">${ic('link')}</span>
            <div style="flex:1;font-size:14px;line-height:1.4"><b>Caisse connectée par Make</b><br><span style="color:var(--ink-2)">${pending.length ? `${pending.length} vente${pending.length > 1 ? 's' : ''} reçue${pending.length > 1 ? 's' : ''}, pas encore déduite${pending.length > 1 ? 's' : ''}` : 'Les tickets arrivent et sont déduits automatiquement.'}</span></div>
          </div>
          ${pending.length ? `<div class="list" style="margin-top:10px">${pending.map((x) => { const pl = DB.plat(x.platId); return `<div class="row"><span class="grow"><span class="title">${esc(pl ? pl.name : 'Plat inconnu')}</span><span class="meta">${esc(x.source)} · ${dayLabel(x.date)}</span></span><b class="num">× ${x.qty}</b></div>`; }).join('')}</div>
            <button class="btn btn-primary press ripple-host" style="margin-top:10px" data-pending>Déduire ces ventes du stock</button>` : ''}
          ${DB.mode === 'demo' ? `<button class="btn btn-ghost press" style="margin-top:10px" data-sim>${ic('spark')}Simuler un service reçu de la caisse</button>` : `<button class="btn btn-ghost press" style="margin-top:10px" data-refresh>${ic('refresh')}Relever la caisse</button>`}
          <div class="section-head"><h2>Saisie manuelle</h2><span style="font-size:13px;color:var(--ink-2)">si la caisse n'est pas reliée</span></div>
          <button class="btn btn-ghost press" style="margin-bottom:6px" data-impsales>${ic('upload')}Importer des ventes (Excel)</button>
          ${cats.map((c) => { const pls = DB.plats.filter((p) => p.cat === c); return pls.length ? `<div class="eyebrow" style="margin:12px 2px 6px">${c}s</div><div class="list">${pls.map((p) => `<div class="row" data-plat="${p.id}"><span class="grow"><span class="title">${esc(p.name)}</span><span class="meta">${p.recipe.length} ingrédient${p.recipe.length > 1 ? 's' : ''} · ${euro(p.price)}</span></span><div class="stepper sm"><button data-d="-1" aria-label="Moins">${ic('minus')}</button><output class="num">${salesDraft[p.id] || 0}</output><button data-d="1" aria-label="Plus">${ic('plus')}</button></div></div>`).join('')}</div>` : ''; }).join('')}
          <div data-usage></div>
          ${today.length ? `<div class="section-head"><h2>Déjà déduit aujourd'hui</h2></div><div class="list">${today.slice(0, 12).map((x) => { const pl = DB.plat(x.platId); return `<div class="row"><span class="m-ico" style="background:var(--neutral-bg)">${ic('check')}</span><span class="grow"><span class="title">${esc(pl ? pl.name : 'Plat')}</span><span class="meta">${esc(x.source)}</span></span><b class="num">× ${x.qty}</b></div>`; }).join('')}</div>` : ''}
        </div>
        <div class="sticky-foot" data-foot style="display:none"><button class="btn btn-primary press ripple-host" data-save></button></div>`;
    },
    mount: (el) => {
      bindBack(el); bindLinks(el);
      const usageBox = el.querySelector('[data-usage]'); const foot = el.querySelector('[data-foot]'); const save = el.querySelector('[data-save]');
      const usageHTML = (u) => { const rows = Object.entries(u).map(([id, q]) => ({ p: DB.product(id), q })).filter((x) => x.p).sort((a, b) => b.q * b.p.price - a.q * a.p.price);
        return `<div class="card card-pad usage"><div style="font-weight:700;margin-bottom:6px">Ce que ça retire du stock</div>${rows.map((x) => `<div class="u-row"><span>${esc(x.p.name)}</span><b class="num">−${qtyStr(Math.round(x.q * 100) / 100, x.p.unit)}</b></div>`).join('')}</div>`; };
      const upd = () => {
        const items = Object.entries(salesDraft).filter(([, q]) => q > 0).map(([platId, qty]) => ({ platId, qty }));
        const n = items.reduce((t, x) => t + x.qty, 0);
        usageBox.innerHTML = n ? `<div class="section-head"><h2>Aperçu</h2></div>` + usageHTML(DB.usage(items)) : '';
        foot.style.display = n ? '' : 'none'; save.textContent = `Enregistrer ${n} vente${n > 1 ? 's' : ''} et déduire`;
      };
      el.querySelectorAll('[data-plat]').forEach((row) => row.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => {
        const id = row.dataset.plat; salesDraft[id] = Math.max(0, (salesDraft[id] || 0) + Number(b.dataset.d));
        const o = row.querySelector('output'); o.textContent = salesDraft[id]; haptic(6); upd();
      })));
      upd();
      save.addEventListener('click', async () => {
        const items = Object.entries(salesDraft).filter(([, q]) => q > 0).map(([platId, qty]) => ({ platId, qty }));
        try { const n = await btnLoading(save, DB.recordSales(items, 'Saisie manuelle')); salesDraft = {}; haptic([15, 30, 15]); toast(`Stock mis à jour · ${n} ingrédient${n > 1 ? 's' : ''} déduit${n > 1 ? 's' : ''}`); render({ silent: true }); } catch (e) { fail(e); }
      });
      const pb = el.querySelector('[data-pending]');
      pb && pb.addEventListener('click', async () => {
        const items = DB.pendingSales().map((x) => ({ platId: x.platId, qty: x.qty, saleId: x.id }));
        try { const n = await btnLoading(pb, DB.recordSales(items, 'Caisse')); confetti(); toast(`Ventes déduites · ${n} mouvement${n > 1 ? 's' : ''} de stock`); render({ silent: true }); } catch (e) { fail(e); }
      });
      el.querySelector('[data-impsales]').addEventListener('click', () => pickTable('ventes', ['code caisse', 'plat'], (rows) => {
        const head = rows.shift().map(norm);
        const iCode = head.findIndex((h) => h.startsWith('code')); const iPlat = head.findIndex((h) => h === 'plat' || h.startsWith('plat')); const iQ = head.findIndex((h) => h.includes('quantit'));
        if (iQ < 0 || (iCode < 0 && iPlat < 0)) { toast('Colonnes « Plat » et « Quantité vendue » introuvables', 'warn'); return; }
        let n = 0, miss = 0; salesDraft = {};
        rows.forEach((r) => { const q = num(r[iQ]); if (isNaN(q) || q <= 0) return; const pl = DB.plats.find((x) => (iCode >= 0 && x.code && norm(x.code) === norm(r[iCode])) || (iPlat >= 0 && norm(x.name) === norm(r[iPlat]))); if (pl) { salesDraft[pl.id] = (salesDraft[pl.id] || 0) + Math.round(q); n += Math.round(q); } else miss++; });
        render({ silent: true }); toast(`${n} plat${n > 1 ? 's' : ''} importé${n > 1 ? 's' : ''}${miss ? ` · ${miss} ligne${miss > 1 ? 's' : ''} inconnue${miss > 1 ? 's' : ''}` : ''} : vérifie puis enregistre`, miss ? 'info' : 'ok');
      }));
      const sim = el.querySelector('[data-sim]'); sim && sim.addEventListener('click', async () => { await btnLoading(sim, DB.simulateCash()); toast('Service de midi reçu de la caisse', 'info'); render({ silent: true }); });
      const rf = el.querySelector('[data-refresh]'); rf && rf.addEventListener('click', async () => { try { await btnLoading(rf, DB.refreshSales()); render({ silent: true }); } catch (e) { fail(e); } });
    }
  };

  /* ---------- Carte et fiches recettes ---------- */
  routes.recipes = {
    auth: true, live: true, cls: 'no-nav',
    render: () => `<div class="back-row">${backBtn()}<span></span></div>
      <h1 class="page-title">Carte et recettes</h1>
      <p class="page-sub">Quantités utilisées pour une portion. C'est ce qui permet de déduire le stock à chaque vente.</p>
      <div class="stack-cards stagger recipe-grid" style="margin-top:14px">${DB.plats.map((pl) => `<button class="card card-pad press-soft" data-pl="${pl.id}" style="width:100%;text-align:left"><div style="display:flex;justify-content:space-between;gap:10px"><b>${esc(pl.name)}</b><span class="num" style="color:var(--ink-2)">${euro(pl.price)}</span></div>
        <div style="font-size:13px;color:var(--ink-2);margin-top:4px">${pl.recipe.slice(0, 5).map((r) => { const p = DB.product(r.productId); return p ? esc(p.name.split(' (')[0]) : ''; }).filter(Boolean).join(' · ')}${pl.recipe.length > 5 ? ` · +${pl.recipe.length - 5}` : ''}</div>
        <div style="font-size:12.5px;color:var(--ink-3);margin-top:6px">Code caisse ${esc(pl.code || '—')} · coût matière ≈ ${euro(pl.recipe.reduce((t, r) => { const p = DB.product(r.productId); return t + (p ? p.price * r.qty : 0); }, 0))}</div></button>`).join('') || '<div class="empty">Aucun plat. Ajoute-les dans la table « Plats » d\'Airtable.</div>'}</div>`,
    mount: (el) => {
      bindBack(el);
      el.querySelectorAll('[data-pl]').forEach((b) => b.addEventListener('click', () => openRecipe(DB.plat(b.dataset.pl))));
    }
  };
  function openRecipe(pl) {
    const rowH = (r) => { const p = DB.product(r.productId); if (!p) return ''; return `<div class="row" data-rp="${p.id}"><span class="grow"><span class="title">${esc(p.name)}</span><span class="meta">par portion</span></span><label class="inv-input"><input type="number" inputmode="decimal" step="0.001" min="0" value="${r.qty}"><span>${esc(p.unit)}</span></label></div>`; };
    sheet(`<h3>${esc(pl.name)}</h3><p class="page-sub" style="margin-top:4px">Mets 0 pour retirer un ingrédient.</p><div class="list" style="margin-top:12px" data-rl>${pl.recipe.map(rowH).join('')}</div>
      <button class="btn btn-ghost press" style="margin-top:12px;border-style:dashed" data-add>${ic('plus')}Ajouter un ingrédient</button>`,
    (sh) => {
      const bind = (row) => { const inp = row.querySelector('input'); inp.addEventListener('change', async () => { const q = num(inp.value); if (isNaN(q)) return; try { await DB.setRecipeQty(pl.id, row.dataset.rp, q); if (q <= 0) row.classList.add('removing'); toast('Recette mise à jour'); } catch (e) { fail(e); } }); };
      sh.querySelectorAll('[data-rp]').forEach(bind);
      sh.querySelector('[data-add]').addEventListener('click', () => pickProduct(null, async (pid) => {
        try { await DB.setRecipeQty(pl.id, pid, 0.1); const d = document.createElement('div'); d.innerHTML = rowH({ productId: pid, qty: 0.1 }); const row = d.firstElementChild; sh.querySelector('[data-rl]').appendChild(row); bind(row); row.querySelector('input').focus(); } catch (e) { fail(e); }
      }, true));
    });
  }

  /* ---------- Compte, RGPD, mentions légales ---------- */
  function openAccount() {
    const user = S.get('user', {}) || {};
    sheet(`<h3>Mon compte</h3>
      <div class="field"><label for="ac-name">Nom</label><input id="ac-name" value="${esc(clean(user.name || ''))}"></div>
      <div class="field"><label for="ac-mail">E-mail de connexion</label><input id="ac-mail" type="email" inputmode="email" value="${esc(user.email || '')}"><span class="err"></span></div>
      <p style="font-size:13px;color:var(--ink-2);margin:8px 2px 0">Le changement d'e-mail est aussi fait dans la table Utilisateurs d'Airtable.</p>
      <button class="btn btn-primary press ripple-host" style="margin-top:16px" data-ok>Enregistrer</button>`,
    (sh, close) => sh.querySelector('[data-ok]').addEventListener('click', async (e) => {
      const mail = sh.querySelector('#ac-mail').value.trim(); const name = sh.querySelector('#ac-name').value.trim();
      if (!/^\S+@\S+\.\S+$/.test(mail)) { const f = sh.querySelector('#ac-mail').parentElement; f.classList.add('error'); f.querySelector('.err').textContent = 'Adresse e-mail invalide.'; return; }
      try { if (mail !== user.email) await btnLoading(e.currentTarget, DB.updateUserEmail(user, mail)); S.set('user', Object.assign({}, user, { email: mail, name: name || user.name })); S.set('lastEmail', mail); close(); toast('Compte mis à jour'); render({ silent: true }); } catch (err) { fail(err); }
    }));
  }
  function openPassword() {
    sheet(`<h3>Mot de passe et sécurité</h3>
      <p class="page-sub" style="margin-top:4px">Restock se connecte avec ton e-mail Google : pas de mot de passe à retenir. Ici, tu peux définir un code d'accès pour verrouiller l'app sur la tablette de la cuisine.</p>
      <div class="field"><label for="pw1">Nouveau code (4 à 6 chiffres)</label><input id="pw1" type="password" inputmode="numeric" maxlength="6" autocomplete="new-password"></div>
      <div class="field"><label for="pw2">Confirmer le code</label><input id="pw2" type="password" inputmode="numeric" maxlength="6" autocomplete="new-password"><span class="err"></span></div>
      <div class="btn-row" style="margin-top:16px">${S.get('pin', '') ? '<button class="btn btn-ghost press" data-off>Retirer le code</button>' : ''}<button class="btn btn-primary press ripple-host" data-ok>Enregistrer</button></div>`,
    (sh, close) => {
      sh.querySelector('[data-ok]').addEventListener('click', async () => {
        const a = sh.querySelector('#pw1').value, b = sh.querySelector('#pw2').value; const f = sh.querySelector('#pw2').parentElement;
        if (!/^\d{4,6}$/.test(a)) { f.classList.add('error'); f.querySelector('.err').textContent = 'Le code doit faire 4 à 6 chiffres.'; return; }
        if (a !== b) { f.classList.add('error'); f.querySelector('.err').textContent = 'Les deux codes ne correspondent pas.'; return; }
        const h = await sha(a); S.set('pin', h); close(); toast("Code d'accès enregistré");
      });
      const off = sh.querySelector('[data-off]'); off && off.addEventListener('click', () => { S.del('pin'); close(); toast("Code d'accès retiré", 'info'); });
    });
  }
  async function sha(t) { try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('restock:' + t)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); } catch (e) { return btoa(t); } }
  function openTeam() {
    const list = S.get('team', ['chef@lentrecote-nantes.example.com', 'second@lentrecote-nantes.example.com']);
    const draw = (sh) => { sh.querySelector('[data-tl]').innerHTML = list.map((m, i) => `<div class="row"><span class="m-ico" style="background:var(--neutral-bg)">${ic('mail')}</span><span class="grow"><span class="title">${esc(m)}</span></span><button class="icon-btn press" data-rm="${i}" aria-label="Retirer">${ic('x')}</button></div>`).join('') || '<div class="row"><span class="meta">Personne pour l\'instant.</span></div>';
      sh.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => { list.splice(Number(b.dataset.rm), 1); S.set('team', list); draw(sh); })); };
    sheet(`<h3>Équipe qui reçoit l'alerte</h3><p class="page-sub" style="margin-top:4px">Le récap du matin part par e-mail à ces adresses.</p><div class="list" style="margin-top:12px" data-tl></div>
      <div class="field" style="display:flex;gap:8px;align-items:flex-end"><div style="flex:1"><label for="tm">Ajouter un e-mail</label><input id="tm" type="email" inputmode="email" placeholder="prenom@restaurant.fr"></div><button class="btn btn-primary press" style="width:auto;height:50px" data-add>${ic('plus')}</button></div>`,
    (sh) => { draw(sh); sh.querySelector('[data-add]').addEventListener('click', () => { const v = sh.querySelector('#tm').value.trim(); if (!/^\S+@\S+\.\S+$/.test(v)) { toast('E-mail invalide', 'warn'); return; } list.push(v); S.set('team', list); sh.querySelector('#tm').value = ''; draw(sh); }); });
  }
  function openSetupImport() {
    sheet(`<h3>Configuration initiale</h3><p class="page-sub" style="margin-top:4px">Pour démarrer vite : remplis le modèle dans Excel ou Google Sheets (fournisseurs, e-mails, jours de livraison), puis importe-le.</p>
      <div class="list" style="margin-top:14px">
        <button class="row press-soft" data-tpl><span class="m-ico" style="background:var(--ok-bg);color:var(--ok)">${ic('download')}</span><span class="grow"><span class="title">Télécharger le modèle fournisseurs</span><span class="meta">Pré-rempli avec tes fournisseurs actuels</span></span></button>
        <button class="row press-soft" data-imp><span class="m-ico" style="background:var(--orange-soft);color:var(--orange-deep)">${ic('upload')}</span><span class="grow"><span class="title">Importer les fournisseurs</span><span class="meta">Fichier Excel ou CSV</span></span></button>
        <button class="row press-soft" data-prod><span class="m-ico" style="background:var(--neutral-bg)">${ic('download')}</span><span class="grow"><span class="title">Exporter les produits</span><span class="meta">Liste complète avec prix et seuils</span></span></button>
      </div>`,
    (sh, close) => {
      sh.querySelector('[data-tpl]').addEventListener('click', () => { downloadCSV('fournisseurs-restock.csv', [['Fournisseur', 'E-mail de commande', 'Jours de livraison', 'Délai (jours)']].concat(DB.suppliers.map((s) => [clean(s.name), s.email, s.days, s.delay]))); toast('Modèle téléchargé'); });
      sh.querySelector('[data-prod]').addEventListener('click', () => { downloadCSV('produits-restock.csv', [['Produit', 'Catégorie', 'Fournisseur', 'Unité', 'Unités par colis', 'Seuil d\'alerte', 'Prix HT']].concat(DB.products.map((p) => [p.name, p.cat, clean(DB.supplier(p.supplierId) && DB.supplier(p.supplierId).name), p.unit, p.cond, p.seuil, String(p.price).replace('.', ',')]))); toast('Produits exportés'); });
      sh.querySelector('[data-imp]').addEventListener('click', () => pickTable('fournisseur', ['fournisseur', 'nom'], async (rows) => {
        const head = rows.shift().map(norm);
        const iN = head.findIndex((h) => h.startsWith('fournisseur') || h === 'nom'); const iE = head.findIndex((h) => h.includes('mail')); const iJ = head.findIndex((h) => h.startsWith('jours')); const iD = head.findIndex((h) => h.startsWith('delai'));
        if (iN < 0) { toast('Colonne « Fournisseur » introuvable', 'warn'); return; }
        close(); toast('Import en cours…', 'info');
        try { let n = 0; for (const r of rows) { if (!r[iN] || !r[iN].trim()) continue; await DB.upsertSupplier({ name: r[iN].trim(), email: iE >= 0 ? r[iE].trim() : '', days: iJ >= 0 ? r[iJ].trim() : '', delay: iD >= 0 ? num(r[iD]) : 0 }); n++; } DB.emit(); toast(`${n} fournisseur${n > 1 ? 's' : ''} importé${n > 1 ? 's' : ''}`); } catch (e) { fail(e); }
      }));
    });
  }
  const LEGAL = {
    rgpd: ['Données personnelles (RGPD)', `<p>Restock traite uniquement les données nécessaires à la gestion du stock du restaurant : nom et e-mail des membres de l'équipe, coordonnées professionnelles des fournisseurs, produits, mouvements de stock, ventes et commandes.</p>
      <h3>Finalité</h3><p>Suivre le stock, préparer les commandes fournisseurs et envoyer l'alerte du matin à l'équipe. Aucune donnée n'est revendue ni utilisée à des fins publicitaires.</p>
      <h3>Base légale</h3><p>Exécution du contrat de service avec le restaurant et intérêt légitime pour la sécurité des données.</p>
      <h3>Hébergement</h3><p>Données stockées dans Airtable (base « Restock »). Automatisations réalisées avec Make. La lecture des bons de livraison utilise un service d'IA : seules les photos des bons lui sont transmises.</p>
      <h3>Durée de conservation</h3><p>Tant que le compte du restaurant est actif, puis 12 mois après la résiliation. Les bons de livraison sont conservés 10 ans (obligation comptable).</p>
      <h3>Tes droits</h3><p>Tu peux demander l'accès, la rectification, la portabilité (export CSV) ou la suppression de tes données à tout moment, depuis l'app ou par e-mail au responsable du restaurant. Tu peux aussi saisir la CNIL (cnil.fr).</p>
      <h3>Sur cet appareil</h3><p>L'app garde en local ton jeton Airtable, tes préférences et ton code d'accès (chiffré). « Effacer les données de cet appareil » les supprime.</p>`],
    mentions: ['Mentions légales', `<p><b>Restock</b> est un prototype réalisé dans le cadre du module « Projet no-code & IA » (MDS, B2 2026-2027). Les données de L'Entrecôte Nantes, des fournisseurs et des prix sont fictives.</p>
      <h3>Éditeur</h3><p>Mathéo Brousseau, étudiant. Contact : par l'intermédiaire de l'école.</p>
      <h3>Hébergement</h3><p>Application web hébergée par GitHub Pages (GitHub Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis). Données hébergées par Airtable (Formagrid Inc., San Francisco).</p>
      <h3>Propriété intellectuelle</h3><p>La marque Restock, la mascotte Coco et l'interface sont la propriété de leur auteur. Les noms de restaurants et de fournisseurs sont utilisés à titre d'exemple.</p>
      <h3>Cookies</h3><p>Aucun cookie publicitaire ni de mesure d'audience. Seul le stockage local du navigateur est utilisé pour faire fonctionner l'app.</p>`]
  };
  routes.legal = {
    auth: false, cls: 'no-nav',
    render: (k) => { const d = LEGAL[k] || LEGAL.mentions; return `<div class="back-row">${backBtn()}<span></span></div><h1 class="page-title">${d[0]}</h1><div class="card card-pad legal" style="margin-top:14px">${d[1]}</div>${k === 'rgpd' ? `<button class="btn btn-ghost press" style="margin-top:14px;color:var(--crit-ink)" data-wipe>${ic('trash')}Effacer les données de cet appareil</button>` : ''}`; },
    mount: (el) => { bindBack(el); const w = el.querySelector('[data-wipe]'); w && w.addEventListener('click', () => { try { Object.keys(localStorage).filter((k) => k.startsWith('restock.')).forEach((k) => localStorage.removeItem(k)); } catch (e) {} toast('Données de cet appareil effacées'); setTimeout(() => location.reload(), 900); }); }
  };

  /* ---------- Profil ---------- */
  routes.profile = {
    tab: 'profile', auth: true, live: true,
    render: () => {
      const user = S.get('user', {}) || {}; const time = S.get('alertTime', '07:00'); const recap = S.get('recap', true); const team = S.get('team', ['chef@lentrecote-nantes.example.com', 'second@lentrecote-nantes.example.com']);
      const row = (icon, label, value, go, extra = '', sub = '') => `<button class="row press-soft ripple-host" ${go ? `data-go="${go}"` : ''} ${extra}><span class="m-ico" style="background:var(--neutral-bg)">${ic(icon)}</span><span class="grow"><span class="title">${label}</span>${sub ? `<span class="meta">${sub}</span>` : ''}</span>${value != null ? `<b class="num" style="color:var(--ink-2);font-weight:600">${value}</b>` : ''}${ic('chev', 'chev')}</button>`;
      return `<h1 class="page-title">Profil</h1>
        <div class="stagger profile-grid">
          <div class="card card-pad" style="display:flex;gap:14px;align-items:center;margin-top:16px"><span class="avatar" style="width:56px;height:56px;font-size:19px;background:var(--cafe);color:var(--creme)">${esc(DB.restaurant.initials || 'LE')}</span><div style="min-width:0"><div style="font-weight:700;font-size:18px">${esc(DB.restaurant.name)}</div><div style="font-size:13px;color:var(--ink-2)">${esc(clean(user.name || ''))}${user.role ? ' · ' + esc(user.role.toLowerCase()) : ''}</div></div></div>
          <div><div class="section-head"><h2>Mon compte</h2></div>
            <div class="list">${row('mail', 'E-mail de connexion', null, null, 'data-account', esc(user.email || ''))}${row('lock', 'Mot de passe et sécurité', null, null, 'data-pass', S.get('pin', '') ? "Code d'accès activé" : 'Connexion Google')}</div></div>
          <div><div class="section-head"><h2>Alerte du matin</h2></div>
            <div class="card card-pad"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><div style="font-weight:700">Heure d'envoi</div><div style="font-size:13px;color:var(--ink-2)">Tous les jours, à l'heure de ton choix</div></div>
              <input type="time" class="time-input" value="${esc(time)}" step="300" aria-label="Heure de l'alerte" data-time></div></div>
            <div class="card card-pad" style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;gap:12px"><div><div style="font-weight:700">Récap par e-mail</div><div style="font-size:13px;color:var(--ink-2)">À l'équipe de cuisine</div></div><button class="switch ${recap ? 'on' : ''}" role="switch" aria-checked="${recap}" aria-label="Récap par e-mail" data-recap></button></div>
            <div class="list" style="margin-top:10px">${row('team', 'Destinataires', team.length, null, 'data-team', 'Qui reçoit l\'alerte')}</div></div>
          <div><div class="section-head"><h2>Restaurant</h2></div>
            <div class="list">${row('box', 'Produits et seuils', DB.products.length, '/stock')}${row('truck', 'Fournisseurs et livraisons', DB.suppliers.length, '/suppliers')}${row('doc', 'Carte et recettes', DB.plats.length, '/recipes')}${row('receipt', 'Ventes du service', null, '/sales')}${row('history', 'Historique des bons', DB.bons.length, '/bons')}${row('upload', 'Configuration (Excel)', null, null, 'data-setup', 'Importer fournisseurs, exporter produits')}${row('link', 'Connexion Airtable', DB.mode === 'live' && !DB.error ? 'Connecté' : 'Démo', null, 'data-airtable')}</div></div>
          <div><div class="section-head"><h2>Légal</h2></div>
            <div class="list">${row('shield', 'Données personnelles (RGPD)', null, '/legal/rgpd')}${row('doc', 'Mentions légales', null, '/legal/mentions')}</div></div>
          ${DB.mode === 'demo' ? `<button class="btn btn-ghost press" style="margin-top:14px" data-reset>${ic('refresh')}Réinitialiser la démo</button>` : ''}
          <button class="btn btn-ghost press" style="margin-top:10px;color:var(--crit-ink)" data-logout>${ic('logout')}Se déconnecter</button>
          <p style="text-align:center;font-size:12.5px;color:var(--ink-3);margin-top:16px">Restock · prototype v2 · mobile et tablette</p>
        </div>`;
    },
    mount: (el) => {
      bindLinks(el);
      const t = el.querySelector('[data-time]');
      t.addEventListener('change', () => { if (!t.value) return; S.set('alertTime', t.value); haptic(8); toast("Alerte programmée à " + t.value.replace(':', ' h ')); });
      el.querySelector('[data-recap]').addEventListener('click', (e) => { const on = !e.currentTarget.classList.contains('on'); e.currentTarget.classList.toggle('on', on); e.currentTarget.setAttribute('aria-checked', on); S.set('recap', on); });
      el.querySelector('[data-account]').addEventListener('click', openAccount);
      el.querySelector('[data-pass]').addEventListener('click', openPassword);
      el.querySelector('[data-team]').addEventListener('click', openTeam);
      el.querySelector('[data-setup]').addEventListener('click', openSetupImport);
      el.querySelector('[data-airtable]').addEventListener('click', openAirtableSettings);
      const r = el.querySelector('[data-reset]'); r && r.addEventListener('click', () => { DB.resetDemo(); toast('Démo réinitialisée'); });
      el.querySelector('[data-logout]').addEventListener('click', () => { S.del('user'); stack = []; go('/login', 'fade'); });
    }
  };

  /* ================= Démarrage ================= */
  location.replace('#/splash');
  render();
  DB.load();
})();
