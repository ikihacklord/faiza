// server.js
// Plain Node.js HTTP server (no Express) serving the front end from /public
// and a small JSON REST API backed by SQLite (db/schema.js).
//
// Run with:  node server.js
// Then open: http://localhost:3000

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const db = require('./db/schema');
const auth = require('./lib/auth');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

/* ---------------------------- helpers ---------------------------- */

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1e6) req.destroy(); // 1MB guard
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); }
      catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function setSessionCookie(res, sessionId, expiresAt) {
  const expires = new Date(expiresAt).toUTCString();
  res.setHeader('Set-Cookie', `sid=${sessionId}; HttpOnly; Path=/; Expires=${expires}; SameSite=Lax`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', 'sid=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
}

function currentUser(req) {
  const cookies = auth.parseCookies(req);
  return auth.getUserBySession(cookies.sid);
}

function serveStatic(req, res, pathname) {
  let filePath = pathname === '/' ? '/login.html' : pathname;
  filePath = path.normalize(path.join(PUBLIC_DIR, filePath));
  if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, content) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

/* ------------------------- row -> API shape ------------------------- */

const patientOut = p => ({
  id: p.id, mrn: p.mrn, name: p.name, dob: p.dob, gender: p.gender,
  phone: p.phone, department: p.department, registered: p.registered,
});
const recordOut = r => ({
  id: r.id, patientId: r.patient_id, type: r.type, date: r.entry_date,
  author: r.author, notes: r.notes,
});
const apptOut = a => ({
  id: a.id, patientId: a.patient_id, date: a.appt_date, time: a.appt_time,
  department: a.department, doctor: a.doctor, status: a.status,
});

/* ------------------------------ routes ------------------------------ */

const VALID_ROLES = ['admin', 'doctor', 'nurse', 'labtech', 'reception'];

async function handleApi(req, res, url) {
  const { pathname } = url;
  const method = req.method;

  // ---- auth: signup / login / logout / me (no session required) ----
  if (pathname === '/api/signup' && method === 'POST') {
    const body = await readBody(req);
    const fullName = (body.fullName || '').trim();
    const email = (body.email || '').trim();
    const password = body.password || '';
    const role = body.role;

    if (!fullName || !email || !password || !VALID_ROLES.includes(role)) {
      return sendJson(res, 400, { error: 'Please fill in every field with a valid role.' });
    }
    // TEMPORARY: minimum password length check disabled for testing.
    // Re-enable before real use — see README "Security notes".
    // if (password.length < 6) {
    //   return sendJson(res, 400, { error: 'Password must be at least 6 characters.' });
    // }
    if (auth.getUserByEmail(email)) {
      return sendJson(res, 409, { error: 'An account with that email already exists.' });
    }
    const user = auth.createUser({ fullName, email, password, role });
    const session = auth.createSession(user.id);
    setSessionCookie(res, session.id, session.expires);
    return sendJson(res, 201, { user });
  }

  if (pathname === '/api/login' && method === 'POST') {
    const body = await readBody(req);
    const email = (body.email || '').trim();
    const password = body.password || '';
    const row = auth.getUserByEmail(email);
    if (!row || !auth.verifyPassword(password, row.password_salt, row.password_hash)) {
      return sendJson(res, 401, { error: 'Incorrect email or password.' });
    }
    const session = auth.createSession(row.id);
    setSessionCookie(res, session.id, session.expires);
    return sendJson(res, 200, { user: auth.getUserById(row.id) });
  }

  if (pathname === '/api/logout' && method === 'POST') {
    const cookies = auth.parseCookies(req);
    if (cookies.sid) auth.destroySession(cookies.sid);
    clearSessionCookie(res);
    return sendJson(res, 200, { ok: true });
  }

  if (pathname === '/api/me' && method === 'GET') {
    const user = currentUser(req);
    if (!user) return sendJson(res, 401, { error: 'Not signed in.' });
    return sendJson(res, 200, { user });
  }

  // ---- everything below requires a signed-in user ----
  const user = currentUser(req);
  if (!user) return sendJson(res, 401, { error: 'Not signed in.' });

  // ---- patients ----
  if (pathname === '/api/patients' && method === 'GET') {
    const rows = db.prepare('SELECT * FROM patients ORDER BY id DESC').all();
    return sendJson(res, 200, { patients: rows.map(patientOut) });
  }

  if (pathname === '/api/patients' && method === 'POST') {
    const body = await readBody(req);
    const { name, dob, gender, phone, department } = body;
    if (!name || !dob || !gender || !phone || !department) {
      return sendJson(res, 400, { error: 'All patient fields are required.' });
    }
    const nextId = (db.prepare('SELECT COALESCE(MAX(id),0) AS m FROM patients').get().m) + 1;
    const mrn = 'SR-24-' + String(nextId).padStart(4, '0');
    const registered = new Date().toISOString().slice(0, 10);
    const info = db.prepare(
      `INSERT INTO patients (mrn, name, dob, gender, phone, department, registered) VALUES (?,?,?,?,?,?,?)`
    ).run(mrn, name, dob, gender, phone, department, registered);
    const row = db.prepare('SELECT * FROM patients WHERE id = ?').get(info.lastInsertRowid);
    return sendJson(res, 201, { patient: patientOut(row) });
  }

  // ---- records ----
  if (pathname === '/api/records' && method === 'GET') {
    const patientId = url.searchParams.get('patientId');
    const rows = patientId
      ? db.prepare('SELECT * FROM records WHERE patient_id = ? ORDER BY entry_date DESC').all(patientId)
      : db.prepare('SELECT * FROM records ORDER BY entry_date DESC').all();
    return sendJson(res, 200, { records: rows.map(recordOut) });
  }

  if (pathname === '/api/records' && method === 'POST') {
    const body = await readBody(req);
    const { patientId, type, author, notes } = body;
    if (!patientId || !type || !author || !notes) {
      return sendJson(res, 400, { error: 'All record fields are required.' });
    }
    const now = new Date();
    const stamp = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);
    const info = db.prepare(
      `INSERT INTO records (patient_id, type, entry_date, author, notes) VALUES (?,?,?,?,?)`
    ).run(patientId, type, stamp, author, notes);
    const row = db.prepare('SELECT * FROM records WHERE id = ?').get(info.lastInsertRowid);
    return sendJson(res, 201, { record: recordOut(row) });
  }

  // ---- appointments ----
  if (pathname === '/api/appointments' && method === 'GET') {
    const rows = db.prepare('SELECT * FROM appointments ORDER BY appt_date, appt_time').all();
    return sendJson(res, 200, { appointments: rows.map(apptOut) });
  }

  if (pathname === '/api/appointments' && method === 'POST') {
    const body = await readBody(req);
    const { patientId, date, time, department, doctor } = body;
    if (!patientId || !date || !time || !department || !doctor) {
      return sendJson(res, 400, { error: 'All appointment fields are required.' });
    }
    const info = db.prepare(
      `INSERT INTO appointments (patient_id, appt_date, appt_time, department, doctor, status) VALUES (?,?,?,?,?,'Scheduled')`
    ).run(patientId, date, time, department, doctor);
    const row = db.prepare('SELECT * FROM appointments WHERE id = ?').get(info.lastInsertRowid);
    return sendJson(res, 201, { appointment: apptOut(row) });
  }

  return sendJson(res, 404, { error: 'Unknown API route.' });
}

/* ------------------------------ server ------------------------------ */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url);
    } else {
      serveStatic(req, res, url.pathname);
    }
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: err.message || 'Server error' });
  }
});

server.listen(PORT, () => {
  console.log(`Sunrise HRMS running at http://localhost:${PORT}`);
  console.log(`Database file: ${path.join(__dirname, 'sunrise.db')}`);
});