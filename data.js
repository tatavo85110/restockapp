/* =========================================================
   Restock — couche de données
   - Mode « Airtable » : lit et écrit dans la base Restock (app4eyVigTRa7P2AK)
     avec un jeton personnel collé dans Profil > Connexion Airtable.
   - Mode « démo » : copie des données Airtable du 18/11/2026, en mémoire.
   ========================================================= */
(function () {
  const BASE_ID = 'app4eyVigTRa7P2AK';
  const API = 'https://api.airtable.com/v0/' + BASE_ID + '/';
  const CONTENT_API = 'https://content.airtable.com/v0/' + BASE_ID + '/';
  const T = {
    restaurants: 'tblBrmT6BE44zr02H', users: 'tblyqT33TW2q7OKOl', suppliers: 'tblHoDAFWL3kKT4CO',
    products: 'tblbEa4ULdsrZ4YDI', moves: 'tblrRxnGz9g7NIXc6', bons: 'tblI0Jw9UjhtFn9Jw',
    bonLines: 'tblUKMghDaTxxLhF8', orders: 'tblMIwvcclRHgJBJc', orderLines: 'tblh8v2DGszbDveOR'
  };

  /* ---------- Instantané démo (Airtable, 18/11/2026) ---------- */
  const S = {
    BG: 'recBcvOk1jwRjA1ng', CN: 'recDIc5PFDOCbBlEI', EO: 'recDgXTpIxMGCBMC9', CV: 'recKjYjAk68qkX7aW', FH: 'recRDjBbQxeQZk8LX',
    PV: 'recTpKyzsmh7xfa4d', BA: 'recVkqnyaUYZPYiE7', BL: 'recXe4Bx38MQZtuZJ', GD: 'recagScAN9KhNtVoA'
  };
  const demoSuppliers = [
    [S.BG, 'Boulangerie Graslin (fictif)', 'fournil@boulangerie-graslin.example.com', 1, 'Boulangerie', 'Tous les jours'],
    [S.CN, 'Crèmerie Nantaise Pro (fictif)', 'commande@cremerie-nantaise.example.com', 2, 'Crèmerie', 'Mar, Ven'],
    [S.EO, 'Épicerie Ouest Distribution (fictif)', 'cde@epicerie-ouest.example.com', 3, 'Épicerie', 'Mer'],
    [S.CV, 'Cave des Vignerons Bordelais (fictif)', 'ventes@cave-vignerons.example.com', 5, 'Cave', 'Jeu'],
    [S.FH, 'Fromagerie des Halles (fictif)', 'halles@fromagerie.example.com', 2, 'Fromager', 'Ven'],
    [S.PV, 'Primeurs du Val de Loire (fictif)', 'pro@primeurs-valdeloire.example.com', 1, 'Primeur', 'Lun à Sam'],
    [S.BA, 'Boucherie Atlantique Viandes (fictif)', 'commandes@atlantique-viandes.example.com', 1, 'Boucherie', 'Mar, Jeu, Sam'],
    [S.BL, 'Boissons Loire Océan (fictif)', 'chr@boissons-loireocean.example.com', 3, 'Boissons', 'Mer'],
    [S.GD, 'Glaces & Desserts Bretagne Sud (fictif)', 'pro@glaces-bretagnesud.example.com', 4, 'Desserts & glaces', 'Jeu']
  ];
  // id, nom, catégorie, fournisseur, unité, stock, seuil, conditionnement, conso/jour, prix
  const demoProducts = [
    ['rec0XVIgXgjFHuSSn', 'Faux-filet de bœuf paré', 'Viande', S.BA, 'kg', 138.6, 40, 10, 26, 24.5],
    ['rec0YadjmmJkjq14i', 'Sucre semoule', 'Desserts', S.EO, 'kg', 16.1, 5, 10, 1.2, 1.1],
    ['rec1FBH6zueU6Ug2R', 'Persil plat (botte)', 'Sauce & condiments', S.PV, 'pièce', 15, 8, 10, 3, 0.9],
    ['rec359OoEr80Vuxyg', 'Citrons', 'Fruits', S.PV, 'kg', 2.9, 2, 5, 0.5, 3.2],
    ['rec6DuU3s0A0sOw0x', 'Salade batavia', 'Légumes & salade', S.PV, 'pièce', 91, 36, 12, 38, 1.2],
    ['rec7mbArXptIwG776', 'Eau minérale plate 100cl', 'Boissons', S.BL, 'bouteille', 61, 36, 12, 20, 0.65],
    ['rec9ZJTTkRnmpg0Px', 'Glace vanille (bac 5L)', 'Desserts', S.GD, 'L', 6, 10, 10, 2.4, 6.5],
    ['rec9kwJbHWRIhzdA8', "Rosé de L'Entrecôte 75cl", 'Vins', S.CV, 'bouteille', 11, 18, 6, 5, 5.8],
    ['recBXCqmay4mgWjwR', 'Fruits de saison (salade de fruits)', 'Fruits', S.PV, 'kg', 14.9, 6, 5, 2.2, 4.5],
    ['recBfYfIgv9gNQyYb', 'Estragon frais (botte)', 'Sauce & condiments', S.PV, 'pièce', 9, 5, 10, 1.5, 1.5],
    ['recDyGUvgyJIIczwN', 'Huile de tournesol (friture)', 'Sauce & condiments', S.EO, 'L', 61.4, 40, 20, 9, 1.9],
    ['recMElZoBzZYAvlo1', 'Sorbet citron (bac 5L)', 'Desserts', S.GD, 'L', 9, 6, 10, 1.1, 7],
    ['recOQCFTepOYqOGOB', 'Meringues', 'Desserts', S.GD, 'pièce', 78, 30, 50, 12, 0.35],
    ['recOyglVwU1M1kTsO', 'Poivre noir moulu', 'Sauce & condiments', S.EO, 'kg', 0.8, 0.5, 1, 0.08, 18],
    ['recPGz7FiaCOwNVLf', 'Échalotes', 'Sauce & condiments', S.PV, 'kg', 2.4, 4, 5, 0.9, 3.8],
    ['recParcJTIuNZD6ew', 'Baguette tradition', 'Pain', S.BG, 'pièce', 104, 30, 10, 55, 0.95],
    ['recQfodhqZApeIhWB', 'Crème de marrons', 'Desserts', S.EO, 'kg', 5.6, 2, 6, 0.45, 9.5],
    ['recRDYaVE2KGr3m16', 'Kirsch (cuisine)', 'Desserts', S.EO, 'bouteille', 5, 2, 6, 0.2, 16],
    ['recSfdatC5AVJqbIr', 'Ananas', 'Fruits', S.PV, 'pièce', 16, 6, 6, 2.5, 2.8],
    ['recTjST29r1q2i0w9', "Bordeaux rouge de L'Entrecôte AOC 37,5cl", 'Vins', S.CV, 'bouteille', 61, 36, 12, 14, 3.9],
    ['recUjKDXZWL8kKcZS', 'Pommes de terre Agria (allumettes)', 'Légumes & salade', S.PV, 'kg', 165.5, 120, 25, 45, 1.1],
    ['recVhnWBsiXeKYrlS', 'Œufs frais', 'Crèmerie', S.CN, 'pièce', 177, 90, 180, 40, 0.22],
    ['recZaKzhCmhXroZX3', 'Ail', 'Sauce & condiments', S.PV, 'kg', 1.4, 1, 1, 0.15, 6.5],
    ['recfJZCrwlwzIaaqK', 'Café en grains', 'Boissons', S.BL, 'kg', 2.4, 4, 6, 1.4, 19],
    ['recgBzOG4We10XBQk', 'Chocolat noir de couverture 70%', 'Desserts', S.EO, 'kg', 7.2, 3, 5, 0.7, 12.5],
    ['rechjBJBVOOEP7ZV9', 'Crème liquide 35%', 'Crèmerie', S.CN, 'L', 6, 10, 6, 2.6, 4.2],
    ['reciMmgsnudRHKedJ', 'Vin rouge supérieur 75cl', 'Vins', S.CV, 'bouteille', 20, 12, 6, 2, 11],
    ['reckPVA1Ge8txncmG', 'Vinaigre de vin rouge', 'Sauce & condiments', S.EO, 'L', 5, 3, 6, 0.6, 2.5],
    ['reckzeecMdLPcIR9k', 'Beurre doux AOP', 'Crèmerie', S.CN, 'kg', 22.1, 10, 10, 3.2, 8.9],
    ['recnjqxZe7Dfe9hKH', 'Eau gazeuse 100cl', 'Boissons', S.BL, 'bouteille', 42, 24, 12, 9, 0.75],
    ['recnwJTAMBWQpyxaO', 'Huile de noix', 'Sauce & condiments', S.EO, 'L', 7.3, 2, 6, 0.3, 14],
    ['recpuuJAi15nIx3bq', 'Sel fin', 'Sauce & condiments', S.EO, 'kg', 9.5, 4, 10, 0.8, 0.6],
    ['recrmdSpnhOHTKQpQ', 'Plateau de fromages (assortiment)', 'Fromages', S.FH, 'kg', 5.1, 2, 3, 0.9, 22],
    ['recurV7ruNrM5NAjK', 'Choux à profiteroles', 'Desserts', S.GD, 'pièce', 194, 60, 100, 30, 0.18],
    ['recwSAd81iy3mQHCR', 'Cerneaux de noix', 'Sauce & condiments', S.EO, 'kg', 1.8, 3, 5, 0.9, 16],
    ['recwYyJxNh51NR7MM', 'Lait entier', 'Crèmerie', S.CN, 'L', 11.1, 6, 6, 2, 1.05],
    ['recxYjEr2qSOefW38', "Bordeaux rouge de L'Entrecôte AOC 75cl", 'Vins', S.CV, 'bouteille', 58, 36, 6, 16, 6.5],
    ['recyqfgc5TbmLvvHC', 'Eau minérale plate 50cl', 'Boissons', S.BL, 'bouteille', 29, 48, 24, 22, 0.45],
    ['reczZUhIW5Kvhk3EJ', 'Moutarde de Dijon', 'Sauce & condiments', S.EO, 'kg', 4.4, 2, 5, 0.4, 4.8]
  ];
  // id, réf, date, statut, fournisseur, lignes [id, produit, colis]
  const demoOrders = [
    ['recNLEWhkcfB4rYQ4', 5, '2026-11-18', 'Brouillon', S.CN, [['recT0w6azmlsX0HOy', 'rechjBJBVOOEP7ZV9', 3]]],
    ['recWrd1w9m47WHckO', 6, '2026-11-18', 'Brouillon', S.EO, [['recv4xNDINSkJPYKL', 'recwSAd81iy3mQHCR', 1]]],
    ['recXoI1OyQBay3ME8', 7, '2026-11-18', 'Brouillon', S.BL, [['recjTVmoKTwpFRT1C', 'recyqfgc5TbmLvvHC', 5], ['reckqGzqt2oGYXxyF', 'recfJZCrwlwzIaaqK', 2]]],
    ['recuhBF7cnplKdFod', 8, '2026-11-18', 'Brouillon', S.PV, [['recVSQSVbOwZSYOJl', 'recPGz7FiaCOwNVLf', 2]]],
    ['recNWpdZcs22K0pBQ', 3, '2026-11-16', 'Envoyée', S.CV, [['recwSS16rZUDEm0fu', 'rec9kwJbHWRIhzdA8', 6], ['recyu2u7t3QU9oCEY', 'recxYjEr2qSOefW38', 12]]],
    ['recfdNDuxRa3AL3FU', 4, '2026-11-17', 'Envoyée', S.GD, [['recXtiMwh77VbxOsx', 'rec9ZJTTkRnmpg0Px', 2]]],
    ['recWcK5gWmx2Ec6Yg', 2, '2026-11-10', 'Reçue', S.BL, [['recy3vcCeUveDTm5O', 'recyqfgc5TbmLvvHC', 4], ['rec4fH7aOgj9Q72mX', 'rec7mbArXptIwG776', 10], ['recXGY5gOd4XCIirP', 'recnjqxZe7Dfe9hKH', 5]]],
    ['recWciRqjFEDdg9df', 1, '2026-11-10', 'Reçue', S.CV, [['reckmVktY0O0WFiEu', 'recxYjEr2qSOefW38', 14], ['recVQA4iTHLfCpwJy', 'recTjST29r1q2i0w9', 6], ['recVJeQ0y2GbAq5tX', 'rec9kwJbHWRIhzdA8', 2], ['recsZd6HljytRpnCl', 'reciMmgsnudRHKedJ', 2]]]
  ];
  // id, réf, date, statut, fournisseur, nb lignes
  const demoBons = [
    ['recTJnYLXL5IGzGa7', 28, '2026-11-18', 'À valider', S.BL, 4],
    ['rec9uIeexvGdeL7vq', 26, '2026-11-17', 'À valider', S.PV, 4],
    ['recfreUhRJr0uy1qH', 25, '2026-11-17', 'Validé', S.BA, 1],
    ['rec5BusAPXzK5FH8f', 27, '2026-11-16', 'Erreur', S.CV, 0],
    ['recvycUFCdtrysuk4', 22, '2026-11-14', 'Validé', S.BA, 1],
    ['rectJEzgyGQSDlJyb', 24, '2026-11-14', 'Validé', S.PV, 5],
    ['recl1Zmm2K7FWCqZx', 23, '2026-11-14', 'Validé', S.BG, 1],
    ['rec8ker2KX5BbzXDU', 19, '2026-11-13', 'Validé', S.CV, 4],
    ['rece8cS23cmhgvbdE', 20, '2026-11-13', 'Validé', S.GD, 2],
    ['recFUsIT0laaW23Hr', 21, '2026-11-13', 'Validé', S.FH, 1],
    ['rec68g7aUrj18GGUA', 17, '2026-11-12', 'Validé', S.BL, 3],
    ['recdAJCB8h4iAIyCa', 18, '2026-11-12', 'Validé', S.EO, 4]
  ];
  // id, bon, libellé lu, quantité (colis), produit
  const demoBonLines = [
    ['recyj2ffkSbH1xbsY', 'recTJnYLXL5IGzGa7', 'EAU MIN PLATE 50CL VERRE X24', 6, 'recyqfgc5TbmLvvHC'],
    ['recdMdoxycfRIOanw', 'recTJnYLXL5IGzGa7', 'EAU MIN PLATE 1L VERRE X12', 4, 'rec7mbArXptIwG776'],
    ['recMtMeSRh2VoZ5C7', 'recTJnYLXL5IGzGa7', 'EAU GAZ IL VERRE X12', 3, 'recnjqxZe7Dfe9hKH'],
    ['rechFyZL0gIglZJ9T', 'recTJnYLXL5IGzGa7', 'CAFE GRAINS ESPRESSO 6X1KG', 1, 'recfJZCrwlwzIaaqK'],
    ['recRI4GkjxB2ICem1', 'rec9uIeexvGdeL7vq', 'PDT AGRIA CAL 50+ SAC 25KG', 6, 'recUjKDXZWL8kKcZS'],
    ['recQDlsIbMf2WBcnb', 'rec9uIeexvGdeL7vq', 'BATAVIA BLONDE CAT1 COLIS 12', 10, 'rec6DuU3s0A0sOw0x'],
    ['recnIM9hd0GSs1FmE', 'rec9uIeexvGdeL7vq', 'ECHALOTE GRISE FILET 5KG', 2, 'recPGz7FiaCOwNVLf'],
    ['recRGgwnm2g5ErrOl', 'rec9uIeexvGdeL7vq', 'MACHE NANTAISE BQ 500G', 4, null]
  ];

  /* ---------- Outils ---------- */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const todayISO = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  const first = (v) => (Array.isArray(v) ? v[0] : v);
  const sel = (v) => (v && typeof v === 'object' ? v.name : v);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('restock.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('restock.' + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem('restock.' + k); } catch (e) {} }
  };
  let uid = 0;
  const fakeId = () => 'recDEMO' + Date.now().toString(36).slice(-6) + (uid++);

  /* ---------- Client Airtable ---------- */
  function token() { return store.get('token', ''); }
  async function at(path, opts = {}) {
    const res = await fetch(API + path, {
      method: opts.method || 'GET',
      headers: Object.assign({ Authorization: 'Bearer ' + token() }, opts.body ? { 'Content-Type': 'application/json' } : {}),
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    if (!res.ok) {
      let msg = 'Airtable ' + res.status;
      try { const j = await res.json(); msg += ' · ' + (j.error && (j.error.message || j.error.type || j.error)); } catch (e) {}
      const err = new Error(msg); err.status = res.status; throw err;
    }
    return res.json();
  }
  async function listAll(table, params = {}) {
    const out = []; let offset;
    do {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach((x, i) => {
          if (typeof x === 'object') Object.entries(x).forEach(([kk, vv]) => q.append(k + '[' + i + '][' + kk + ']', vv));
          else q.append(k + '[]', x);
        });
        else q.append(k, v);
      });
      if (offset) q.append('offset', offset);
      const j = await at(table + '?' + q.toString());
      out.push(...j.records); offset = j.offset;
    } while (offset);
    return out;
  }
  const create = (table, records) => at(table, { method: 'POST', body: { records: records.map((f) => ({ fields: f })), typecast: true } });
  const patch = (table, records) => at(table, { method: 'PATCH', body: { records, typecast: true } });
  const byIds = (ids) => 'OR(' + ids.map((id) => "RECORD_ID()='" + id + "'").join(',') + ')';

  /* ---------- État de l'app ---------- */
  const DB = {
    mode: token() ? 'live' : 'demo',
    ready: false, error: null,
    restaurant: { name: "L'Entrecôte Nantes", initials: 'LE', email: '' },
    suppliers: [], products: [], orders: [], bons: [], bonLines: {}, moves: {},
    listeners: new Set(),
    on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
    emit() { this.listeners.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } }); },

    supplier(id) { return this.suppliers.find((s) => s.id === id); },
    product(id) { return this.products.find((p) => p.id === id); },
    bon(id) { return this.bons.find((b) => b.id === id); },
    order(id) { return this.orders.find((o) => o.id === id); },
    level(p) { if (p.qty <= p.seuil * 0.5) return 'crit'; if (p.qty <= p.seuil) return 'low'; return 'ok'; },
    toOrderColis(p) {
      if (p.qty > p.seuil) return 0;
      return Math.max(1, Math.ceil(Math.max(0, p.seuil + p.conso * 7 - p.qty) / (p.cond || 1)));
    },
    inOrder(p) { return this.orders.some((o) => (o.status === 'Brouillon' || o.status === 'Envoyée') && o.lines.some((l) => l.productId === p.id)); },
    orderTotal(o) { return o.lines.reduce((s, l) => { const p = this.product(l.productId); return s + (p ? l.qty * p.cond * p.price : 0); }, 0); },

    setToken(t) {
      if (t) store.set('token', t.trim()); else store.del('token');
      this.mode = t ? 'live' : 'demo';
      return this.load();
    },

    async load() {
      this.error = null;
      try {
        if (this.mode === 'live') await this.loadLive();
        else { await sleep(700); this.loadDemo(); }
      } catch (e) {
        console.error(e);
        this.error = e.message || String(e);
        if (!this.products.length) this.loadDemo();
      }
      this.ready = true; this.emit();
    },

    loadDemo() {
      const keep = store.get('demoState', null);
      this.suppliers = demoSuppliers.map(([id, name, email, delay, cat, days]) => ({ id, name, email, delay, cat, days }));
      this.products = demoProducts.map(([id, name, cat, supplierId, unit, qty, seuil, cond, conso, price]) => ({ id, name, cat, supplierId, unit, qty, seuil, cond, conso, price }));
      this.orders = demoOrders.map(([id, ref, date, status, supplierId, lines]) => ({ id, ref, date, status, supplierId, lines: lines.map(([lid, productId, qty]) => ({ id: lid, productId, qty })) }));
      this.bons = demoBons.map(([id, ref, date, status, supplierId, n]) => ({ id, ref, date, status, supplierId, lineCount: n }));
      this.bonLines = {};
      demoBonLines.forEach(([id, bonId, label, qty, productId]) => {
        (this.bonLines[bonId] = this.bonLines[bonId] || []).push({ id, bonId, label, qty, productId });
      });
      this.moves = {};
      if (keep && keep.v === 1) Object.assign(this, keep.data);
    },
    saveDemo() {
      if (this.mode !== 'demo') return;
      store.set('demoState', { v: 1, data: { products: this.products, orders: this.orders, bons: this.bons, bonLines: this.bonLines, moves: this.moves } });
    },
    resetDemo() { store.del('demoState'); this.loadDemo(); this.emit(); },

    async loadLive() {
      const [rest, sup, prod, ord, ordLines, bons] = await Promise.all([
        listAll(T.restaurants, { maxRecords: 1 }),
        listAll(T.suppliers),
        listAll(T.products),
        listAll(T.orders),
        listAll(T.orderLines),
        listAll(T.bons, { sort: [{ field: 'Date', direction: 'desc' }], maxRecords: 30 })
      ]);
      if (rest[0]) {
        const n = rest[0].fields['Nom'] || "Restaurant";
        this.restaurant = { name: n, email: rest[0].fields['Email'] || '', initials: n.replace(/^L'/, 'L ').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() };
      }
      this.suppliers = sup.map((r) => ({
        id: r.id, name: r.fields['Nom'] || '—', email: r.fields['Email de commande'] || '', delay: r.fields['Délai de livraison (jours)'] || 0,
        cat: sel(r.fields['Catégorie']) || '', days: r.fields['Jours de livraison'] || ''
      }));
      this.products = prod.map((r) => {
        const f = r.fields;
        return {
          id: r.id, name: f['Nom'] || '—', cat: sel(f['Catégorie']) || 'Autre', supplierId: first(f['Fournisseur']) || null,
          unit: sel(f['Unité']) || '', qty: Math.round((f['Stock actuel'] || 0) * 10) / 10, seuil: f["Seuil d'alerte"] || 0,
          cond: f['Conditionnement'] || 1, conso: f['Conso moyenne / jour'] || 0, price: f['Prix unitaire'] || 0,
          moveIds: f['Mouvements de stock'] || []
        };
      });
      const linesById = {};
      ordLines.forEach((r) => { linesById[r.id] = { id: r.id, productId: first(r.fields['Produit']), qty: r.fields['Quantité commandée'] || 0 }; });
      this.orders = ord.map((r) => ({
        id: r.id, ref: r.fields['Réf'], date: r.fields['Date'] || '', status: sel(r.fields['Statut']) || 'Brouillon',
        supplierId: first(r.fields['Fournisseur']), email: r.fields['Email de commande (texte)'] || '',
        lines: (r.fields['Lignes de commande'] || []).map((id) => linesById[id]).filter(Boolean)
      })).sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.ref - a.ref);
      this.bons = bons.map((r) => ({
        id: r.id, ref: r.fields['Réf'], date: r.fields['Date'] || '', status: sel(r.fields['Statut']) || 'À lire',
        supplierId: first(r.fields['Fournisseur']), lineCount: (r.fields['Lignes de bon'] || []).length,
        lineIds: r.fields['Lignes de bon'] || [], ai: r.fields['Résultat IA (JSON)'] || ''
      }));
      this.moves = {};
    },

    /* ---------- Mouvements d'un produit ---------- */
    async getMoves(productId) {
      if (this.moves[productId]) return this.moves[productId];
      const p = this.product(productId);
      let list = [];
      if (this.mode === 'live') {
        const ids = (p.moveIds || []).slice(-30);
        if (ids.length) {
          const recs = await listAll(T.moves, { filterByFormula: byIds(ids) });
          list = recs.map((r) => ({ id: r.id, type: sel(r.fields['Type']), qty: r.fields['Quantité'] || 0, date: r.fields['Date'] || '', origin: sel(r.fields['Origine']) || '' }));
        }
      } else {
        await sleep(450);
        const d = (n) => { const x = new Date(); x.setDate(x.getDate() - n); return x.toISOString().slice(0, 10); };
        const unitIn = Math.max(p.cond, Math.round(p.seuil));
        list = [
          { id: 'm1', type: 'Sortie', qty: -Math.round(p.conso * 2 * 10) / 10, date: d(0), origin: 'Saisie manuelle' },
          { id: 'm2', type: 'Inventaire', qty: -Math.round(p.conso * 0.3 * 10) / 10 || -1, date: d(1), origin: 'Inventaire' },
          { id: 'm3', type: 'Entrée', qty: unitIn, date: d(4), origin: 'Bon de réception' },
          { id: 'm4', type: 'Sortie', qty: -Math.round(p.conso * 3 * 10) / 10, date: d(5), origin: 'Saisie manuelle' },
          { id: 'm5', type: 'Entrée', qty: unitIn, date: d(9), origin: 'Bon de réception' }
        ];
      }
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      this.moves[productId] = list;
      return list;
    },

    /* ---------- Seuil d'alerte ---------- */
    async setSeuil(productId, value) {
      const p = this.product(productId); p.seuil = value;
      if (this.mode === 'live') await patch(T.products, [{ id: productId, fields: { "Seuil d'alerte": value } }]);
      else { await sleep(350); this.saveDemo(); }
      this.emit();
    },

    /* ---------- Sortie / correction de stock manuelle ---------- */
    async addMove(productId, qty, type) {
      const p = this.product(productId);
      const origin = type === 'Inventaire' ? 'Inventaire' : 'Saisie manuelle';
      if (this.mode === 'live') {
        const r = await create(T.moves, [{ Type: type, 'Quantité': qty, Date: todayISO(), Origine: origin, Produit: [productId] }]);
        (p.moveIds = p.moveIds || []).push(r.records[0].id);
      } else await sleep(400);
      p.qty = Math.round((p.qty + qty) * 10) / 10;
      if (this.moves[productId]) this.moves[productId].unshift({ id: fakeId(), type, qty, date: todayISO(), origin });
      this.saveDemo(); this.emit();
    },

    /* ---------- Ajouter un produit à la commande brouillon du fournisseur ---------- */
    async addToOrder(productId, colis) {
      const p = this.product(productId);
      let o = this.orders.find((x) => x.status === 'Brouillon' && x.supplierId === p.supplierId);
      if (this.mode === 'live') {
        if (!o) {
          const r = await create(T.orders, [{ Date: todayISO(), Statut: 'Brouillon', Fournisseur: [p.supplierId] }]);
          const rec = r.records[0];
          o = { id: rec.id, ref: rec.fields['Réf'], date: todayISO(), status: 'Brouillon', supplierId: p.supplierId, lines: [] };
          this.orders.unshift(o);
        }
        const existing = o.lines.find((l) => l.productId === productId);
        if (existing) { existing.qty += colis; await patch(T.orderLines, [{ id: existing.id, fields: { 'Quantité commandée': existing.qty } }]); }
        else {
          const r = await create(T.orderLines, [{ 'Quantité commandée': colis, Commande: [o.id], Produit: [productId] }]);
          o.lines.push({ id: r.records[0].id, productId, qty: colis });
        }
      } else {
        await sleep(600);
        if (!o) { o = { id: fakeId(), ref: Math.max(0, ...this.orders.map((x) => x.ref || 0)) + 1, date: todayISO(), status: 'Brouillon', supplierId: p.supplierId, lines: [] }; this.orders.unshift(o); }
        const existing = o.lines.find((l) => l.productId === productId);
        if (existing) existing.qty += colis; else o.lines.push({ id: fakeId(), productId, qty: colis });
        this.saveDemo();
      }
      this.emit();
      return o;
    },

    async setOrderLineQty(orderId, lineId, qty) {
      const o = this.order(orderId); const l = o.lines.find((x) => x.id === lineId);
      if (qty <= 0) {
        if (this.mode === 'live') await at(T.orderLines + '/' + lineId, { method: 'DELETE' }); else await sleep(250);
        o.lines = o.lines.filter((x) => x.id !== lineId);
      } else {
        l.qty = qty;
        if (this.mode === 'live') await patch(T.orderLines, [{ id: lineId, fields: { 'Quantité commandée': qty } }]); else await sleep(150);
      }
      this.saveDemo(); this.emit();
    },

    async setOrderStatus(orderId, status) {
      const o = this.order(orderId);
      if (this.mode === 'live') await patch(T.orders, [{ id: orderId, fields: { Statut: status } }]);
      else await sleep(900);
      o.status = status; if (status === 'Envoyée') o.date = todayISO();
      this.saveDemo(); this.emit();
    },

    /* ---------- Bons de réception ---------- */
    async createBon(file) {
      if (this.mode === 'live') {
        const r = await create(T.bons, [{ Date: todayISO(), Statut: 'À lire' }]);
        const id = r.records[0].id;
        if (file) {
          const b64 = await fileToBase64(file);
          const res = await fetch(CONTENT_API + id + '/Photo/uploadAttachment', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ contentType: file.type || 'image/jpeg', file: b64, filename: file.name || 'bon.jpg' })
          });
          if (!res.ok) throw new Error("Photo non envoyée (Airtable " + res.status + ")");
        }
        const bon = { id, ref: r.records[0].fields['Réf'], date: todayISO(), status: 'À lire', supplierId: null, lineCount: 0, lineIds: [] };
        this.bons.unshift(bon); this.emit();
        return bon;
      }
      // Démo : on simule un bon « Crèmerie » que l'IA va lire
      await sleep(500);
      const id = fakeId();
      const bon = { id, ref: Math.max(0, ...this.bons.map((b) => b.ref || 0)) + 1, date: todayISO(), status: 'À lire', supplierId: S.CN, lineCount: 0, demoReadAt: Date.now() + 5200 };
      this.bons.unshift(bon);
      this.bonLines[id] = [
        { id: fakeId(), bonId: id, label: 'BEURRE DX AOP CHARENTES 10X1KG', qty: 2, productId: 'reckzeecMdLPcIR9k' },
        { id: fakeId(), bonId: id, label: 'CREME UHT 35% 1L X6', qty: 5, productId: 'rechjBJBVOOEP7ZV9', flag: true },
        { id: fakeId(), bonId: id, label: 'LAIT ENTIER UHT 1L X6', qty: 2, productId: 'recwYyJxNh51NR7MM' },
        { id: fakeId(), bonId: id, label: 'OEUFS PA CAL M PLT 180', qty: 1, productId: 'recVhnWBsiXeKYrlS' }
      ];
      this.emit();
      return bon;
    },

    /* Relit le statut d'un bon (lecture IA par Make) */
    async refreshBon(id) {
      const bon = this.bon(id);
      if (this.mode === 'live') {
        const r = await at(T.bons + '/' + id);
        bon.status = sel(r.fields['Statut']) || bon.status;
        bon.supplierId = first(r.fields['Fournisseur']) || bon.supplierId;
        bon.lineIds = r.fields['Lignes de bon'] || [];
        bon.lineCount = bon.lineIds.length;
        bon.ai = r.fields['Résultat IA (JSON)'] || '';
      } else {
        await sleep(300);
        if (bon.status === 'À lire' && bon.demoReadAt && Date.now() >= bon.demoReadAt) { bon.status = 'À valider'; bon.lineCount = (this.bonLines[id] || []).length; this.saveDemo(); }
      }
      return bon;
    },

    async getBonLines(bonId) {
      const bon = this.bon(bonId);
      if (this.mode === 'live') {
        if (!bon.lineIds || !bon.lineIds.length) await this.refreshBon(bonId);
        const ids = bon.lineIds || [];
        if (!ids.length) { this.bonLines[bonId] = []; return []; }
        const recs = await listAll(T.bonLines, { filterByFormula: byIds(ids) });
        this.bonLines[bonId] = recs.map((r) => ({ id: r.id, bonId, label: r.fields['Libellé lu'] || '', qty: r.fields['Quantité'] || 0, productId: first(r.fields['Produit']) || null, moveIds: r.fields['Mouvements de stock'] || [] }));
      } else await sleep(350);
      const lines = this.bonLines[bonId] || [];
      // repère les quantités inhabituelles : plus de 2× la commande habituelle (≈ 7 jours de conso)
      lines.forEach((l) => {
        const p = l.productId && this.product(l.productId);
        if (p && l.flag == null) { const usual = Math.max(1, Math.round((p.conso * 7) / p.cond)); l.usual = usual; l.flag = l.qty > usual * 2; }
        else if (p && l.usual == null) l.usual = Math.max(1, Math.round((p.conso * 7) / p.cond));
      });
      return lines;
    },

    async addBonLine(bonId, productId, qty) {
      const p = this.product(productId);
      const line = { id: fakeId(), bonId, label: p.name.toUpperCase(), qty, productId, flag: false, added: true };
      if (this.mode === 'live') {
        const r = await create(T.bonLines, [{ 'Libellé lu': line.label, 'Quantité': qty, Bon: [bonId], Produit: [productId] }]);
        line.id = r.records[0].id;
      } else await sleep(300);
      (this.bonLines[bonId] = this.bonLines[bonId] || []).push(line);
      return line;
    },

    /* Validation : met à jour les lignes, écrit les mouvements d'entrée et passe le bon en « Validé ».
       Les mouvements sont reliés à leur ligne : le scénario Make n°2 ne les recrée donc pas. */
    async validateBon(bonId, lines) {
      const bon = this.bon(bonId);
      const usable = lines.filter((l) => l.productId && l.qty > 0);
      const entries = usable.map((l) => { const p = this.product(l.productId); return { line: l, p, units: Math.round(l.qty * (p.cond || 1) * 10) / 10 }; });
      if (this.mode === 'live') {
        const updates = lines.map((l) => ({ id: l.id, fields: { 'Quantité': l.qty, Produit: l.productId ? [l.productId] : [] } }));
        for (let i = 0; i < updates.length; i += 10) await patch(T.bonLines, updates.slice(i, i + 10));
        const fresh = entries.filter((e) => !(e.line.moveIds && e.line.moveIds.length));
        for (let i = 0; i < fresh.length; i += 10) {
          await create(T.moves, fresh.slice(i, i + 10).map((e) => ({ Type: 'Entrée', 'Quantité': e.units, Date: todayISO(), Origine: 'Bon de réception', Produit: [e.p.id], 'Ligne de bon': [e.line.id] })));
        }
        await patch(T.bons, [{ id: bonId, fields: { Statut: 'Validé' } }]);
      } else await sleep(1100);
      entries.forEach((e) => { e.p.qty = Math.round((e.p.qty + e.units) * 10) / 10; delete this.moves[e.p.id]; });
      bon.status = 'Validé'; bon.lineCount = lines.length;
      this.saveDemo(); this.emit();
      return entries;
    },

    /* ---------- Connexion ---------- */
    async checkUser(email) {
      if (this.mode !== 'live') { await sleep(900); return { name: 'Gérant', role: 'Gérant' }; }
      const recs = await listAll(T.users, { filterByFormula: "LOWER({Email Google})='" + email.toLowerCase().replace(/'/g, "\\'") + "'", maxRecords: 1 });
      if (!recs.length) return null;
      return { name: recs[0].fields['Nom'] || email, role: sel(recs[0].fields['Rôle']) || '' };
    }
  };

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1]);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  window.DB = DB;
  window.RStore = store;
})();
