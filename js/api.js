/* =====================================================
   ตั้งค่าการเชื่อมต่อระบบ
   ▼▼ แก้บรรทัดนี้เป็น URL ของ Web App จากขั้นตอนที่ 5 ของคู่มือ
   ตัวอย่าง: 'https://script.google.com/macros/s/AKfy.../exec'
   หากยังไม่ใส่ ระบบจะทำงานใน "โหมดตัวอย่าง" (Mock data)
   ===================================================== */
const API_URL = 'REPLACE_WITH_YOUR_WEB_APP_URL';

/* ตรวจว่าอยู่ในโหมดตัวอย่างหรือไม่ */
function isMockMode() { return !/^https:\/\/script\.google/.test(API_URL); }

/* เรียกใช้ API (POST แบบ simple request เพื่อผ่าน CORS จาก GitHub Pages) */
async function apiCall(action, data = {}, token = null) {
  if (isMockMode()) return mockApi(action, data, token);
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, data, token }),
  });
  let out;
  try { out = await res.json(); }
  catch (e) { throw new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ — ตรวจ URL ใน js/api.js และสิทธิ์ Web App (ต้องเป็น Anyone)'); }
  if (!out.ok) {
    const err = new Error(out.error || 'เกิดข้อผิดพลาด');
    err.code = out.code || '';
    throw err;
  }
  return out;
}

/* =====================================================
   โหมดตัวอย่าง (Mock) — ใช้เฉพาะเมื่อยังไม่ได้ใส่ API_URL
   ลองระบบได้ครบ: admin@msu.ac.th / etc1234 (รหัสเดียวกันทุกบัญชี)
   ===================================================== */
const MOCK = {
  settings: {
    siteTitle: 'สาขาวิชาเทคโนโลยีและสื่อสารการศึกษา',
    tagline: 'ผลิตครูและนักออกแบบการเรียนรู้ สำหรับโลกยุคดิจิทัล',
    announcement: 'เปิดรับสมัครเรียนรอบ Admission — สอบถามเพิ่มเติมที่กองวิชาการ คณะศึกษาศาสตร์',
    about: '<p>สาขาวิชาเทคโนโลยีและสื่อสารการศึกษา คณะศึกษาศาสตร์ มหาวิทยาลัยมหาสารคาม มุ่งผลิตครูและบุคลากรทางการศึกษาที่ออกแบบ พัฒนา และนำสื่อกับเทคโนโลยีมาใช้เพื่อการเรียนรู้อย่างสร้างสรรค์</p><p>บัณฑิตของเราพร้อมทำงานทั้งสายการผลิตสื่อ สายเทคโนโลยีการศึกษา และสายการจัดการเรียนรู้ดิจิทัล</p>',
    phone: '0 4375 4xxx',
    email: 'etc@edu.msu.ac.th',
  },
  cards: [
    { id: '1', title: 'หลักสูตรที่เปิดสอน', subtitle: 'ปริญญาตรี – ปริญญาเอก', imageUrl: 'https://picsum.photos/seed/etc-curric/1600/900', linkUrl: 'https://www.msu.ac.th', size: 'wide', active: true },
    { id: '2', title: 'บุคลากรประจำสาขา', subtitle: 'อาจารย์และนักวิชาการ', imageUrl: 'https://picsum.photos/seed/etc-staff/800/1000', linkUrl: 'https://www.msu.ac.th', size: 'normal', active: true },
    { id: '3', title: 'ข่าวและประกาศ', subtitle: 'รับสมัคร ทุน กิจกรรม', imageUrl: 'https://picsum.photos/seed/etc-news/800/1000', linkUrl: 'https://www.msu.ac.th', size: 'normal', active: true },
    { id: '4', title: 'วิจัยและบริการวิชาการ', subtitle: 'ผลงานวิชาการของสาขา', imageUrl: 'https://picsum.photos/seed/etc-research/800/1050', linkUrl: 'https://www.msu.ac.th', size: 'tall', active: true },
    { id: '5', title: 'สื่อการเรียน E-Learning', subtitle: 'คลังสื่อดิจิทัล', imageUrl: 'https://picsum.photos/seed/etc-media/800/1000', linkUrl: 'https://www.msu.ac.th', size: 'normal', active: true },
    { id: '6', title: 'ติดต่อสาขาวิชา', subtitle: 'อีเมลและโทรศัพท์', imageUrl: 'https://picsum.photos/seed/etc-contact/1600/900', linkUrl: 'https://www.msu.ac.th', size: 'wide', active: false },
  ],
  users: [
    { id: 'u1', email: 'admin@msu.ac.th', name: 'ผู้ดูแลระบบ', role: 'ADMIN', status: 'ACTIVE', lastLogin: '', createdAt: '' },
    { id: 'u2', email: 'editor@msu.ac.th', name: 'อาจารย์สมศรี ใจดี', role: 'EDITOR', status: 'ACTIVE', lastLogin: '', createdAt: '' },
    { id: 'u3', email: 'viewer@msu.ac.th', name: 'นักศึกษา กช. ตัวอย่าง', role: 'VIEWER', status: 'ACTIVE', lastLogin: '', createdAt: '' },
  ],
  logs: [
    { time: '2025-01-15T09:24:00', email: 'admin@msu.ac.th', action: 'LOGIN', detail: 'เข้าสู่ระบบสำเร็จ' },
    { time: '2025-01-15T09:20:00', email: 'admin@msu.ac.th', action: 'EDIT_CARD', detail: 'หลักสูตรที่เปิดสอน' },
    { time: '2025-01-14T15:02:00', email: 'editor@msu.ac.th', action: 'UPLOAD', detail: 'banner-news.jpg' },
  ],
};

let M = JSON.parse(JSON.stringify(MOCK)); // สถานะจำลอง (รีเฟรชแล้วรีเซ็ต)

function mockApi(action, data, token) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try { resolve(mockRoute(action, data, token)); }
      catch (e) { reject(e); }
    }, 260);
  });
}

function mockRoute(action, d, token) {
  if (action === 'site')
    return { ok: true, settings: M.settings, cards: M.cards.filter(c => c.active !== false) };

  if (action === 'login') {
    const u = M.users.find(u => u.email === String(d.email || '').trim().toLowerCase());
    if (!u || d.password !== 'etc1234')
      throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง (โหมดตัวอย่าง: รหัส 1234? — ใช้ etc1234)');
    if (u.status !== 'ACTIVE') throw new Error('บัญชีนี้ถูกระงับการใช้งาน');
    return { ok: true, token: 'MOCK', user: u };
  }

  if (token !== 'MOCK') { const e = new Error('SESSION_EXPIRED'); e.code = 'SESSION_EXPIRED'; throw e; }

  switch (action) {
    case 'me':          return { ok: true, user: M.users[0] };
    case 'logout':      return { ok: true };
    case 'stats':       return { ok: true, cards: M.cards.length,
                                 active: M.cards.filter(c => c.active !== false).length,
                                 users: M.users.length, logs: M.logs };
    case 'listCards':   return { ok: true, cards: M.cards };
    case 'getSettings': return { ok: true, settings: M.settings };
    case 'listUsers':   return { ok: true, users: M.users };
    case 'saveCard': {
      if (!d.title) throw new Error('กรุณากรอกชื่อการ์ด');
      const c = M.cards.find(c => String(c.id) === String(d.id));
      if (c) Object.assign(c, d);
      else M.cards.push({ id: String(Date.now()), order: M.cards.length + 1, ...d });
      return { ok: true };
    }
    case 'deleteCard':
      M.cards = M.cards.filter(c => String(c.id) !== String(d.id));
      return { ok: true };
    case 'toggleCard': {
      const c = M.cards.find(c => String(c.id) === String(d.id));
      if (c) c.active = d.active !== false;
      return { ok: true };
    }
    case 'moveCard': {
      const i = M.cards.findIndex(c => String(c.id) === String(d.id));
      const j = d.dir === 'up' ? i - 1 : i + 1;
      if (i >= 0 && j >= 0 && j < M.cards.length) {
        const t = M.cards[i]; M.cards[i] = M.cards[j]; M.cards[j] = t;
      }
      return { ok: true };
    }
    case 'uploadImage':
      return { ok: true, url: 'https://picsum.photos/seed/preview' + Date.now() + '/900/640' };
    case 'saveUser': {
      if (d.id) {
        const u = M.users.find(u => String(u.id) === String(d.id));
        if (u) Object.assign(u, { name: d.name, role: d.role, status: d.status });
      } else {
        M.users.push({ id: String(Date.now()), email: d.email, name: d.name,
                       role: d.role, status: d.status, lastLogin: '', createdAt: '' });
      }
      return { ok: true };
    }
    case 'deleteUser':
      M.users = M.users.filter(u => String(u.id) !== String(d.id));
      return { ok: true };
    case 'saveSettings':
      Object.assign(M.settings, d);
      return { ok: true };
  }
  throw new Error('คำสั่งไม่ถูกต้อง: ' + action);
}
