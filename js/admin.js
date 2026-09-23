/* ระบบหลังบ้าน — ล็อกอิน + จัดการการ์ด / ผู้ใช้ / ตั้งค่าเว็บ */
const $ = (s, p = document) => p.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g,
  m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const RANK = { VIEWER: 1, EDITOR: 2, ADMIN: 3 };
const LS_KEY = 'etc_token';

const S = { token: localStorage.getItem(LS_KEY), user: null, view: 'overview',
            cards: [], users: [] };

const NAV = [
  ['overview',  'ภาพรวมระบบ',   'layout-dashboard'],
  ['cards',     'การ์ดสารสนเทศ', 'layout-grid'],
  ['users',     'ผู้ใช้และสิทธิ์', 'users', 'ADMIN'],
  ['settings',  'ตั้งค่าเว็บไซต์', 'settings'],
];

const SETTING_FIELDS = [
  ['siteTitle',    'ชื่อเว็บไซต์ (แสดงที่แท็บเบราว์เซอร์)'],
  ['tagline',      'คำโปรยใต้ชื่อสาขา'],
  ['announcement', 'ข้อความประกาศวิ่งด้านบน (เว้นว่าง = ไม่แสดง)'],
  ['about',        'ข้อความ "รู้จักสาขา" (ใช้แท็ก HTML ได้ เช่น <p>…</p>)', 'textarea'],
  ['phone',        'โทรศัพท์ติดต่อ'],
  ['email',        'อีเมลติดต่อ'],
];

document.addEventListener('DOMContentLoaded', init);

async function init() {
  if (isMockMode()) $('#mockbar').hidden = false;
  lucide.createIcons();
  bindGlobal();
  if (!S.token) return showLogin();
  try {
    const r = await apiCall('me', {}, S.token);
    S.user = r.user;
    enterApp();
  } catch (e) {
    localStorage.removeItem(LS_KEY);
    S.token = null;
    showLogin();
  }
}

/* ---------- ล็อกอิน ---------- */
function showLogin() {
  $('#authView').hidden = false;
  $('#appView').hidden = true;
  if (isMockMode()) $('#authDemo').hidden = false;
}

async function onLogin(e) {
  e.preventDefault();
  const btn = $('#loginBtn');
  btn.disabled = true; btn.textContent = 'กำลังตรวจสอบ…';
  $('#loginErr').hidden = true;
  try {
    const r = await apiCall('login', {
      email: $('#loginEmail').value.trim(),
      password: $('#loginPass').value,
    });
    S.token = r.token;
    localStorage.setItem(LS_KEY, r.token);
    S.user = r.user;
    enterApp();
    toast(`ยินดีต้อนรับ ${r.user.name}`, 'ok');
  } catch (err) {
    const p = $('#loginErr');
    p.textContent = err.message; p.hidden = false;
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'เข้าสู่ระบบ <i data-lucide="log-in"></i>';
    lucide.createIcons();
  }
}

function enterApp() {
  $('#authView').hidden = true;
  $('#appView').hidden = false;
  $('#uName').textContent = S.user.name;
  $('#uRole').textContent = roleLabel(S.user.role);
  renderView();
}

function roleLabel(r) {
  return { ADMIN: 'ผู้ดูแลระบบ', EDITOR: 'ผู้จัดการเนื้อหา', VIEWER: 'ผู้ชม' }[r] || r;
}
function fmt(v) {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d)) return '—';
  return d.toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ---------- โครงหลังบ้าน ---------- */
function renderView() {
  const titles = { overview: 'ภาพรวมระบบ', cards: 'การ์ดสารสนเทศ',
                   users: 'ผู้ใช้และสิทธิ์', settings: 'ตั้งค่าเว็บไซต์' };
  $('#viewTitle').textContent = titles[S.view] || '';
  $('#nav').innerHTML = NAV
    .filter(n => !n[3] || RANK[S.user.role] >= RANK[n[3]])
    .map(n => `<a href="#" data-act="nav" data-id="${n[0]}" class="${S.view === n[0] ? 'on' : ''}">
      <i data-lucide="${n[2]}"></i><span>${n[1]}</span></a>`).join('');
  $('#view').innerHTML = `<div class="loading"><i data-lucide="loader"></i> กำลังโหลด…</div>`;
  lucide.createIcons();

  (async () => {
    try {
      if (S.view === 'overview') await viewOverview();
      if (S.view === 'cards')    await viewCards();
      if (S.view === 'users')    await viewUsers();
      if (S.view === 'settings') await viewSettings();
    } catch (e) { fail(e); }
    lucide.createIcons();
  })();
}

/* ---------- มุมมอง: ภาพรวม ---------- */
async function viewOverview() {
  const r = await apiCall('stats', {}, S.token);
  let html = `<div class="statrow">
    <div class="stat"><span class="stat__n">${r.cards}</span><span class="stat__l">การ์ดทั้งหมด</span></div>
    <div class="stat"><span class="stat__n">${r.active}</span><span class="stat__l">เปิดใช้งานบนหน้าเว็บ</span></div>`;
  html += (r.users !== undefined)
    ? `<div class="stat"><span class="stat__n">${r.users}</span><span class="stat__l">บัญชีผู้ใช้</span></div>`
    : `<div class="stat"><span class="stat__n" style="font-size:26px;padding-top:8px">${roleLabel(S.user.role)}</span><span class="stat__l">บทบาทของคุณ</span></div>`;
  html += `</div>`;
  if (r.logs && r.logs.length) {
    html += `<div class="panel"><h3>กิจกรรมล่าสุด</h3>
      <table class="tbl">
        <thead><tr><th>เวลา</th><th>ผู้ใช้</th><th>การกระทำ</th><th>รายละเอียด</th></tr></thead>
        <tbody>${r.logs.map(l => `<tr>
          <td>${fmt(l.time)}</td><td>${esc(l.email)}</td>
          <td>${esc(l.action)}</td><td>${esc(l.detail)}</td></tr>`).join('')}
        </tbody></table></div>`;
  }
  $('#view').innerHTML = html;
}

/* ---------- มุมมอง: การ์ด ---------- */
async function viewCards() {
  const r = await apiCall('listCards', {}, S.token);
  S.cards = r.cards;
  const canEdit = RANK[S.user.role] >= RANK.EDITOR;

  const rows = S.cards.map((c, i) => {
    let host = '';
    try { if (c.linkUrl) host = new URL(c.linkUrl).host; } catch (e) {}
    return `<div class="row">
      <img class="row__thumb" src="${esc(c.imageUrl)}" alt="" loading="lazy">
      <div class="row__info">
        <strong>${esc(c.title)}</strong>
        ${c.subtitle ? `<span class="row__sub">${esc(c.subtitle)}</span>` : ''}
        <span class="row__url"><i data-lucide="link"></i>${esc(host || 'ไม่ได้ตั้งลิงก์')}</span>
      </div>
      <div class="row__tags">
        <span class="badge">${esc(c.size || 'normal')}</span>
        <span class="badge ${c.active ? 'badge--on' : 'badge--off'}">${c.active ? 'เปิดใช้งาน' : 'ซ่อนอยู่'}</span>
      </div>
      <div class="row__act">
        ${canEdit ? `
        <button class="btn btn--icon" data-act="card-up" data-id="${c.id}" ${i === 0 ? 'disabled' : ''} title="เลื่อนขึ้น"><i data-lucide="arrow-up"></i></button>
        <button class="btn btn--icon" data-act="card-down" data-id="${c.id}" ${i === S.cards.length - 1 ? 'disabled' : ''} title="เลื่อนลง"><i data-lucide="arrow-down"></i></button>
        <button class="btn btn--icon" data-act="card-edit" data-id="${c.id}" title="แก้ไข"><i data-lucide="pencil"></i></button>
        <button class="btn btn--icon" data-act="card-toggle" data-id="${c.id}" title="${c.active ? 'ซ่อนจากหน้าเว็บ' : 'แสดงบนหน้าเว็บ'}"><i data-lucide="${c.active ? 'eye-off' : 'eye'}"></i></button>
        <button class="btn btn--icon btn--danger" data-act="card-del" data-id="${c.id}" title="ลบ"><i data-lucide="trash-2"></i></button>` :
        `<span class="row__ro">ดูอย่างเดียว</span>`}
      </div>
    </div>`;
  }).join('');

  $('#view').innerHTML = `
    <div class="viewhead">
      <p>ลำดับในหน้านี้คือลำดับการแสดงผลบนหน้าแรก (จากบนลงล่าง)</p>
      ${canEdit ? `<button class="btn btn--primary" data-act="card-new"><i data-lucide="plus"></i> เพิ่มการ์ดใหม่</button>` : ''}
    </div>
    <div class="rows">${rows || `<div class="empty"><p>ยังไม่มีการ์ด — เพิ่มการ์ดใบแรกของคุณได้จากปุ่มด้านบน</p></div>`}</div>`;
}

function openCardModal(c) {
  modal(`
    <h3 class="modal__h">${c ? 'แก้ไขการ์ด' : 'เพิ่มการ์ดใหม่'}</h3>
    <form id="cardForm">
      <div class="fieldgrid">
        <label>ชื่อการ์ด *<input name="title" required maxlength="80" value="${esc(c?.title || '')}"></label>
        <label>คำบรรยายสั้น<input name="subtitle" maxlength="120" value="${esc(c?.subtitle || '')}"></label>
      </div>
      <label>ลิงก์ปลายทางเมื่อคลิกภาพ *<input name="linkUrl" type="url" required placeholder="https://…" value="${esc(c?.linkUrl || '')}"></label>
      <div class="fieldgrid">
        <label>ขนาดบนหน้าเว็บ
          <select name="size">
            <option value="normal" ${!c || c.size === 'normal' ? 'selected' : ''}>ปกติ (1 ใน 3 ช่อง)</option>
            <option value="wide" ${c?.size === 'wide' ? 'selected' : ''}>กว้าง (ครึ่งหนึ่งของแถว)</option>
            <option value="tall" ${c?.size === 'tall' ? 'selected' : ''}>สูง (แนวตั้ง)</option>
          </select>
        </label>
        <label class="chk"><input type="checkbox" name="active" ${!c || c.active !== false ? 'checked' : ''}> แสดงบนหน้าเว็บ</label>
      </div>
      <label>ภาพ Infographic *
        <div class="upl">
          <img id="uplPrev" class="upl__prev" src="${esc(c?.imageUrl || '')}" alt="">
          <div class="upl__side">
            <div class="upl__drop" data-act="upl-pick">
              <i data-lucide="image-up"></i>
              <span id="uplHint">คลิกเลือกไฟล์ภาพ — ระบบบีบอัดและอัปโหลดขึ้น Google Drive ให้อัตโนมัติ</span>
              <input type="file" id="uplFile" accept="image/*" hidden>
            </div>
            <input name="imageUrl" id="imageUrl" placeholder="หรือวาง URL ของภาพโดยตรง" value="${esc(c?.imageUrl || '')}">
          </div>
        </div>
      </label>
      <div class="modal__act">
        <button type="button" class="btn" data-close>ยกเลิก</button>
        <button type="submit" class="btn btn--primary" id="cardSaveBtn">บันทึกการ์ด</button>
      </div>
    </form>`);

  const f = $('#cardForm');
  $('#uplFile').addEventListener('change', onPickImage);
  $('#imageUrl').addEventListener('input', e => { $('#uplPrev').src = e.target.value; });

  f.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('#cardSaveBtn');
    btn.disabled = true;
    const fd = new FormData(f);
    try {
      await apiCall('saveCard', {
        id: c ? c.id : undefined,
        title: String(fd.get('title')).trim(),
        subtitle: String(fd.get('subtitle')).trim(),
        linkUrl: String(fd.get('linkUrl')).trim(),
        imageUrl: String(fd.get('imageUrl')).trim(),
        size: fd.get('size'),
        active: fd.get('active') === 'on',
      }, S.token);
      closeModal();
      toast('บันทึกการ์ดเรียบร้อย', 'ok');
      renderView();
    } catch (err) { fail(err); btn.disabled = false; }
  });
  lucide.createIcons();
}

/* อัปโหลดรูป: บีบอัดบนเบราว์เซอร์ก่อน แล้วส่ง base64 ให้ Apps Script ขึ้น Drive */
async function onPickImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const hint = $('#uplHint');
  hint.textContent = 'กำลังบีบอัดและอัปโหลด… กรุณารอสักครู่';
  try {
    const dataUrl = await resizeImage(file, 1600, 0.86);
    const r = await apiCall('uploadImage', {
      name: file.name, mime: 'image/jpeg',
      base64: dataUrl.split(',')[1],
    }, S.token);
    $('#imageUrl').value = r.url;
    $('#uplPrev').src = r.url;
    hint.textContent = 'อัปโหลดสำเร็จ — คลิกอีกครั้งเพื่อเปลี่ยนรูป';
    toast('อัปโหลดภาพขึ้น Google Drive แล้ว', 'ok');
  } catch (err) {
    fail(err);
    hint.textContent = 'อัปโหลดไม่สำเร็จ — ลองไฟล์อื่น หรือวาง URL รูปโดยตรง';
  }
  e.target.value = '';
}

function resizeImage(file, max, q) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const sc = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(img.width * sc));
      cv.height = Math.max(1, Math.round(img.height * sc));
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      resolve(cv.toDataURL('image/jpeg', q));
    };
    img.onerror = reject;
    img.src = url;
  });
}

/* ปุ่มต่อการ์ดรายแถว */
async function moveCard(id, dir) {
  try { await apiCall('moveCard', { id, dir }, S.token); renderView(); }
  catch (e) { fail(e); }
}
async function toggleCard(id) {
  const c = S.cards.find(x => String(x.id) === String(id));
  try { await apiCall('toggleCard', { id, active: !c.active }, S.token); renderView(); }
  catch (e) { fail(e); }
}
function confirmDelCard(id) {
  const c = S.cards.find(x => String(x.id) === String(id));
  confirmBox(`ลบการ์ด “${esc(c.title)}” ออกจากระบบ? (ไฟล์รูปใน Drive จะไม่ถูกลบ)`, async () => {
    try { await apiCall('deleteCard', { id }, S.token); toast('ลบการ์ดแล้ว', 'ok'); renderView(); }
    catch (e) { fail(e); }
  });
}

/* ---------- มุมมอง: ผู้ใช้ ---------- */
async function viewUsers() {
  const r = await apiCall('listUsers', {}, S.token);
  S.users = r.users;
  $('#view').innerHTML = `
    <div class="viewhead">
      <p>ADMIN ควบคุมได้ทุกส่วน · EDITOR แก้เนื้อหาได้ · VIEWER ดูอย่างเดียว</p>
      <button class="btn btn--primary" data-act="user-new"><i data-lucide="plus"></i> เพิ่มผู้ใช้</button>
    </div>
    <div class="rows">${S.users.map(u => `
      <div class="row row--user">
        <div class="row__info">
          <strong>${esc(u.name)} <span class="row__mail">${esc(u.email)}</span></strong>
          <span class="row__sub">เข้าใช้ล่าสุด: ${fmt(u.lastLogin)}</span>
        </div>
        <div class="row__tags">
          <span class="badge badge--${u.role.toLowerCase()}">${roleLabel(u.role)}</span>
          <span class="badge ${u.status === 'ACTIVE' ? 'badge--on' : 'badge--off'}">${u.status === 'ACTIVE' ? 'ใช้งาน' : 'ระงับ'}</span>
        </div>
        <div class="row__act">
          <button class="btn btn--icon" data-act="user-edit" data-id="${u.id}" title="แก้ไข / เปลี่ยนรหัส"><i data-lucide="pencil"></i></button>
          ${u.email !== S.user.email
            ? `<button class="btn btn--icon btn--danger" data-act="user-del" data-id="${u.id}" title="ลบบัญชี"><i data-lucide="trash-2"></i></button>`
            : `<span class="row__me">คุณ</span>`}
        </div>
      </div>`).join('')}</div>`;
}

function openUserModal(u) {
  modal(`
    <h3 class="modal__h">${u ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</h3>
    <form id="userForm">
      <div class="fieldgrid">
        <label>ชื่อ-นามสกุล *<input name="name" required value="${esc(u?.name || '')}"></label>
        <label>อีเมล *<input name="email" type="email" required value="${esc(u?.email || '')}" ${u ? 'readonly class="ro"' : ''}></label>
      </div>
      <div class="fieldgrid">
        <label>ระดับสิทธิ์
          <select name="role">
            <option value="VIEWER">ผู้ชม (ดูอย่างเดียว)</option>
            <option value="EDITOR">ผู้จัดการเนื้อหา</option>
            <option value="ADMIN">ผู้ดูแลระบบ</option>
          </select></label>
        <label>สถานะ
          <select name="status">
            <option value="ACTIVE">ใช้งานปกติ</option>
            <option value="SUSPENDED">ระงับการใช้งาน</option>
          </select></label>
      </div>
      <label>${u ? 'รหัสผ่านใหม่ (เว้นว่าง = ใช้รหัสเดิม)' : 'รหัสผ่าน *'}
        <input name="password" type="text" ${u ? '' : 'required'} minlength="4"
               placeholder="ตัวอักษรหรือตัวเลข อย่างน้อย 4 ตัว">
      </label>
      <div class="modal__act">
        <button type="button" class="btn" data-close>ยกเลิก</button>
        <button class="btn btn--primary" type="submit">บันทึกผู้ใช้</button>
      </div>
    </form>`);

  const f = $('#userForm');
  f.elements.role.value = u ? u.role : 'VIEWER';
  f.elements.status.value = u ? u.status : 'ACTIVE';

  f.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(f);
    try {
      await apiCall('saveUser', {
        id: u ? u.id : undefined,
        name: String(fd.get('name')).trim(),
        email: String(fd.get('email')).trim().toLowerCase(),
        role: fd.get('role'),
        status: fd.get('status'),
        password: String(fd.get('password') || ''),
      }, S.token);
      closeModal();
      toast('บันทึกผู้ใช้เรียบร้อย', 'ok');
      renderView();
    } catch (err) { fail(err); }
  });
}

function confirmDelUser(id) {
  const u = S.users.find(x => String(x.id) === String(id));
  confirmBox(`ลบบัญชี ${esc(u.email)} ออกจากระบบ?`, async () => {
    try { await apiCall('deleteUser', { id }, S.token); toast('ลบบัญชีแล้ว', 'ok'); renderView(); }
    catch (e) { fail(e); }
  });
}

/* ---------- มุมมอง: ตั้งค่าเว็บ ---------- */
async function viewSettings() {
  const r = await apiCall('getSettings', {}, S.token);
  const s = r.settings;
  const can = RANK[S.user.role] >= RANK.ADMIN;
  $('#view').innerHTML = `
    <p class="hint">ข้อความเหล่านี้แสดงบนหน้าแรก — ${can ? 'คุณสามารถแก้ไขได้' : 'เฉพาะผู้ดูแล (ADMIN) ที่แก้ไขได้'}</p>
    <form id="setForm" class="panel" style="margin-top:0">
      ${SETTING_FIELDS.map(([k, l, t]) => `
        <label>${l}
          ${t === 'textarea'
            ? `<textarea name="${k}" rows="4" ${can ? '' : 'disabled'}>${esc(s[k] || '')}</textarea>`
            : `<input name="${k}" value="${esc(s[k] || '')}" ${can ? '' : 'disabled'}>`}
        </label>`).join('')}
      ${can ? `<button class="btn btn--primary" type="submit"><i data-lucide="save"></i> บันทึกการตั้งค่า</button>` : ''}
    </form>`;
  if (can) $('#setForm').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, payload = {};
    SETTING_FIELDS.forEach(([k]) => payload[k] = f.elements[k].value);
    try {
      await apiCall('saveSettings', payload, S.token);
      toast('บันทึกการตั้งค่าเรียบร้อย (หน้าเว็บจะใช้ค่าใหม่ทันทีเมื่อรีเฟรช)', 'ok');
    } catch (err) { fail(err); }
  });
}

/* ---------- โมดัล / Toast / ผู้ช่วยทั่วไป ---------- */
function modal(html) {
  $('#modalBox').innerHTML = html;
  $('#modalBack').hidden = false;
  lucide.createIcons();
}
function closeModal() { $('#modalBack').hidden = true; }

function confirmBox(msg, onYes) {
  modal(`<h3 class="modal__h">ยืนยันการทำรายการ</h3>
    <p class="modal__p">${msg}</p>
    <div class="modal__act">
      <button class="btn" data-close>ยกเลิก</button>
      <button class="btn btn--danger" id="cfmYes">ยืนยัน</button>
    </div>`);
  $('#cfmYes').addEventListener('click', () => { closeModal(); onYes(); });
}

function toast(msg, type = 'ok') {
  const t = document.createElement('div');
  t.className = 'toast toast--' + type;
  t.innerHTML = `<i data-lucide="${type === 'ok' ? 'check' : 'alert-triangle'}"></i><span>${esc(msg)}</span>`;
  $('#toasts').append(t);
  lucide.createIcons();
  setTimeout(() => t.remove(), 3400);
}

function fail(e) {
  if (e.code === 'SESSION_EXPIRED') {
    localStorage.removeItem(LS_KEY);
    toast('เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง', 'bad');
    setTimeout(() => location.reload(), 900);
  } else toast(e.message, 'bad');
}

async function logout() {
  try { await apiCall('logout', {}, S.token); } catch (e) {}
  localStorage.removeItem(LS_KEY);
  location.href = 'admin.html';
}

/* ---------- กระจายเหตุการณ์ทั้งหมด ---------- */
function bindGlobal() {
  $('#loginForm').addEventListener('submit', onLogin);
  $('#logoutBtn').addEventListener('click', logout);

  $('#modalBack').addEventListener('click', e => {
    if (e.target.id === 'modalBack') closeModal();
  });

  document.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { closeModal(); return; }
    const t = e.target.closest('[data-act]');
    if (!t) return;
    e.preventDefault();
    const act = t.dataset.act, id = t.dataset.id;
    if (act === 'nav')        { S.view = id; renderView(); }
    if (act === 'card-new')   openCardModal(null);
    if (act === 'card-edit')  openCardModal(S.cards.find(c => String(c.id) === String(id)));
    if (act === 'card-up')    moveCard(id, 'up');
    if (act === 'card-down')  moveCard(id, 'down');
    if (act === 'card-toggle') toggleCard(id);
    if (act === 'card-del')   confirmDelCard(id);
    if (act === 'user-new')   openUserModal(null);
    if (act === 'user-edit')  openUserModal(S.users.find(u => String(u.id) === String(id)));
    if (act === 'user-del')   confirmDelUser(id);
    if (act === 'upl-pick')   $('#uplFile').click();
  });
}
