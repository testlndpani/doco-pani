// ==========================================================
// PANIDOS - Multi bahasa (Indonesia / English / 中文)
// Teks sumber = Bahasa Indonesia (apa adanya di HTML & script.js).
// Mesin ini menerjemahkan teks & atribut di halaman secara otomatis,
// termasuk konten dinamis (MutationObserver).
// Placeholder: {0} {1} = teks bebas, {#0} {#1} = angka. Di terjemahan tulis {0} {1}.
// ==========================================================
(function () {
  'use strict';

  const LANGS = {
    id: { label: 'Bahasa Indonesia', short: 'ID', flag: 'flag-id.svg', html: 'id' },
    en: { label: 'English', short: 'EN', flag: 'flag-en.svg', html: 'en' },
    zh: { label: '中文', short: '中文', flag: 'flag-zh.svg', html: 'zh-CN' }
  };
  const STORE = 'panidos.lang';

  // [Indonesia, English, 中文]
  const D = [
    // ---------- Login ----------
    ['Dokumen terkendali,', 'Controlled documents,', '文件受控，'],
    ['operasi lebih aman.', 'safer operations.', '运营更安全。'],
    ['Satu pusat arsip untuk SOP, instruksi kerja, dan formulir - lengkap dengan riwayat revisi dan jejak audit.',
      'One central archive for SOPs, work instructions and forms - complete with revision history and an audit trail.',
      '集中管理 SOP、作业指导书和表单的统一档案库，附带完整的修订历史与审计追踪。'],
    ['Akses berbasis peran', 'Role-based access', '基于角色的访问'],
    ['Riwayat revisi lengkap', 'Complete revision history', '完整的修订历史'],
    ['Jejak audit otomatis', 'Automatic audit trail', '自动审计追踪'],
    ['Masuk ke akun Anda', 'Sign in to your account', '登录您的账户'],
    ['Gunakan username dan password yang diberikan administrator.', 'Use the username and password provided by your administrator.', '请使用管理员提供的用户名和密码。'],
    ['Username', 'Username', '用户名'],
    ['Password', 'Password', '密码'],
    ['Masuk', 'Sign in', '登录'],
    ['Memeriksa...', 'Checking...', '正在验证…'],
    ['Belum terhubung: isi CONFIG.API_URL di script.js dengan Web App URL Apps Script Anda.',
      'Not connected: set CONFIG.API_URL in script.js to your Apps Script Web App URL.',
      '尚未连接：请在 script.js 中将 CONFIG.API_URL 设置为您的 Apps Script Web App 网址。'],
    ['CONFIG.API_URL belum diisi di script.js.', 'CONFIG.API_URL has not been set in script.js.', 'script.js 中尚未设置 CONFIG.API_URL。'],
    ['Tidak dapat terhubung ke server. Periksa API_URL dan deployment Web App.',
      'Unable to connect to the server. Check the API_URL and the Web App deployment.',
      '无法连接到服务器。请检查 API_URL 和 Web App 部署。'],

    // ---------- Sidebar & topbar ----------
    ['Dashboard & Arsip', 'Dashboard & Archive', '仪表盘与档案'],
    ['Repositori Dokumen', 'Document Repository', '文档库'],
    ['Unggah & Klasifikasi', 'Upload & Classify', '上传与分类'],
    ['Administrasi', 'Administration', '管理'],
    ['Jejak Audit', 'Audit Trail', '审计追踪'],
    ['Pengguna & Departemen', 'Users & Departments', '用户与部门'],
    ['Penyimpanan', 'Storage', '存储'],
    ['Buka menu', 'Open menu', '打开菜单'],
    ['Cari nomor dokumen, judul, departemen, atau nama file...', 'Search document number, title, department, or file name...', '搜索文档编号、标题、部门或文件名…'],
    ['Hapus pencarian', 'Clear search', '清除搜索'],
    ['Muat ulang data', 'Reload data', '刷新数据'],
    ['Ubah password', 'Change password', '修改密码'],
    ['Ubah Password', 'Change Password', '修改密码'],
    ['Keluar', 'Sign out', '退出登录'],

    // ---------- Dashboard ----------
    ['Selamat datang kembali', 'Welcome back', '欢迎回来'],
    ['Halo, {0}', 'Hello, {0}', '您好，{0}'],
    ['Pastikan setiap dokumen yang Anda gunakan adalah revisi terbaru. Dokumen terkendali adalah bagian dari budaya K3 kita.',
      'Make sure every document you use is the latest revision. Document control is part of our HSE culture.',
      '请确保您使用的每份文档都是最新修订版。文档受控是我们 HSE（健康、安全与环境）文化的一部分。'],
    ['Keselamatan utama', 'Safety first', '安全第一'],
    ['Revisi terkendali', 'Controlled revisions', '修订受控'],
    ['Repositori Berkas', 'File Repository', '文件库'],
    ['Dashboard Dokumen Arsip', 'Archived Documents Dashboard', '档案文档仪表盘'],
    ['Pantau seluruh dokumen terkendali berdasarkan tipe, departemen, tahap status, dan jumlah orang tersosialisasi.',
      'Monitor all controlled documents by type, department, status stage, and number of people socialized.',
      '按类型、部门、状态阶段及已宣贯人数监控所有受控文档。'],
    ['Ekspor CSV', 'Export CSV', '导出 CSV'],
    ['Unggah Dokumen', 'Upload Document', '上传文档'],
    ['Total Dokumen', 'Total Documents', '文档总数'],
    ['Draft (Develop)', 'Draft (Develop)', '草稿（开发中）'],
    ['Full Approved', 'Full Approved', '全部批准'],
    ['Sosialisasi', 'Socialization', '宣贯'],
    ['{#0} orang tersosialisasi', '{0} people socialized', '已宣贯 {0} 人'],
    ['{#0} orang', '{0} people', '{0} 人'],
    ['Aktif (Berlaku)', 'Active (Effective)', '有效（生效中）'],
    ['Obsolete (Tidak Berlaku)', 'Obsolete (Not Effective)', '已作废（不再生效）'],
    ['Aktif', 'Active', '有效'],
    ['Nonaktif', 'Inactive', '停用'],
    ['Obsolete', 'Obsolete', '已作废'],
    ['Dokumen per Tipe', 'Documents by Type', '按类型统计文档'],
    ['Tampilkan semua', 'Show all', '显示全部'],
    ['Rangkuman Dokumen per Departemen', 'Document Summary by Department', '按部门汇总文档'],
    ['Tips:', 'Tips:', '提示：'],
    ['Klik kartu tipe atau departemen untuk memfilter tabel. Klik ikon', 'Click a type or department card to filter the table. Click the icon', '点击类型或部门卡片可筛选表格。点击图标'],
    ['pada baris dokumen untuk melihat riwayat revisi dan siapa yang mengubahnya.', 'on a document row to view the revision history and who changed it.', '（位于文档行）可查看修订历史及修改人。'],
    ['Belum ada tipe dokumen.', 'No document types yet.', '暂无文档类型。'],
    ['{#0} Aktif', '{0} Active', '{0} 有效'],
    ['{#0} Lainnya', '{0} Others', '{0} 其他'],
    ['{#0} departemen', '{0} departments', '{0} 个部门'],
    ['dokumen', 'documents', '份文档'],
    ['Draft {#0} · Approved {#1} · Sosialisasi {#2} · Aktif {#3} · Obsolete {#4}',
      'Draft {0} · Approved {1} · Socialization {2} · Active {3} · Obsolete {4}',
      '草稿 {0} · 已批准 {1} · 宣贯 {2} · 有效 {3} · 已作废 {4}'],
    ['Belum ada dokumen.', 'No documents yet.', '暂无文档。'],

    // ---------- Tabel ----------
    ['Semua Tipe', 'All Types', '所有类型'],
    ['Semua Departemen', 'All Departments', '所有部门'],
    ['Semua Status', 'All Statuses', '所有状态'],
    ['Tampilkan', 'Show', '每页显示'],
    ['baris', 'rows', '行'],
    ['Memuat database dokumen...', 'Loading document database...', '正在加载文档数据库…'],
    ['Dokumen', 'Document', '文档'],
    ['No. Dokumen', 'Doc. No.', '文档编号'],
    ['Tipe', 'Type', '类型'],
    ['Departemen', 'Department', '部门'],
    ['Revisi', 'Revision', '修订版'],
    ['Diperbarui', 'Updated', '更新时间'],
    ['Status', 'Status', '状态'],
    ['Aksi', 'Actions', '操作'],
    ['oleh {0}', 'by {0}', '由 {0}'],
    ['Menampilkan {#0}–{#1} dari {#2} dokumen (disaring dari {#3} total)', 'Showing {0}–{1} of {2} documents (filtered from {3} total)', '显示第 {0}–{1} 条，共 {2} 份文档（从总计 {3} 份中筛选）'],
    ['Menampilkan {#0}–{#1} dari {#2} dokumen', 'Showing {0}–{1} of {2} documents', '显示第 {0}–{1} 条，共 {2} 份文档'],
    ['Sebelumnya', 'Previous', '上一页'],
    ['Berikutnya', 'Next', '下一页'],
    ['Pratinjau', 'Preview', '预览'],
    ['Buka di Drive', 'Open in Drive', '在 Drive 中打开'],
    ['Riwayat revisi', 'Revision history', '修订历史'],
    ['Edit / Revisi', 'Edit / Revise', '编辑 / 修订'],
    ['Edit atau revisi', 'Edit or revise', '编辑或修订'],
    ['Hapus', 'Delete', '删除'],
    ['Tidak ada dokumen', 'No documents', '没有文档'],
    ['Tidak ada dokumen yang sesuai dengan filter saat ini.', 'No documents match the current filters.', '没有符合当前筛选条件的文档。'],
    ['Belum ada dokumen. Klik "Unggah Dokumen" untuk memulai.', 'No documents yet. Click "Upload Document" to get started.', '暂无文档。点击“上传文档”开始。'],
    ['Gagal memuat data', 'Failed to load data', '加载数据失败'],
    ['Gagal mengambil data: {0}', 'Failed to fetch data: {0}', '获取数据失败：{0}'],
    ['Gagal terhubung ke server Apps Script. Periksa API_URL Anda.', 'Failed to connect to the Apps Script server. Check your API_URL.', '无法连接到 Apps Script 服务器。请检查您的 API_URL。'],
    ['Tidak dapat terhubung', 'Unable to connect', '无法连接'],
    ['Periksa CONFIG.API_URL dan pengaturan deployment Web App.', 'Check CONFIG.API_URL and the Web App deployment settings.', '请检查 CONFIG.API_URL 和 Web App 部署设置。'],
    ['Pratinjau Dokumen', 'Document Preview', '文档预览'],
    ['Pratinjau dokumen', 'Document preview', '文档预览'],
    ['Tutup pratinjau', 'Close preview', '关闭预览'],
    ['Tutup', 'Close', '关闭'],

    // ---------- Status & aksi ----------
    ['Dokumen baru', 'New document', '新文档'],
    ['Terbit revisi', 'Revision issued', '已发布修订'],
    ['Ubah informasi', 'Information edited', '信息变更'],
    ['Hapus dokumen', 'Document deleted', '文档已删除'],
    ['Login', 'Login', '登录'],
    ['Login gagal', 'Login failed', '登录失败'],
    ['Kelola pengguna', 'User management', '用户管理'],
    ['Kelola departemen', 'Department management', '部门管理'],
    ['Ganti password', 'Password changed', '密码已修改'],

    // ---------- Riwayat ----------
    ['Riwayat Dokumen', 'Document History', '文档历史'],
    ['Memuat riwayat...', 'Loading history...', '正在加载历史…'],
    ['Gagal memuat riwayat.', 'Failed to load history.', '加载历史失败。'],
    ['Terbaru', 'Latest', '最新'],
    ['Buka file', 'Open file', '打开文件'],
    ['Versi dokumen', 'Document versions', '文档版本'],
    ['{#0} revisi', '{0} revisions', '{0} 个修订版'],
    ['Aktivitas & perubahan', 'Activity & changes', '活动与变更'],
    ['· diunggah oleh', '· uploaded by', '· 上传人：'],
    ['· terakhir diubah oleh', '· last edited by', '· 最后修改人：'],
    ['tidak tercatat', 'not recorded', '未记录'],
    ['Belum ada aktivitas tercatat untuk dokumen ini.', 'No recorded activity for this document yet.', '此文档暂无活动记录。'],
    ['{0} · {1} sekarang', '{0} · {1} currently', '{0} · 当前 {1}'],

    // ---------- Audit ----------
    ['Jejak Audit & Log Sistem', 'Audit Trail & System Log', '审计追踪与系统日志'],
    ['Catatan seluruh aktivitas: siapa melakukan apa dan kapan. Data diambil dari sheet AuditLog.', 'A record of all activity: who did what and when. Data is read from the AuditLog sheet.', '所有活动记录：谁在何时做了什么。数据来自 AuditLog 工作表。'],
    ['Muat ulang', 'Reload', '刷新'],
    ['Cari pengguna, dokumen, detail...', 'Search user, document, details...', '搜索用户、文档、详情…'],
    ['Semua Aksi', 'All Actions', '所有操作'],
    ['Waktu', 'Time', '时间'],
    ['Pengguna', 'User', '用户'],
    ['Detail', 'Details', '详情'],
    ['Memuat log...', 'Loading log...', '正在加载日志…'],
    ['Gagal memuat', 'Failed to load', '加载失败'],
    ['Tidak dapat terhubung ke server.', 'Unable to connect to the server.', '无法连接到服务器。'],
    ['{#0} dari {#1} catatan terakhir', '{0} of {1} latest records', '最近 {1} 条记录中的 {0} 条'],
    ['Tidak ada catatan', 'No records', '没有记录'],
    ['Tidak ada aktivitas yang sesuai.', 'No matching activity.', '没有符合条件的活动。'],

    // ---------- Pengguna & departemen ----------
    ['Kelola akun, peran, dan departemen yang boleh dikelola setiap pengguna.', 'Manage accounts, roles, and the departments each user may manage.', '管理账户、角色以及每位用户可管理的部门。'],
    ['Admin: semua aksi · Editor: unggah/edit di departemennya · Viewer: hanya melihat', 'Admin: all actions · Editor: upload/edit in own departments · Viewer: view only', 'Admin：所有操作 · Editor：在所属部门上传/编辑 · Viewer：仅查看'],
    ['Tambah Pengguna', 'Add User', '添加用户'],
    ['Edit Pengguna', 'Edit User', '编辑用户'],
    ['Peran', 'Role', '角色'],
    ['Login Terakhir', 'Last Login', '最近登录'],
    ['Master departemen untuk form dokumen dan hak akses Editor', 'Department master data for document forms and Editor permissions', '用于文档表单和 Editor 权限的部门主数据'],
    ['Tambah Departemen', 'Add Department', '添加部门'],
    ['Edit Departemen', 'Edit Department', '编辑部门'],
    ['Kode', 'Code', '代码'],
    ['Nama', 'Name', '名称'],
    ['Jumlah Dokumen', 'Document Count', '文档数量'],
    ['Terkendali · Terlacak · Terpercaya', 'Controlled · Traceable · Trusted', '受控 · 可追溯 · 可信'],
    ['Edit pengguna', 'Edit user', '编辑用户'],
    ['Edit departemen', 'Edit department', '编辑部门'],
    ['Semua', 'All', '全部'],
    ['Semua departemen', 'All departments', '所有部门'],
    ['Belum ada pengguna.', 'No users yet.', '暂无用户。'],
    ['Belum ada departemen.', 'No departments yet.', '暂无部门。'],
    ['Atur peran dan departemen yang boleh dikelola.', 'Set the role and the departments this user may manage.', '设置角色及可管理的部门。'],
    ['Nama Lengkap', 'Full Name', '全名'],
    ['Email', 'Email', '电子邮箱'],
    ['Viewer - hanya melihat', 'Viewer - view only', 'Viewer - 仅查看'],
    ['Editor - per departemen', 'Editor - per department', 'Editor - 按部门'],
    ['Admin - semua aksi', 'Admin - all actions', 'Admin - 所有操作'],
    ['Departemen yang boleh dikelola', 'Departments allowed to manage', '可管理的部门'],
    ['Status akun', 'Account status', '账户状态'],
    ['(kosongkan jika tidak diubah)', '(leave blank to keep unchanged)', '（留空则不修改）'],
    ['Simpan', 'Save', '保存'],
    ['huruf kecil, tanpa spasi', 'lowercase, no spaces', '小写字母，无空格'],
    ['Minimal 8 karakter', 'Minimum 8 characters', '至少 8 个字符'],
    ['Minimal 8 karakter.', 'Minimum 8 characters.', '至少 8 个字符。'],
    ['Misal: QA', 'e.g. QA', '例如：QA'],
    ['Kode dipakai pada nomor dokumen dan filter.', 'The code is used in document numbers and filters.', '该代码用于文档编号和筛选。'],
    ['Nama Departemen', 'Department Name', '部门名称'],
    ['Password lama', 'Current password', '当前密码'],
    ['Password baru', 'New password', '新密码'],
    ['Ulangi password baru', 'Repeat new password', '重复新密码'],
    ['Pilih minimal satu departemen untuk Editor.', 'Select at least one department for the Editor.', '请至少为 Editor 选择一个部门。'],
    ['Menyimpan...', 'Saving...', '正在保存…'],
    ['Gagal memuat pengguna.', 'Failed to load users.', '加载用户失败。'],
    ['Gagal menyimpan pengguna.', 'Failed to save user.', '保存用户失败。'],
    ['Gagal menyimpan departemen.', 'Failed to save department.', '保存部门失败。'],
    ['Konfirmasi password baru tidak sama.', 'The new password confirmation does not match.', '两次输入的新密码不一致。'],
    ['Gagal mengganti password.', 'Failed to change password.', '修改密码失败。'],

    // ---------- Unggah ----------
    ['Unggah & Registrasi Dokumen', 'Upload & Register Document', '上传并登记文档'],
    ['Daftarkan dokumen terkendali beserta metadatanya.', 'Register a controlled document along with its metadata.', '登记受控文档及其元数据。'],
    ['Berkas dokumen', 'Document file', '文档文件'],
    ['Maks.', 'Max.', '最大'],
    ['Tarik dan letakkan berkas di sini, atau', 'Drag and drop a file here, or', '将文件拖放到此处，或'],
    ['telusuri file lokal', 'browse local files', '浏览本地文件'],
    ['Semua format didukung (PDF, DOCX, XLSX, dll.), maksimal', 'All formats supported (PDF, DOCX, XLSX, etc.), maximum', '支持所有格式（PDF、DOCX、XLSX 等），最大'],
    ['Klasifikasi & metadata', 'Classification & metadata', '分类与元数据'],
    ['Tipe Dokumen', 'Document Type', '文档类型'],
    ['Nomor Dokumen', 'Document Number', '文档编号'],
    ['Judul Dokumen', 'Document Title', '文档标题'],
    ['Jumlah orang tersosialisasi', 'Number of people socialized', '已宣贯人数'],
    ['Isi total karyawan/peserta yang sudah menerima sosialisasi dokumen ini.', 'Enter the total number of employees/participants who have received socialization of this document.', '填写已接受本文档宣贯的员工/参与者总人数。'],
    ['Misal: IM-HRD-2026-001', 'e.g. IM-HRD-2026-001', '例如：IM-HRD-2026-001'],
    ['Masukkan judul lengkap dokumen', 'Enter the full document title', '输入文档完整标题'],
    ['Batal', 'Cancel', '取消'],
    ['Simpan & Unggah', 'Save & Upload', '保存并上传'],
    ['Mengunggah...', 'Uploading...', '正在上传…'],
    ['Gagal mengunggah dokumen.', 'Failed to upload the document.', '上传文档失败。'],
    ['Pilih file terlebih dahulu.', 'Please choose a file first.', '请先选择文件。'],
    ['Ukuran file maksimal {#0} MB.', 'Maximum file size is {0} MB.', '文件大小上限为 {0} MB。'],
    ['Anda belum memiliki departemen yang boleh dikelola. Hubungi Admin.', 'You do not have any department you may manage yet. Contact an Admin.', '您尚无可管理的部门。请联系管理员。'],
    ['Hapus pilihan', 'Remove selection', '移除所选文件'],
    ['{0} (lama)', '{0} (legacy)', '{0}（旧）'],

    // ---------- Kelola / revisi ----------
    ['Kelola / Revisi Dokumen', 'Manage / Revise Document', '管理 / 修订文档'],
    ['Ubah informasi atau terbitkan revisi baru.', 'Edit information or issue a new revision.', '修改信息或发布新修订版。'],
    ['Edit Info / Status', 'Edit Info / Status', '编辑信息 / 状态'],
    ['Ubah judul, status, atau metadata tanpa ganti file', 'Change the title, status, or metadata without replacing the file', '无需更换文件即可修改标题、状态或元数据'],
    ['Terbitkan Revisi Baru', 'Issue New Revision', '发布新修订版'],
    ['Unggah file baru; versi Aktif lama menjadi Obsolete saat revisi baru berstatus Aktif', 'Upload a new file; the old Active version becomes Obsolete once the new revision is Active', '上传新文件；新修订版变为“有效”时，旧的有效版本将作废'],
    ['Nomor Revisi', 'Revision Number', '修订版号'],
    ['Perbarui angka ini setiap ada sesi sosialisasi baru.', 'Update this number after every new socialization session.', '每次新的宣贯活动后请更新此数字。'],
    ['Catatan Perubahan Revisi', 'Revision Change Notes', '修订变更说明'],
    ['Apa yang berubah pada revisi ini? Misal: perbaikan langkah 3 dan penambahan APD', 'What changed in this revision? e.g. fix to step 3 and added PPE', '此修订有什么变化？例如：修正第 3 步并增加个人防护装备（APD）'],
    ['File revisi terbaru', 'Latest revision file', '最新修订文件'],
    ['Tarik file revisi ke sini, atau', 'Drag the revision file here, or', '将修订文件拖到此处，或'],
    ['telusuri', 'browse', '浏览'],
    ['Simpan Perubahan', 'Save Changes', '保存更改'],
    ['Memproses...', 'Processing...', '正在处理…'],
    ['Pilih file revisi baru terlebih dahulu.', 'Please choose the new revision file first.', '请先选择新的修订文件。'],
    ['Terjadi kesalahan saat menyimpan perubahan.', 'An error occurred while saving the changes.', '保存更改时出错。'],

    // ---------- Hapus ----------
    ['Hapus dokumen?', 'Delete document?', '删除文档？'],
    ['Versi {0} dari {1} akan dihapus dari daftar dan file di Google Drive dipindahkan ke Trash. Tindakan ini tercatat di Jejak Audit.',
      'Version {0} of {1} will be removed from the list and its file in Google Drive will be moved to Trash. This action is recorded in the Audit Trail.',
      '{1} 的 {0} 版本将从列表中移除，其在 Google Drive 中的文件将移入回收站。此操作会记录在审计追踪中。'],
    ['Gagal menghapus: {0}', 'Failed to delete: {0}', '删除失败：{0}'],
    ['Terjadi kesalahan koneksi saat menghapus.', 'A connection error occurred while deleting.', '删除时发生连接错误。'],

    // ---------- Ekspor CSV ----------
    ['Judul', 'Title', '标题'],
    ['Orang Tersosialisasi', 'People Socialized', '已宣贯人数'],
    ['Catatan Revisi', 'Revision Notes', '修订说明'],
    ['Diunggah Oleh', 'Uploaded By', '上传人'],
    ['Tgl Unggah', 'Upload Date', '上传日期'],
    ['Diperbarui Oleh', 'Updated By', '更新人'],
    ['Tgl Diperbarui', 'Updated Date', '更新日期'],
    ['Nama File', 'File Name', '文件名'],
    ['Link', 'Link', '链接'],
    ['Tidak ada data untuk diekspor.', 'No data to export.', '没有可导出的数据。'],

    // ---------- Tipe dokumen (data master) ----------
    ['Kebijakan (Policy)', 'Policy', '政策'],
    ['Formulir / Template', 'Form / Template', '表单 / 模板'],
    ['Surat Keputusan (SK)', 'Decree Letter (SK)', '决定书（SK）'],
    ['POL - Kebijakan (Policy)', 'POL - Policy', 'POL - 政策'],
    ['FRM - Formulir / Template', 'FRM - Form / Template', 'FRM - 表单 / 模板'],
    ['SK - Surat Keputusan (SK)', 'SK - Decree Letter (SK)', 'SK - 决定书（SK）'],

    // ---------- Pesan dari server (Code.gs) ----------
    ['Silakan login terlebih dahulu.', 'Please sign in first.', '请先登录。'],
    ['Sesi berakhir. Silakan login kembali.', 'Your session has expired. Please sign in again.', '会话已过期。请重新登录。'],
    ['Sesi tidak valid. Silakan login kembali.', 'Invalid session. Please sign in again.', '会话无效。请重新登录。'],
    ['Anda tidak memiliki hak akses untuk aksi ini.', 'You do not have permission for this action.', '您没有执行此操作的权限。'],
    ['Anda tidak berwenang mengelola dokumen departemen "{0}".', 'You are not authorized to manage documents of department "{0}".', '您无权管理部门“{0}”的文档。'],
    ['Departemen "{0}" tidak terdaftar atau tidak aktif.', 'Department "{0}" is not registered or is inactive.', '部门“{0}”未注册或已停用。'],
    ['Departemen "{0}" tidak terdaftar.', 'Department "{0}" is not registered.', '部门“{0}”未注册。'],
    ['Aksi tidak dikenal.', 'Unknown action.', '未知操作。'],
    ['Permintaan tidak valid.', 'Invalid request.', '请求无效。'],
    ['Username dan password wajib diisi.', 'Username and password are required.', '用户名和密码为必填项。'],
    ['Username atau password salah.', 'Incorrect username or password.', '用户名或密码错误。'],
    ['Nomor dokumen wajib diisi.', 'Document number is required.', '文档编号为必填项。'],
    ['Kolom "{0}" wajib diisi.', 'The "{0}" field is required.', '“{0}”为必填项。'],
    ['Tipe dokumen "{0}" tidak terdaftar.', 'Document type "{0}" is not registered.', '文档类型“{0}”未注册。'],
    ['Data file tidak lengkap.', 'File data is incomplete.', '文件数据不完整。'],
    ['Ukuran file melebihi batas 15 MB.', 'File size exceeds the 15 MB limit.', '文件大小超过 15 MB 限制。'],
    ['Status tidak valid.', 'Invalid status.', '状态无效。'],
    ['Nomor dokumen sudah terdaftar. Gunakan "Terbitkan Revisi Baru" untuk versi berikutnya.', 'This document number is already registered. Use "Issue New Revision" for the next version.', '该文档编号已注册。请使用“发布新修订版”创建下一个版本。'],
    ['Dokumen berhasil diunggah.', 'Document uploaded successfully.', '文档上传成功。'],
    ['Dokumen tidak ditemukan.', 'Document not found.', '未找到文档。'],
    ['Revisi "{0}" sudah ada untuk nomor dokumen ini.', 'Revision "{0}" already exists for this document number.', '此文档编号已存在修订版“{0}”。'],
    ['Tidak ada perubahan.', 'No changes.', '没有更改。'],
    ['Informasi dokumen diperbarui.', 'Document information updated.', '文档信息已更新。'],
    ['Dokumen dasar tidak ditemukan.', 'Base document not found.', '未找到基础文档。'],
    ['Revisi "{0}" sudah ada. Gunakan nomor revisi yang baru.', 'Revision "{0}" already exists. Use a new revision number.', '修订版“{0}”已存在。请使用新的修订版号。'],
    ['Revisi baru berhasil diterbitkan dan versi lama dijadikan Obsolete.', 'The new revision was issued and the old version is now Obsolete.', '新修订版已发布，旧版本已作废。'],
    ['Revisi baru berhasil disimpan dengan status {0}.', 'The new revision was saved with status {0}.', '新修订版已保存，状态为 {0}。'],
    ['Dokumen berhasil dihapus.', 'Document deleted successfully.', '文档已删除。'],
    ['Password minimal 4 karakter.', 'Password must be at least 4 characters.', '密码至少需要 4 个字符。'],
    ['Username 3-30 karakter: huruf, angka, titik, garis bawah, atau strip.', 'Username must be 3-30 characters: letters, digits, dot, underscore, or hyphen.', '用户名需为 3-30 个字符：字母、数字、点、下划线或连字符。'],
    ['Peran tidak valid.', 'Invalid role.', '角色无效。'],
    ['Editor harus memiliki minimal satu departemen.', 'An Editor must have at least one department.', 'Editor 至少需要一个部门。'],
    ['Anda tidak dapat menurunkan peran atau menonaktifkan akun sendiri.', 'You cannot downgrade your own role or deactivate your own account.', '您不能降低自己的角色或停用自己的账户。'],
    ['Minimal harus ada satu Admin aktif.', 'There must be at least one active Admin.', '至少必须有一位有效的 Admin。'],
    ['Pengguna diperbarui.', 'User updated.', '用户已更新。'],
    ['Password wajib diisi untuk pengguna baru.', 'A password is required for a new user.', '新用户必须设置密码。'],
    ['Pengguna berhasil dibuat.', 'User created successfully.', '用户创建成功。'],
    ['Kode departemen 2-12 karakter (huruf/angka).', 'Department code must be 2-12 characters (letters/digits).', '部门代码需为 2-12 个字符（字母/数字）。'],
    ['Departemen diperbarui.', 'Department updated.', '部门已更新。'],
    ['Departemen ditambahkan.', 'Department added.', '部门已添加。'],
    ['Password lama salah.', 'The current password is incorrect.', '当前密码错误。'],
    ['Password berhasil diganti.', 'Password changed successfully.', '密码修改成功。'],
    ['Jumlah orang tersosialisasi harus berupa bilangan bulat 0 atau lebih.', 'The number of people socialized must be a whole number of 0 or more.', '已宣贯人数必须是 0 或更大的整数。'],
    // ---------- Grafik & Analitik ----------
    ['Grafik & Analitik', 'Charts & Analytics', '图表与分析'],
    ['Grafik & Analitik Dokumen', 'Document Charts & Analytics', '文档图表与分析'],
    ['Grafik & Visualisasi Dokumen', 'Document Charts & Visualization', '文档图表与可视化'],
    ['Analisis visual menyeluruh seluruh dokumen terkendali: sebaran status, kepatuhan departemen, capaian sosialisasi, dan tren revisi.',
      'Comprehensive visual analysis of all controlled documents: status distribution, department compliance, socialization reach, and revision trends.',
      '受控文档全景可视化分析：状态分布、部门合规、宣贯覆盖与修订趋势。'],
    ['Segarkan Grafik', 'Refresh Charts', '刷新图表'],
    ['Buka Repositori', 'Open Repository', '打开文档库'],
    ['Tingkat Dokumen Aktif', 'Active Document Rate', '有效文档比例'],
    ['Tahap Sosialisasi', 'Socialization Stage', '宣贯阶段'],
    ['Total Tersosialisasi', 'Total Socialized', '累计已宣贯'],
    ['Butuh Tindakan', 'Action Required', '待办处理'],
    ['Tingkat Revisi', 'Revision Rate', '修订率'],
    ['Pernah direvisi', 'Ever revised', '曾修订过'],
    ['Alur Siklus Dokumen', 'Document Lifecycle Pipeline', '文档生命周期流程'],
    ['Perjalanan dokumen dari perancangan hingga arsip usang', 'The journey of documents from drafting to obsolescence', '文档从起草编制到归档作废的全过程'],
    ['Proporsi Status Dokumen', 'Document Status Breakdown', '文档状态占比'],
    ['Dokumen per Departemen', 'Documents by Department', '各部门统计文档'],
    ['Distribusi Tipe Dokumen', 'Document Type Distribution', '文档类型分布'],
    ['Capaian Sosialisasi per Departemen', 'Socialization Reach by Department', '各部门宣贯覆盖情况'],
    ['Top 5 Dokumen Paling Banyak Tersosialisasi', 'Top 5 Most Socialized Documents', '宣贯人数排名前5的文档'],
    ['Dokumen dengan jangkauan pemahaman operasional tertinggi', 'Documents with the highest operational comprehension reach', '运营普及与知晓度最高的文档'],
    ['Jumlah Tersosialisasi', 'Number Socialized', '已宣贯人数'],
    ['Rata-rata {#0} orang / dok', 'Average {0} people / doc', '平均每份文档 {0} 人'],
    ['Rata-rata', 'Average', '平均'],
    ['orang', 'people', '人'],
    ['{#0}% dari total', '{0}% of total', '占总数 {0}%'],
    ['dari total', 'of total', '占总数'],
    ['{#0} dokumen aktif', '{0} active documents', '{0} 份有效文档'],
    ['Belum ada data sosialisasi.', 'No socialization data yet.', '暂无宣贯数据。'],
    ['Terkendali', 'Controlled', '受控'],
    ['Pengembangan awal', 'Initial development', '初期开发'],
    ['Disetujui penuh', 'Fully approved', '已完全批准'],
    ['Resmi operasional', 'Officially operational', '正式投入运营'],
    ['Tidak berlaku lagi', 'No longer effective', '已不再生效'],
    ['Server Error: {0}', 'Server Error: {0}', '服务器错误：{0}'],

    // ---------- Modul Penomoran & Surat Keluar ----------
    ['Persuratan', 'Correspondence', '发函与公文'],
    ['Penomoran & Surat', 'Letter Numbering & Letters', '发函编号与公文'],
    ['Penomoran & Registrasi Surat Keluar', 'Outbox Numbering & Letter Registration', '发函编号与公文登记'],
    ['Penerbitan nomor surat resmi berurutan, pelacakan registrasi, dan pengunggahan berkas surat bertandatangan.',
      'Sequential official letter numbering issuance, registration tracking, and signed file upload.',
      '官方发函顺序编号、公文登记追踪及已签署文件归档上传。'],
    ['Daftarkan Nomor Surat', 'Register Letter Number', '申请发函编号'],
    ['Total Surat Didaftarkan', 'Total Letters Registered', '已登记函件总数'],
    ['Menunggu Upload', 'Pending Upload', '等待上传'],
    ['Belum diunggah berkas', 'File not yet uploaded', '尚未上传文件'],
    ['Tercatat & Valid', 'Recorded & Valid', '已记录并有效'],
    ['Berkas resmi tersimpan', 'Official file saved', '官方正本已保存'],
    ['Bulan Berjalan', 'Current Month', '当月发函'],
    ['Bulan ini', 'This month', '本月'],
    ['Daftarkan Nomor', 'Register Number', '申请编号'],
    ['Pilih entitas, jenis surat & tujuan untuk klaim nomor urut',
      'Select entity, letter type & recipient to claim sequential number',
      '选择发函实体、类型及接收方以获取序列号'],
    ['Tandatangani Surat', 'Sign Letter', '签署文件'],
    ['Cantumkan nomor resmi pada dokumen & mintakan tanda tangan',
      'Include official number on the document & obtain signature',
      '在公文上标注官方编号并完成签字审批'],
    ['Unggah Berkas', 'Upload File', '上传文件'],
    ['Unggah berkas untuk mengubah status menjadi Tercatat & Valid',
      'Upload file to update status to Recorded & Valid',
      '上传文件后公文状态将更新为已记录且有效'],
    ['Cari nomor surat, perihal, tujuan, pemohon...',
      'Search letter number, subject, recipient, applicant...',
      '搜索公文编号、事由、接收方、申请人…'],
    ['Semua Entitas', 'All Entities', '所有实体'],
    ['Semua Jenis Surat', 'All Letter Types', '所有公文类型'],
    ['No. Surat', 'Letter No.', '公文编号'],
    ['Entitas & Dept', 'Entity & Dept', '实体与部门'],
    ['Tanggal & Jenis', 'Date & Type', '日期与类型'],
    ['Perihal & Tujuan', 'Subject & Recipient', '事由与接收方'],
    ['Berkas Surat', 'Letter File', '公文正本'],
    ['Pemohon', 'Applicant', '申请人'],
    ['Daftarkan Nomor Surat Baru', 'Register New Letter Number', '申请新发函编号'],
    ['Sistem akan menerbitkan nomor surat resmi berurutan sesuai format korporat.',
      'The system will issue a sequential official letter number according to corporate format.',
      '系统将按企业标准生成连续的官方公文编号。'],
    ['Entitas Perusahaan', 'Company Entity', '发函公司实体'],
    ['Departemen Pemohon', 'Applicant Department', '申请部门'],
    ['Jenis Surat', 'Letter Type', '公文类型'],
    ['Tanggal Surat', 'Letter Date', '发函日期'],
    ['Ditujukan Kepada', 'Addressed To', '接收单位/个人'],
    ['Perihal / Hal Surat', 'Subject / Matter', '公文事由 / 主题'],
    ['Catatan / Keterangan Tambahan', 'Additional Notes', '附加说明/备注'],
    ['Pratinjau Format Nomor Surat:', 'Letter Number Format Preview:', '发函编号格式预览：'],
    ['Terbitkan Nomor Surat', 'Issue Letter Number', '生成发函编号'],
    ['Unggah Berkas Surat Resmi', 'Upload Official Letter File', '上传官方公文正本'],
    ['Unggah berkas fisik/PDF yang telah ditandatangani untuk memvalidasi pencatatan surat.',
      'Upload signed physical/PDF file to validate letter record.',
      '上传已签字的纸质扫描件或PDF正本以生效备案。'],
    ['Berkas Surat Bertandatangan', 'Signed Letter Document', '已签署公文正本'],
    ['Catatan / Keterangan Berkas', 'File Notes / Description', '文件说明/存放位置'],
    ['Ketetapan Validasi Surat:', 'Letter Validation Policy:', '公文生效规定：'],
    ['Setelah berkas diunggah, surat resmi berstatus Tercatat & Valid dan berkas tersimpan aman di folder Google Drive perusahaan.',
      'Once uploaded, the letter is officially Recorded & Valid and stored safely in company Google Drive.',
      '文件上传后，公文状态将正式转为已记录有效，并安全归档于公司 Google Drive。'],
    ['Unggah & Validasi Surat', 'Upload & Validate Letter', '上传并生效备案'],
    ['Nomor Surat Berhasil Terbit!', 'Letter Number Successfully Issued!', '发函编号已成功生成！'],
    ['Nomor urut resmi telah didaftarkan ke sistem.', 'Official sequential number has been registered in the system.', '官方序列号已在系统中成功登记。'],
    ['NOMOR SURAT RESMI:', 'OFFICIAL LETTER NUMBER:', '官方发函编号：'],
    ['Salin Nomor Surat', 'Copy Letter Number', '复制公文编号'],
    ['Gunakan nomor resmi di atas pada kop surat. Setelah surat dicetak dan ditandatangani, segera unggah berkasnya ke sistem agar berstatus Tercatat & Valid.',
      'Use the official number above on letterheads. After printing and signing, upload the file immediately to become Recorded & Valid.',
      '请在公文抬头使用此编号。打印并完成签署后，请尽快上传文件以正式备案生效。'],
    ['Unggah Berkas Sekarang', 'Upload File Now', '立即上传文件'],
    ['Selesai (Unggah Nanti)', 'Done (Upload Later)', '完成（稍后上传）'],
    ['Batalkan Nomor Surat', 'Cancel Letter Number', '作废发函编号'],
    ['Tindakan ini akan menandai status surat sebagai Dibatalkan.',
      'This action will mark the letter status as Cancelled.',
      '此操作将把该公文状态标记为已作废。'],
    ['Alasan Pembatalan', 'Cancellation Reason', '作废原因'],
    ['Batalkan Nomor', 'Cancel Number', '确认作废'],
    ['Hapus Data Surat', 'Delete Letter Data', '删除公文数据'],
    ['Tindakan permanen oleh Administrator.', 'Permanent action by Administrator.', '管理员永久删除操作。'],
    ['Hapus Permanen', 'Delete Permanently', '永久删除'],
    ['Registrasi nomor surat', 'Letter number registration', '发函编号登记'],
    ['Upload berkas surat', 'Upload letter file', '上传公文文件'],
    ['Batalkan surat', 'Cancel letter', '作废发函'],
    ['Hapus surat', 'Delete letter', '删除发函'],
    ['Dibatalkan', 'Cancelled', '已作废'],

    // ---------- Modul Master List Dokumen & Matriks Kepatuhan ----------
    ['Master List Dokumen', 'Document Master List', '主控文档清单'],
    ['Master List & Matriks Kepatuhan Dokumen', 'Master List & Document Compliance Matrix', '主控文档清单与合规矩阵'],
    ['Daftar acuan dokumen wajib per departemen & section, serta pelacakan ketersediaan dokumen di repositori.',
      'Master register of mandatory documents per department & section, and tracking of document availability in the repository.',
      '各部门及工段必备受控文档基准清单，以及文档库归档完备性追踪。'],
    ['Ekspor Matriks (CSV)', 'Export Matrix (CSV)', '导出合规矩阵 (CSV)'],
    ['Tambah Dokumen Master', 'Add Master Document', '添加主控文档'],
    ['Total Dokumen Wajib', 'Total Mandatory Documents', '必备文档总数'],
    ['Target acuan regulasi', 'Regulatory benchmark target', '法规与管理基准目标'],
    ['Sudah Terupload', 'Uploaded & Available', '已上传归档'],
    ['Belum Ada (Gap)', 'Missing / Gap', '尚未归档（缺口）'],
    ['Perlu diunggah/dibuat', 'Needs to be uploaded/created', '需上传或制定'],
    ['Tingkat Kepatuhan', 'Compliance Rate', '合规完备率'],
    ['Cari judul, nomor acuan, section, keterangan...',
      'Search title, reference no., section, description...',
      '搜索标题、基准编号、工段、说明…'],
    ['Semua Section', 'All Sections', '所有工段'],
    ['Semua Status Ketersediaan', 'All Availability Status', '所有归档状态'],
    ['Sudah Terupload & Tersedia', 'Uploaded & Available', '已上传并生效'],
    ['Belum Ada / Gap (Perlu Diunggah)', 'Missing / Gap (Upload Required)', '尚未归档（需上传）'],
    ['No. Acuan', 'Ref. No.', '基准编号'],
    ['Judul Dokumen Wajib', 'Mandatory Document Title', '必备文档名称'],
    ['Departemen & Section', 'Department & Section', '部门与工段'],
    ['Status di Repositori', 'Status in Repository', '文档库归档状态'],
    ['Dokumen Terupload', 'Uploaded File', '已归档文件'],
    ['Unggah Sekarang', 'Upload Now', '立即上传'],
    ['Ubah Dokumen Master', 'Edit Master Document', '修改主控文档'],
    ['Tambah Dokumen Master Baru', 'Add New Master Document', '添加新主控文档'],
    ['Tetapkan dokumen wajib yang harus dimiliki per departemen & section.',
      'Specify mandatory documents required per department & section.',
      '设定各部门及工段必须具备的受控标准文档。'],
    ['Departemen & Section / Bagian', 'Department & Section', '部门与工段'],
    ['Section / Bagian', 'Section / Area', '工段 / 业务单元'],
    ['Detail & Klasifikasi Dokumen', 'Document Details & Classification', '文档详情与分类'],
    ['Nomor Dokumen Acuan (Rencana)', 'Planned Reference Number', '规划基准编号'],
    ['Judul / Nama Dokumen Wajib', 'Mandatory Document Title', '必备文档名称'],
    ['Keterangan / Dasar Regulasi / Kepatuhan', 'Regulatory Basis / Compliance Notes', '法规依据与合规说明'],
    ['Dokumen Wajib (Mandatory Kepatuhan / Regulasi)', 'Mandatory Document (Regulatory Compliance)', '必备文档（法规与体系强制）'],
    ['Simpan Dokumen Master', 'Save Master Document', '保存主控文档'],
    ['Hapus Dokumen Master', 'Delete Master Document', '删除主控文档'],
    ['Matriks Master List berhasil diekspor.', 'Master List matrix exported successfully.', '主控文档合规矩阵已成功导出。'],
    ['Kelola dokumen master', 'Manage master documents', '管理主控文档'],
    ['Hapus dokumen master', 'Delete master document', '删除主控文档']
  ];

  // ---------- Indeks kamus ----------
  const byId = new Map();   // kunci -> [en, zh]
  const exact = new Map();  // kunci tanpa placeholder
  const tpls = [];          // kunci dengan placeholder

  D.forEach(function (row) {
    const key = row[0];
    byId.set(key, [row[1], row[2]]);
    if (/\{#?\d\}/.test(key)) {
      const order = [];
      let re = '';
      let last = 0;
      const rx = /\{(#?)(\d)\}/g;
      let m;
      while ((m = rx.exec(key))) {
        re += escapeRe(key.slice(last, m.index)) + (m[1] ? '(\\d[\\d.,]*)' : '(.+?)');
        order.push({ num: !!m[1], idx: Number(m[2]) });
        last = m.index + m[0].length;
      }
      re += escapeRe(key.slice(last));
      tpls.push({ re: new RegExp('^' + re + '$'), order: order, out: [row[1], row[2]], len: key.length });
    } else {
      exact.set(key, [row[1], row[2]]);
    }
  });
  tpls.sort(function (a, b) { return b.len - a.len; });

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function langIdx(l) { return l === 'en' ? 0 : 1; }

  function lookup(core, l) {
    if (l === 'id') return null;
    const i = langIdx(l);
    const hit = exact.get(core);
    if (hit) return hit[i];
    for (let k = 0; k < tpls.length; k++) {
      const t = tpls[k];
      const m = core.match(t.re);
      if (!m) continue;
      const vals = {};
      t.order.forEach(function (o, n) {
        const raw = m[n + 1];
        vals[o.idx] = o.num ? raw : (lookup(raw, l) || raw); // parameter bebas ikut diterjemahkan jika dikenal
      });
      return t.out[i].replace(/\{(\d)\}/g, function (_, d) { return vals[d] !== undefined ? vals[d] : ''; });
    }
    return null;
  }

  // ---------- Bahasa aktif ----------
  let lang = 'id';
  try { const s = localStorage.getItem(STORE); if (LANGS[s]) lang = s; } catch (e) { /* abaikan */ }

  // t(): untuk teks yang dirangkai di JavaScript
  function t(key, params) {
    const e = byId.get(key);
    let s = (lang === 'id' || !e) ? key : e[langIdx(lang)];
    if (params) s = s.replace(/\{#?(\d)\}/g, function (_, d) { return params[d] !== undefined ? params[d] : ''; });
    return s;
  }

  // ---------- Penerjemah DOM ----------
  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'data-label'];
  const ATTR_SEL = ATTRS.map(function (a) { return '[' + a + ']'; }).join(',');
  const textRec = new WeakMap(); // node -> { src, out }
  const attrRec = new WeakMap(); // element -> { attr: { src, out } }

  function skipText(node) {
    const p = node.parentElement;
    if (!p) return true;
    const tag = p.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'TITLE') return true;
    return !!p.closest('.ms,[data-no-i18n],.doc-title,.doc-code,.fc-name');
  }

  function convert(src, l) {
    const core = src.replace(/\s+/g, ' ').trim();
    if (!core) return src;
    const tr = lookup(core, l);
    if (tr == null) return src;
    const lead = (src.match(/^\s*/) || [''])[0];
    const trail = (src.match(/\s*$/) || [''])[0];
    return lead + tr + trail;
  }

  function processText(node, force) {
    if (skipText(node)) return;
    const v = node.nodeValue;
    let rec = textRec.get(node);
    if (rec && v === rec.out) {
      if (!force) return;
    } else {
      rec = { src: v, out: v };
      textRec.set(node, rec);
    }
    const out = convert(rec.src, lang);
    rec.out = out;
    if (node.nodeValue !== out) node.nodeValue = out;
  }

  function processAttrs(el, force) {
    if (el.closest && el.closest('[data-no-i18n]')) return;
    let rec = attrRec.get(el);
    ATTRS.forEach(function (a) {
      if (!el.hasAttribute(a)) return;
      const v = el.getAttribute(a);
      if (!rec) { rec = {}; attrRec.set(el, rec); }
      let r = rec[a];
      if (r && v === r.out) {
        if (!force) return;
      } else {
        r = { src: v, out: v };
        rec[a] = r;
      }
      const out = convert(r.src, lang);
      r.out = out;
      if (v !== out) el.setAttribute(a, out);
    });
  }

  function walk(root, force) {
    if (!root) return;
    if (root.nodeType === 3) { processText(root, force); return; }
    if (root.nodeType !== 1) return;
    if (root.matches && root.matches(ATTR_SEL)) processAttrs(root, force);
    root.querySelectorAll(ATTR_SEL).forEach(function (el) { processAttrs(el, force); });
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const list = [];
    let n;
    while ((n = tw.nextNode())) list.push(n);
    list.forEach(function (node) { processText(node, force); });
  }

  const observer = new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      if (m.type === 'childList') m.addedNodes.forEach(function (n) { walk(n, false); });
      else if (m.type === 'characterData') processText(m.target, false);
      else if (m.type === 'attributes') processAttrs(m.target, false);
    });
  });

  // ---------- Pemilih bahasa ----------
  function updateSwitchers() {
    const cur = LANGS[lang];
    document.querySelectorAll('[data-lang-switch]').forEach(function (sw) {
      const img = sw.querySelector('[data-lang-current]');
      const code = sw.querySelector('[data-lang-code]');
      if (img) img.src = cur.flag;
      if (code) code.textContent = cur.short;
      sw.querySelectorAll('[data-lang]').forEach(function (b) {
        const on = b.dataset.lang === lang;
        b.classList.toggle('active', on);
        b.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    });
  }

  function closeMenus() {
    document.querySelectorAll('[data-lang-switch] .lang-menu').forEach(function (m) { m.classList.add('hidden'); });
    document.querySelectorAll('[data-lang-switch] .lang-btn').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
  }

  function setLang(l) {
    if (!LANGS[l]) return;
    lang = l;
    try { localStorage.setItem(STORE, l); } catch (e) { /* abaikan */ }
    document.documentElement.lang = LANGS[l].html;
    document.documentElement.setAttribute('data-lang', l);
    walk(document.body, true);
    updateSwitchers();
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: l } }));
  }

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-lang-switch] .lang-btn');
    const opt = e.target.closest('[data-lang-switch] [data-lang]');
    if (opt) { setLang(opt.dataset.lang); closeMenus(); return; }
    if (btn) {
      const menu = btn.parentElement.querySelector('.lang-menu');
      const willOpen = menu.classList.contains('hidden');
      closeMenus();
      if (willOpen) { menu.classList.remove('hidden'); btn.setAttribute('aria-expanded', 'true'); }
      return;
    }
    closeMenus();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenus(); });

  // ---------- Mulai ----------
  document.documentElement.lang = LANGS[lang].html;
  document.documentElement.setAttribute('data-lang', lang);
  walk(document.body, true);
  updateSwitchers();
  observer.observe(document.body, {
    subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS
  });

  window.I18N = { t: t, setLang: setLang, getLang: function () { return lang; }, langs: LANGS };
})();
