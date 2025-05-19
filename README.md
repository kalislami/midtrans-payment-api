# Midtrans Payment API

API sederhana untuk integrasi Midtrans payment gateway menggunakan Node.js, TypeScript, dan Sequelize (SQLite). Sudah termasuk fitur transaksi, callback, status update, dan dockerized.

## Fitur

- Create transaction dengan berbagai payment type (bank transfer, gopay, qris)
- Handle payment callback dari Midtrans
- Cek status transaksi
- Batalkan dan expire transaksi (sandbox mode)
- Simpan data transaksi ke SQLite
- Dockerized untuk kemudahan deployment dan development

## Teknologi

- Node.js + TypeScript
- Express.js
- Sequelize ORM dengan SQLite
- Midtrans Node.js SDK (midtrans-client)
- Jest untuk unit testing
- Docker & Docker Compose
- Swagger

---

### Jalankan migrasi database

```bash
npm run migrate
```

---

## Menjalankan Aplikasi

### Dengan Docker

```bash
docker-compose up --build
```

Layanan akan tersedia di: `http://localhost:3000`

### Tanpa Docker (lokal)

```bash
npm run dev
```

---

## 📦 Struktur Folder

```
src/
├── app.ts                  # setup express
├── server.ts               # entrypoint
├── swagger.ts              # config swagger
├── routes/                 # endpoint logic
├── midtrans/               # midtrans service
├── models/                 # define Sequelize model
├── types/                  # type declaration
│   └── midtrans-client.d.ts
test/                       # unit test features
```

---

## 🧪 Menjalankan Unit Test

```bash
npm test
```

Test dilakukan menggunakan Jest + Supertest.

---

## 🛠 Build (Production)

```bash
npm run build
```

## ✨ Credits

Dibuat oleh Kamal sebagai latihan integrasi pembayaran menggunakan Midtrans dengan best practices REST API dan testing.

```