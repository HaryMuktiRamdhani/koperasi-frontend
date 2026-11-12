# Koperasi Sekolah Frontend

Frontend untuk Sistem Informasi Koperasi Sekolah. Aplikasi ini menyediakan antarmuka web untuk login, dashboard, pengelolaan data master, transaksi koperasi, manajemen pengguna, serta pengaturan akun dan aplikasi.

Frontend dikembangkan sebagai aplikasi React terpisah dari backend dan berkomunikasi melalui REST API.

## Deskripsi Proyek

Koperasi Sekolah adalah sistem informasi berbasis web yang membantu pengelolaan operasional koperasi sekolah secara terpusat. Aplikasi ini digunakan untuk mengelola data siswa, kelas, jurusan, barang, tagihan, dan pembayaran.

Frontend ditujukan untuk pengguna internal koperasi sekolah, terutama:

- Admin, yang dapat mengakses manajemen pengguna dan fitur administrasi yang memerlukan hak akses admin.
- Staff, yang dapat menggunakan fitur operasional sesuai hak akses yang diberikan backend.

Frontend dan backend dikembangkan dalam project terpisah. Frontend menangani tampilan, navigasi, state antarmuka, validasi input dasar, serta pengiriman request HTTP. Backend menangani autentikasi, validasi utama, hak akses, pemrosesan bisnis, dan penyimpanan data.

## Teknologi yang Digunakan

| Teknologi | Fungsi |
| --- | --- |
| React 19 | Membangun antarmuka berbasis komponen |
| TypeScript 6 | Menambahkan pemeriksaan tipe pada source code frontend |
| Vite 8 | Development server dan proses build |
| Tailwind CSS 4 | Styling dan layout antarmuka |
| React Router DOM 7 | Routing halaman dan proteksi navigasi |
| Axios | HTTP client untuk komunikasi dengan REST API |
| Lucide React | Ikon pada navigasi dan komponen antarmuka |
| React DOM | Render aplikasi React ke halaman browser |

## Fitur Frontend

### 1. Authentication

- Login menggunakan email dan password melalui endpoint backend.
- Menyimpan JWT dan informasi pengguna setelah login berhasil.
- Mendukung alur verifikasi autentikasi dua faktor apabila backend memintanya.
- Menyediakan input kode autentikasi atau recovery code pada tahap verifikasi dua faktor.
- Menambahkan token JWT sebagai `Bearer` token pada request API yang membutuhkan autentikasi.
- Mengarahkan pengguna yang belum memiliki token ke halaman login.
- Menangani sesi yang kedaluwarsa atau tidak aktif dengan menghapus token dan informasi pengguna lokal, lalu mengarahkan kembali ke login.
- Menyediakan logout yang memanggil backend sebelum membersihkan data autentikasi browser.

### 2. Dashboard

- Menampilkan ringkasan informasi koperasi dari endpoint dashboard.
- Menampilkan statistik utama seperti jumlah siswa, barang, tagihan, dan pemasukan.
- Menampilkan informasi status pembayaran dan data ringkasan transaksi yang dikirim backend.
- Menyediakan tautan menuju halaman data dan transaksi terkait.
- Mengikuti tema dan format mata uang yang aktif pada aplikasi.

### 3. Master Data

#### Jurusan

- Menampilkan daftar jurusan.
- Menambah, mengubah, dan menghapus data jurusan.
- Menampilkan status jurusan dan menggunakan dialog konfirmasi untuk penghapusan.

#### Kelas

- Menampilkan daftar kelas.
- Menambah, mengubah, dan menghapus kelas.
- Menghubungkan kelas dengan jurusan melalui data yang dimuat dari backend.

#### Siswa

- Menampilkan daftar siswa.
- Menambah, mengubah, dan menghapus data siswa.
- Menggunakan data kelas dan jurusan sebagai relasi pada form siswa.
- Menyediakan pencarian, filter, dan tampilan status sesuai implementasi halaman.
- Menyediakan halaman detail siswa melalui route `/students/:id`.

#### Barang

- Menampilkan daftar barang koperasi.
- Menambah, mengubah, dan menghapus data barang.
- Menampilkan informasi harga dan status barang.
- Memformat nilai harga berdasarkan pengaturan bahasa yang aktif.

### 4. Transaksi

#### Tagihan

- Menampilkan data tagihan beserta relasi siswa dan barang yang diperlukan.
- Menambah dan mengubah tagihan.
- Mendukung pembuatan tagihan untuk beberapa siswa.
- Menghapus tagihan melalui dialog konfirmasi.
- Menyediakan pencarian, filter status, sorting, dan pagination.
- Menampilkan tanggal tagihan, jatuh tempo, jumlah, dan status pembayaran.

#### Pembayaran

- Menampilkan riwayat pembayaran yang tersimpan.
- Memuat daftar tagihan yang dapat dipilih untuk pembayaran.
- Membuat pembayaran baru melalui endpoint backend.
- Menampilkan informasi tagihan, siswa, barang, tanggal pembayaran, jumlah, dan status yang tersedia dari response API.
- Memformat tanggal dan nominal pembayaran sesuai pengaturan aplikasi.

### 5. Pengguna

- Menampilkan daftar akun pengguna.
- Menampilkan nama, email, role, dan status akun.
- Menambah akun pengguna melalui modal dua langkah.
- Melakukan validasi dasar email, password, nama, dan username.
- Mengecek ketersediaan username melalui backend.
- Mengubah data pengguna yang tersedia melalui fitur edit.
- Mengaktifkan atau menonaktifkan status pengguna.
- Mempertahankan perlindungan backend untuk akun admin aktif terakhir.
- Membatasi route `/users` untuk role `admin`.
- Tidak menampilkan password atau hash password dari response pengguna.

### 6. Settings

Halaman Settings memiliki sidebar pengaturan dan route berikut:

#### Profil

- Menampilkan foto profil, nama lengkap, username, dan bio.
- Menyediakan modal untuk mengedit nama lengkap, username, dan bio.
- Mengecek ketersediaan username.
- Menyediakan penggantian foto dengan preview dan crop square.
- Mempertahankan proses hapus akun dengan konfirmasi username dan password.

#### Keamanan

- Menyediakan pengaturan keamanan sesi.
- Menyediakan pengaturan kebijakan password sesuai data dari backend.
- Menyediakan modal untuk mengganti password menggunakan password lama, password baru, dan konfirmasi password.
- Menyediakan kontrol tampil/sembunyikan untuk input password.

#### Sesi Aktif

- Menampilkan sesi perangkat yang sedang atau pernah aktif sesuai response backend.
- Menampilkan metadata sesi seperti perangkat, browser, sistem operasi, waktu login, dan aktivitas terakhir jika tersedia.
- Memungkinkan pencabutan satu sesi atau seluruh sesi lain.

#### Tampilan

- Mempertahankan pilihan tema Terang, Gelap, dan Sistem.
- Menerapkan perubahan tema secara langsung.

#### Bahasa & Regional

- Menyediakan pemilihan bahasa aplikasi Bahasa Indonesia atau English.
- Menyimpan pilihan bahasa pada browser.
- Menyediakan fungsi terjemahan dan formatter yang digunakan oleh halaman lain.

## Struktur Folder

Struktur utama frontend di bawah ini tidak memasukkan `node_modules` dan `dist` karena keduanya merupakan folder hasil instalasi atau build.

```text
frontend/
├── dokumentasi/
│   └── setup_frontend.md
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   └── logo smk 1 cisarua remove bg.png
├── src/
│   ├── components/
│   │   ├── settings/
│   │   ├── ConfirmModal.tsx
│   │   ├── IconBadge.tsx
│   │   ├── PageHeader.tsx
│   │   ├── SessionTimeoutMonitor.tsx
│   │   └── Sidebar.tsx
│   ├── context/
│   │   ├── CooperativeContext.tsx
│   │   ├── LanguageContext.tsx
│   │   ├── SidebarContext.tsx
│   │   └── ThemeContext.tsx
│   ├── layouts/
│   │   └── DashboardLayout.tsx
│   ├── pages/
│   │   ├── Bill.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Help.tsx
│   │   ├── Item.tsx
│   │   ├── Jurusan.tsx
│   │   ├── Kelas.tsx
│   │   ├── Login.tsx
│   │   ├── Payment.tsx
│   │   ├── Profile.tsx
│   │   ├── Settings.tsx
│   │   ├── Student.tsx
│   │   ├── StudentDetail.tsx
│   │   └── Users.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── cooperativeStorage.ts
│   │   ├── languageStorage.ts
│   │   ├── settingsService.ts
│   │   └── settingsStorage.ts
│   ├── utils/
│   │   ├── classFilters.ts
│   │   └── studentFilters.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts
```

### Keterangan Folder dan File Penting

| Folder/File | Keterangan |
| --- | --- |
| `src/pages/` | Halaman utama aplikasi dan fitur CRUD/transaksi |
| `src/components/` | Komponen UI yang digunakan kembali pada beberapa halaman |
| `src/components/settings/` | Komponen halaman dan kontrol Settings |
| `src/layouts/` | Layout aplikasi setelah pengguna berhasil login |
| `src/context/` | Context React untuk tema, bahasa, sidebar, dan profil koperasi |
| `src/services/` | Client API serta helper penyimpanan preferensi browser |
| `src/utils/` | Helper filter data siswa dan kelas |
| `src/App.tsx` | Browser router, route aplikasi, dan proteksi route berbasis token/role |
| `src/main.tsx` | Entry point dan provider utama aplikasi |
| `src/index.css` | Tailwind import, token warna aplikasi, styling global, dan dukungan dark mode |
| `vite.config.ts` | Konfigurasi Vite, React plugin, dan Tailwind plugin |
| `tsconfig.json` | Konfigurasi TypeScript bundler mode |
| `public/` | Asset statis seperti favicon, ikon, dan logo sekolah |
| `dokumentasi/` | Folder dokumentasi teknis tambahan yang tersedia di project |

Folder `src/types/` tidak tersedia pada struktur saat ini. Tipe dan interface digunakan secara lokal pada komponen, halaman, context, atau service yang membutuhkannya.

## Integrasi Backend

### Komunikasi API

Frontend menggunakan instance Axios pada `src/services/api.ts`. Base URL ditentukan dengan urutan berikut:

1. Nilai environment `VITE_API_URL`, jika tersedia.
2. `http://localhost:5001/api` sebagai fallback development.

Contoh konfigurasi saat menjalankan frontend:

```env
VITE_API_URL=http://localhost:5001/api
```

File `.env.example` tidak tersedia di frontend saat ini. Nilai environment di atas merupakan konfigurasi yang dibaca langsung oleh source code, bukan file konfigurasi tambahan yang sudah disediakan project.

### Kelompok Endpoint yang Digunakan

Endpoint berikut ditemukan dari pemakaian API pada source code frontend:

| Modul | Endpoint |
| --- | --- |
| Authentication | `POST /auth/login`, `POST /auth/2fa/verify`, `POST /auth/logout`, `POST /auth/session/keep-alive` |
| Dashboard | `GET /dashboard` |
| Jurusan | `GET /jurusan`, `POST /jurusan`, `PUT /jurusan/:id`, `DELETE /jurusan/:id` |
| Kelas | `GET /classes`, `POST /classes`, `PUT /classes/:id`, `DELETE /classes/:id` |
| Siswa | `GET /students`, `POST /students`, `PUT /students/:id`, `DELETE /students/:id` |
| Barang | `GET /items`, `POST /items`, `PUT /items/:id`, `DELETE /items/:id` |
| Tagihan | `GET /bills`, `POST /bills/bulk`, `PUT /bills/:id`, `DELETE /bills/:id` |
| Pembayaran | `GET /bills`, `GET /payments`, `POST /payments` |
| Pengguna | `GET /users`, `POST /users`, `PUT /users/:id`, `PATCH /users/:id/status` |
| Profil | `GET /profile`, `PATCH /profile`, `GET /profile/check-username`, `PATCH /profile/password`, `DELETE /profile` |
| Sesi | `DELETE /profile/sessions/:id`, `DELETE /profile/sessions` |
| Keamanan | `GET /security/settings`, `PUT /security/settings`, `GET /security/policy`, `PUT /security/policy`, `PATCH /profile/password` |
| Profil koperasi | `GET /cooperative-profile`, `PATCH /cooperative-profile` |
| Pengaturan backend | `GET /settings`, `PUT /settings/:key` tersedia melalui `settingsService.ts` |

### Token dan Penanganan Error

- Axios membaca token dari `localStorage` pada setiap request yang bukan request login atau verifikasi autentikasi.
- Token dikirim melalui header `Authorization: Bearer <token>`.
- Interceptor response mendeteksi response `401` yang menandakan sesi tidak valid atau kedaluwarsa.
- Untuk error sesi tersebut, token dan informasi user dihapus dari browser, pesan singkat disimpan sementara, lalu pengguna diarahkan ke `/`.
- Halaman menampilkan pesan error dari response API ketika tersedia, dengan fallback yang lebih umum untuk pengguna.

## Pengelolaan Data pada Browser

Frontend tidak menyimpan seluruh data koperasi di browser. Data master, transaksi, profil, sesi, dan pengaturan keamanan dimuat dari backend melalui API. Penyimpanan browser digunakan untuk autentikasi dan preferensi ringan.

| Storage | Key | Fungsi |
| --- | --- | --- |
| LocalStorage | `token` | JWT untuk request terautentikasi dan pemeriksaan route |
| LocalStorage | `user` | Informasi user hasil login yang diperlukan layout dan proteksi role |
| LocalStorage | `theme` | Key tema lama yang dibaca untuk kompatibilitas saat inisialisasi |
| LocalStorage | `koperasi.settings.appearance` | Preferensi tampilan yang dikelola `settingsStorage`, termasuk mode tema |
| LocalStorage | `koperasi.settings.language` | Preferensi bahasa dan nilai formatter regional |
| SessionStorage | `authMessage` | Pesan sementara setelah sesi berakhir atau token tidak valid |

React Context digunakan untuk state aplikasi yang perlu dibagikan:

- `ThemeContext`: mode tema dan preferensi tampilan.
- `LanguageContext`: bahasa, fungsi terjemahan, serta formatter angka, mata uang, tanggal, dan waktu.
- `CooperativeContext`: identitas koperasi dan logo dari backend.
- `SidebarContext`: state sidebar pada layout aplikasi.

## Autentikasi dan Proteksi Halaman

1. Pengguna memasukkan email dan password pada halaman `/`.
2. Frontend mengirim kredensial ke `POST /auth/login`.
3. Jika berhasil tanpa langkah tambahan, JWT dan data user disimpan pada LocalStorage.
4. Jika backend mengembalikan `requires2fa`, frontend menampilkan form verifikasi dan mengirim kode atau recovery code ke `POST /auth/2fa/verify`.
5. Semua route utama dirender di dalam `DashboardLayout` dan membutuhkan token LocalStorage.
6. Route `/users` memiliki pemeriksaan role tambahan dan hanya dapat dibuka oleh user dengan role `admin`.
7. Backend tetap menjadi sumber validasi utama untuk token, sesi, role, permission, dan akses data.
8. Logout memanggil endpoint backend, kemudian menghapus `token` dan `user` dari LocalStorage.
9. `SessionTimeoutMonitor` memeriksa keberlanjutan sesi dan membantu menjaga sesi aktif ketika diperlukan.

Role yang digunakan oleh frontend adalah `admin` dan `staff`, sesuai nilai yang dipakai pada form dan pemeriksaan route saat ini.

## Theme dan Tampilan Aplikasi

- Styling utama menggunakan utility class Tailwind CSS.
- Tema yang tersedia adalah Terang, Gelap, dan Sistem.
- `ThemeProvider` menyimpan mode tema dan menerapkan class `dark` pada elemen HTML.
- Mode Sistem mengikuti preferensi `prefers-color-scheme` browser.
- Preferensi tema disimpan melalui `settingsStorage` sehingga tetap tersedia setelah refresh.
- `index.css` menyediakan token warna permukaan, teks, border, primary teal, danger, dan styling select untuk light/dark mode.
- Layout utama terdiri dari `DashboardLayout`, `Sidebar`, header aplikasi, dan area konten route.
- Komponen seperti `PageHeader`, `SettingSection`, `SettingRow`, `Select`, `Toggle`, `ConfirmDialog`, dan `EmptyState` digunakan kembali pada halaman yang sesuai.
- Ikon antarmuka menggunakan Lucide React.

## Dokumentasi

Folder dokumentasi frontend yang tersedia adalah:

```text
frontend/dokumentasi/setup_frontend.md
```

File tersebut tersedia di project, tetapi saat ini belum berisi dokumentasi. Tidak terdapat dokumentasi teknis tambahan lain pada folder `docs/`.

## Menjalankan Project

Pastikan Node.js dan npm tersedia pada komputer pengembangan.

```bash
npm install
npm run dev
```

Untuk pemeriksaan TypeScript dan build production:

```bash
npm run build
```

Perintah `npm run build` menjalankan TypeScript check melalui `tsc`, kemudian membuat bundle production menggunakan Vite.

## Penutup

Project ini merupakan frontend application untuk Sistem Informasi Koperasi Sekolah. Frontend menyediakan antarmuka pengelolaan data, transaksi, akun, dan pengaturan yang terhubung ke backend melalui REST API, dengan dukungan autentikasi JWT, role admin/staff, tema light/dark, dan preferensi bahasa aplikasi.