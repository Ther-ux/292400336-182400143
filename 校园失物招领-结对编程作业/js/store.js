(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LostFoundStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CATEGORIES = ['校园卡/证件', '电子产品', '钥匙', '书籍资料', '衣物饰品', '水杯雨伞', '其他'];
  const LOCATIONS = ['旗山校区东门', '教学楼', '图书馆', '食堂', '宿舍区', '体育场', '校车/公交站', '其他'];
  const STORAGE_KEY = 'campus-lost-found-v1';
  const OWNER_ID = 'me';

  const seedItems = [
    { id:'seed-1', type:'lost', title:'蓝色校园卡', category:'校园卡/证件', location:'教学楼', date:'2026-10-05', description:'蓝色卡套，卡套背面有一张白色便利贴，可能遗失在教学楼二楼靠窗位置。', contactName:'林同学', contact:'QQ 2865****31', ownerId:'sample', status:'active', createdAt:'2026-10-05T18:20:00+08:00' },
    { id:'seed-2', type:'found', title:'黑色折叠伞', category:'水杯雨伞', location:'图书馆', date:'2026-10-05', description:'在图书馆三楼自习区捡到，黑色折叠伞，伞柄有一圈灰色防滑纹。', contactName:'陈同学', contact:'微信 cxy***07', ownerId:'sample', status:'active', createdAt:'2026-10-05T16:10:00+08:00' },
    { id:'seed-3', type:'lost', title:'AirPods 白色耳机盒', category:'电子产品', location:'食堂', date:'2026-10-04', description:'只丢了充电盒，白色外壳，右下角有很浅的划痕，可能落在二楼靠楼梯的桌面。', contactName:'周同学', contact:'手机号 15******912', ownerId:'sample', status:'active', createdAt:'2026-10-04T20:42:00+08:00' },
    { id:'seed-4', type:'found', title:'高等数学笔记本', category:'书籍资料', location:'教学楼', date:'2026-10-03', description:'红色封皮，第一页写有部分课程笔记，失主可描述封面贴纸后领取。', contactName:'吴同学', contact:'QQ 17******46', ownerId:'me', status:'active', createdAt:'2026-10-03T19:00:00+08:00' },
    { id:'seed-5', type:'lost', title:'宿舍钥匙一串', category:'钥匙', location:'体育场', date:'2026-10-02', description:'两把银色钥匙和一个深蓝色小挂件，跑步后发现不见了。', contactName:'吴同学', contact:'微信 whb***26', ownerId:'me', status:'resolved', createdAt:'2026-10-02T21:15:00+08:00', resolvedAt:'2026-10-03T12:00:00+08:00' },
    { id:'seed-6', type:'found', title:'灰色针织外套', category:'衣物饰品', location:'宿舍区', date:'2026-10-01', description:'宿舍区公共晾晒处旁的长椅上发现，M码左右，口袋为空。', contactName:'许同学', contact:'手机号 18******530', ownerId:'sample', status:'resolved', createdAt:'2026-10-01T15:30:00+08:00', resolvedAt:'2026-10-02T10:00:00+08:00' }
  ];

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function normalize(value) { return String(value ?? '').trim().toLocaleLowerCase('zh-CN'); }
  function nowIso() { return new Date().toISOString(); }

  function validateDraft(draft) {
    const required = ['type','title','category','location','date','description','contactName','contact'];
    const missing = required.filter((key) => !String(draft?.[key] ?? '').trim());
    if (missing.length) return { ok:false, message:'请完整填写所有必填项。', missing };
    if (!['lost','found'].includes(draft.type)) return { ok:false, message:'信息类型无效。', missing:['type'] };
    if (String(draft.title).trim().length < 2) return { ok:false, message:'物品名称至少填写 2 个字。', missing:['title'] };
    if (String(draft.description).trim().length < 5) return { ok:false, message:'物品描述至少填写 5 个字，便于他人辨认。', missing:['description'] };
    return { ok:true, message:'', missing:[] };
  }

  function createItem(draft, options = {}) {
    const result = validateDraft(draft);
    if (!result.ok) throw new Error(result.message);
    return {
      id: options.id || `item-${Date.now()}-${Math.random().toString(16).slice(2,8)}`,
      type: draft.type,
      title: String(draft.title).trim(),
      category: String(draft.category).trim(),
      location: String(draft.location).trim(),
      date: String(draft.date).trim(),
      description: String(draft.description).trim(),
      contactName: String(draft.contactName).trim(),
      contact: String(draft.contact).trim(),
      ownerId: options.ownerId || OWNER_ID,
      status: 'active',
      createdAt: options.createdAt || nowIso()
    };
  }

  function filterItems(items, filters = {}) {
    const keyword = normalize(filters.keyword);
    const type = filters.type || 'all';
    const category = filters.category || 'all';
    const location = filters.location || 'all';
    const status = filters.status || 'all';
    return items
      .filter((item) => type === 'all' || item.type === type)
      .filter((item) => category === 'all' || item.category === category)
      .filter((item) => location === 'all' || item.location === location)
      .filter((item) => status === 'all' || item.status === status)
      .filter((item) => {
        if (!keyword) return true;
        return [item.title,item.description,item.location,item.category].some((field) => normalize(field).includes(keyword));
      })
      .slice()
      .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function updateStatus(items, id, actorId = OWNER_ID) {
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) throw new Error('信息不存在。');
    if (items[index].ownerId !== actorId) throw new Error('只有发布者可以更新这条信息。');
    if (items[index].status === 'resolved') return clone(items);
    const next = clone(items);
    next[index].status = 'resolved';
    next[index].resolvedAt = nowIso();
    return next;
  }

  function statusText(item) { return item.status === 'resolved' ? (item.type === 'lost' ? '已找到' : '已归还') : '进行中'; }
  function typeText(type) { return type === 'lost' ? '寻物' : '招领'; }
  function iconForCategory(category) {
    return ({'校园卡/证件':'▣','电子产品':'◉','钥匙':'⚿','书籍资料':'▤','衣物饰品':'♢','水杯雨伞':'☂','其他':'✦'})[category] || '✦';
  }

  function loadItems(storage) {
    if (!storage) return clone(seedItems);
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return clone(seedItems);
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : clone(seedItems);
    } catch (_) { return clone(seedItems); }
  }
  function saveItems(storage, items) { if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(items)); }
  function resetItems(storage) { if (storage) storage.removeItem(STORAGE_KEY); return clone(seedItems); }

  return { CATEGORIES, LOCATIONS, STORAGE_KEY, OWNER_ID, seedItems: clone(seedItems), normalize, validateDraft, createItem, filterItems, updateStatus, statusText, typeText, iconForCategory, loadItems, saveItems, resetItems };
});
