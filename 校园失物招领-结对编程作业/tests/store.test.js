const test = require('node:test');
const assert = require('node:assert/strict');
const Store = require('../js/store.js');

const validDraft = {
  type:'lost', title:'蓝色校园卡', category:'校园卡/证件', location:'教学楼', date:'2026-10-06',
  description:'蓝色卡套，背面有白色贴纸。', contactName:'测试同学', contact:'QQ 123456'
};

test('T01：完整发布数据通过校验', () => {
  assert.equal(Store.validateDraft(validDraft).ok, true);
});

test('T02：缺少联系方式时拒绝发布', () => {
  const draft = { ...validDraft, contact:'' };
  const result = Store.validateDraft(draft);
  assert.equal(result.ok, false);
  assert.ok(result.missing.includes('contact'));
});

test('T03：物品描述过短时拒绝发布', () => {
  assert.equal(Store.validateDraft({ ...validDraft, description:'丢了' }).ok, false);
});

test('T04：createItem 自动生成进行中状态并保留字段', () => {
  const item = Store.createItem(validDraft, { id:'x1', createdAt:'2026-10-06T10:00:00+08:00' });
  assert.equal(item.id, 'x1');
  assert.equal(item.status, 'active');
  assert.equal(item.title, validDraft.title);
});

test('T05：关键词可以命中物品名称', () => {
  const result = Store.filterItems(Store.seedItems, { keyword:'校园卡' });
  assert.ok(result.some((item) => item.title.includes('校园卡')));
});

test('T06：关键词也可以命中描述与地点', () => {
  const byDesc = Store.filterItems(Store.seedItems, { keyword:'划痕' });
  const byLocation = Store.filterItems(Store.seedItems, { keyword:'图书馆' });
  assert.equal(byDesc.length, 1);
  assert.ok(byLocation.length >= 1);
});

test('T07：按寻物/招领类型筛选', () => {
  const lost = Store.filterItems(Store.seedItems, { type:'lost' });
  assert.ok(lost.length > 0);
  assert.ok(lost.every((item) => item.type === 'lost'));
});

test('T08：按类别和地点组合筛选', () => {
  const result = Store.filterItems(Store.seedItems, { category:'校园卡/证件', location:'教学楼' });
  assert.equal(result.length, 1);
  assert.equal(result[0].title, '蓝色校园卡');
});

test('T09：按状态筛选只返回未解决信息', () => {
  const result = Store.filterItems(Store.seedItems, { status:'active' });
  assert.ok(result.every((item) => item.status === 'active'));
});

test('T10：发布者可以把寻物信息更新为已找到', () => {
  const mine = [{ ...Store.seedItems[0], id:'mine-1', ownerId:'me', type:'lost', status:'active' }];
  const updated = Store.updateStatus(mine, 'mine-1');
  assert.equal(updated[0].status, 'resolved');
  assert.equal(Store.statusText(updated[0]), '已找到');
});

test('T11：招领信息解决后显示已归还', () => {
  const item = { ...Store.seedItems[1], status:'resolved', type:'found' };
  assert.equal(Store.statusText(item), '已归还');
});

test('T12：非发布者不能修改他人状态', () => {
  const data = [{ ...Store.seedItems[0], id:'other-1', ownerId:'other', status:'active' }];
  assert.throws(() => Store.updateStatus(data, 'other-1', 'me'), /只有发布者/);
});

test('T13：筛选结果按发布时间从新到旧排序', () => {
  const result = Store.filterItems(Store.seedItems, {});
  for (let i = 1; i < result.length; i += 1) {
    assert.ok(new Date(result[i - 1].createdAt) >= new Date(result[i].createdAt));
  }
});

test('T14：中文关键词前后空格与大小写规范化不会影响搜索', () => {
  const result = Store.filterItems(Store.seedItems, { keyword:'  AIRPODS  ' });
  assert.equal(result.length, 1);
  assert.match(result[0].title, /AirPods/i);
});
