(function () {
  'use strict';
  const Store = window.LostFoundStore;
  const app = document.getElementById('app');
  const toast = document.getElementById('toast');
  let items = Store.loadItems(window.localStorage);
  let filters = { keyword:'', type:'all', category:'all', location:'all', status:'all' };
  let toastTimer;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const formatDate = (value) => value ? new Intl.DateTimeFormat('zh-CN', { month:'short', day:'numeric' }).format(new Date(`${value}T00:00:00`)) : '';
  const formatTime = (value) => value ? new Intl.DateTimeFormat('zh-CN', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(value)) : '';
  const localDateValue = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  function showToast(message) {
    toast.textContent = message; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }
  function save() { Store.saveItems(window.localStorage, items); }
  function setActiveNav(route) { $$('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === route)); }
  function navigate(hash) { if (location.hash === hash) route(); else location.hash = hash; }

  function fillSelect(select, values, firstLabel) {
    select.innerHTML = `<option value="all">${escapeHtml(firstLabel)}</option>` + values.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
  }
  function fillRequiredSelect(select, values, firstLabel) {
    select.innerHTML = `<option value="">${escapeHtml(firstLabel)}</option>` + values.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
  }

  function itemCard(item) {
    return `<article class="item-card">
      <div class="item-visual ${item.type}">
        <span class="type-badge">${Store.typeText(item.type)}</span>
        <span class="status-badge">${Store.statusText(item)}</span>
        <div class="item-icon" aria-hidden="true">${Store.iconForCategory(item.category)}</div>
      </div>
      <div class="item-body"><h3 title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p>
        <div class="meta-list"><span>⌖ ${escapeHtml(item.location)}</span><span>◷ ${escapeHtml(formatDate(item.date))}</span><span>${escapeHtml(item.category)}</span></div>
      </div>
      <div class="card-footer"><small>${escapeHtml(formatTime(item.createdAt))} 发布</small><button class="text-link" type="button" data-detail="${escapeHtml(item.id)}">查看详情 →</button></div>
    </article>`;
  }

  function renderHome() {
    setActiveNav('home');
    app.innerHTML = document.getElementById('homeTemplate').innerHTML;
    const stats = {
      active: items.filter((i) => i.status === 'active').length,
      lost: items.filter((i) => i.type === 'lost' && i.status === 'active').length,
      resolved: items.filter((i) => i.status === 'resolved').length
    };
    $('#heroStats', app).innerHTML = `<div class="stat-box"><strong>${stats.active}</strong><span>进行中</span></div><div class="stat-box"><strong>${stats.lost}</strong><span>寻物中</span></div><div class="stat-box"><strong>${stats.resolved}</strong><span>已解决</span></div>`;
    fillSelect($('#categoryFilter', app), Store.CATEGORIES, '全部类别');
    fillSelect($('#locationFilter', app), Store.LOCATIONS, '全部地点');
    $('#searchInput', app).value = filters.keyword;
    $('#categoryFilter', app).value = filters.category;
    $('#locationFilter', app).value = filters.location;
    $('#statusFilter', app).value = filters.status;
    syncTypeButtons();
    renderGrid();

    $('#searchBtn', app).addEventListener('click', () => { filters.keyword = $('#searchInput', app).value.trim(); renderGrid(); });
    $('#searchInput', app).addEventListener('keydown', (e) => { if (e.key === 'Enter') { filters.keyword = e.target.value.trim(); renderGrid(); } });
    $$('[data-filter-type]', app).forEach((btn) => btn.addEventListener('click', () => { filters.type = btn.dataset.filterType; syncTypeButtons(); renderGrid(); }));
    $('#categoryFilter', app).addEventListener('change', (e) => { filters.category = e.target.value; renderGrid(); });
    $('#locationFilter', app).addEventListener('change', (e) => { filters.location = e.target.value; renderGrid(); });
    $('#statusFilter', app).addEventListener('change', (e) => { filters.status = e.target.value; renderGrid(); });
    $('#clearFilters', app).addEventListener('click', resetFilters);
    $('[data-action="hero-publish"]', app).addEventListener('click', () => navigate('#publish'));
    $('[data-action="scroll-list"]', app).addEventListener('click', () => $('#listingSection', app).scrollIntoView({behavior:'smooth'}));
  }

  function syncTypeButtons() {
    $$('[data-filter-type]', app).forEach((button) => {
      const selected = button.dataset.filterType === filters.type;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  function resetFilters() {
    filters = { keyword:'', type:'all', category:'all', location:'all', status:'all' };
    renderHome();
  }

  function renderGrid() {
    const result = Store.filterItems(items, filters);
    const grid = $('#itemGrid', app); const empty = $('#emptyState', app);
    grid.innerHTML = result.map(itemCard).join('');
    grid.hidden = result.length === 0; empty.hidden = result.length !== 0;
    $('#resultCount', app).textContent = `共 ${result.length} 条匹配信息`;
    $('#clearFilters', app).hidden = !filters.keyword && ['type','category','location','status'].every((key) => filters[key] === 'all');
    $$('[data-detail]', grid).forEach((btn) => btn.addEventListener('click', () => navigate(`#detail/${encodeURIComponent(btn.dataset.detail)}`)));
    const reset = $('[data-action="reset-filter"]', app);
    if (reset) reset.addEventListener('click', resetFilters);
  }

  function renderPublish() {
    setActiveNav('publish'); app.innerHTML = document.getElementById('publishTemplate').innerHTML;
    fillRequiredSelect($('[name="category"]', app), Store.CATEGORIES, '请选择类别');
    fillRequiredSelect($('[name="location"]', app), Store.LOCATIONS, '请选择地点');
    $('[name="date"]', app).value = localDateValue();
    const textarea = $('[name="description"]', app); const count = $('#descCount', app);
    textarea.addEventListener('input', () => { count.textContent = textarea.value.length; });
    $('#cancelPublish', app).addEventListener('click', () => history.length > 1 ? history.back() : navigate('#home'));
    $('#publishForm', app).addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.currentTarget).entries());
      const validation = Store.validateDraft(data); const error = $('#formError', app);
      if (!validation.ok) { error.textContent = validation.message; error.hidden = false; return; }
      try {
        const item = Store.createItem(data); items.unshift(item); save();
        showToast('发布成功，已加入“我的发布”'); navigate(`#detail/${encodeURIComponent(item.id)}`);
      } catch (err) { error.textContent = err.message; error.hidden = false; }
    });
  }

  function renderMine() {
    setActiveNav('mine'); app.innerHTML = document.getElementById('mineTemplate').innerHTML;
    const mine = items.filter((i) => i.ownerId === Store.OWNER_ID).sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
    const active = mine.filter((i) => i.status === 'active').length; const resolved = mine.length - active;
    $('#mineStats', app).innerHTML = `<div class="mine-stat"><strong>${mine.length}</strong><span>全部发布</span></div><div class="mine-stat"><strong>${active}</strong><span>进行中</span></div><div class="mine-stat"><strong>${resolved}</strong><span>已解决</span></div>`;
    $('#mineList', app).innerHTML = mine.map((item) => `<article class="mine-row">
      <div class="mine-icon ${item.type}">${Store.iconForCategory(item.category)}</div>
      <div class="mine-info"><h3>${escapeHtml(item.title)} · <span class="pill">${Store.statusText(item)}</span></h3><p>${Store.typeText(item.type)} · ${escapeHtml(item.location)} · ${escapeHtml(item.date)}</p></div>
      <div class="mine-actions"><button class="small-btn" data-detail="${escapeHtml(item.id)}">查看详情</button><button class="small-btn resolve" data-resolve="${escapeHtml(item.id)}" ${item.status==='resolved'?'disabled':''}>${item.status==='resolved'?'已完成':(item.type==='lost'?'标记已找到':'标记已归还')}</button></div>
    </article>`).join('');
    $('#mineEmpty', app).hidden = mine.length !== 0; $('#mineList', app).hidden = mine.length === 0;
    $$('[data-detail]', app).forEach((btn) => btn.addEventListener('click', () => navigate(`#detail/${encodeURIComponent(btn.dataset.detail)}`)));
    $$('[data-resolve]', app).forEach((btn) => btn.addEventListener('click', () => resolveItem(btn.dataset.resolve, true)));
    $('[data-action="mine-publish"]', app).addEventListener('click', () => navigate('#publish'));
  }

  function renderDetail(id) {
    setActiveNav(''); app.innerHTML = document.getElementById('detailTemplate').innerHTML;
    const item = items.find((i) => i.id === id); const page = $('#detailPage', app);
    if (!item) { page.innerHTML = `<div class="empty-state"><div class="empty-icon">!</div><h3>这条信息不存在</h3><p>它可能已经被删除或链接有误。</p><button class="ghost-btn" type="button" data-back>返回信息广场</button></div>`; $('[data-back]',page).addEventListener('click',()=>navigate('#home')); return; }
    const mine = item.ownerId === Store.OWNER_ID;
    page.innerHTML = `<article class="detail-main">
      <div class="detail-hero ${item.type}"><button class="back-btn" type="button" data-back>← 返回</button><div class="item-icon">${Store.iconForCategory(item.category)}</div></div>
      <div class="detail-content"><div class="detail-kicker"><span class="pill">${Store.typeText(item.type)}</span><span class="pill">${Store.statusText(item)}</span><span class="pill">${escapeHtml(item.category)}</span></div>
      <h1>${escapeHtml(item.title)}</h1><p class="desc">${escapeHtml(item.description)}</p>
      <div class="detail-facts"><div class="fact"><small>地点</small><strong>${escapeHtml(item.location)}</strong></div><div class="fact"><small>日期</small><strong>${escapeHtml(item.date)}</strong></div><div class="fact"><small>发布时间</small><strong>${escapeHtml(formatTime(item.createdAt))}</strong></div></div></div>
    </article>
    <aside class="contact-card"><h3>${item.status==='resolved'?'这条信息已解决':'联系发布者'}</h3><p>${item.status==='resolved'?'物品已经找回或归还，状态已由发布者更新。':'核实物品特征后再约定领取方式，避免冒领。'}</p>
      <div class="contact-person"><strong>${escapeHtml(item.contactName)}</strong><span>${escapeHtml(item.contact)}</span></div>
      ${item.status==='active'?`<button class="primary-btn" type="button" data-copy>复制联系方式</button>`:''}
      ${mine && item.status==='active'?`<button class="ghost-btn" style="width:100%;margin-top:10px" type="button" data-resolve>${item.type==='lost'?'标记为已找到':'标记为已归还'}</button>`:''}
      <p class="privacy-note">平台仅展示发布者主动填写的联系方式，不提供站内聊天、实名认证或位置追踪。</p></aside>`;
    $('[data-back]', page).addEventListener('click', () => history.length > 1 ? history.back() : navigate('#home'));
    const copyBtn = $('[data-copy]', page); if (copyBtn) copyBtn.addEventListener('click', () => copyText(item.contact));
    const resolveBtn = $('[data-resolve]', page); if (resolveBtn) resolveBtn.addEventListener('click', () => resolveItem(item.id, false));
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); showToast('联系方式已复制'); }
    catch (_) {
      const input = document.createElement('textarea'); input.value = text; input.style.position='fixed'; input.style.opacity='0'; document.body.appendChild(input); input.select(); document.execCommand('copy'); input.remove(); showToast('联系方式已复制');
    }
  }
  function resolveItem(id, fromMine) {
    try { items = Store.updateStatus(items, id); save(); showToast('状态已更新，其他用户将看到最新结果'); fromMine ? renderMine() : renderDetail(id); }
    catch (err) { showToast(err.message); }
  }

  function route() {
    const hash = location.hash || '#home';
    if (hash === '#home') renderHome();
    else if (hash === '#publish') renderPublish();
    else if (hash === '#mine') renderMine();
    else if (hash.startsWith('#detail/')) renderDetail(decodeURIComponent(hash.slice('#detail/'.length)));
    else navigate('#home');
    window.scrollTo({ top:0, behavior:'auto' });
  }

  document.getElementById('headerPublishBtn').addEventListener('click', () => navigate('#publish'));
  window.addEventListener('hashchange', route);
  route();
})();
