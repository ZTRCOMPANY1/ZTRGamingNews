
const DATA = window.ZTR_DATA || { news: [], reviews: [], radar: [], events: [], launches: [], platforms: [], promos: [] };
const CONFIG = window.ZTR_CONFIG || {};

function qs(sel, root=document){ return root.querySelector(sel); }
function qsa(sel, root=document){ return [...root.querySelectorAll(sel)]; }
function esc(str=''){ return String(str).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
function slugify(value=''){ return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
function brDate(dateStr){ const d = new Date(dateStr); return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' }); }
function brDateTime(dateStr){ const d = new Date(dateStr); return d.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }); }
function countdown(target){
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return 'Encerrado';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${days}d ${hours}h ${mins}m`;
}
function getParam(name){ return new URLSearchParams(location.search).get(name); }
function storage(key, fallback){ try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

function initHeader(){
  const btn = qs('[data-menu-btn]');
  const nav = qs('[data-mobile-nav]');
  if (btn && nav) btn.addEventListener('click', ()=> nav.classList.toggle('open'));
  qsa('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
}

function articleUrl(slug){ return `../../Artigos/?slug=${encodeURIComponent(slug)}`; }
function platformUrl(slug){ return `../../Plataforma/?platform=${encodeURIComponent(slug)}`; }

function renderCard(item, large=false){
  return `
  <article class="news-card ${large ? 'large' : ''}">
    <a class="card-cover" href="${articleUrl(item.slug)}"><img src="${esc(item.cover)}" alt="${esc(item.title)}"></a>
    <div class="card-body">
      <div class="card-meta-top"><span class="pill">${esc(item.platform)}</span><span>${brDate(item.date)}</span></div>
      <h3><a href="${articleUrl(item.slug)}">${esc(item.title)}</a></h3>
      <p>${esc(item.summary)}</p>
      <div class="card-bottom"><span>${esc(item.source)}</span><a href="${articleUrl(item.slug)}">Ler matéria</a></div>
    </div>
  </article>`;
}

function renderHome(){
  const hero = qs('[data-home-hero]');
  if (!hero) return;
  const featured = DATA.news.filter(n => n.featured);
  const top = featured[0] || DATA.news[0];
  const side = featured.slice(1,4);
  hero.innerHTML = `
    <article class="hero-main">
      <img src="${esc(top.cover)}" alt="${esc(top.title)}">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <span class="pill">Atualizado em ${brDate(DATA.generatedAt)}</span>
        <h1>${esc(top.title)}</h1>
        <p>${esc(top.summary)}</p>
        <div class="card-bottom white"><span>${esc(top.platform)} • ${esc(top.source)}</span><a class="btn btn-primary" href="${articleUrl(top.slug)}">Abrir destaque</a></div>
      </div>
    </article>
    <div class="hero-side">
      ${side.map(item => `<article class="mini-card"><img src="${esc(item.cover)}" alt="${esc(item.title)}"><div><span class="pill small">${esc(item.platform)}</span><h3><a href="${articleUrl(item.slug)}">${esc(item.title)}</a></h3><p>${esc(item.summary)}</p></div></article>`).join('')}
    </div>`;

  const latest = qs('[data-latest-grid]');
  if (latest) latest.innerHTML = DATA.news.slice(0,6).map((n, idx)=>renderCard(n, idx===0)).join('');

  const reviews = qs('[data-reviews-preview]');
  if (reviews) reviews.innerHTML = DATA.reviews.slice(0,2).map(item => `
    <article class="review-card">
      <img src="${esc(item.cover)}" alt="${esc(item.title)}">
      <div class="review-score">${esc(item.score)}</div>
      <div class="card-body"><h3>${esc(item.title)}</h3><p>${esc(item.summary)}</p></div>
    </article>`).join('');

  const radar = qs('[data-radar-preview]');
  if (radar) radar.innerHTML = DATA.radar.slice(0,2).map(item => `
    <article class="radar-card"><img src="${esc(item.cover)}" alt="${esc(item.title)}"><div class="card-body"><span class="pill small">${esc(item.platform)}</span><h3>${esc(item.title)}</h3><p>${esc(item.summary)}</p></div></article>`).join('');

  const popular = qs('[data-popular-list]');
  if (popular) popular.innerHTML = DATA.news.slice(0,5).map((n,i) => `<li><span class="rank">${String(i+1).padStart(2,'0')}</span><div><a href="${articleUrl(n.slug)}">${esc(n.title)}</a><small>${esc(n.platform)} • ${brDate(n.date)}</small></div></li>`).join('');

  const eventCol = qs('[data-events-column]');
  const launchCol = qs('[data-launches-column]');
  if (eventCol) eventCol.innerHTML = DATA.events.map(item => `<article class="list-card"><div><h3>${esc(item.title)}</h3><p>${esc(item.note)}</p></div><div class="list-meta"><span>${brDateTime(item.date)}</span><span>${esc(item.platform)}</span></div></article>`).join('');
  if (launchCol) launchCol.innerHTML = DATA.launches.map(item => `<article class="list-card"><div><h3>${esc(item.title)}</h3><p>${esc(item.note)}</p></div><div class="list-meta"><span>${brDateTime(item.date)}</span><span>${esc(item.platform)}</span></div></article>`).join('');

  const platforms = qs('[data-platform-cards]');
  if (platforms) platforms.innerHTML = DATA.platforms.map(p => `
    <article class="platform-card">
      <a href="${platformUrl(p.slug)}"><img src="${esc(p.cover)}" alt="${esc(p.name)}"></a>
      <div class="card-body"><h3><a href="${platformUrl(p.slug)}">${esc(p.name)}</a></h3><p>${esc(p.desc)}</p><a class="text-link" href="${platformUrl(p.slug)}">Ver notícias da plataforma</a></div>
    </article>`).join('');

  const promoPreview = qs('[data-promo-preview]');
  if (promoPreview) promoPreview.innerHTML = DATA.promos.slice(0,3).map(p => promoCard(p)).join('');
}

function promoCard(item){
  return `
  <article class="promo-card" data-promo-url="${esc(item.url)}">
    <img src="${esc(item.cover)}" alt="${esc(item.title)}">
    <div class="card-body">
      <div class="card-meta-top"><span class="pill ${item.free ? 'free' : ''}">${item.free ? 'Grátis' : esc(item.platform)}</span><span class="countdown" data-countdown="${esc(item.endDate)}">${countdown(item.endDate)}</span></div>
      <h3>${esc(item.title)}</h3>
      <p>${esc(item.summary)}</p>
      <div class="card-bottom"><span>${esc(item.price)}</span><button class="btn btn-primary btn-small" data-go-promo="${esc(item.url)}">Ir para oferta</button></div>
    </div>
  </article>`;
}

function renderNewsPage(){
  const grid = qs('[data-news-grid]');
  if (!grid) return;
  const search = qs('[data-news-search]');
  const buttons = qsa('[data-news-filter]');
  let current = 'Todas';
  function apply(){
    const term = (search?.value || '').toLowerCase().trim();
    const list = DATA.news.filter(item => (current === 'Todas' || item.platform === current) && (!term || [item.title,item.summary,item.source,item.platform].join(' ').toLowerCase().includes(term)));
    grid.innerHTML = list.map(item => renderCard(item)).join('') || '<div class="empty-box">Nenhuma notícia encontrada.</div>';
    const count = qs('[data-news-count]');
    if (count) count.textContent = `${list.length} resultado(s)`;
  }
  buttons.forEach(btn => btn.addEventListener('click', ()=>{ buttons.forEach(b=>b.classList.remove('active')); btn.classList.add('active'); current = btn.dataset.newsFilter; apply(); }));
  if (search) search.addEventListener('input', apply);
  apply();
}

function renderArticle(){
  const root = qs('[data-article-root]');
  if (!root) return;
  const slug = getParam('slug') || DATA.news[0]?.slug;
  const item = DATA.news.find(n => n.slug === slug);
  if (!item){ root.innerHTML = '<div class="empty-box">Matéria não encontrada.</div>'; return; }
  root.innerHTML = `
    <article class="article-shell">
      <header class="article-hero"><img src="${esc(item.cover)}" alt="${esc(item.title)}"><div class="hero-overlay"></div><div class="article-hero-content"><span class="pill">${esc(item.platform)}</span><h1>${esc(item.title)}</h1><p>${esc(item.summary)}</p><div class="card-bottom white"><span>${esc(item.source)} • ${brDate(item.date)} • ${esc(item.readTime)}</span></div></div></header>
      <div class="article-grid">
        <div class="article-content">
          ${item.body.map(p => `<p>${esc(p)}</p>`).join('')}
          <div class="bullet-box"><h3>Pontos principais</h3><ul>${item.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul></div>
          <div class="article-actions"><a class="btn btn-primary" href="../Noticias">Ver todas as notícias</a><button class="btn btn-ghost" data-copy-link>Copiar link</button></div>
        </div>
        <aside class="article-side"><div class="side-panel"><h3>Mais notícias</h3>${DATA.news.slice(0,4).map(n => `<a class="side-link" href="${articleUrl(n.slug)}">${esc(n.title)}</a>`).join('')}</div></aside>
      </div>
    </article>`;
  const copy = qs('[data-copy-link]', root);
  if (copy) copy.addEventListener('click', async()=>{ try{ await navigator.clipboard.writeText(location.href); copy.textContent = 'Link copiado'; }catch{ copy.textContent = 'Não foi possível copiar'; } });
}

function renderPlatforms(){
  const root = qs('[data-platforms-grid]');
  if (!root) return;
  root.innerHTML = DATA.platforms.map(p => `
    <article class="platform-card full">
      <a href="${platformUrl(p.slug)}"><img src="${esc(p.cover)}" alt="${esc(p.name)}"></a>
      <div class="card-body"><h3><a href="${platformUrl(p.slug)}">${esc(p.name)}</a></h3><p>${esc(p.desc)}</p><a class="btn btn-primary btn-small" href="${platformUrl(p.slug)}">Abrir plataforma</a></div>
    </article>`).join('');
}

function renderPlatformDetail(){
  const root = qs('[data-platform-detail]');
  if (!root) return;
  const slug = getParam('platform') || DATA.platforms[0]?.slug;
  const plat = DATA.platforms.find(p => p.slug === slug);
  if (!plat){ root.innerHTML = '<div class="empty-box">Plataforma não encontrada.</div>'; return; }
  const name = plat.name;
  const news = DATA.news.filter(n => n.platform === name || (name === 'PC' && ['Steam','Epic Games','PC'].includes(n.platform)));
  root.innerHTML = `
    <section class="detail-hero"><img src="${esc(plat.cover)}" alt="${esc(plat.name)}"><div class="hero-overlay"></div><div class="detail-hero-content"><span class="pill">Plataforma</span><h1>${esc(plat.name)}</h1><p>${esc(plat.desc)}</p></div></section>
    <section class="section"><div class="section-head"><h2>Últimas notícias de ${esc(plat.name)}</h2><span>${news.length} matérias</span></div><div class="news-grid">${news.map(n => renderCard(n)).join('')}</div></section>`;
}

function renderReviewsPage(){
  const root = qs('[data-reviews-grid]');
  if (!root) return;
  root.innerHTML = DATA.reviews.map(item => `<article class="review-card page"><img src="${esc(item.cover)}" alt="${esc(item.title)}"><div class="review-score">${esc(item.score)}</div><div class="card-body"><h3>${esc(item.title)}</h3><p>${esc(item.summary)}</p><span class="text-muted">Status: ${esc(item.label)}</span></div></article>`).join('');
}

function renderRadarPage(){
  const root = qs('[data-radar-grid]');
  if (!root) return;
  root.innerHTML = DATA.radar.map(item => `<article class="radar-card page"><img src="${esc(item.cover)}" alt="${esc(item.title)}"><div class="card-body"><span class="pill small">${esc(item.platform)}</span><h3>${esc(item.title)}</h3><p>${esc(item.summary)}</p></div></article>`).join('');
}

function renderSchedulePage(){
  const events = qs('[data-events-list]');
  const launches = qs('[data-launches-list]');
  if (events) events.innerHTML = DATA.events.map(item => `<article class="list-card"><div><h3>${esc(item.title)}</h3><p>${esc(item.note)}</p></div><div class="list-meta"><span>${brDateTime(item.date)}</span><span>${esc(item.platform)}</span></div></article>`).join('');
  if (launches) launches.innerHTML = DATA.launches.map(item => `<article class="list-card"><div><h3>${esc(item.title)}</h3><p>${esc(item.note)}</p></div><div class="list-meta"><span>${brDateTime(item.date)}</span><span>${esc(item.platform)}</span></div></article>`).join('');
}

function renderPromosPage(){
  const root = qs('[data-promos-grid]');
  if (!root) return;
  const filter = qs('[data-promo-filter]');
  function apply(){
    const mode = filter?.value || 'all';
    const list = DATA.promos.filter(item => mode === 'all' || (mode === 'free' ? item.free : !item.free));
    root.innerHTML = list.map(item => promoCard(item)).join('') || '<div class="empty-box">Nenhuma promoção encontrada.</div>';
    attachPromoRedirects();
  }
  if (filter) filter.addEventListener('change', apply);
  apply();
}

function attachPromoRedirects(){
  qsa('[data-go-promo]').forEach(btn => {
    btn.addEventListener('click', ()=>{
      const url = btn.dataset.goPromo;
      btn.textContent = 'Redirecionando...';
      setTimeout(()=> window.open(url, '_blank', 'noopener'), 800);
    });
  });
}

function refreshCountdowns(){
  qsa('[data-countdown]').forEach(el => el.textContent = countdown(el.dataset.countdown));
}

function initNewsletter(){
  const form = qs('[data-newsletter-form]');
  if (!form) return;
  const msg = qs('[data-newsletter-message]');
  const listRoot = qs('[data-subscribers-list]');
  function paint(){
    if (!listRoot) return;
    const list = storage('ztr-newsletter-subs', []);
    listRoot.innerHTML = list.length ? list.map(item => `<li>${esc(item.email)} <small>• ${brDateTime(item.date)}</small></li>`).join('') : '<li>Nenhum cadastro salvo neste navegador.</li>';
  }
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const email = qs('input[type="email"]', form)?.value.trim();
    if (!email){ if (msg) msg.textContent = 'Digite um e-mail válido.'; return; }
    const list = storage('ztr-newsletter-subs', []);
    if (!list.find(i => i.email.toLowerCase() === email.toLowerCase())) list.unshift({ email, date: new Date().toISOString() });
    save('ztr-newsletter-subs', list);
    if (CONFIG.newsletterReceiverEmail) {
      const subject = encodeURIComponent('Novo cadastro na newsletter');
      const body = encodeURIComponent(`Novo inscrito: ${email}`);
      window.open(`mailto:${CONFIG.newsletterReceiverEmail}?subject=${subject}&body=${body}`, '_self');
    }
    if (msg) msg.textContent = CONFIG.newsletterReceiverEmail ? 'Cadastro salvo e cliente de e-mail aberto.' : 'Cadastro salvo neste navegador. Para receber avisos por e-mail, configure newsletterReceiverEmail em assets/js/config.js.';
    form.reset();
    paint();
  });
  const exportBtn = qs('[data-export-subs]');
  if (exportBtn) exportBtn.addEventListener('click', ()=>{
    const list = storage('ztr-newsletter-subs', []);
    const csv = 'email,data\n' + list.map(i => `${i.email},${i.date}`).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'newsletter-subscribers.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  const clearBtn = qs('[data-clear-subs]');
  if (clearBtn) clearBtn.addEventListener('click', ()=>{ localStorage.removeItem('ztr-newsletter-subs'); paint(); if (msg) msg.textContent = 'Lista local apagada.'; });
  paint();
}

document.addEventListener('DOMContentLoaded', ()=>{
  initHeader();
  renderHome();
  renderNewsPage();
  renderArticle();
  renderPlatforms();
  renderPlatformDetail();
  renderReviewsPage();
  renderRadarPage();
  renderSchedulePage();
  renderPromosPage();
  initNewsletter();
  attachPromoRedirects();
  refreshCountdowns();
  setInterval(refreshCountdowns, 60000);
});
