// ==========================================
// KONFIGURASI FRONTEND
// ==========================================
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbzF4zGvQ_Xu63pS_-sf6VYJeduNh8sJoa5RRoGfkDWiwbFNh4z31bDr33aPXkkcNIx3kw/exec',
  MAX_FILE_SIZE_MB: 15
};

const STORE_KEY = 'panidos.session';
const STATUS_LABEL = { Active: 'Aktif', Draft: 'Draf', Obsolete: 'Obsolete' };
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
  PASSWORD_CHANGE: { label: 'Ganti password',      icon: 'key',          cls: 'badge-info' }
};

// ---------- State ----------
const state = {
  token: '', me: null,
  docs: [], types: [], depts: [],
  filtered: [], page: 1,
  previewId: null, deleteTarget: null, manageDoc: null,
  users: [], audit: [], view: 'main'
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
  if (!isAdmin() && state.view !== 'main') showView('main');
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
  ['main', 'audit', 'users'].forEach(v => $('view' + v[0].toUpperCase() + v.slice(1)).classList.toggle('hidden', v !== name));
  document.querySelectorAll('.nav-item[data-view]').forEach(b => {
    const on = b.dataset.view === name && (name !== 'main' || b.dataset.scroll === (state.navScroll || 'top'));
    b.classList.toggle('active', on);
  });
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
$('btnRefresh').addEventListener('click', () => { fetchDatabase(); if (state.view === 'audit') loadAudit(); if (state.view === 'users') loadUsers(); });

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
  $('statActive').textContent = docs.filter(d => d.status === 'Active').length;
  $('statDraft').textContent = docs.filter(d => d.status === 'Draft').length;
  $('statObsolete').textContent = docs.filter(d => d.status === 'Obsolete').length;
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
        <span class="dept-bar" title="Aktif ${n('Active')} · Draf ${n('Draft')} · Obsolete ${n('Obsolete')}">
          <i class="bar-ok" style="width:${pct(n('Active'))}%"></i>
          <i class="bar-warn" style="width:${pct(n('Draft'))}%"></i>
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
      <td data-label="Status"><span class="badge ${getStatusBadgeClass(doc.status)}">${escapeHTML(STATUS_LABEL[doc.status] || doc.status)}</span></td>
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
            <span class="muted">${escapeHTML(l.role)}</span> · ${escapeHTML(m.label)}
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

function setManageMode(mode) {
  const isRev = mode === 'new_revision';
  const doc = state.manageDoc;
  $('mgRevGroup').classList.toggle('hidden', !isRev);
  $('mgFileInput').required = isRev;
  $('mgNote').required = isRev;
  $('mgStatusGroup').classList.toggle('hidden', isRev); // revisi baru otomatis Aktif
  if (doc) $('mgRevision').value = isRev ? nextRevision(doc.revision) : doc.revision;
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
    status: $('mgStatus').value
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
  $('deleteText').innerHTML = `Versi <b>${escapeHTML(doc.revision)}</b> dari <b>${escapeHTML(doc.docNumber)}</b> akan dihapus dari daftar dan file di Google Drive dipindahkan ke Trash. Tindakan ini tercatat di Jejak Audit.`;
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
      state.audit = r.logs;
      const actions = [...new Set(r.logs.map(l => l.action))].sort();
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
  const head = ['No. Dokumen', 'Judul', 'Tipe', 'Departemen', 'Revisi', 'Status', 'Catatan Revisi', 'Diunggah Oleh', 'Tgl Unggah', 'Diperbarui Oleh', 'Tgl Diperbarui', 'Nama File', 'Link'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = state.filtered.map(d => [d.docNumber, d.title, d.docType, deptName(d.department), d.revision, d.status, d.revisionNote,
    d.uploadedByName, formatDate(d.uploadDate), d.updatedByName, formatDate(d.updatedAt), d.fileName, d.fileUrl].map(esc).join(','));
  const csv = '﻿' + [head.map(esc).join(','), ...rows].join('\r\n');
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
function getStatusBadgeClass(status) {
  if (status === 'Active') return 'badge-active';
  if (status === 'Draft') return 'badge-draft';
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
