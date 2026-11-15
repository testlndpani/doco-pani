# PANI DOCO SYSTEM (PANIDOS) - Document Control System (Serverless)

Google Drive (file) + Google Sheets (database) + Google Apps Script (API) + GitHub Pages (tampilan).
Fitur: login pengguna, peran (Admin/Editor/Viewer), dashboard visual grafik & analitik interaktif, riwayat revisi, jejak audit, master departemen.

## Dashboard Grafik & Analitik
Halaman khusus **Grafik & Analitik** menampilkan analisis visual seluruh dokumen terkendali:
- **6 Metrik KPI**: Total dokumen, persentase dokumen aktif/terkendali, dokumen tahap sosialisasi, total orang tersosialisasi, dokumen butuh tindakan (draft/approved), dan tingkat revisi dokumen.
- **Alur Siklus Dokumen**: Visualisasi tahapan dokumen (Draft → Approved → Sosialisasi → Aktif → Obsolete).
- **Donut Chart**: Proporsi status dokumen dengan persentase kepatuhan/terkendali di tengah.
- **Stacked Bar Chart**: Sebaran dokumen per departemen berlapis warna status dokumen.
- **Column Bar Chart**: Distribusi dokumen berdasarkan tipe dokumen (SOP, WI, IM, FRM, POL, SK).
- **Leaderboard Capaian Sosialisasi**: Peringkat departemen berdasarkan jumlah karyawan yang telah menerima sosialisasi.
- **Top 5 Dokumen Tersosialisasi**: Tabel peringkat 5 dokumen dengan jangkauan sosialisasi tertinggi.
- Dibuat menggunakan SVG murni tanpa library eksternal (ringan, cepat, responsif, dan berfungsi offline).

## Bahasa
Tiga bahasa (Indonesia, English, 中文) dengan pemilih bendera di samping ikon profil dan di halaman login. Pilihan tersimpan di browser. Kamus terjemahan ada di `i18n.js` (kolom: Indonesia, English, 中文); teks baru yang tampil di antarmuka cukup ditambahkan sebagai baris baru di kamus tersebut.

## File
- `Code.gs`   : Backend Apps Script
- `index.html`, `style.css`, `script.js`, `i18n.js`, `flag-*.svg`, logo & foto : Frontend

## Sheet (dibuat otomatis)
| Sheet | Fungsi |
|---|---|
| Documents | Satu baris per versi/revisi dokumen (+ catatan revisi, pengunggah, pengubah terakhir) |
| DocTypes | Master tipe dokumen (Code, Name) |
| Departments | Master departemen (Code, Name, Active) |
| Users | Akun: Username, FullName, Email, Role, Departments, hash password, Active, LastLogin |
| AuditLog | Siapa melakukan apa & kapan (login, unggah, revisi, edit, hapus, kelola user) |
| Letters | Registrasi penomoran & arsip surat keluar tervalidasi (ID, No. Surat, Entitas, Jenis, Dept, Berkas, Status) |
| Entities | Master entitas perusahaan (MGR, PANI, PETS, GSM, dll.) |
| LetterTypes | Master jenis surat resmi (SP, SE, ST, SK, IM, EXT, BA, UND, PKS, dll.) |
| MasterList | Matriks acuan dokumen wajib per departemen, section, dan tipe dokumen beserta pelacakan ketersediaan di repositori |

## Modul Master List Dokumen & Matriks Kepatuhan
Halaman **Master List Dokumen** berfungsi sebagai register acuan dokumen wajib yang harus dimiliki perusahaan:
- **Matriks per Departemen & Section**: Menetapkan daftar dokumen acuan wajib (SOP, WI, Formulir, Kebijakan) per bagian/sub-departemen (e.g. K3 Operasi, Lingkungan Hidup, Pit Operation, Mine Planning, HRD & Training, Plant Processing).
- **Pelacakan Ketersediaan Terintegrasi dengan Repositori**:
  - Sistem otomatis memeriksa repositori dokumen: mana dokumen yang **Sudah Terupload & Aktif** (badge hijau lengkap dengan tautan berkas Drive dan revisi terkini), dan mana yang **Belum Ada / Gap** (badge merah).
  - Untuk dokumen yang berstatus **Belum Ada (Gap)**, terdapat tombol **"Unggah Sekarang"** yang langsung membuka modal unggah repositori dengan data Departemen, Tipe, Nomor Acuan, dan Judul yang sudah terisi otomatis (*pre-filled*).
- **Dashboard Kepatuhan & Gap Analysis**: Metrik total dokumen wajib, jumlah terupload, sisa gap, persentase kepatuhan (*compliance rate*), serta bilah ringkasan capaian per departemen (*compliance strip*).
- **Ekspor Matriks CSV**: Pengunduhan matriks pemenuhan dokumen untuk keperluan audit ISO/SMKP/regulasi pertambangan.

## Modul Penomoran & Registrasi Surat Keluar (Surat Pemberitahuan dll.)
Halaman terpisah **Penomoran & Surat** mengatur siklus tertib administrasi persuratan resmi perusahaan:
1. **Pendaftaran Nomor Surat**: Pemohon memilih kode/nama entitas, departemen, jenis surat, tanggal, perihal, dan pihak tujuan.
2. **Penomoran Otomatis**: Sistem secara otomatis meng-generate nomor urut 3-digit berurutan per tahun kalender dengan format standar korporat:
   `[NomorUrut]/[Entitas]-[JenisSurat]/[Departemen]/[BulanRomawi]/[Tahun]`
   *(Contoh: `001/MGR-SP/SHE/XI/2026`)*
3. **Status Awal (Menunggu Upload / Pending)**: Nomor surat telah dipesan/didaftarkan tetapi belum sah sebagai surat resmi yang berlaku.
4. **Validasi & Unggah Berkas**: Setelah surat fisik dicetak, dibubuhi nomor, dan ditandatangani, pengguna wajib mengunggah berkas (PDF / Docx / Scan) ke sistem.
   - Berkas otomatis tersimpan di folder Google Drive: `PANIDOS/Surat_Keluar/[KodeEntitas]/[Tahun]/`.
   - Status surat resmi berubah menjadi **Tercatat & Valid**.
5. Dilengkapi papan statistik KPI (Total, Menunggu Upload, Tercatat & Valid, Bulan Berjalan), fitur 1-klik salin nomor surat, filter multi-kriteria, pembatalan nomor surat, dan jejak audit otomatis.

## Status dokumen
| Status | Arti |
|---|---|
| Draft (Develop) | Masih disusun / dalam pengembangan |
| Full Approved | Sudah disetujui penuh, belum disosialisasikan |
| Sosialisasi | Sedang disosialisasikan; isi **jumlah orang tersosialisasi** |
| Aktif (Berlaku) | Dokumen berlaku (satu versi Aktif per nomor dokumen) |
| Obsolete | Tidak berlaku |

Jumlah orang tersosialisasi disimpan di kolom `SocializedCount` (sheet Documents, ditambahkan otomatis) dan tampil di tabel, dashboard, riwayat, serta ekspor CSV.

## Peran
- **Admin**: semua aksi, hapus dokumen, kelola pengguna/departemen, lihat Jejak Audit.
- **Editor**: unggah/edit/terbitkan revisi hanya untuk departemen yang diizinkan.
- **Viewer**: hanya melihat, pratinjau, dan melihat riwayat.

## Pemasangan
1. Buat folder di Google Drive, salin Folder ID.
2. Buat Google Sheet kosong -> Extensions > Apps Script -> tempel `Code.gs`.
3. Isi `FOLDER_ID` dan `INITIAL_ADMIN.password` (min. 8 karakter) di bagian atas `Code.gs`.
4. Pilih fungsi `setupInitialAdmin` -> Run -> setujui izin (Advanced > Go to project > Allow).
   Semua sheet dibuat otomatis + akun admin pertama. Setelah itu hapus password awal dari kode.
5. Time zone: Project Settings -> (GMT+08:00) Makassar.
6. Deploy > New deployment > Web app: Execute as **Me**, Who has access **Anyone**. Salin Web App URL.
7. Isi `CONFIG.API_URL` di `script.js`, unggah 3 file frontend ke GitHub, aktifkan Pages.
8. Login sebagai admin -> Pengguna & Departemen -> tambah pengguna & sesuaikan departemen.

Setiap kali `Code.gs` diubah: Deploy > Manage deployments > pensil > Version: New version.

## Upgrade dari versi lama
Tempel `Code.gs` baru, jalankan `setupInitialAdmin` sekali. Kolom baru ditambahkan ke sheet `Documents` otomatis;
data lama tetap terbaca. Departemen lama (teks bebas) tetap tampil dan dapat dirapikan lewat menu Edit.

## Catatan keamanan
- Password disimpan langsung (plaintext); sesi login berlaku 6 jam.
- Semua aksi divalidasi di server (bukan hanya disembunyikan di tampilan).
- File di Drive dibagikan "siapa pun dengan link" (agar pratinjau berfungsi); link tidak ditampilkan tanpa login,
  tetapi siapa pun yang memegang link file dapat membukanya.
