// ==========================================
// KONFIGURASI FRONTEND
// ==========================================
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbzF4zGvQ_Xu63pS_-sf6VYJeduNh8sJoa5RRoGfkDWiwbFNh4z31bDr33aPXkkcNIx3kw/exec',
  MAX_FILE_SIZE_MB: 15
};

const STORE_KEY = 'panidos.session';
const STATUS_LABEL = { Draft: 'Draft (Develop)', Approved: 'Full Approved', Socialization: 'Sosialisasi', Active: 'Aktif', Obsolete: 'Obsolete' };
const STATUS_ORDER = ['Draft', 'Approved', 'Socialization', 'Active', 'Obsolete'];
const SOC_STATUSES = ['Socialization', 'Active']; // status yang menampilkan jumlah orang tersosialisasi
const TYPE_ICON = { SOP: 'description', WI: 'assignment', IM: 'mail', FRM: 'article', POL: 'gavel', SK: 'workspace_premium' };
const ACTION_META = {
  CREATE:          { label: 'Dokumen baru',        icon: 'note_add',     cls: 'badge-active' },
  NEW_REVISION:    { label: 'Terbit revisi',       icon: 'history',      cls: 'badge-active' },
  EDIT:            { label: 'Ubah informasi',      icon: 'edit',         cls: 'badge-info' },
  DELETE:          { label: 'Hapus dokumen',       icon: 'delete',       cls: 'badge-obsolete' },
  LOGIN:           { label: 'Login',               icon: 'login',        cls: 'badge-neutral' },
  LOGIN_FAILED:    { label: 'Login gagal',         icon: 'gpp_maybe',    cls: 'badge-obsolete' },
  USER_SAVE:       { label: 'Kelola pengguna',     icon: 'manage_accounts', cls: 'badge-info' },
  DEPT_SAVE:       { label: 'Kelola departemen',   icon: 'corporate_fare',  cls: 'badge-info' },
  PASSWORD_CHANGE: { label: 'Ganti password',      icon: 'key',          cls: 'badge-info' },
  LETTER_REGISTER: { label: 'Registrasi nomor surat', icon: 'mark_email_read', cls: 'badge-pending' },
  LETTER_UPLOAD:   { label: 'Upload berkas surat',    icon: 'task_alt',        cls: 'badge-valid' },
  LETTER_CANCEL:   { label: 'Batalkan surat',         icon: 'cancel',          cls: 'badge-obsolete' },
  LETTER_DELETE:   { label: 'Hapus surat',            icon: 'delete',          cls: 'badge-obsolete' },
  MASTER_SAVE:     { label: 'Kelola dokumen master',  icon: 'checklist',       cls: 'badge-info' },
  MASTER_DELETE:   { label: 'Hapus dokumen master',   icon: 'delete',          cls: 'badge-obsolete' }
};

// ---------- State ----------
const state = {
  token: '', me: null,
  docs: [], types: [], depts: [],
  filtered: [], page: 1,
  previewId: null, deleteTarget: null, manageDoc: null,
  users: [], audit: [], view: 'main',
  letters: [], letterEntities: [], letterTypes: [],
  letterUploadTarget: null, letterCancelTarget: null, letterDeleteTarget: null,
  masterList: [], masterDeleteTarget: null
};

const $ = (id) => document.getElementById(id);
const docTable = $('docTable');
const docTableBody = $('docTableBody');
const loadingIndicator = $('loadingIndicator');
const emptyState = $('emptyState');
const searchInput = $('searchInput');
const filterType = $('filterType');
const filterDept = $('filterDept');
const filterStatus = $('filterStatus');
const pageSizeSel = $('pageSize');

// ==========================================
// 1. API & SESI
// ==========================================
async function api(action, data) {
  const res = await fetch(CONFIG.API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(Object.assign({}, data, { action: action, token: state.token }))
  });
  const result = await res.json();
  if (result.status !== 'success' && result.code === 'AUTH' && action !== 'login') {
    forceLogout(result.message);
  }
  return result;
}

function saveToken(t) { try { t ? localStorage.setItem(STORE_KEY, t) : localStorage.removeItem(STORE_KEY); } catch (e) { /* abaikan */ } }
function loadToken() { try { return localStorage.getItem(STORE_KEY) || ''; } catch (e) { return ''; } }

function showLogin(message) {
  document.body.classList.add('is-guest');
  $('loginPass').value = '';
  if (message) showAlert($('loginAlert'), message, 'error'); else hideAlert($('loginAlert'));
  setTimeout(() => $('loginUser').focus(), 50);
}

function forceLogout(message) {
  state.token = ''; state.me = null; saveToken('');
  document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
  showLogin(message);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.maxMb').forEach(el => (el.textContent = CONFIG.MAX_FILE_SIZE_MB));
  $('searchKbd').textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K';

  if (CONFIG.API_URL.startsWith('GANTI_')) {
    showLogin('Belum terhubung: isi CONFIG.API_URL di script.js dengan Web App URL Apps Script Anda.');
    return;
  }
  state.token = loadToken();
  if (state.token) { document.body.classList.remove('is-guest'); fetchDatabase(); } else { showLogin(); }
});

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert($('loginAlert'));
  if (CONFIG.API_URL.startsWith('GANTI_')) return showAlert($('loginAlert'), 'CONFIG.API_URL belum diisi di script.js.', 'error');
  const btn = $('btnLogin');
  setBusy(btn, true, 'Memeriksa...');
  try {
    const r = await api('login', { username: $('loginUser').value.trim(), password: $('loginPass').value });
    if (r.status === 'success') {
      state.token = r.token; saveToken(r.token);
      document.body.classList.remove('is-guest');
      fetchDatabase();
    } else {
      showAlert($('loginAlert'), r.message, 'error');
    }
  } catch (err) {
    showAlert($('loginAlert'), 'Tidak dapat terhubung ke server. Periksa API_URL dan deployment Web App.', 'error');
  } finally {
    setBusy(btn, false, 'Masuk');
  }
});

$('btnLogout').addEventListener('click', () => { $('userPop').classList.add('hidden'); forceLogout(); showView('main'); });

// Menu pengguna
$('btnUser').addEventListener('click', (e) => { e.stopPropagation(); $('userPop').classList.toggle('hidden'); });
document.addEventListener('click', (e) => { if (!e.target.closest('#userMenu')) $('userPop').classList.add('hidden'); });

// ---------- Peran ----------
function isAdmin() { return state.me && state.me.role === 'Admin'; }
function canWrite() { return state.me && state.me.role !== 'Viewer'; }
function deptKey(d) { return String(d || '').trim().toUpperCase() || '-'; }
function canEditDept(code) {
  if (!state.me) return false;
  if (state.me.role === 'Admin') return true;
  if (state.me.role !== 'Editor') return false;
  return state.me.departments.includes('*') || state.me.departments.includes(deptKey(code));
}
function deptName(code) {
  const k = deptKey(code);
  const d = state.depts.find(x => x.code === k);
  return d ? d.name : String(code || '').trim() || '-';
}

function applyRoleUI() {
  const me = state.me;
  document.querySelectorAll('[data-need="write"]').forEach(el => el.classList.toggle('hidden', !canWrite()));
  document.querySelectorAll('[data-need="admin"]').forEach(el => el.classList.toggle('hidden', !isAdmin()));
  $('userName').textContent = me.fullName;
  $('userRole').textContent = me.role;
  $('welcomeName').textContent = `Halo, ${String(me.fullName || me.username).trim().split(/\s+/)[0]}`;
  $('popName').textContent = me.fullName;
  $('popMeta').textContent = `@${me.username} · ${me.role}`;
  $('userAvatar').innerHTML = `<span>${escapeHTML(initials(me.fullName))}</span>`;
  if (!isAdmin() && state.view !== 'main' && state.view !== 'charts' && state.view !== 'masterList' && state.view !== 'letters') showView('main');
}

function initials(name) {
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0] || '?')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

// ==========================================
// 2. NAVIGASI, SIDEBAR, TUTUP MODAL
// ==========================================
function showView(name) {
  state.view = name;
  ['main', 'charts', 'masterList', 'letters', 'audit', 'users'].forEach(v => {
    const el = $('view' + v[0].toUpperCase() + v.slice(1));
    if (el) el.classList.toggle('hidden', v !== name);
  });
  document.querySelectorAll('.nav-item[data-view]').forEach(b => {
    const on = b.dataset.view === name && (name !== 'main' || b.dataset.scroll === (state.navScroll || 'top'));
    b.classList.toggle('active', on);
  });
  if (name === 'charts') renderCharts();
  if (name === 'masterList') loadMasterList();
  if (name === 'letters') loadLetters();
  if (name === 'audit') loadAudit();
  if (name === 'users') loadUsers();
}

document.querySelectorAll('.nav-item[data-view]').forEach(b => b.addEventListener('click', () => {
  state.navScroll = b.dataset.scroll || 'top';
  showView(b.dataset.view);
  if (b.dataset.view === 'main') {
    if (state.navScroll === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
    else $(state.navScroll).scrollIntoView({ behavior: 'smooth' });
  } else window.scrollTo({ top: 0 });
  closeSidebar();
}));

$('btnMenu').addEventListener('click', () => { $('sidebar').classList.add('open'); $('sidebarScrim').classList.remove('hidden'); });
$('sidebarScrim').addEventListener('click', closeSidebar);
function closeSidebar() { $('sidebar').classList.remove('open'); $('sidebarScrim').classList.add('hidden'); }
$('navUpload').addEventListener('click', () => { closeSidebar(); openUploadModal(); });
$('btnOpenUpload').addEventListener('click', openUploadModal);

document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => $(btn.getAttribute('data-close')).classList.add('hidden'));
});
document.querySelectorAll('.modal-backdrop').forEach(bd => {
  bd.addEventListener('mousedown', (e) => { if (e.target === bd) bd.classList.add('hidden'); });
});

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !document.body.classList.contains('is-guest')) {
    e.preventDefault(); showView('main'); searchInput.focus(); searchInput.select();
  }
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach(m => m.classList.add('hidden'));
    $('userPop').classList.add('hidden');
    closeSidebar();
  }
});

// ==========================================
// 3. AMBIL DATA (LIST)
// ==========================================
async function fetchDatabase() {
  showLoading(true);
  $('btnRefresh').classList.add('spin');
  try {
    const result = await api('list');
    if (result.status === 'success') {
      state.me = result.me;
      state.docs = result.documents || [];
      state.types = result.docTypes || [];
      state.depts = result.departments || [];

      applyRoleUI();
      populateDocTypeDropdowns();
      populateDeptOptions();
      updateStatistics();
      renderTypeCards();
      renderDeptCards();
      applyFilters();
      if (state.view === 'charts') renderCharts();
    } else if (result.code !== 'AUTH') {
      showToast('Gagal mengambil data: ' + result.message, 'err');
      showEmpty('Gagal memuat data', result.message);
    }
  } catch (error) {
    console.error('Fetch Error:', error);
    showToast('Gagal terhubung ke server Apps Script. Periksa API_URL Anda.', 'err');
    showEmpty('Tidak dapat terhubung', 'Periksa CONFIG.API_URL dan pengaturan deployment Web App.');
  } finally {
    showLoading(false);
    $('btnRefresh').classList.remove('spin');
  }
}
$('btnRefresh').addEventListener('click', () => { fetchDatabase(); if (state.view === 'charts') renderCharts(); if (state.view === 'audit') loadAudit(); if (state.view === 'users') loadUsers(); });

function populateDocTypeDropdowns() {
  const current = filterType.value;
  filterType.innerHTML = '<option value="ALL">Semua Tipe</option>' +
    state.types.map(t => `<option value="${escapeHTML(t.code)}">${escapeHTML(t.code)} - ${escapeHTML(t.name)}</option>`).join('');
  if ([...filterType.options].some(o => o.value === current)) filterType.value = current;

  const opts = state.types.map(t => `<option value="${escapeHTML(t.code)}">${escapeHTML(t.code)} - ${escapeHTML(t.name)}</option>`).join('');
  $('upDocType').innerHTML = opts;
  $('mgDocType').innerHTML = opts;
}

function writableDepts() {
  return state.depts.filter(d => d.active && canEditDept(d.code));
}
function deptOptionsHTML(list, extraCode) {
  let html = list.map(d => `<option value="${escapeHTML(d.code)}">${escapeHTML(d.code)} - ${escapeHTML(d.name)}</option>`).join('');
  if (extraCode && !list.some(d => d.code === deptKey(extraCode))) {
    html = `<option value="${escapeHTML(extraCode)}">${escapeHTML(extraCode)} (lama)</option>` + html;
  }
  return html;
}

function populateDeptOptions() {
  const current = filterDept.value;
  const keys = new Map();
  state.depts.forEach(d => keys.set(d.code, d.name));
  state.docs.forEach(d => { const k = deptKey(d.department); if (!keys.has(k)) keys.set(k, d.department.trim() || '-'); });
  const sorted = [...keys.keys()].sort();
  filterDept.innerHTML = '<option value="ALL">Semua Departemen</option>' +
    sorted.map(k => `<option value="${escapeHTML(k)}">${escapeHTML(k)} - ${escapeHTML(keys.get(k))}</option>`).join('');
  if (sorted.includes(current)) filterDept.value = current;
}

// ==========================================
// 4. RINGKASAN, KARTU TIPE & DEPARTEMEN
// ==========================================
function updateStatistics() {
  const docs = state.docs;
  $('statTotal').textContent = docs.length;
  const cnt = (s) => docs.filter(d => d.status === s).length;
  $('statDraft').textContent = cnt('Draft');
  $('statApproved').textContent = cnt('Approved');
  $('statSocial').textContent = cnt('Socialization');
  $('statActive').textContent = cnt('Active');
  $('statObsolete').textContent = cnt('Obsolete');
  const people = docs.filter(d => d.status !== 'Obsolete').reduce((s, d) => s + (Number(d.socialized) || 0), 0);
  $('statSocialPeople').textContent = people.toLocaleString('id-ID') + ' orang tersosialisasi';
}

function renderTypeCards() {
  const grid = $('typeGrid');
  if (!state.types.length) { grid.innerHTML = '<div class="empty-line">Belum ada tipe dokumen.</div>'; return; }
  grid.innerHTML = state.types.map(t => {
    const docs = state.docs.filter(d => d.docType === t.code);
    const active = docs.filter(d => d.status === 'Active').length;
    const sel = filterType.value === t.code ? ' selected' : '';
    return `
      <button type="button" class="type-card${sel}" data-type="${escapeHTML(t.code)}">
        <span class="type-ico"><span class="ms">${TYPE_ICON[t.code] || 'folder'}</span></span>
        <span class="type-info">
          <strong title="${escapeHTML(t.name)}">${escapeHTML(t.name)}</strong>
          <span class="type-badges">
            <span class="pill-n ok">${active} Aktif</span>
            <span class="pill-n dark">${docs.length - active} Lainnya</span>
          </span>
        </span>
      </button>`;
  }).join('');
}

function renderDeptCards() {
  const grid = $('deptGrid');
  const map = new Map();
  state.docs.forEach(d => {
    const k = deptKey(d.department);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(d);
  });
  $('deptCount').textContent = map.size ? `${map.size} departemen` : '';
  if (!map.size) { grid.innerHTML = '<div class="empty-line">Belum ada dokumen.</div>'; return; }

  const rows = [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  grid.innerHTML = rows.map(([key, docs]) => {
    const total = docs.length;
    const n = (s) => docs.filter(d => d.status === s).length;
    const pct = (v) => (v / total * 100).toFixed(1);
    const byType = {};
    docs.forEach(d => { byType[d.docType] = (byType[d.docType] || 0) + 1; });
    const chips = Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([code, c]) => `<span>${escapeHTML(code)}<b>${c}</b></span>`).join('');
    const sel = filterDept.value === key ? ' selected' : '';
    return `
      <button type="button" class="dept-card${sel}" data-dept="${escapeHTML(key)}">
        <span class="dept-top">
          <span class="dept-avatar">${escapeHTML(key.slice(0, 3))}</span>
          <span class="dept-name">${escapeHTML(deptName(key))}</span>
          <span class="dept-total"><strong>${total}</strong><small>dokumen</small></span>
        </span>
        <span class="dept-bar" title="Draft ${n('Draft')} · Approved ${n('Approved')} · Sosialisasi ${n('Socialization')} · Aktif ${n('Active')} · Obsolete ${n('Obsolete')}">
          <i class="bar-warn" style="width:${pct(n('Draft'))}%"></i>
          <i class="bar-info" style="width:${pct(n('Approved'))}%"></i>
          <i class="bar-social" style="width:${pct(n('Socialization'))}%"></i>
          <i class="bar-ok" style="width:${pct(n('Active'))}%"></i>
          <i class="bar-bad" style="width:${pct(n('Obsolete'))}%"></i>
        </span>
        <span class="dept-types">${chips}</span>
      </button>`;
  }).join('');
}

$('typeGrid').addEventListener('click', (e) => {
  const card = e.target.closest('[data-type]');
  if (!card) return;
  filterType.value = filterType.value === card.dataset.type ? 'ALL' : card.dataset.type;
  resetPageAndFilter();
  $('sectionRepo').scrollIntoView({ behavior: 'smooth' });
});
$('deptGrid').addEventListener('click', (e) => {
  const card = e.target.closest('[data-dept]');
  if (!card) return;
  filterDept.value = filterDept.value === card.dataset.dept ? 'ALL' : card.dataset.dept;
  resetPageAndFilter();
  $('sectionRepo').scrollIntoView({ behavior: 'smooth' });
});

// ==========================================
// 5. FILTER, PAGINASI, TABEL
// ==========================================
searchInput.addEventListener('input', () => { if (state.view !== 'main') showView('main'); toggleSearchClear(); resetPageAndFilter(); });
$('searchClear').addEventListener('click', () => { searchInput.value = ''; toggleSearchClear(); resetPageAndFilter(); searchInput.focus(); });
[filterType, filterDept, filterStatus, pageSizeSel].forEach(el => el.addEventListener('change', resetPageAndFilter));
$('btnResetFilters').addEventListener('click', () => {
  searchInput.value = ''; filterType.value = 'ALL'; filterDept.value = 'ALL'; filterStatus.value = 'ALL';
  toggleSearchClear(); resetPageAndFilter();
});
$('btnExport').addEventListener('click', exportCsv);

function toggleSearchClear() { $('searchClear').classList.toggle('hidden', !searchInput.value); }
function resetPageAndFilter() { state.page = 1; applyFilters(); }

function applyFilters() {
  const kw = searchInput.value.toLowerCase().trim();
  const selType = filterType.value, selDept = filterDept.value, selStatus = filterStatus.value;

  state.filtered = state.docs.filter(doc => {
    const hay = [doc.docNumber, doc.title, doc.department, deptName(doc.department), doc.fileName, doc.uploadedByName, doc.updatedByName]
      .join(' ').toLowerCase();
    return (!kw || hay.includes(kw)) &&
      (selType === 'ALL' || doc.docType === selType) &&
      (selDept === 'ALL' || deptKey(doc.department) === selDept) &&
      (selStatus === 'ALL' || doc.status === selStatus);
  });

  document.querySelectorAll('.type-card').forEach(c => c.classList.toggle('selected', c.dataset.type === selType));
  document.querySelectorAll('.dept-card').forEach(c => c.classList.toggle('selected', c.dataset.dept === selDept));
  renderTable();
}

function renderTable() {
  const size = parseInt(pageSizeSel.value, 10);
  const totalPages = Math.max(1, Math.ceil(state.filtered.length / size));
  if (state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * size;
  const pageDocs = state.filtered.slice(start, start + size);

  docTableBody.innerHTML = '';

  if (!state.filtered.length) {
    showEmpty('Tidak ada dokumen', state.docs.length
      ? 'Tidak ada dokumen yang sesuai dengan filter saat ini.'
      : (canWrite() ? 'Belum ada dokumen. Klik "Unggah Dokumen" untuk memulai.' : 'Belum ada dokumen.'));
    $('tableInfo').textContent = '';
    $('pager').innerHTML = '';
    return;
  }

  emptyState.classList.add('hidden');
  docTable.classList.remove('hidden');

  pageDocs.forEach(doc => {
    const ext = fileExt(doc.fileName);
    const when = formatDate(doc.updatedAt || doc.uploadDate);
    const who = doc.updatedByName || doc.uploadedByName;
    const canEdit = canWrite() && canEditDept(doc.department);
    const tr = document.createElement('tr');
    if (doc.id === state.previewId) tr.classList.add('is-previewed');
    tr.innerHTML = `
      <td class="td-doc" data-label="Dokumen">
        <div class="doc-cell">
          <span class="file-ico ${extClass(ext)}"><span class="ms">${extIcon(ext)}</span></span>
          <span>
            <span class="doc-title">${escapeHTML(doc.title)}</span>
            <span class="doc-filename">${escapeHTML(doc.fileName)}</span>
          </span>
        </div>
      </td>
      <td data-label="No. Dokumen"><span class="doc-code">${escapeHTML(doc.docNumber)}</span></td>
      <td data-label="Tipe"><span class="type-tag">${escapeHTML(doc.docType)}</span></td>
      <td data-label="Departemen"><span title="${escapeHTML(deptName(doc.department))}">${escapeHTML(deptKey(doc.department))}</span></td>
      <td data-label="Revisi" class="nowrap">${escapeHTML(doc.revision)}</td>
      <td data-label="Diperbarui"><span class="nowrap">${escapeHTML(when)}</span>${who ? `<span class="doc-filename">oleh ${escapeHTML(who)}</span>` : ''}</td>
      <td data-label="Status"><span class="badge ${getStatusBadgeClass(doc.status)}">${escapeHTML(STATUS_LABEL[doc.status] || doc.status)}</span>${socBadge(doc)}</td>
      <td class="td-actions">
        <div class="action-group">
          <button class="act" data-act="preview" data-id="${escapeHTML(doc.id)}" title="Pratinjau" aria-label="Pratinjau"><span class="ms">visibility</span></button>
          <a class="act" href="${escapeHTML(doc.fileUrl)}" target="_blank" rel="noopener noreferrer" title="Buka di Drive" aria-label="Buka di Drive"><span class="ms">open_in_new</span></a>
          <button class="act" data-act="history" data-num="${escapeHTML(doc.docNumber)}" title="Riwayat revisi" aria-label="Riwayat revisi"><span class="ms">history</span></button>
          ${canEdit ? `<button class="act" data-act="manage" data-id="${escapeHTML(doc.id)}" title="Edit / Revisi" aria-label="Edit atau revisi"><span class="ms">edit</span></button>` : ''}
          ${isAdmin() ? `<button class="act danger" data-act="delete" data-id="${escapeHTML(doc.id)}" title="Hapus" aria-label="Hapus"><span class="ms">delete</span></button>` : ''}
        </div>
      </td>`;
    docTableBody.appendChild(tr);
  });

  const from = start + 1, to = start + pageDocs.length;
  $('tableInfo').textContent = `Menampilkan ${from}–${to} dari ${state.filtered.length} dokumen` +
    (state.filtered.length !== state.docs.length ? ` (disaring dari ${state.docs.length} total)` : '');
  renderPager(totalPages);
}

function renderPager(totalPages) {
  const pager = $('pager');
  if (totalPages <= 1) { pager.innerHTML = ''; return; }
  const set = new Set([1, totalPages, state.page - 1, state.page, state.page + 1]);
  const list = [...set].filter(p => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  let html = `<button class="pg" data-page="${state.page - 1}" ${state.page === 1 ? 'disabled' : ''}>Sebelumnya</button>`;
  let prev = 0;
  list.forEach(p => {
    if (p - prev > 1) html += '<span class="pg-gap">…</span>';
    html += `<button class="pg ${p === state.page ? 'on' : ''}" data-page="${p}">${p}</button>`;
    prev = p;
  });
  html += `<button class="pg" data-page="${state.page + 1}" ${state.page === totalPages ? 'disabled' : ''}>Berikutnya</button>`;
  pager.innerHTML = html;
}

$('pager').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-page]');
  if (!btn || btn.disabled) return;
  state.page = parseInt(btn.dataset.page, 10);
  renderTable();
  $('sectionRepo').scrollIntoView({ behavior: 'smooth' });
});

docTableBody.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const act = btn.dataset.act;
  if (act === 'preview') openPreview(btn.dataset.id);
  if (act === 'manage') openManageModal(btn.dataset.id);
  if (act === 'delete') askDelete(btn.dataset.id);
  if (act === 'history') openHistory(btn.dataset.num);
});

// ==========================================
// 6. PRATINJAU
// ==========================================
function openPreview(docId) {
  const doc = state.docs.find(d => d.id === docId);
  if (!doc) return;
  state.previewId = docId;
  const src = doc.driveFileId
    ? `https://drive.google.com/file/d/${encodeURIComponent(doc.driveFileId)}/preview`
    : doc.fileUrl.replace(/\/view.*$/, '/preview');
  $('previewIframe').src = src;
  $('previewOpen').href = doc.fileUrl;
  $('previewMeta').textContent = `${doc.docNumber} · ${doc.title} · ${doc.revision}`;
  $('previewPanel').classList.remove('hidden');
  $('previewPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  renderTable();
}
$('previewClose').addEventListener('click', () => {
  state.previewId = null;
  $('previewIframe').src = 'about:blank';
  $('previewPanel').classList.add('hidden');
  renderTable();
});

// ==========================================
// 7. RIWAYAT REVISI
// ==========================================
async function openHistory(docNumber) {
  $('historyTitle').textContent = 'Riwayat Dokumen';
  $('historySub').textContent = docNumber;
  $('historyBody').innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Memuat riwayat...</p></div>';
  $('historyModal').classList.remove('hidden');

  try {
    const r = await api('history', { docNumber });
    if (r.status !== 'success') { $('historyBody').innerHTML = `<div class="alert alert-error">${escapeHTML(r.message)}</div>`; return; }
    renderHistory(r);
  } catch (err) {
    $('historyBody').innerHTML = '<div class="alert alert-error">Gagal memuat riwayat.</div>';
  }
}

function renderHistory(r) {
  const first = r.versions[0];
  if (first) $('historyTitle').textContent = first.title;

  const versions = r.versions.map((v, i) => {
    const changed = v.updatedBy && v.updatedBy !== v.uploadedBy
      ? `<span>· terakhir diubah oleh <b>${escapeHTML(v.updatedByName)}</b> (${escapeHTML(formatDate(v.updatedAt))})</span>` : '';
    return `
      <div class="ver ${i === 0 ? 'ver-latest' : ''}">
        <div class="ver-head">
          <strong class="ver-rev">${escapeHTML(v.revision)}</strong>
          ${i === 0 ? '<span class="pill-n ok">Terbaru</span>' : ''}
          <span class="badge ${getStatusBadgeClass(v.status)}">${escapeHTML(STATUS_LABEL[v.status] || v.status)}</span>
          ${SOC_STATUSES.includes(v.status) ? socBadge(v, true) : ''}
          <a class="btn btn-tonal btn-sm ver-open" href="${escapeHTML(v.fileUrl)}" target="_blank" rel="noopener noreferrer"><span class="ms">open_in_new</span>Buka file</a>
        </div>
        <p class="ver-note">${escapeHTML(v.revisionNote || '—')}</p>
        <small class="ver-meta"><span class="ms">description</span>${escapeHTML(v.fileName)}
          <span>· diunggah oleh <b>${escapeHTML(v.uploadedByName || 'tidak tercatat')}</b> (${escapeHTML(formatDate(v.uploadDate))})</span>${changed}
        </small>
      </div>`;
  }).join('');

  const logs = r.logs.length ? r.logs.map(l => {
    const m = ACTION_META[l.action] || { label: l.action, icon: 'bolt', cls: 'badge-neutral' };
    return `
      <li>
        <span class="tl-dot ${m.cls}"><span class="ms">${m.icon}</span></span>
        <div class="tl-body">
          <div class="tl-top"><strong>${escapeHTML(l.fullName || l.username)}</strong>
            <span class="muted">${escapeHTML(l.role)}</span> · <span class="tl-act">${escapeHTML(m.label)}</span>
            ${l.revision ? `<span class="type-tag">${escapeHTML(l.revision)}</span>` : ''}</div>
          ${l.detail ? `<p class="tl-detail">${escapeHTML(l.detail)}</p>` : ''}
          <small class="muted">${escapeHTML(formatDate(l.timestamp))}</small>
        </div>
      </li>`;
  }).join('') : '<li class="muted">Belum ada aktivitas tercatat untuk dokumen ini.</li>';

  $('historyBody').innerHTML = `
    <div class="section-label"><span class="ms">layers</span>Versi dokumen <em class="chip">${r.versions.length} revisi</em></div>
    <div class="ver-list">${versions}</div>
    <div class="section-label"><span class="ms">timeline</span>Aktivitas &amp; perubahan</div>
    <ol class="timeline">${logs}</ol>`;
}

// ==========================================
// 8. UNGGAH DOKUMEN BARU
// ==========================================
function openUploadModal() {
  if (!canWrite()) return;
  $('uploadForm').reset();
  syncSoc('up');
  hideAlert($('uploadAlert'));
  renderFileChip('up');
  const list = writableDepts();
  $('upDepartment').innerHTML = deptOptionsHTML(list);
  if (!list.length) showAlert($('uploadAlert'), 'Anda belum memiliki departemen yang boleh dikelola. Hubungi Admin.', 'error');
  $('uploadModal').classList.remove('hidden');
}

[['up', 'upDrop', 'upFileInput'], ['mg', 'mgDrop', 'mgFileInput']].forEach(([prefix, dropId, inputId]) => {
  const drop = $(dropId);
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, () => drop.classList.add('drag')));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove('drag')));
  $(inputId).addEventListener('change', () => renderFileChip(prefix));
});

function renderFileChip(prefix) {
  const input = $(prefix === 'up' ? 'upFileInput' : 'mgFileInput');
  const chip = $(prefix === 'up' ? 'upFileChip' : 'mgFileChip');
  const file = input.files[0];
  if (!file) { chip.classList.add('hidden'); chip.innerHTML = ''; return; }
  const ext = fileExt(file.name);
  chip.innerHTML = `
    <span class="file-ico ${extClass(ext)}"><span class="ms">${extIcon(ext)}</span></span>
    <span class="fc-main"><span class="fc-name">${escapeHTML(file.name)}</span><span class="fc-size">${formatSize(file.size)}</span></span>
    <button type="button" class="act danger" title="Hapus pilihan" aria-label="Hapus pilihan"><span class="ms">delete</span></button>`;
  chip.querySelector('button').addEventListener('click', () => { input.value = ''; renderFileChip(prefix); });
  chip.classList.remove('hidden');
}

$('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const alertEl = $('uploadAlert'), btn = $('btnSubmitUpload');
  hideAlert(alertEl);

  const file = $('upFileInput').files[0];
  if (!file) return showAlert(alertEl, 'Pilih file terlebih dahulu.', 'error');
  if (file.size / (1024 * 1024) > CONFIG.MAX_FILE_SIZE_MB) return showAlert(alertEl, `Ukuran file maksimal ${CONFIG.MAX_FILE_SIZE_MB} MB.`, 'error');

  setBusy(btn, true, 'Mengunggah...');
  try {
    const result = await api('create', {
      docType: $('upDocType').value,
      docNumber: $('upDocNumber').value.trim(),
      title: $('upTitle').value.trim(),
      department: $('upDepartment').value,
      revision: $('upRevision').value.trim(),
      status: $('upStatus').value,
      socialized: socValue('up'),
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      fileData: await fileToBase64(file)
    });
    if (result.status === 'success') {
      showToast(result.message, 'ok');
      $('uploadModal').classList.add('hidden');
      fetchDatabase();
    } else if (result.code !== 'AUTH') {
      showAlert(alertEl, result.message, 'error');
    }
  } catch (err) {
    showAlert(alertEl, 'Gagal mengunggah dokumen.', 'error');
  } finally {
    setBusy(btn, false, 'Simpan & Unggah');
  }
});

// ==========================================
// 9. KELOLA / REVISI
// ==========================================
document.querySelectorAll('input[name="manageMode"]').forEach(radio => {
  radio.addEventListener('change', (e) => setManageMode(e.target.value));
});

function nextRevision(rev) {
  const m = String(rev).match(/^(.*?)(\d+)(\D*)$/);
  if (!m) return String(rev) + ' 01';
  return m[1] + String(parseInt(m[2], 10) + 1).padStart(m[2].length, '0') + m[3];
}

// Kolom jumlah orang tersosialisasi hanya muncul pada status Sosialisasi/Aktif
function syncSoc(prefix) {
  const show = SOC_STATUSES.includes($(prefix + 'Status').value);
  $(prefix + 'SocGroup').classList.toggle('hidden', !show);
}
function socValue(prefix) {
  const v = parseInt($(prefix + 'Socialized').value, 10);
  if (!SOC_STATUSES.includes($(prefix + 'Status').value)) return undefined; // status lain: nilai lama dipertahankan
  return v > 0 ? v : 0;
}
['up', 'mg'].forEach(prefix => $(prefix + 'Status').addEventListener('change', () => syncSoc(prefix)));

function setManageMode(mode) {
  const isRev = mode === 'new_revision';
  const doc = state.manageDoc;
  $('mgRevGroup').classList.toggle('hidden', !isRev);
  $('mgFileInput').required = isRev;
  $('mgNote').required = isRev;
  if (doc) {
    $('mgRevision').value = isRev ? nextRevision(doc.revision) : doc.revision;
    $('mgStatus').value = isRev ? 'Draft' : doc.status; // revisi baru dimulai dari Draft
    $('mgSocialized').value = isRev ? 0 : (doc.socialized || 0);
  }
  syncSoc('mg');
  $('manageSub').textContent = doc ? `${doc.docNumber} · ${doc.revision} sekarang` : '';
}

function openManageModal(docId) {
  const doc = state.docs.find(d => d.id === docId);
  if (!doc) return;
  state.manageDoc = doc;

  $('manageForm').reset();
  hideAlert($('manageAlert'));
  renderFileChip('mg');
  $('mgDepartment').innerHTML = deptOptionsHTML(writableDepts(), doc.department);

  document.querySelector('input[name="manageMode"][value="edit"]').checked = true;
  $('mgDocId').value = doc.id;
  $('mgDocType').value = doc.docType;
  $('mgDocNumber').value = doc.docNumber;
  $('mgTitle').value = doc.title;
  $('mgDepartment').value = [...$('mgDepartment').options].some(o => o.value === deptKey(doc.department)) ? deptKey(doc.department) : doc.department;
  $('mgStatus').value = doc.status;
  $('mgSocialized').value = doc.socialized || 0;
  setManageMode('edit');
  $('manageModal').classList.remove('hidden');
}

$('manageForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const alertEl = $('manageAlert'), btn = $('btnSubmitManage');
  hideAlert(alertEl);
  const mode = document.querySelector('input[name="manageMode"]:checked').value;

  const payload = {
    id: $('mgDocId').value,
    docType: $('mgDocType').value,
    title: $('mgTitle').value.trim(),
    department: $('mgDepartment').value,
    revision: $('mgRevision').value.trim(),
    status: $('mgStatus').value,
    socialized: socValue('mg')
  };

  setBusy(btn, true, 'Memproses...');
  try {
    if (mode === 'new_revision') {
      const file = $('mgFileInput').files[0];
      if (!file) return showAlert(alertEl, 'Pilih file revisi baru terlebih dahulu.', 'error');
      if (file.size / (1024 * 1024) > CONFIG.MAX_FILE_SIZE_MB) return showAlert(alertEl, `Ukuran file maksimal ${CONFIG.MAX_FILE_SIZE_MB} MB.`, 'error');
      payload.revisionNote = $('mgNote').value.trim();
      payload.fileName = file.name;
      payload.mimeType = file.type || 'application/octet-stream';
      payload.fileData = await fileToBase64(file);
    }
    const result = await api(mode, payload);
    if (result.status === 'success') {
      showToast(result.message, 'ok');
      $('manageModal').classList.add('hidden');
      fetchDatabase();
    } else if (result.code !== 'AUTH') {
      showAlert(alertEl, result.message, 'error');
    }
  } catch (err) {
    showAlert(alertEl, 'Terjadi kesalahan saat menyimpan perubahan.', 'error');
  } finally {
    setBusy(btn, false, 'Simpan Perubahan');
  }
});

// ==========================================
// 10. HAPUS (ADMIN)
// ==========================================
function askDelete(docId) {
  const doc = state.docs.find(d => d.id === docId);
  if (!doc) return;
  state.deleteTarget = doc;
  $('deleteText').innerHTML = I18N.t('Versi {0} dari {1} akan dihapus dari daftar dan file di Google Drive dipindahkan ke Trash. Tindakan ini tercatat di Jejak Audit.', [`<b>${escapeHTML(doc.revision)}</b>`, `<b>${escapeHTML(doc.docNumber)}</b>`]);
  $('deleteModal').classList.remove('hidden');
}

$('btnConfirmDelete').addEventListener('click', async () => {
  const doc = state.deleteTarget;
  if (!doc) return;
  const btn = $('btnConfirmDelete');
  btn.disabled = true;
  try {
    const r = await api('delete', { id: doc.id });
    if (r.status === 'success') {
      if (doc.id === state.previewId) $('previewClose').click();
      $('deleteModal').classList.add('hidden');
      showToast(r.message, 'ok');
      fetchDatabase();
    } else if (r.code !== 'AUTH') {
      showToast('Gagal menghapus: ' + r.message, 'err');
    }
  } catch (err) {
    showToast('Terjadi kesalahan koneksi saat menghapus.', 'err');
  } finally {
    btn.disabled = false; state.deleteTarget = null;
  }
});

// ==========================================
// 11. JEJAK AUDIT (ADMIN)
// ==========================================
$('btnAuditRefresh').addEventListener('click', loadAudit);
$('auditSearch').addEventListener('input', renderAudit);
$('auditAction').addEventListener('change', renderAudit);

async function loadAudit() {
  $('auditBody').innerHTML = '';
  $('auditEmpty').innerHTML = '<div class="spinner"></div><p>Memuat log...</p>';
  $('auditEmpty').classList.remove('hidden');
  try {
    const r = await api('audit_list', { limit: 500 });
    if (r.status === 'success') {
      // Deduplikasi tampilan: untuk LOGIN/LOGIN_FAILED, tampilkan hanya aksi login terbaru per username
      const seenLogin = new Set();
      const dedupedLogs = [];
      (r.logs || []).forEach(l => {
        if (l.action === 'LOGIN' || l.action === 'LOGIN_FAILED') {
          const u = String(l.username || '').toLowerCase();
          if (!seenLogin.has(u)) {
            seenLogin.add(u);
            dedupedLogs.push(l);
          }
        } else {
          dedupedLogs.push(l);
        }
      });
      state.audit = dedupedLogs;
      const actions = [...new Set(dedupedLogs.map(l => l.action))].sort();
      const cur = $('auditAction').value;
      $('auditAction').innerHTML = '<option value="ALL">Semua Aksi</option>' +
        actions.map(a => `<option value="${escapeHTML(a)}">${escapeHTML((ACTION_META[a] || {}).label || a)}</option>`).join('');
      if (actions.includes(cur)) $('auditAction').value = cur;
      renderAudit();
    } else if (r.code !== 'AUTH') {
      $('auditEmpty').innerHTML = `<strong>Gagal memuat</strong><p>${escapeHTML(r.message)}</p>`;
    }
  } catch (err) {
    $('auditEmpty').innerHTML = '<strong>Gagal memuat</strong><p>Tidak dapat terhubung ke server.</p>';
  }
}

function renderAudit() {
  const kw = $('auditSearch').value.toLowerCase().trim();
  const act = $('auditAction').value;
  const rows = state.audit.filter(l =>
    (act === 'ALL' || l.action === act) &&
    (!kw || [l.username, l.fullName, l.docNumber, l.detail, l.revision].join(' ').toLowerCase().includes(kw)));

  $('auditInfo').textContent = `${rows.length} dari ${state.audit.length} catatan terakhir`;
  if (!rows.length) {
    $('auditBody').innerHTML = '';
    $('auditEmpty').innerHTML = '<span class="ms">receipt_long</span><strong>Tidak ada catatan</strong><p>Tidak ada aktivitas yang sesuai.</p>';
    $('auditEmpty').classList.remove('hidden');
    return;
  }
  $('auditEmpty').classList.add('hidden');
  $('auditBody').innerHTML = rows.map(l => {
    const m = ACTION_META[l.action] || { label: l.action, cls: 'badge-neutral' };
    return `
      <tr>
        <td class="nowrap" data-label="Waktu">${escapeHTML(formatDate(l.timestamp))}</td>
        <td data-label="Pengguna"><strong>${escapeHTML(l.fullName || l.username)}</strong><span class="doc-filename">@${escapeHTML(l.username)}${l.role ? ' · ' + escapeHTML(l.role) : ''}</span></td>
        <td data-label="Aksi"><span class="badge ${m.cls}">${escapeHTML(m.label)}</span></td>
        <td data-label="No. Dokumen">${l.docNumber ? `<span class="doc-code">${escapeHTML(l.docNumber)}</span>` : '—'}</td>
        <td data-label="Revisi" class="nowrap">${escapeHTML(l.revision || '—')}</td>
        <td data-label="Detail" class="td-detail">${escapeHTML(l.detail)}</td>
      </tr>`;
  }).join('');
}

// ==========================================
// 12. PENGGUNA & DEPARTEMEN (ADMIN)
// ==========================================
async function loadUsers() {
  try {
    const r = await api('users_list');
    if (r.status === 'success') { state.users = r.users; renderUsers(); }
    else if (r.code !== 'AUTH') showToast(r.message, 'err');
  } catch (err) { showToast('Gagal memuat pengguna.', 'err'); }
  renderDeptTable();
}

function deptLabels(u) {
  if (u.role === 'Admin' || u.departments.includes('*')) return '<span class="pill-n dark">Semua</span>';
  if (!u.departments.length) return '<span class="muted">—</span>';
  return u.departments.map(d => `<span class="pill-n dark">${escapeHTML(d)}</span>`).join(' ');
}

function renderUsers() {
  $('userBody').innerHTML = state.users.map(u => `
    <tr>
      <td data-label="Pengguna">
        <div class="doc-cell">
          <span class="avatar sm"><span>${escapeHTML(initials(u.fullName))}</span></span>
          <span><span class="doc-title">${escapeHTML(u.fullName)}</span><span class="doc-filename">@${escapeHTML(u.username)}${u.email ? ' · ' + escapeHTML(u.email) : ''}</span></span>
        </div>
      </td>
      <td data-label="Peran"><span class="badge ${u.role === 'Admin' ? 'badge-info' : u.role === 'Editor' ? 'badge-active' : 'badge-neutral'}">${escapeHTML(u.role)}</span></td>
      <td data-label="Departemen">${deptLabels(u)}</td>
      <td class="nowrap" data-label="Login Terakhir">${escapeHTML(u.lastLogin ? formatDate(u.lastLogin) : '—')}</td>
      <td data-label="Status"><span class="badge ${u.active ? 'badge-active' : 'badge-obsolete'}">${u.active ? 'Aktif' : 'Nonaktif'}</span></td>
      <td class="td-actions"><div class="action-group">
        <button class="act" data-user="${escapeHTML(u.username)}" title="Edit pengguna" aria-label="Edit pengguna"><span class="ms">edit</span></button>
      </div></td>
    </tr>`).join('') || '<tr><td colspan="6" class="muted">Belum ada pengguna.</td></tr>';
}
$('userBody').addEventListener('click', (e) => {
  const b = e.target.closest('[data-user]');
  if (b) openUserModal(state.users.find(u => u.username === b.dataset.user));
});

function renderDeptTable() {
  const counts = {};
  state.docs.forEach(d => { const k = deptKey(d.department); counts[k] = (counts[k] || 0) + 1; });
  $('deptBody').innerHTML = state.depts.map(d => `
    <tr>
      <td data-label="Kode"><span class="doc-code">${escapeHTML(d.code)}</span></td>
      <td data-label="Nama">${escapeHTML(d.name)}</td>
      <td data-label="Jumlah Dokumen">${counts[d.code] || 0}</td>
      <td data-label="Status"><span class="badge ${d.active ? 'badge-active' : 'badge-obsolete'}">${d.active ? 'Aktif' : 'Nonaktif'}</span></td>
      <td class="td-actions"><div class="action-group">
        <button class="act" data-dept-edit="${escapeHTML(d.code)}" title="Edit departemen" aria-label="Edit departemen"><span class="ms">edit</span></button>
      </div></td>
    </tr>`).join('') || '<tr><td colspan="5" class="muted">Belum ada departemen.</td></tr>';
}
$('deptBody').addEventListener('click', (e) => {
  const b = e.target.closest('[data-dept-edit]');
  if (b) openDeptModal(state.depts.find(d => d.code === b.dataset.deptEdit));
});

// ----- Modal pengguna -----
let editingUser = null;
$('btnAddUser').addEventListener('click', () => openUserModal(null));
$('usRole').addEventListener('change', syncUserDeptGroup);

function syncUserDeptGroup() {
  $('usDeptGroup').classList.toggle('hidden', $('usRole').value !== 'Editor');
}

function openUserModal(u) {
  editingUser = u || null;
  $('userForm').reset();
  hideAlert($('userAlert'));
  $('userModalTitle').textContent = u ? 'Edit Pengguna' : 'Tambah Pengguna';
  $('usUsername').value = u ? u.username : '';
  $('usUsername').readOnly = !!u;
  $('usFullName').value = u ? u.fullName : '';
  $('usEmail').value = u ? u.email : '';
  $('usRole').value = u ? u.role : 'Viewer';
  $('usActive').value = u ? String(u.active) : 'true';
  $('usPassword').required = !u;
  $('usPasswordLabel').innerHTML = u ? 'Password baru <small class="muted">(kosongkan jika tidak diubah)</small>' : 'Password <b>*</b>';

  const sel = u ? u.departments : [];
  const all = sel.includes('*');
  $('usDeptChecks').innerHTML =
    `<label class="check"><input type="checkbox" value="*" ${all ? 'checked' : ''}><span>Semua departemen</span></label>` +
    state.depts.filter(d => d.active || sel.includes(d.code)).map(d =>
      `<label class="check"><input type="checkbox" value="${escapeHTML(d.code)}" ${sel.includes(d.code) ? 'checked' : ''}><span>${escapeHTML(d.code)} · ${escapeHTML(d.name)}</span></label>`).join('');
  syncUserDeptGroup();
  $('userModal').classList.remove('hidden');
}

$('userForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const alertEl = $('userAlert'), btn = $('btnSubmitUser');
  hideAlert(alertEl);
  const role = $('usRole').value;
  let departments = [];
  if (role === 'Admin') departments = ['*'];
  if (role === 'Editor') {
    departments = [...$('usDeptChecks').querySelectorAll('input:checked')].map(i => i.value);
    if (departments.includes('*')) departments = ['*'];
    if (!departments.length) return showAlert(alertEl, 'Pilih minimal satu departemen untuk Editor.', 'error');
  }
  setBusy(btn, true, 'Menyimpan...');
  try {
    const r = await api('user_save', {
      username: $('usUsername').value.trim(), fullName: $('usFullName').value.trim(),
      email: $('usEmail').value.trim(), role, departments,
      active: $('usActive').value === 'true', password: $('usPassword').value
    });
    if (r.status === 'success') {
      $('userModal').classList.add('hidden');
      showToast(r.message, 'ok');
      loadUsers();
    } else if (r.code !== 'AUTH') showAlert(alertEl, r.message, 'error');
  } catch (err) { showAlert(alertEl, 'Gagal menyimpan pengguna.', 'error'); }
  finally { setBusy(btn, false, 'Simpan'); }
});

// ----- Modal departemen -----
$('btnAddDept').addEventListener('click', () => openDeptModal(null));
function openDeptModal(d) {
  $('deptForm').reset();
  hideAlert($('deptAlert'));
  $('deptModalTitle').textContent = d ? 'Edit Departemen' : 'Tambah Departemen';
  $('dpCode').value = d ? d.code : '';
  $('dpCode').readOnly = !!d;
  $('dpName').value = d ? d.name : '';
  $('dpActive').value = d ? String(d.active) : 'true';
  $('deptModal').classList.remove('hidden');
}
$('deptForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const alertEl = $('deptAlert'), btn = $('btnSubmitDept');
  hideAlert(alertEl);
  setBusy(btn, true, 'Menyimpan...');
  try {
    const r = await api('dept_save', { code: $('dpCode').value.trim(), name: $('dpName').value.trim(), active: $('dpActive').value === 'true' });
    if (r.status === 'success') {
      $('deptModal').classList.add('hidden');
      showToast(r.message, 'ok');
      await fetchDatabase();
      renderDeptTable();
    } else if (r.code !== 'AUTH') showAlert(alertEl, r.message, 'error');
  } catch (err) { showAlert(alertEl, 'Gagal menyimpan departemen.', 'error'); }
  finally { setBusy(btn, false, 'Simpan'); }
});

// ----- Ubah password sendiri -----
$('btnChangePw').addEventListener('click', () => {
  $('userPop').classList.add('hidden');
  $('pwForm').reset(); hideAlert($('pwAlert'));
  $('pwModal').classList.remove('hidden');
});
$('pwForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const alertEl = $('pwAlert'), btn = $('btnSubmitPw');
  hideAlert(alertEl);
  if ($('pwNew').value !== $('pwNew2').value) return showAlert(alertEl, 'Konfirmasi password baru tidak sama.', 'error');
  setBusy(btn, true, 'Menyimpan...');
  try {
    const r = await api('change_password', { oldPassword: $('pwOld').value, newPassword: $('pwNew').value });
    if (r.status === 'success') {
      state.token = r.token; saveToken(r.token);
      $('pwModal').classList.add('hidden');
      showToast(r.message, 'ok');
    } else if (r.code !== 'AUTH') showAlert(alertEl, r.message, 'error');
  } catch (err) { showAlert(alertEl, 'Gagal mengganti password.', 'error'); }
  finally { setBusy(btn, false, 'Simpan'); }
});

// ==========================================
// 13. EKSPOR CSV
// ==========================================
function exportCsv() {
  if (!state.filtered.length) return showToast('Tidak ada data untuk diekspor.', 'err');
  const head = ['No. Dokumen', 'Judul', 'Tipe', 'Departemen', 'Revisi', 'Status', 'Orang Tersosialisasi', 'Catatan Revisi', 'Diunggah Oleh', 'Tgl Unggah', 'Diperbarui Oleh', 'Tgl Diperbarui', 'Nama File', 'Link'];
  const tr = (s) => I18N.t(s);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = state.filtered.map(d => [d.docNumber, d.title, d.docType, deptName(d.department), d.revision, tr(STATUS_LABEL[d.status] || d.status), SOC_STATUSES.includes(d.status) ? (d.socialized || 0) : '', d.revisionNote,
    d.uploadedByName, formatDate(d.uploadDate), d.updatedByName, formatDate(d.updatedAt), d.fileName, d.fileUrl].map(esc).join(','));
  const csv = '﻿' + [head.map(h => esc(tr(h))).join(','), ...rows].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = `daftar-dokumen-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// ==========================================
// 14. HELPERS
// ==========================================
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = err => reject(err);
  });
}
function fileExt(name) { return (String(name).split('.').pop() || '').toLowerCase(); }
function extClass(ext) {
  if (ext === 'pdf') return 'ext-pdf';
  if (['doc', 'docx', 'odt', 'rtf', 'txt'].includes(ext)) return 'ext-doc';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'ext-xls';
  if (['ppt', 'pptx', 'odp'].includes(ext)) return 'ext-ppt';
  if (['png', 'jpg', 'jpeg', 'gif', 'tif', 'tiff', 'webp'].includes(ext)) return 'ext-img';
  return 'ext-oth';
}
function extIcon(ext) {
  if (ext === 'pdf') return 'picture_as_pdf';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'table_chart';
  if (['ppt', 'pptx', 'odp'].includes(ext)) return 'slideshow';
  if (['png', 'jpg', 'jpeg', 'gif', 'tif', 'tiff', 'webp'].includes(ext)) return 'image';
  return 'description';
}
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}
function formatDate(raw) {
  const s = String(raw || '');
  if (!s || /^\d{2}\/\d{2}\/\d{4}/.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d)) return s;
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
// Penanda jumlah orang tersosialisasi (tampil pada status Sosialisasi/Aktif)
function socBadge(doc, inline) {
  const n = Number(doc.socialized) || 0;
  if (!SOC_STATUSES.includes(doc.status) || (!n && doc.status !== 'Socialization')) return '';
  return `<span class="soc-count${inline ? ' inline' : ''}" title="Jumlah orang yang sudah tersosialisasi"><span class="ms">groups</span>${n.toLocaleString('id-ID')} orang</span>`;
}
function getStatusBadgeClass(status) {
  if (status === 'Active') return 'badge-active';
  if (status === 'Draft') return 'badge-draft';
  if (status === 'Approved') return 'badge-approved';
  if (status === 'Socialization') return 'badge-social';
  if (status === 'Obsolete') return 'badge-obsolete';
  return 'badge-neutral';
}
function showLoading(isLoading) {
  if (isLoading) {
    loadingIndicator.classList.remove('hidden');
    docTable.classList.add('hidden');
    emptyState.classList.add('hidden');
  } else loadingIndicator.classList.add('hidden');
}
function showEmpty(title, text) {
  docTable.classList.add('hidden');
  emptyState.innerHTML = `<span class="ms">folder_off</span><strong>${escapeHTML(title)}</strong><p>${escapeHTML(text)}</p>`;
  emptyState.classList.remove('hidden');
}
function setBusy(btn, busy, label) {
  btn.disabled = busy;
  const t = btn.querySelector('.btn-text');
  if (t) t.textContent = label;
}
function showAlert(el, message, type) {
  el.textContent = message;
  el.className = `alert alert-${type}`;
}
function hideAlert(el) { el.classList.add('hidden'); }
function showToast(message, type) {
  const t = document.createElement('div');
  t.className = `toast ${type || 'ok'}`;
  t.innerHTML = `<span class="ms">${type === 'err' ? 'error' : 'check_circle'}</span><span>${escapeHTML(message)}</span>`;
  $('toastStack').appendChild(t);
  setTimeout(() => t.remove(), 4000);
}
function escapeHTML(str) {
  return String(str ?? '').replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag]));
}


// ==========================================
// 15. GRAFIK & ANALITIK DOKUMEN
// ==========================================
$('btnChartsRefresh').addEventListener('click', () => {
  fetchDatabase();
  renderCharts();
});
$('btnChartsToRepo').addEventListener('click', () => {
  showView('main');
  $('sectionRepo').scrollIntoView({ behavior: 'smooth' });
});

function renderCharts() {
  const docs = state.docs || [];
  const total = docs.length;

  const cnt = (s) => docs.filter(d => d.status === s).length;
  const draft = cnt('Draft');
  const approved = cnt('Approved');
  const social = cnt('Socialization');
  const active = cnt('Active');
  const obsolete = cnt('Obsolete');
  const peopleTotal = docs.filter(d => d.status !== 'Obsolete').reduce((s, d) => s + (Number(d.socialized) || 0), 0);
  const revisedDocs = docs.filter(d => d.revision && !/^(rev\.?\s*0+0?|0+0?)$/i.test(d.revision.trim())).length;

  // 1. KPI Cards
  $('kpiTotal').textContent = total;
  $('kpiActivePct').textContent = total ? Math.round((active / total) * 100) + '%' : '0%';
  $('kpiActiveCount').textContent = `${active} ${I18N.t('dokumen')} ${I18N.t('Aktif')}`;
  $('kpiSocialCount').textContent = social;
  $('kpiSocialDocPct').textContent = `${total ? Math.round((social / total) * 100) : 0}% ${I18N.t('dari total')}`;
  $('kpiPeopleTotal').textContent = peopleTotal.toLocaleString('id-ID');
  const avg = (social + active > 0) ? Math.round(peopleTotal / (social + active)) : 0;
  $('kpiAvgPeople').textContent = `${I18N.t('Rata-rata')} ${avg} ${I18N.t('orang')}`;
  $('kpiActionCount').textContent = draft + approved;
  $('kpiRevPct').textContent = total ? Math.round((revisedDocs / total) * 100) + '%' : '0%';
  $('kpiRevCount').textContent = `${revisedDocs} ${I18N.t('Pernah direvisi')}`;

  // 2. Pipeline Alur Siklus Dokumen
  const stages = [
    { key: 'Draft', cls: 'step-draft', count: draft, label: 'Draft (Develop)', desc: 'Pengembangan awal' },
    { key: 'Approved', cls: 'step-approved', count: approved, label: 'Full Approved', desc: 'Disetujui penuh' },
    { key: 'Socialization', cls: 'step-social', count: social, label: 'Sosialisasi', desc: `${peopleTotal.toLocaleString('id-ID')} orang` },
    { key: 'Active', cls: 'step-active', count: active, label: 'Aktif (Berlaku)', desc: 'Resmi operasional' },
    { key: 'Obsolete', cls: 'step-obsolete', count: obsolete, label: 'Obsolete', desc: 'Tidak berlaku lagi' }
  ];
  $('pipelineTrack').innerHTML = stages.map(st => {
    const pct = total ? ((st.count / total) * 100).toFixed(1) : 0;
    return `
      <div class="pipe-step ${st.cls}">
        <div class="pipe-top">
          <span class="pipe-name">${I18N.t(st.label)}</span>
          <span class="pill-n dark">${pct}%</span>
        </div>
        <div class="pipe-count">${st.count}</div>
        <span class="pipe-sub">${st.desc}</span>
      </div>`;
  }).join('');

  // 3. Donut Chart (Status)
  $('donutTotalBadge').textContent = `${total} ${I18N.t('Dokumen')}`;
  const statusColors = {
    Draft: '#d97706',
    Approved: '#2563eb',
    Socialization: '#8b5cf6',
    Active: '#059669',
    Obsolete: '#e11d48'
  };
  const statusData = [
    { key: 'Active', count: active, label: 'Aktif (Berlaku)', color: statusColors.Active },
    { key: 'Socialization', count: social, label: 'Sosialisasi', color: statusColors.Socialization },
    { key: 'Approved', count: approved, label: 'Full Approved', color: statusColors.Approved },
    { key: 'Draft', count: draft, label: 'Draft (Develop)', color: statusColors.Draft },
    { key: 'Obsolete', count: obsolete, label: 'Obsolete', color: statusColors.Obsolete }
  ].filter(s => s.count > 0);

  if (!total) {
    $('donutSvgWrap').innerHTML = `<span class="muted">${I18N.t('Belum ada dokumen.')}</span>`;
    $('donutLegend').innerHTML = '';
  } else {
    const r = 68;
    const circ = 2 * Math.PI * r;
    let offset = 0;
    const slicesSvg = statusData.map(s => {
      const segLen = (s.count / total) * circ;
      const strokeDash = `${segLen} ${circ - segLen}`;
      const curOffset = offset;
      offset += segLen;
      return `<circle class="donut-slice" cx="100" cy="100" r="${r}" stroke="${s.color}"
                stroke-dasharray="${strokeDash}" stroke-dashoffset="-${curOffset}"
                data-status="${s.key}"><title>${I18N.t(s.label)}: ${s.count} (${((s.count / total) * 100).toFixed(1)}%)</title></circle>`;
    }).join('');

    const activePct = total ? Math.round((active / total) * 100) : 0;
    $('donutSvgWrap').innerHTML = `
      <svg class="donut-svg" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="26" />
        ${slicesSvg}
      </svg>
      <div class="donut-center-text">
        <span class="donut-center-val">${activePct}%</span>
        <span class="donut-center-lbl">${I18N.t('Terkendali')}</span>
      </div>`;

    $('donutLegend').innerHTML = [
      { key: 'Active', count: active, label: 'Aktif (Berlaku)', color: statusColors.Active },
      { key: 'Socialization', count: social, label: 'Sosialisasi', color: statusColors.Socialization },
      { key: 'Approved', count: approved, label: 'Full Approved', color: statusColors.Approved },
      { key: 'Draft', count: draft, label: 'Draft (Develop)', color: statusColors.Draft },
      { key: 'Obsolete', count: obsolete, label: 'Obsolete', color: statusColors.Obsolete }
    ].map(s => {
      const pct = total ? ((s.count / total) * 100).toFixed(1) : 0;
      return `
        <div class="legend-item" title="${I18N.t(s.label)}">
          <span class="legend-dot" style="background:${s.color}"></span>
          <span class="legend-lbl">${I18N.t(s.label)}</span>
          <span class="legend-val">${s.count}</span>
          <span class="legend-pct">${pct}%</span>
        </div>`;
    }).join('');
  }

  // 4. Stacked Horizontal Bars per Departemen
  const deptMap = new Map();
  docs.forEach(d => {
    const k = deptKey(d.department);
    if (!deptMap.has(k)) deptMap.set(k, { total: 0, Draft: 0, Approved: 0, Socialization: 0, Active: 0, Obsolete: 0 });
    const row = deptMap.get(k);
    row.total++;
    if (row[d.status] !== undefined) row[d.status]++;
  });

  const sortedDepts = [...deptMap.entries()].sort((a, b) => b[1].total - a[1].total);
  $('deptChartCount').textContent = sortedDepts.length ? `${sortedDepts.length} ${I18N.t('departemen')}` : '';

  if (!sortedDepts.length) {
    $('deptStackedList').innerHTML = `<div class="empty-line">${I18N.t('Belum ada dokumen.')}</div>`;
  } else {
    $('deptStackedList').innerHTML = sortedDepts.map(([code, item]) => {
      const t = item.total;
      const pct = (s) => ((item[s] / t) * 100).toFixed(1);
      return `
        <div class="stacked-bar-row">
          <div class="stacked-bar-meta">
            <span class="stacked-bar-title">
              <span class="stacked-bar-badge">${escapeHTML(code)}</span>
              <span>${escapeHTML(deptName(code))}</span>
            </span>
            <span class="stacked-bar-total">${t} <small class="muted">${I18N.t('dokumen')}</small></span>
          </div>
          <div class="stacked-bar-track" title="Draft ${item.Draft} · Approved ${item.Approved} · Sosialisasi ${item.Socialization} · Aktif ${item.Active} · Obsolete ${item.Obsolete}">
            <i class="stacked-bar-seg" style="width:${pct('Active')}%; background:${statusColors.Active};"></i>
            <i class="stacked-bar-seg" style="width:${pct('Socialization')}%; background:${statusColors.Socialization};"></i>
            <i class="stacked-bar-seg" style="width:${pct('Approved')}%; background:${statusColors.Approved};"></i>
            <i class="stacked-bar-seg" style="width:${pct('Draft')}%; background:${statusColors.Draft};"></i>
            <i class="stacked-bar-seg" style="width:${pct('Obsolete')}%; background:${statusColors.Obsolete};"></i>
          </div>
        </div>`;
    }).join('');
  }

  // 5. Vertical Column Chart (Tipe Dokumen)
  const typeMap = new Map();
  state.types.forEach(t => typeMap.set(t.code, { name: t.name, count: 0, active: 0 }));
  docs.forEach(d => {
    if (!typeMap.has(d.docType)) typeMap.set(d.docType, { name: d.docType, count: 0, active: 0 });
    const r = typeMap.get(d.docType);
    r.count++;
    if (d.status === 'Active') r.active++;
  });

  const typeEntries = [...typeMap.entries()];
  $('typesChartCount').textContent = `${typeEntries.length} ${I18N.t('Tipe')}`;
  const maxTypeCount = Math.max(1, ...typeEntries.map(e => e[1].count));

  if (!typeEntries.length) {
    $('colChartTypes').innerHTML = `<div class="empty-line">${I18N.t('Belum ada tipe dokumen.')}</div>`;
  } else {
    $('colChartTypes').innerHTML = typeEntries.map(([code, d]) => {
      const hPct = Math.max(8, Math.round((d.count / maxTypeCount) * 100));
      return `
        <div class="col-item" title="${escapeHTML(d.name)}: ${d.count} total (${d.active} ${I18N.t('Aktif')})">
          <span class="col-val">${d.count}</span>
          <div class="col-bar-bg">
            <div class="col-bar-fill" style="height:${hPct}%;"></div>
          </div>
          <div class="col-meta">
            <span class="col-code">${escapeHTML(code)}</span>
            <span class="col-sub">${d.active} ${I18N.t('Aktif')}</span>
          </div>
        </div>`;
    }).join('');
  }

  // 6. Capaian Sosialisasi per Departemen
  const socDeptMap = new Map();
  docs.forEach(d => {
    const k = deptKey(d.department);
    const n = Number(d.socialized) || 0;
    socDeptMap.set(k, (socDeptMap.get(k) || 0) + n);
  });
  const sortedSocDepts = [...socDeptMap.entries()].sort((a, b) => b[1] - a[1]);
  const maxSoc = Math.max(1, ...sortedSocDepts.map(e => e[1]));
  $('socialTotalBadge').textContent = `${peopleTotal.toLocaleString('id-ID')} ${I18N.t('orang')}`;

  if (!sortedSocDepts.length || !peopleTotal) {
    $('socialDeptList').innerHTML = `<div class="empty-line">${I18N.t('Belum ada data sosialisasi.')}</div>`;
  } else {
    $('socialDeptList').innerHTML = sortedSocDepts.slice(0, 7).map(([code, count], idx) => {
      const pct = Math.max(4, Math.round((count / maxSoc) * 100));
      const rankClass = idx === 0 ? 'top-1' : idx === 1 ? 'top-2' : idx === 2 ? 'top-3' : '';
      return `
        <div class="rank-item">
          <span class="rank-badge ${rankClass}">#${idx + 1}</span>
          <div class="rank-info">
            <div class="rank-top">
              <span class="rank-name">${escapeHTML(code)} · ${escapeHTML(deptName(code))}</span>
              <span class="rank-count">${count.toLocaleString('id-ID')} <small class="muted">${I18N.t('orang')}</small></span>
            </div>
            <div class="rank-track">
              <div class="rank-fill" style="width:${pct}%;"></div>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  // 7. Top 5 Dokumen Paling Banyak Tersosialisasi
  const topSocial = [...docs].filter(d => (Number(d.socialized) || 0) > 0).sort((a, b) => (Number(b.socialized) || 0) - (Number(a.socialized) || 0)).slice(0, 5);
  if (!topSocial.length) {
    $('topSocialBody').innerHTML = `<tr><td colspan="7" class="muted" style="text-align:center; padding:24px;">${I18N.t('Belum ada data sosialisasi.')}</td></tr>`;
  } else {
    $('topSocialBody').innerHTML = topSocial.map((doc, i) => {
      const ext = fileExt(doc.fileName);
      const rankClass = i === 0 ? 'top-1' : i === 1 ? 'top-2' : i === 2 ? 'top-3' : '';
      return `
        <tr>
          <td><span class="rank-badge ${rankClass}">#${i + 1}</span></td>
          <td class="td-doc">
            <div class="doc-cell">
              <span class="file-ico ${extClass(ext)}"><span class="ms">${extIcon(ext)}</span></span>
              <span>
                <span class="doc-title">${escapeHTML(doc.title)}</span>
                <span class="doc-filename">${escapeHTML(doc.fileName)}</span>
              </span>
            </div>
          </td>
          <td><span class="doc-code">${escapeHTML(doc.docNumber)}</span></td>
          <td><span title="${escapeHTML(deptName(doc.department))}">${escapeHTML(deptKey(doc.department))}</span></td>
          <td class="nowrap">${escapeHTML(doc.revision)}</td>
          <td><span class="badge ${getStatusBadgeClass(doc.status)}">${escapeHTML(STATUS_LABEL[doc.status] || doc.status)}</span></td>
          <td style="text-align:right;">
            <span class="soc-count inline"><span class="ms">groups</span><b>${(Number(doc.socialized) || 0).toLocaleString('id-ID')}</b> ${I18N.t('orang')}</span>
          </td>
        </tr>`;
    }).join('');
  }
}


// ==========================================================
// 15. MODUL PENOMORAN & SURAT KELUAR (LETTERS)
// ==========================================================
const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

function toRomanMonth(m) {
  const n = parseInt(m, 10);
  if (isNaN(n) || n < 1 || n > 12) return 'I';
  return ROMAN_MONTHS[n - 1];
}

// Navigasi & refresh letters
$('btnLettersRefresh').addEventListener('click', loadLetters);
$('btnOpenLetterReg').addEventListener('click', openLetterRegModal);

// Filter toolbar
$('letterSearch').addEventListener('input', renderLetters);
['letterFilterEntity', 'letterFilterType', 'letterFilterDept', 'letterFilterStatus'].forEach(id => {
  $(id).addEventListener('change', renderLetters);
});

async function loadLetters() {
  $('btnLettersRefresh').classList.add('spin');
  try {
    const r = await api('letter_list');
    if (r.status === 'success') {
      state.letters = r.letters || [];
      state.letterEntities = r.entities || [];
      state.letterTypes = r.letterTypes || [];
      if (r.departments && r.departments.length) {
        state.depts = r.departments;
      }
      populateLetterFilterOptions();
      renderLetters();
    } else if (r.code !== 'AUTH') {
      showToast(r.message || 'Gagal memuat surat.', 'err');
    }
  } catch (err) {
    showToast('Koneksi terputus saat memuat surat.', 'err');
  } finally {
    $('btnLettersRefresh').classList.remove('spin');
  }
}

function populateLetterFilterOptions() {
  const curEnt = $('letterFilterEntity').value;
  const curType = $('letterFilterType').value;
  const curDept = $('letterFilterDept').value;

  // Entities
  $('letterFilterEntity').innerHTML = '<option value="ALL">Semua Entitas</option>' +
    state.letterEntities.map(e => `<option value="${escapeHTML(e.code)}">${escapeHTML(e.code)} - ${escapeHTML(e.name)}</option>`).join('');
  if (curEnt) $('letterFilterEntity').value = curEnt;

  // Types
  $('letterFilterType').innerHTML = '<option value="ALL">Semua Jenis Surat</option>' +
    state.letterTypes.map(t => `<option value="${escapeHTML(t.code)}">${escapeHTML(t.code)} - ${escapeHTML(t.name)}</option>`).join('');
  if (curType) $('letterFilterType').value = curType;

  // Depts
  $('letterFilterDept').innerHTML = '<option value="ALL">Semua Departemen</option>' +
    state.depts.map(d => `<option value="${escapeHTML(d.code)}">${escapeHTML(d.code)} - ${escapeHTML(d.name)}</option>`).join('');
  if (curDept) $('letterFilterDept').value = curDept;
}

function renderLetters() {
  const letters = state.letters || [];
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonthRoman = toRomanMonth(now.getMonth() + 1);

  // Statistics
  const total = letters.length;
  const pending = letters.filter(l => l.status === 'Pending').length;
  const valid = letters.filter(l => l.status === 'Valid').length;
  const thisMonth = letters.filter(l => String(l.year) === String(curYear) && l.month === curMonthRoman).length;

  $('statLetterTotal').textContent = total.toLocaleString('id-ID');
  $('statLetterPending').textContent = pending.toLocaleString('id-ID');
  $('statLetterValid').textContent = valid.toLocaleString('id-ID');
  $('statLetterThisMonth').textContent = thisMonth.toLocaleString('id-ID');
  $('statLetterMonthLabel').textContent = `${curMonthRoman} / ${curYear}`;

  // Filter application
  const q = $('letterSearch').value.toLowerCase().trim();
  const filterEnt = $('letterFilterEntity').value;
  const filterType = $('letterFilterType').value;
  const filterDept = $('letterFilterDept').value;
  const filterStatus = $('letterFilterStatus').value;

  const rows = letters.filter(l => {
    if (filterEnt !== 'ALL' && l.entityCode !== filterEnt) return false;
    if (filterType !== 'ALL' && l.letterType !== filterType) return false;
    if (filterDept !== 'ALL' && deptKey(l.department) !== deptKey(filterDept)) return false;
    if (filterStatus !== 'ALL' && l.status !== filterStatus) return false;
    if (q) {
      const match = [
        l.letterNumber, l.subject, l.recipient, l.department,
        l.entityCode, l.letterType, l.registeredByName, l.registeredBy, l.notes
      ].join(' ').toLowerCase();
      if (!match.includes(q)) return false;
    }
    return true;
  });

  $('letterInfo').textContent = `${rows.length} dari ${total} surat terdaftar`;

  if (!rows.length) {
    $('letterBody').innerHTML = '';
    $('letterEmpty').innerHTML = `
      <span class="ms">drafts</span>
      <strong>Tidak ada surat ditemukan</strong>
      <p>Belum ada surat yang sesuai kriteria pencarian atau filter.</p>
    `;
    $('letterEmpty').classList.remove('hidden');
    return;
  }

  $('letterEmpty').classList.add('hidden');
  $('letterBody').innerHTML = rows.map(l => {
    const isPending = l.status === 'Pending';
    const isValid = l.status === 'Valid';
    const isCancelled = l.status === 'Cancelled';
    const statusBadge = isValid
      ? '<span class="badge badge-valid">Tercatat &amp; Valid</span>'
      : isCancelled
      ? '<span class="badge badge-cancelled">Dibatalkan</span>'
      : '<span class="badge badge-pending">Menunggu Upload</span>';

    return `
      <tr>
        <td class="nowrap" data-label="No. Surat">
          <strong class="doc-code" style="font-size:13px; color:var(--primary-deep);">${escapeHTML(l.letterNumber)}</strong>
          <button type="button" class="copy-ltr-btn" data-copy-num="${escapeHTML(l.letterNumber)}" title="Salin nomor surat">
            <span class="ms">content_copy</span>
          </button>
        </td>
        <td data-label="Entitas & Dept">
          <strong>${escapeHTML(l.entityCode)}</strong>
          <span class="doc-filename">${escapeHTML(l.department)}</span>
        </td>
        <td data-label="Tanggal & Jenis" class="nowrap">
          <div>${escapeHTML(formatDate(l.letterDate) || l.letterDate)}</div>
          <span class="type-tag" style="margin-top:2px;">${escapeHTML(l.letterType)}</span>
        </td>
        <td data-label="Perihal & Tujuan">
          <div class="doc-title">${escapeHTML(l.subject)}</div>
          <span class="doc-filename">Kepada: <b>${escapeHTML(l.recipient)}</b></span>
          ${l.notes ? `<small class="muted" style="display:block; margin-top:2px;">Catatan: ${escapeHTML(l.notes)}</small>` : ''}
        </td>
        <td data-label="Status">
          ${statusBadge}
        </td>
        <td data-label="Berkas Surat">
          ${isValid && l.fileUrl ? `
            <a href="${escapeHTML(l.fileUrl)}" target="_blank" rel="noopener noreferrer" class="link-file" style="display:inline-flex; align-items:center; gap:4px; font-weight:600; color:var(--primary);">
              <span class="ms" style="font-size:16px;">description</span>
              <span class="ellipsis" style="max-width:160px;" title="${escapeHTML(l.fileName || 'Lihat Dokumen')}">${escapeHTML(l.fileName || 'Lihat Dokumen')}</span>
            </a>
          ` : (isPending && canWrite()) ? `
            <button type="button" class="btn-upload-prompt" data-ltr-upload="${escapeHTML(l.id)}">
              <span class="ms">cloud_upload</span>Unggah Berkas
            </button>
          ` : `<span class="muted">—</span>`}
        </td>
        <td data-label="Pemohon">
          <strong>${escapeHTML(l.registeredByName || l.registeredBy)}</strong>
          <span class="doc-filename">${escapeHTML(formatDate(l.registeredAt) || l.registeredAt)}</span>
        </td>
        <td style="text-align: right;" data-label="Aksi">
          <div class="action-group">
            ${isPending && canWrite() ? `
              <button class="act" data-ltr-upload="${escapeHTML(l.id)}" title="Unggah berkas"><span class="ms">cloud_upload</span></button>
              <button class="act danger" data-ltr-cancel="${escapeHTML(l.id)}" title="Batalkan nomor surat"><span class="ms">block</span></button>
            ` : ''}
            ${isValid && l.fileUrl ? `
              <a href="${escapeHTML(l.fileUrl)}" target="_blank" rel="noopener noreferrer" class="act" title="Buka berkas di Google Drive"><span class="ms">open_in_new</span></a>
            ` : ''}
            ${isAdmin() ? `
              <button class="act danger" data-ltr-delete="${escapeHTML(l.id)}" title="Hapus data surat"><span class="ms">delete</span></button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Table action events delegation
$('letterBody').addEventListener('click', (e) => {
  // Salin nomor
  const copyBtn = e.target.closest('[data-copy-num]');
  if (copyBtn) {
    const num = copyBtn.dataset.copyNum;
    copyToClipboard(num);
    showToast(`Nomor surat ${num} disalin ke clipboard!`, 'ok');
    return;
  }
  // Upload berkas
  const upBtn = e.target.closest('[data-ltr-upload]');
  if (upBtn) {
    openLetterUploadModal(upBtn.dataset.ltrUpload);
    return;
  }
  // Batal
  const cancelBtn = e.target.closest('[data-ltr-cancel]');
  if (cancelBtn) {
    openLetterCancelModal(cancelBtn.dataset.ltrCancel);
    return;
  }
  // Hapus (Admin)
  const delBtn = e.target.closest('[data-ltr-delete]');
  if (delBtn) {
    openLetterDeleteModal(delBtn.dataset.ltrDelete);
    return;
  }
});

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
}

// ==========================================
// REGISTRASI NOMOR SURAT BARU
// ==========================================
function openLetterRegModal() {
  if (!canWrite()) return showToast('Hanya Editor dan Admin yang dapat mendaftarkan surat.', 'err');

  // Populate Entity dropdown
  const entities = state.letterEntities.filter(e => e.active !== false);
  $('ltrEntity').innerHTML = entities.map(e =>
    `<option value="${escapeHTML(e.code)}">${escapeHTML(e.code)} - ${escapeHTML(e.name)}</option>`
  ).join('');

  // Populate Dept dropdown (filter according to user's permissions)
  const depts = state.depts.filter(d => d.active !== false && canEditDept(d.code));
  $('ltrDept').innerHTML = depts.map(d =>
    `<option value="${escapeHTML(d.code)}">${escapeHTML(d.code)} - ${escapeHTML(d.name)}</option>`
  ).join('');

  // Populate Type dropdown
  const types = state.letterTypes.filter(t => t.active !== false);
  $('ltrType').innerHTML = types.map(t =>
    `<option value="${escapeHTML(t.code)}">${escapeHTML(t.code)} - ${escapeHTML(t.name)}</option>`
  ).join('');

  // Default date = today YYYY-MM-DD
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  $('ltrDate').value = `${yyyy}-${mm}-${dd}`;

  $('ltrRecipient').value = '';
  $('ltrSubject').value = '';
  $('ltrNotes').value = '';
  hideAlert($('ltrRegAlert'));

  updateLetterPreview();
  $('letterRegModal').classList.remove('hidden');
}

// Update live preview when changing inputs
['ltrEntity', 'ltrDept', 'ltrType', 'ltrDate'].forEach(id => {
  $(id).addEventListener('change', updateLetterPreview);
  $(id).addEventListener('input', updateLetterPreview);
});

function updateLetterPreview() {
  const ent = ($('ltrEntity').value || 'MGR').toUpperCase();
  const dept = ($('ltrDept').value || 'DEPT').toUpperCase();
  const type = ($('ltrType').value || 'SP').toUpperCase();
  const dateStr = $('ltrDate').value;

  let y = new Date().getFullYear();
  let m = new Date().getMonth() + 1;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parts = dateStr.split('-');
    y = parts[0];
    m = parseInt(parts[1], 10);
  }
  const roman = toRomanMonth(m);
  $('ltrPreviewNumber').textContent = `[Auto]/${ent}-${type}/${dept}/${roman}/${y}`;
}

// Submit Letter Registration
$('letterRegForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('btnSubmitLetterReg');
  const alertEl = $('ltrRegAlert');
  hideAlert(alertEl);

  setBusy(btn, true, 'Menerbitkan...');
  try {
    const payload = {
      entityCode: $('ltrEntity').value.trim(),
      letterType: $('ltrType').value.trim(),
      department: $('ltrDept').value.trim(),
      letterDate: $('ltrDate').value,
      recipient: $('ltrRecipient').value.trim(),
      subject: $('ltrSubject').value.trim(),
      notes: $('ltrNotes').value.trim()
    };

    const r = await api('letter_register', payload);
    if (r.status === 'success') {
      $('letterRegModal').classList.add('hidden');
      state.lastCreatedLetterId = r.id;
      state.lastCreatedLetterNum = r.letterNumber;

      // Show success modal
      $('ltrSuccessNumber').textContent = r.letterNumber;
      $('letterSuccessModal').classList.remove('hidden');

      // Refresh list
      loadLetters();
    } else if (r.code !== 'AUTH') {
      showAlert(alertEl, r.message || 'Gagal menerbitkan nomor surat.', 'error');
    }
  } catch (err) {
    showAlert(alertEl, 'Gagal terhubung ke server.', 'error');
  } finally {
    setBusy(btn, false, 'Terbitkan Nomor Surat');
  }
});

// Copy number inside success modal
$('btnCopySuccessNum').addEventListener('click', () => {
  const num = $('ltrSuccessNumber').textContent;
  copyToClipboard(num);
  showToast(`Nomor surat ${num} berhasil disalin!`, 'ok');
});

// "Unggah Berkas Sekarang" from success modal
$('btnSuccessUploadNow').addEventListener('click', () => {
  $('letterSuccessModal').classList.add('hidden');
  if (state.lastCreatedLetterId) {
    openLetterUploadModal(state.lastCreatedLetterId);
  }
});

// ==========================================
// UPLOAD BERKAS SURAT RESMI
// ==========================================
let ltrSelectedFile = null;

function openLetterUploadModal(letterId) {
  const letter = state.letters.find(l => l.id === letterId);
  if (!letter) return showToast('Data surat tidak ditemukan.', 'err');

  state.letterUploadTarget = letter;
  ltrSelectedFile = null;

  $('ltrUploadNum').textContent = letter.letterNumber;
  $('ltrUploadSubj').textContent = letter.subject;
  $('ltrUploadMeta').textContent = `Entitas: ${letter.entityCode} · Dept: ${letter.department} · Ditujukan Kepada: ${letter.recipient} · Tanggal: ${formatDate(letter.letterDate) || letter.letterDate}`;

  $('ltrFileInput').value = '';
  $('ltrFileChip').classList.add('hidden');
  $('ltrFileChip').innerHTML = '';
  $('ltrUploadNotes').value = '';
  hideAlert($('ltrUploadAlert'));

  $('letterUploadModal').classList.remove('hidden');
}

// Drag & drop for letter upload
const ltrDrop = $('ltrDrop');
const ltrFileInput = $('ltrFileInput');
const ltrFileChip = $('ltrFileChip');

['dragenter', 'dragover'].forEach(ev => ltrDrop.addEventListener(ev, (e) => { e.preventDefault(); ltrDrop.classList.add('drag'); }));
['dragleave', 'drop'].forEach(ev => ltrDrop.addEventListener(ev, (e) => { e.preventDefault(); ltrDrop.classList.remove('drag'); }));
ltrDrop.addEventListener('drop', (e) => {
  if (e.dataTransfer.files && e.dataTransfer.files[0]) setLtrFile(e.dataTransfer.files[0]);
});
ltrFileInput.addEventListener('change', () => {
  if (ltrFileInput.files && ltrFileInput.files[0]) setLtrFile(ltrFileInput.files[0]);
});

function setLtrFile(file) {
  if (file.size > MAX_FILE_SIZE) {
    return showAlert($('ltrUploadAlert'), `Ukuran file melebihi batas 15 MB (${formatBytes(file.size)}).`, 'error');
  }
  hideAlert($('ltrUploadAlert'));
  ltrSelectedFile = file;
  ltrFileChip.innerHTML = `
    <span class="ms">attach_file</span>
    <strong>${escapeHTML(file.name)}</strong>
    <span>(${formatBytes(file.size)})</span>
    <button type="button" class="remove" id="btnRemoveLtrFile" aria-label="Hapus file">&times;</button>
  `;
  ltrFileChip.classList.remove('hidden');
  $('btnRemoveLtrFile').addEventListener('click', () => {
    ltrSelectedFile = null;
    ltrFileInput.value = '';
    ltrFileChip.classList.add('hidden');
  });
}

// Submit Letter Upload
$('letterUploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('btnSubmitLetterUpload');
  const alertEl = $('ltrUploadAlert');
  hideAlert(alertEl);

  if (!ltrSelectedFile) {
    return showAlert(alertEl, 'Pilih berkas surat bertandatangan untuk diunggah.', 'error');
  }
  if (!state.letterUploadTarget) {
    return showAlert(alertEl, 'Data surat target tidak valid.', 'error');
  }

  setBusy(btn, true, 'Mengunggah & Memvalidasi...');
  try {
    const fileBase64 = await fileToBase64(ltrSelectedFile);
    const payload = {
      id: state.letterUploadTarget.id,
      fileName: ltrSelectedFile.name,
      mimeType: ltrSelectedFile.type || 'application/octet-stream',
      fileData: fileBase64,
      notes: $('ltrUploadNotes').value.trim()
    };

    const r = await api('letter_upload', payload);
    if (r.status === 'success') {
      $('letterUploadModal').classList.add('hidden');
      showToast('Berkas surat berhasil diunggah! Status resmi Tercatat & Valid.', 'ok');
      loadLetters();
    } else if (r.code !== 'AUTH') {
      showAlert(alertEl, r.message || 'Gagal mengunggah berkas surat.', 'error');
    }
  } catch (err) {
    showAlert(alertEl, 'Terjadi kesalahan koneksi saat mengunggah berkas.', 'error');
  } finally {
    setBusy(btn, false, 'Unggah & Validasi Surat');
  }
});

// ==========================================
// BATALKAN NOMOR SURAT
// ==========================================
function openLetterCancelModal(letterId) {
  const letter = state.letters.find(l => l.id === letterId);
  if (!letter) return showToast('Data surat tidak ditemukan.', 'err');

  state.letterCancelTarget = letter;
  $('ltrCancelText').innerHTML = `Batalkan penerbitan nomor surat <b>${escapeHTML(letter.letterNumber)}</b> (${escapeHTML(letter.subject)})?`;
  $('ltrCancelReason').value = '';
  hideAlert($('ltrCancelAlert'));
  $('letterCancelModal').classList.remove('hidden');
}

$('letterCancelForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('btnSubmitLetterCancel');
  const alertEl = $('ltrCancelAlert');
  hideAlert(alertEl);

  if (!state.letterCancelTarget) return;

  setBusy(btn, true, 'Membatalkan...');
  try {
    const r = await api('letter_cancel', {
      id: state.letterCancelTarget.id,
      reason: $('ltrCancelReason').value.trim()
    });
    if (r.status === 'success') {
      $('letterCancelModal').classList.add('hidden');
      showToast(r.message || 'Nomor surat berhasil dibatalkan.', 'ok');
      loadLetters();
    } else if (r.code !== 'AUTH') {
      showAlert(alertEl, r.message || 'Gagal membatalkan nomor surat.', 'error');
    }
  } catch (err) {
    showAlert(alertEl, 'Gagal terhubung ke server.', 'error');
  } finally {
    setBusy(btn, false, 'Batalkan Nomor');
  }
});

// ==========================================
// HAPUS DATA SURAT (ADMIN)
// ==========================================
function openLetterDeleteModal(letterId) {
  const letter = state.letters.find(l => l.id === letterId);
  if (!letter) return showToast('Data surat tidak ditemukan.', 'err');

  state.letterDeleteTarget = letter;
  $('ltrDelText').innerHTML = `Hapus permanen surat <b>${escapeHTML(letter.letterNumber)}</b> - <em>${escapeHTML(letter.subject)}</em>? Jika berkas tersimpan di Google Drive, berkas akan dipindahkan ke Trash.`;
  $('letterDeleteModal').classList.remove('hidden');
}

$('btnConfirmDeleteLetter').addEventListener('click', async () => {
  if (!state.letterDeleteTarget) return;
  const btn = $('btnConfirmDeleteLetter');
  btn.disabled = true;

  try {
    const r = await api('letter_delete', { id: state.letterDeleteTarget.id });
    if (r.status === 'success') {
      $('letterDeleteModal').classList.add('hidden');
      showToast(r.message || 'Data surat berhasil dihapus.', 'ok');
      loadLetters();
    } else if (r.code !== 'AUTH') {
      showToast('Gagal menghapus: ' + r.message, 'err');
    }
  } catch (err) {
    showToast('Terjadi kesalahan koneksi saat menghapus.', 'err');
  } finally {
    btn.disabled = false;
    state.letterDeleteTarget = null;
  }
});


// ==========================================================
// 16. MODUL MASTER LIST DOKUMEN & MATRIKS KEPATUHAN
// ==========================================================
$('btnMasterRefresh').addEventListener('click', loadMasterList);
$('btnOpenAddMaster').addEventListener('click', () => openMasterModal(null));
$('btnMasterExportCsv').addEventListener('click', exportMasterMatrixCsv);

// Filter listeners
$('masterSearch').addEventListener('input', renderMasterList);
['masterFilterDept', 'masterFilterSection', 'masterFilterType', 'masterFilterStatus'].forEach(id => {
  $(id).addEventListener('change', renderMasterList);
});

async function loadMasterList() {
  $('btnMasterRefresh').classList.add('spin');
  try {
    const r = await api('master_list');
    if (r.status === 'success') {
      state.masterList = r.masterList || [];
      if (r.departments && r.departments.length) state.depts = r.departments;
      if (r.docTypes && r.docTypes.length) state.types = r.docTypes;

      populateMasterFilterOptions();
      renderMasterList();
    } else if (r.code !== 'AUTH') {
      showToast(r.message || 'Gagal memuat master list dokumen.', 'err');
    }
  } catch (err) {
    showToast('Koneksi terputus saat memuat master list dokumen.', 'err');
  } finally {
    $('btnMasterRefresh').classList.remove('spin');
  }
}

function syncMasterWithDocs(masterItems, docs) {
  const docMap = {};
  const titleMap = {};

  (docs || []).forEach(d => {
    if (!d.id) return;
    const numKey = String(d.docNumber || '').trim().toUpperCase();
    const titleKey = (String(d.title || '').trim() + '|' + String(d.department || '').trim()).toUpperCase();

    function shouldReplace(cur, cand) {
      if (!cur) return true;
      if (cand.status === 'Active' && cur.status !== 'Active') return true;
      if (cand.status === 'Approved' && cur.status === 'Draft') return true;
      return false;
    }

    if (numKey && shouldReplace(docMap[numKey], d)) docMap[numKey] = d;
    if (titleKey && shouldReplace(titleMap[titleKey], d)) titleMap[titleKey] = d;
  });

  return (masterItems || []).map(m => {
    const numKey = String(m.docNumber || '').trim().toUpperCase();
    const titleKey = (String(m.title || '').trim() + '|' + String(m.department || '').trim()).toUpperCase();
    const matched = (numKey ? docMap[numKey] : null) || titleMap[titleKey] || m.matchedDoc;

    return Object.assign({}, m, {
      isUploaded: Boolean(matched && matched.fileUrl),
      matchedDoc: matched || null
    });
  });
}

function populateMasterFilterOptions() {
  const curDept = $('masterFilterDept').value;
  const curSec = $('masterFilterSection').value;
  const curType = $('masterFilterType').value;

  // Departments
  $('masterFilterDept').innerHTML = '<option value="ALL">Semua Departemen</option>' +
    state.depts.map(d => `<option value="${escapeHTML(d.code)}">${escapeHTML(d.code)} - ${escapeHTML(d.name)}</option>`).join('');
  if (curDept) $('masterFilterDept').value = curDept;

  // Sections (unique sections from state.masterList)
  const sections = [...new Set(state.masterList.map(m => m.section).filter(Boolean))].sort();
  $('masterFilterSection').innerHTML = '<option value="ALL">Semua Section</option>' +
    sections.map(s => `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join('');
  if (curSec) $('masterFilterSection').value = curSec;

  // Types
  $('masterFilterType').innerHTML = '<option value="ALL">Semua Tipe</option>' +
    state.types.map(t => `<option value="${escapeHTML(t.code)}">${escapeHTML(t.code)} - ${escapeHTML(t.name)}</option>`).join('');
  if (curType) $('masterFilterType').value = curType;
}

function renderMasterList() {
  // Sinkronisasi status terunggah dengan repositori terkini
  state.masterList = syncMasterWithDocs(state.masterList, state.docs);
  const items = state.masterList || [];

  // Hitung metrik KPI Kepatuhan
  const total = items.length;
  const uploaded = items.filter(m => m.isUploaded).length;
  const missing = total - uploaded;
  const compliancePct = total > 0 ? Math.round((uploaded / total) * 100) : 0;

  $('statMasterTotal').textContent = total.toLocaleString('id-ID');
  $('statMasterUploaded').textContent = uploaded.toLocaleString('id-ID');
  $('statMasterUploadedPct').textContent = `${compliancePct}% terpenuhi`;
  $('statMasterMissing').textContent = missing.toLocaleString('id-ID');
  $('statMasterCompliance').textContent = `${compliancePct}%`;
  $('statMasterComplianceBar').style.width = `${compliancePct}%`;

  // Render Department Compliance Strip
  const deptsPresent = [...new Set(items.map(m => m.department))].sort();
  const curFilterDept = $('masterFilterDept').value;

  $('masterDeptStrip').innerHTML = deptsPresent.map(deptCode => {
    const deptItems = items.filter(m => m.department === deptCode);
    const dTotal = deptItems.length;
    const dUploaded = deptItems.filter(m => m.isUploaded).length;
    const dPct = dTotal > 0 ? Math.round((dUploaded / dTotal) * 100) : 0;
    const isFull = dUploaded === dTotal;
    const isActive = curFilterDept === deptCode;

    return `
      <button type="button" class="mds-chip ${isFull ? 'full' : ''} ${isActive ? 'active' : ''}" data-dept-chip="${escapeHTML(deptCode)}">
        <strong>${escapeHTML(deptCode)}</strong>
        <span class="mds-count">${dUploaded}/${dTotal} (${dPct}%)</span>
      </button>
    `;
  }).join('');

  // Terapkan Filter
  const q = $('masterSearch').value.toLowerCase().trim();
  const filterDept = $('masterFilterDept').value;
  const filterSec = $('masterFilterSection').value;
  const filterType = $('masterFilterType').value;
  const filterStatus = $('masterFilterStatus').value;

  const rows = items.filter(m => {
    if (filterDept !== 'ALL' && deptKey(m.department) !== deptKey(filterDept)) return false;
    if (filterSec !== 'ALL' && m.section !== filterSec) return false;
    if (filterType !== 'ALL' && m.docType !== filterType) return false;
    if (filterStatus === 'UPLOADED' && !m.isUploaded) return false;
    if (filterStatus === 'MISSING' && m.isUploaded) return false;

    if (q) {
      const match = [
        m.docNumber, m.title, m.department, m.section, m.docType, m.description,
        m.matchedDoc ? m.matchedDoc.fileName : ''
      ].join(' ').toLowerCase();
      if (!match.includes(q)) return false;
    }
    return true;
  });

  $('masterInfo').textContent = `${rows.length} dari ${total} dokumen master`;

  if (!rows.length) {
    $('masterBody').innerHTML = '';
    $('masterEmpty').innerHTML = `
      <span class="ms">playlist_remove</span>
      <strong>Tidak ada dokumen master ditemukan</strong>
      <p>Belum ada dokumen yang sesuai dengan kriteria filter atau pencarian Anda.</p>
    `;
    $('masterEmpty').classList.remove('hidden');
    return;
  }

  $('masterEmpty').classList.add('hidden');
  $('masterBody').innerHTML = rows.map(m => {
    const isUp = m.isUploaded;
    const statusBadge = isUp
      ? `<span class="badge badge-active"><span class="ms">task_alt</span>Sudah Terupload</span>
         <small class="muted" style="display:block; margin-top:2px;">${escapeHTML(m.matchedDoc.revision || 'Rev. 00')} · ${escapeHTML(STATUS_LABEL[m.matchedDoc.status] || m.matchedDoc.status || 'Aktif')}</small>`
      : `<span class="badge badge-obsolete"><span class="ms">error_outline</span>Belum Ada (Gap)</span>`;

    const fileCell = isUp && m.matchedDoc && m.matchedDoc.fileUrl
      ? `<a href="${escapeHTML(m.matchedDoc.fileUrl)}" target="_blank" rel="noopener noreferrer" class="link-file" style="display:inline-flex; align-items:center; gap:4px; font-weight:600; color:var(--primary);">
           <span class="ms" style="font-size:16px;">description</span>
           <span class="ellipsis" style="max-width:180px;" title="${escapeHTML(m.matchedDoc.fileName || m.matchedDoc.title)}">${escapeHTML(m.matchedDoc.fileName || m.matchedDoc.title)}</span>
         </a>`
      : (!isUp && canWrite())
      ? `<button type="button" class="btn-upload-ml" data-upload-ml="${escapeHTML(m.id)}">
           <span class="ms">cloud_upload</span>Unggah Sekarang
         </button>`
      : `<span class="muted">—</span>`;

    return `
      <tr>
        <td class="nowrap" data-label="No. Acuan">
          ${m.docNumber ? `<strong class="doc-code" style="color:var(--primary-deep); font-size:12.5px;">${escapeHTML(m.docNumber)}</strong>` : '<span class="muted">—</span>'}
        </td>
        <td data-label="Judul Dokumen Wajib">
          <div style="font-weight:600; color:var(--navy); font-size:13.5px;">
            ${escapeHTML(m.title)}
            ${m.mandatory ? '<span class="badge-mandatory" title="Wajib Kepatuhan"><span class="ms">verified</span>Wajib</span>' : ''}
          </div>
          ${m.description ? `<small class="muted" style="display:block; margin-top:3px; line-height:16px;">${escapeHTML(m.description)}</small>` : ''}
        </td>
        <td data-label="Departemen & Section">
          <strong title="${escapeHTML(deptName(m.department))}">${escapeHTML(m.department)}</strong>
          <span class="doc-filename">${escapeHTML(m.section || 'Umum')}</span>
        </td>
        <td data-label="Tipe" class="nowrap">
          <span class="type-tag">${escapeHTML(m.docType)}</span>
        </td>
        <td data-label="Status di Repositori">
          ${statusBadge}
        </td>
        <td data-label="Dokumen Terupload">
          ${fileCell}
        </td>
        <td style="text-align: right;" data-label="Aksi">
          <div class="action-group">
            ${!isUp && canWrite() ? `
              <button class="act" data-upload-ml="${escapeHTML(m.id)}" title="Unggah dokumen ke repositori"><span class="ms">cloud_upload</span></button>
            ` : ''}
            ${canWrite() ? `
              <button class="act" data-edit-ml="${escapeHTML(m.id)}" title="Ubah data master"><span class="ms">edit</span></button>
            ` : ''}
            ${isAdmin() ? `
              <button class="act danger" data-del-ml="${escapeHTML(m.id)}" title="Hapus dokumen master"><span class="ms">delete</span></button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Department chip click event delegation
$('masterDeptStrip').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-dept-chip]');
  if (!chip) return;
  const deptCode = chip.dataset.deptChip;
  if ($('masterFilterDept').value === deptCode) {
    $('masterFilterDept').value = 'ALL';
  } else {
    $('masterFilterDept').value = deptCode;
  }
  renderMasterList();
});

// Master Table event delegation
$('masterBody').addEventListener('click', (e) => {
  // Unggah dokumen dari master list
  const upBtn = e.target.closest('[data-upload-ml]');
  if (upBtn) {
    uploadFromMasterList(upBtn.dataset.uploadMl);
    return;
  }

  // Edit master list
  const editBtn = e.target.closest('[data-edit-ml]');
  if (editBtn) {
    const item = state.masterList.find(m => m.id === editBtn.dataset.editMl);
    if (item) openMasterModal(item);
    return;
  }

  // Hapus master list
  const delBtn = e.target.closest('[data-del-ml]');
  if (delBtn) {
    openMasterDeleteModal(delBtn.dataset.delMl);
    return;
  }
});

// ==========================================
// UNGGAH DOKUMEN REPOSITORI DARI MASTER LIST
// ==========================================
function uploadFromMasterList(mlId) {
  const item = state.masterList.find(m => m.id === mlId);
  if (!item) return;

  // Buka modal unggah dokumen repositori dengan form terisi otomatis
  $('uploadForm').reset();
  $('upDocType').value = item.docType || 'SOP';
  $('upDocNumber').value = item.docNumber || '';
  $('upTitle').value = item.title || '';
  $('upDepartment').value = item.department || '';
  $('upRevision').value = 'Rev. 00';
  $('upStatus').value = 'Approved';
  $('upSocialized').value = 0;
  $('upSocGroup').classList.add('hidden');
  hideAlert($('uploadAlert'));

  selectedFile = null;
  $('upFileChip').classList.add('hidden');
  $('upFileChip').innerHTML = '';

  $('uploadModal').classList.remove('hidden');
  showToast(`Mengunggah untuk dokumen wajib: ${item.title}`, 'info');
}

// ==========================================
// KELOLA MODAL DOKUMEN MASTER (TAMBAH / EDIT)
// ==========================================
function openMasterModal(item) {
  if (!canWrite()) return showToast('Hanya Editor dan Admin yang dapat mengelola master list.', 'err');

  $('masterForm').reset();
  hideAlert($('mlAlert'));

  // Populate depts
  const depts = state.depts.filter(d => d.active !== false && canEditDept(d.code));
  $('mlDept').innerHTML = depts.map(d =>
    `<option value="${escapeHTML(d.code)}">${escapeHTML(d.code)} - ${escapeHTML(d.name)}</option>`
  ).join('');

  // Populate types
  $('mlDocType').innerHTML = state.types.map(t =>
    `<option value="${escapeHTML(t.code)}">${escapeHTML(t.code)} - ${escapeHTML(t.name)}</option>`
  ).join('');

  if (item) {
    // Mode Edit
    $('masterModalTitle').textContent = 'Ubah Dokumen Master';
    $('mlId').value = item.id;
    $('mlDept').value = item.department;
    $('mlSection').value = item.section || '';
    $('mlDocType').value = item.docType;
    $('mlDocNumber').value = item.docNumber || '';
    $('mlTitle').value = item.title;
    $('mlDesc').value = item.description || '';
    $('mlMandatory').checked = item.mandatory !== false;
  } else {
    // Mode Tambah
    $('masterModalTitle').textContent = 'Tambah Dokumen Master Baru';
    $('mlId').value = '';
    $('mlSection').value = '';
    $('mlDocNumber').value = '';
    $('mlTitle').value = '';
    $('mlDesc').value = '';
    $('mlMandatory').checked = true;
  }

  $('masterModal').classList.remove('hidden');
}

$('masterForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('btnSubmitMaster');
  const alertEl = $('mlAlert');
  hideAlert(alertEl);

  setBusy(btn, true, 'Menyimpan...');
  try {
    const payload = {
      id: $('mlId').value.trim() || undefined,
      department: $('mlDept').value.trim(),
      section: $('mlSection').value.trim(),
      docType: $('mlDocType').value.trim(),
      docNumber: $('mlDocNumber').value.trim(),
      title: $('mlTitle').value.trim(),
      description: $('mlDesc').value.trim(),
      mandatory: $('mlMandatory').checked
    };

    const r = await api('master_save', payload);
    if (r.status === 'success') {
      $('masterModal').classList.add('hidden');
      showToast(r.message || 'Dokumen master berhasil disimpan.', 'ok');
      loadMasterList();
    } else if (r.code !== 'AUTH') {
      showAlert(alertEl, r.message || 'Gagal menyimpan dokumen master.', 'error');
    }
  } catch (err) {
    showAlert(alertEl, 'Gagal terhubung ke server.', 'error');
  } finally {
    setBusy(btn, false, 'Simpan Dokumen Master');
  }
});

// ==========================================
// HAPUS DOKUMEN MASTER (ADMIN)
// ==========================================
function openMasterDeleteModal(mlId) {
  const item = state.masterList.find(m => m.id === mlId);
  if (!item) return showToast('Data dokumen master tidak ditemukan.', 'err');

  state.masterDeleteTarget = item;
  $('mlDelText').innerHTML = `Hapus dokumen acuan <b>${escapeHTML(item.title)}</b> (${escapeHTML(item.department)} - ${escapeHTML(item.section)}) dari Master List? Dokumen file fisik di repositori tidak akan terhapus.`;
  $('masterDeleteModal').classList.remove('hidden');
}

$('btnConfirmDeleteMaster').addEventListener('click', async () => {
  if (!state.masterDeleteTarget) return;
  const btn = $('btnConfirmDeleteMaster');
  btn.disabled = true;

  try {
    const r = await api('master_delete', { id: state.masterDeleteTarget.id });
    if (r.status === 'success') {
      $('masterDeleteModal').classList.add('hidden');
      showToast(r.message || 'Dokumen master berhasil dihapus.', 'ok');
      loadMasterList();
    } else if (r.code !== 'AUTH') {
      showToast('Gagal menghapus: ' + r.message, 'err');
    }
  } catch (err) {
    showToast('Terjadi kesalahan koneksi saat menghapus.', 'err');
  } finally {
    btn.disabled = false;
    state.masterDeleteTarget = null;
  }
});

// ==========================================
// EKSPOR MATRIKS MASTER LIST (CSV)
// ==========================================
function exportMasterMatrixCsv() {
  const items = state.masterList || [];
  if (!items.length) return showToast('Tidak ada data master list untuk diekspor.', 'err');

  const head = [
    'No', 'No. Acuan', 'Judul Dokumen Wajib', 'Departemen', 'Section / Bagian',
    'Tipe Dokumen', 'Status Kepatuhan', 'Keterangan Regulasi',
    'Status di Repositori', 'No. Dokumen Terupload', 'Revisi Terupload',
    'Status Dokumen Terupload', 'Tautan Berkas'
  ];

  const lines = items.map((m, i) => {
    const matched = m.matchedDoc || {};
    return [
      i + 1,
      m.docNumber || '',
      m.title,
      m.department,
      m.section,
      m.docType,
      m.mandatory ? 'Wajib (Mandatory)' : 'Standar',
      m.description,
      m.isUploaded ? 'Sudah Terupload & Tersedia' : 'Belum Ada (Gap)',
      matched.docNumber || '',
      matched.revision || '',
      matched.status || '',
      matched.fileUrl || ''
    ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',');
  });

  const csv = '\uFEFF' + [head.join(','), ...lines].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Matriks_Master_List_Dokumen_PANIDOS_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('Matriks Master List berhasil diekspor.', 'ok');
}
