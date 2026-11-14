# PANI DOCO SYSTEM (PANIDOS) - Document Control System (Serverless)

Google Drive (file) + Google Sheets (database) + Google Apps Script (API) + GitHub Pages (tampilan).
Fitur: login pengguna, peran (Admin/Editor/Viewer), riwayat revisi, jejak audit, master departemen.

## File
- `Code.gs`   : Backend Apps Script
- `index.html`, `style.css`, `script.js` : Frontend

## Sheet (dibuat otomatis)
| Sheet | Fungsi |
|---|---|
| Documents | Satu baris per versi/revisi dokumen (+ catatan revisi, pengunggah, pengubah terakhir) |
| DocTypes | Master tipe dokumen (Code, Name) |
| Departments | Master departemen (Code, Name, Active) |
| Users | Akun: Username, FullName, Email, Role, Departments, hash password, Active, LastLogin |
| AuditLog | Siapa melakukan apa & kapan (login, unggah, revisi, edit, hapus, kelola user) |

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
