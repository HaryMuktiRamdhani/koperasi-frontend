# Stokpedia Frontend

Frontend dari aplikasi **Stokpedia**, yaitu sistem informasi koperasi sekolah berbasis web yang menyediakan berbagai fitur untuk mendukung pengelolaan operasional koperasi. Frontend ini berfungsi sebagai antarmuka pengguna untuk mengakses seluruh fitur aplikasi, mulai dari login, dashboard, pengelolaan data, transaksi koperasi, manajemen pengguna, hingga pengaturan akun dan aplikasi.

Frontend Stokpedia dikembangkan menggunakan React dengan Tailwind CSS sebagai framework styling. Aplikasi ini dikembangkan secara terpisah dari backend dan berkomunikasi melalui REST API untuk mengambil, mengirim, dan mengelola data aplikasi.

## Deskripsi Proyek

Stokpedia merupakan sistem informasi koperasi sekolah berbasis web yang memiliki dua jenis pengguna utama, yaitu admin dan staff.

Frontend Stokpedia menyediakan antarmuka bagi admin dan staff untuk mengelola operasional koperasi, mulai dari data siswa, kelas, jurusan, barang, tagihan, pembayaran, hingga berbagai fitur administrasi lainnya. Kedua jenis pengguna memiliki akses ke fitur yang sama, dengan perbedaan bahwa akun admin utama (super admin) tidak dapat dihapus melalui aplikasi.

Frontend dan backend dikembangkan secara terpisah dengan komunikasi menggunakan REST API.

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
| SheetJS (`xlsx`) | Membaca, memvalidasi, membuat template, dan menulis file Excel |
| React DOM | Render aplikasi React ke halaman browser |

## Fitur Frontend

### 1. Dashboard

- Menampilkan ringkasan informasi koperasi dari endpoint dashboard.
- Menampilkan statistik utama seperti jumlah siswa, barang, tagihan, dan pemasukan.
- Menampilkan informasi status pembayaran dan data ringkasan transaksi yang dikirim backend.
- Menyediakan tautan menuju halaman data dan transaksi terkait.

### 2. Master Data

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
- Mengekspor seluruh data siswa terbaru ke file `data_siswa.xlsx`, bukan hanya data pada halaman aktif.
- Mengunduh template `template_data_siswa.xlsx` dengan header `NIS`, `Nama Siswa`, `Kelas`, `Jurusan`, `Angkatan`, dan `Status`.
- Menyediakan worksheet petunjuk pengisian pada template Excel.
- Mengimpor file `.xlsx` melalui preview sebelum penyimpanan.
- Memvalidasi kolom wajib, format tahun angkatan, status, duplikasi NIS, kelas, jurusan, dan relasi kelas-jurusan.
- Mencocokkan jurusan berdasarkan nama atau kode dari data master yang dimuat melalui API.

#### Barang

- Menampilkan daftar barang koperasi.
- Menambah, mengubah, dan menghapus data barang.
- Menampilkan informasi harga dan status barang.

### 3. Transaksi

#### Tagihan

- Menampilkan data tagihan beserta relasi siswa dan barang yang diperlukan.
- Menambah dan mengubah tagihan.
- Mendukung pembuatan tagihan untuk beberapa siswa.
- Menghapus tagihan melalui dialog konfirmasi.
- Menyediakan pencarian, filter status dan sorting.
- Menampilkan tanggal tagihan, jatuh tempo, jumlah, dan status pembayaran.

#### Pembayaran

- Menampilkan riwayat pembayaran yang tersimpan.
- Memuat daftar tagihan yang dapat dipilih untuk pembayaran.
- Membuat pembayaran baru melalui endpoint backend.
- Menampilkan informasi tagihan, siswa, barang, tanggal pembayaran, jumlah, dan status yang tersedia dari response API.

### 4. Pengguna

- Menampilkan daftar akun pengguna.
- Menampilkan nama, email, role, dan status akun.
- Menambah akun pengguna melalui modal dua langkah.
- Melakukan validasi dasar email, password, nama, dan username.
- Mengecek ketersediaan username melalui backend.
- Mengubah data pengguna yang tersedia melalui fitur edit.
- Mengaktifkan atau menonaktifkan status pengguna.
- Mempertahankan perlindungan backend untuk akun admin aktif terakhir.
- Tidak menampilkan password atau hash password dari response pengguna.

### 5. Settings

Halaman Settings memiliki sidebar pengaturan dan route berikut:

#### Profil

- Menampilkan foto profil, nama lengkap, username, dan bio.
- Menyediakan modal untuk mengedit nama lengkap, username, dan bio.
- Menyediakan penggantian foto

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

### Keterangan

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


## Integrasi Backend

Frontend Stokpedia berkomunikasi dengan backend melalui REST API menggunakan Axios.

Konfigurasi komunikasi API menggunakan environment variable `VITE_API_URL` dengan `http://localhost:5001/api` sebagai URL default untuk development.

Beberapa kelompok endpoint yang digunakan meliputi:

| **Modul** | **Fungsi** |
| --- | --- |
| Authentication | Registrasi dan Login Pengguna |
| Dashboard | Mengambil ringkasan informasi dan statistik koperasi |
| Jurusan | Mengambil dan mengelola data jurusan |
| Kelas | Mengambil dan mengelola data kelas serta relasi jurusan |
| Siswa | Mengambil dan mengelola data siswa |
| Barang | Mengambil dan mengelola data barang koperasi |
| Tagihan | Mengambil dan mengelola data tagihan siswa |
| Pembayaran | Mengelola transaksi dan riwayat pembayaran |
| Pengguna | Mengambil dan mengelola akun serta status pengguna |
| Profil | Mengakses dan mengelola informasi profil pengguna |
| Keamanan | Mengelola pengaturan keamanan dan kebijakan password |
| Sesi Aktif | Mengakses dan mengelola sesi perangkat pengguna |
| Profil Koperasi | Mengambil dan memperbarui informasi profil koperasi |
| Pengaturan | Mengambil dan mengelola konfigurasi aplikasi |

Frontend menggunakan service API untuk mengirim request dan menerima respons dari backend. Token JWT disertakan pada request yang membutuhkan autentikasi melalui header `Authorization` dengan skema `Bearer`.

Selain itu, frontend menyediakan penanganan respons API, termasuk pengelolaan sesi ketika token tidak lagi valid.

### Import dan Export Excel

Stokpedia menyediakan fitur import dan export data siswa menggunakan library SheetJS (`xlsx`) di browser.

- Export data siswa dalam format `.xlsx` dengan mengambil seluruh data terbaru dari backend.
- Menyediakan template Excel beserta petunjuk pengisian.
- Import data melalui proses preview dan validasi sebelum dikirim ke backend.
- Memvalidasi format NIS, nama siswa, kelas, jurusan, angkatan, status, serta duplikasi data.
- Mengirim baris data yang valid melalui REST API untuk disimpan ke database.



## Pengelolaan Data pada Browser

Frontend Stokpedia menggunakan LocalStorage dan SessionStorage untuk menyimpan beberapa informasi aplikasi.

| **Storage** | **Key** | **Fungsi** |
| --- | --- | --- |
| LocalStorage | `token` | Menyimpan token autentikasi pengguna |
| LocalStorage | `user` | Menyimpan informasi pengguna |
| LocalStorage | `koperasi.settings.appearance` | Menyimpan preferensi tampilan aplikasi |
| LocalStorage | `koperasi.settings.language` | Menyimpan preferensi bahasa |

Selain itu, frontend menggunakan React Context untuk mengelola state aplikasi seperti tema, bahasa, identitas koperasi, dan tampilan sidebar.

Data yang disimpan di browser digunakan untuk mendukung kebutuhan aplikasi. Data utama seperti siswa, kelas, jurusan, barang, tagihan, pembayaran, pengguna, serta pengaturan tetap dikelola melalui backend.

## Autentikasi dan Proteksi Halaman

Frontend Stokpedia menggunakan sistem autentikasi berbasis JWT untuk mengatur akses pengguna ke dalam aplikasi.

1. Pengguna login menggunakan email dan password.
2. Frontend mengirim data login ke backend melalui API.
3. Jika login berhasil, token dan informasi pengguna disimpan di LocalStorage.
4. Halaman aplikasi dilindungi berdasarkan status login dan hak akses pengguna.
5. Pengguna dapat keluar dari aplikasi melalui fitur logout.

Stokpedia memiliki dua role pengguna, yaitu `admin` dan `staff`. Keduanya dapat menggunakan fitur aplikasi sesuai hak akses yang diberikan.

## Theme dan Tampilan Aplikasi

- Tampilan aplikasi dibuat menggunakan Tailwind CSS.
- Tersedia tiga pilihan tema, yaitu Terang, Gelap, dan Sistem.
- Pengaturan tema akan tersimpan sehingga tetap digunakan setelah halaman dimuat ulang.
- Layout aplikasi terdiri dari sidebar, header, dan area konten utama.
- Komponen antarmuka dibuat agar dapat digunakan kembali pada berbagai halaman.
- Ikon aplikasi menggunakan Lucide React.

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

Project Stokpedia merupakan aplikasi frontend yang dirancang untuk membantu pengelolaan data dan kegiatan koperasi sekolah.