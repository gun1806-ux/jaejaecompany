// 홈페이지 문의 → 메일 발송 (Vercel 서버 함수)
// Vercel 프로젝트 설정 > Environment Variables 에 아래 3개를 넣어야 동작합니다.
//   GMAIL_USER     보내는 Gmail 주소
//   GMAIL_APP_PASS Gmail 앱 비밀번호(16자리)
//   INQUIRY_TO     문의를 받을 메일 주소 (비우면 GMAIL_USER 로 받음)
const nodemailer = require('nodemailer');

const hits = new Map(); // 같은 IP 연속 접수 막기 (인스턴스 단위, 간단 방어)
const one = (s, n) => String(s == null ? '' : s).replace(/[\r\n\t]+/g, ' ').trim().slice(0, n);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false }); }

  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }

  if (b.website) return res.status(200).json({ ok: true }); // 로봇이 채우는 숨은 칸

  const name = one(b.name, 60), phone = one(b.phone, 40), type = one(b.type, 40), budget = one(b.budget, 40);
  const page = one(b.page, 120), kind = b.kind === 'quick' ? '간편 문의' : '문의';
  const msg = String(b.msg == null ? '' : b.msg).trim().slice(0, 4000);
  if (!name || !phone) return res.status(400).json({ ok: false, error: '성함과 연락처를 남겨주세요.' });
  if (!/[0-9]{3,}/.test(phone.replace(/[^0-9]/g, ''))) return res.status(400).json({ ok: false, error: '연락처를 확인해 주세요.' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
  const now = Date.now(), last = hits.get(ip) || 0;
  if (now - last < 20000) return res.status(429).json({ ok: false, error: '잠시 후 다시 시도해 주세요.' });
  hits.set(ip, now);

  const { GMAIL_USER, GMAIL_APP_PASS, INQUIRY_TO } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASS) return res.status(503).json({ ok: false, error: 'mail-not-configured' });

  const rows = [['문의 종류', kind], ['성함 / 업체명', name], ['연락처', phone], ['문의 분야', type || '-'], ['예산', budget || '-'], ['보낸 페이지', page || '-']];
  const when = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + (msg ? `\n\n내용:\n${msg}` : '') + `\n\n접수 시각: ${when}`;
  const html = `<div style="font-family:'Malgun Gothic',sans-serif;font-size:15px;color:#222">
<h2 style="margin:0 0 14px;font-size:19px">재재컴퍼니 홈페이지 ${esc(kind)}</h2>
<table style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="padding:7px 14px 7px 0;color:#888;white-space:nowrap">${esc(k)}</td><td style="padding:7px 0"><b>${esc(v)}</b></td></tr>`).join('')}</table>
${msg ? `<div style="margin-top:16px;padding:14px 16px;background:#f6f6f2;border-radius:10px;white-space:pre-wrap">${esc(msg)}</div>` : ''}
<p style="margin-top:16px;color:#999;font-size:12.5px">접수 시각 ${esc(when)} · 전화하기: <a href="tel:${esc(phone.replace(/[^0-9+]/g, ''))}">${esc(phone)}</a></p></div>`;

  try {
    const t = nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_APP_PASS } });
    await t.sendMail({
      from: `"재재컴퍼니 홈페이지" <${GMAIL_USER}>`,
      to: INQUIRY_TO || GMAIL_USER,
      subject: `[홈페이지 ${kind}] ${type || '분야 미선택'} - ${name}`,
      text, html,
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('mail fail', e && e.message);
    return res.status(502).json({ ok: false, error: 'mail-failed' });
  }
};
