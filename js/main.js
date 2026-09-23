/* หน้าเว็บสาธารณะ — โหลดเนื้อหาจาก Google Sheet ผ่าน Apps Script */
const $ = (s, p = document) => p.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g,
  m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

const el = {
  cards: $('#cards'), ticker: $('#ticker'), tInner: $('#tickerInner'),
  tag: $('#mTag'), about: $('#aboutText'),
  fPhone: $('#fPhone'), fPhoneV: $('#fPhoneV'),
  fEmail: $('#fEmail'), fEmailV: $('#fEmailV'),
  mockbar: $('#mockbar'),
};

boot();

async function boot() {
  $('#year').textContent = new Date().getFullYear();
  lucide.createIcons();
  if (isMockMode()) el.mockbar.hidden = false;

  try {
    const d = await apiCall('site');
    paint(d);
  } catch (err) {
    el.cards.innerHTML = `
      <div class="empty">
        <h3>โหลดข้อมูลไม่สำเร็จ</h3>
        <p>${esc(err.message)}</p>
        <p>ตรวจสอบ URL ของ Web App ในไฟล์ <code>js/api.js</code>
        และสิทธิ์การเข้าถึง (ต้องตั้งเป็น Anyone)</p>
      </div>`;
  }
}

function paint(d) {
  const s = d.settings || {};

  if (s.siteTitle) document.title = s.siteTitle + ' · คณะศึกษาศาสตร์ ม.มหาสารคาม';
  if (s.tagline) el.tag.textContent = s.tagline;
  if (s.about) el.about.innerHTML = s.about;

  if (s.phone) { el.fPhone.hidden = false; el.fPhoneV.textContent = s.phone; }
  if (s.email) { el.fEmail.hidden = false; el.fEmailV.textContent = s.email; }

  if (s.announcement) {
    el.ticker.hidden = false;
    const t = esc(s.announcement);
    el.tInner.innerHTML = `<span>${t}</span><span>${t}</span>`;
  }

  const cards = d.cards || [];
  if (cards.length) {
    el.cards.innerHTML = cards.map(cardHTML).join('');
  } else {
    el.cards.innerHTML = `
      <div class="empty">
        <h3>ยังไม่มีรายการสารสนเทศ</h3>
        <p>ผู้ดูแลระบบสามารถเพิ่มรายการได้จาก
        <a href="admin.html">ระบบจัดการผู้ดูแล</a></p>
      </div>`;
  }
  lucide.createIcons();
}

function cardHTML(c, i) {
  const size = ['wide', 'tall'].includes(c.size) ? c.size : 'normal';
  const no = String(i + 1).padStart(2, '0');
  return `
  <a class="card card--${size} rise" style="animation-delay:${Math.min(i * 0.06, 0.42)}s"
     href="${esc(c.linkUrl || '#')}" target="_blank" rel="noopener" title="${esc(c.title)}">
    <figure class="card__img">
      <img src="${esc(c.imageUrl || '')}" alt="${esc(c.title)}" loading="lazy">
    </figure>
    <div class="card__bar">
      <span class="card__no">${no}</span>
      <div class="card__meta">
        <h3>${esc(c.title)}</h3>
        ${c.subtitle ? `<p>${esc(c.subtitle)}</p>` : ''}
      </div>
      <span class="card__go"><i data-lucide="arrow-up-right"></i></span>
    </div>
  </a>`;
}
