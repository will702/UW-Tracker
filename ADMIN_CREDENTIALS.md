# UW Tracker - Admin Credentials

## Akses Admin Panel

**URL Admin Panel:** `/admin` (atau klik tombol Settings di homepage)

**Password Admin:** `UW2024$Admin#Secure`

## Fitur Admin Panel

1. **Tambah Record Baru**
   - Form lengkap untuk menambah data IPO baru
   - Support multiple underwriters (pisah dengan koma)
   - Validasi lengkap untuk semua field

2. **Bulk Upload**
   - Upload multiple records sekaligus dalam format JSON
   - Sample JSON generator tersedia
   - Error reporting untuk data yang gagal diupload

3. **Kelola Data**
   - Lihat dan search existing records
   - Delete records dengan confirmation dialog
   - Pagination dan search functionality

## Keamanan

- Password protection untuk akses admin
- Confirmation dialog untuk delete operations
- Session-based authentication (logout tersedia)
- Error handling untuk unauthorized access

## Catatan Production

- Password sudah diubah dari demo password
- Console logs sudah dinonaktifkan
- Ready untuk deployment
- Backup database sebelum memberikan akses admin ke user lain

## Backup & Recovery

Sebelum deployment, pastikan:
1. Database backup tersedia
2. Environment variables sudah dikonfigurasi dengan benar
3. CORS settings sudah sesuai untuk domain production