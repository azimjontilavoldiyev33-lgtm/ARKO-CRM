# ARKO-CRM

Ishlab chiqarish korxonalari uchun CRM tizimi. Ustalar davomati, buyurtmalar, vazifalar, moliya va ombor boshqaruvini bir joyda birlashtiradi.

---

## Mundarija

- [Texnologiyalar](#texnologiyalar)
- [Loyiha tuzilmasi](#loyiha-tuzilmasi)
- [O'rnatish](#ornatish)
- [Muhit o'zgaruvchilari](#muhit-ozgaruvchilari)
- [Ma'lumotlar modellari](#malumotlar-modellari)
- [API endpointlar](#api-endpointlar)
- [Sahifalar](#sahifalar)
- [Autentifikatsiya](#autentifikatsiya)
- [Real-time yangilanish](#real-time-yangilanish)
- [PWA va Push bildirishnomalar](#pwa-va-push-bildirishnomalar)

---

## Texnologiyalar

| Texnologiya | Versiya | Maqsad |
|-------------|---------|--------|
| Next.js | 15+ | Full-stack framework (App Router) |
| TypeScript | 5+ | Tip xavfsizligi |
| MongoDB + Mongoose | — | Ma'lumotlar bazasi |
| NextAuth.js | v4 | Admin autentifikatsiyasi |
| Tailwind CSS | v4 | Stil |
| bcryptjs | — | Parol shifrlash |

---

## Loyiha tuzilmasi

```
ARKO-CRM/
├── app/
│   ├── admin/          # Admin paneli (himoyalangan, /login orqali kirish)
│   │   ├── page.tsx            # Dashboard
│   │   ├── workers/            # Ustalar
│   │   ├── orders/             # Buyurtmalar
│   │   ├── tasks/              # Vazifalar
│   │   ├── pipelines/          # Ishlab chiqarish zanjiri
│   │   ├── attendance/         # Davomat hisoboti
│   │   ├── salary/             # Oylik hisob-kitob
│   │   ├── inventory/          # Materiallar ombori
│   │   ├── kpi/                # KPI ko'rsatkichlari
│   │   ├── reports/            # Hisobotlar
│   │   └── office-location/    # Ofis joylashuvi
│   ├── ish/            # Ishchi mobil ilovasi (PWA)
│   │   ├── page.tsx            # Davomat + Vazifalar
│   │   ├── login/              # Ishchi kirish
│   │   └── profile/            # Profil
│   ├── monitor/
│   │   └── [department]/       # Seks ekrani (real-time monitor)
│   ├── api/
│   │   ├── workers/            # Ustalar CRUD
│   │   ├── orders/             # Buyurtmalar CRUD
│   │   ├── tasks/              # Vazifalar CRUD
│   │   ├── pipelines/          # Pipeline CRUD
│   │   ├── attendance/         # Davomat hisoboti
│   │   ├── finance/            # Moliyaviy yozuvlar
│   │   ├── materials/          # Materiallar ombori
│   │   ├── salary/             # Oylik hisob-kitob
│   │   ├── kpi/                # KPI
│   │   ├── mobile/             # Mobil ilova API
│   │   ├── sse/                # Server-Sent Events
│   │   ├── cron/               # Cron vazifalar
│   │   └── upload/             # Fayl yuklash
│   └── login/          # Admin kirish sahifasi
├── models/             # Mongoose sxemalari
├── lib/                # Yordamchi funksiyalar
└── middleware.ts       # /admin yo'llarini himoya qiladi
```

---

## O'rnatish

### Talablar

- Node.js 18+
- MongoDB (local yoki Atlas)

### Qadamlar

```bash
# 1. Repozitoriyani klonlash
git clone <repo-url>
cd ARKO-CRM

# 2. Paketlarni o'rnatish
npm install

# 3. Muhit o'zgaruvchilarini sozlash
cp .env.example .env.local
# .env.local faylini tahrirlang (pastga qarang)

# 4. Development serverni ishga tushirish
npm run dev
```

Brauzerda `http://localhost:3000` ni oching.

---

## Muhit o'zgaruvchilari

`.env.local` faylida quyidagi o'zgaruvchilar bo'lishi kerak:

```env
# MongoDB ulanish URL
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>

# NextAuth
NEXTAUTH_SECRET=<random-secret-string>
NEXTAUTH_URL=http://localhost:3000

# Birinchi admin (tizim birinchi marta ishga tushganda avtomatik yaratiladi)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Fayl saqlash (Cloudinary yoki S3)
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>

# Telegram bot (ixtiyoriy)
TELEGRAM_BOT_TOKEN=<token>

# Web Push bildirishnomalar (ixtiyoriy)
VAPID_PUBLIC_KEY=<public-key>
VAPID_PRIVATE_KEY=<private-key>
VAPID_EMAIL=mailto:admin@example.com
```

---

## Ma'lumotlar modellari

### Company (Korxona)
```typescript
{
  name: string         // Korxona nomi
  plan: 'basic'|'pro'  // Tarif rejasi
  isActive: boolean    // Faol/nofaol
  pointValue: number   // 1 KPI ball = necha so'm
}
```

### Admin
```typescript
{
  username: string     // Login
  passwordHash: string // bcrypt shifrlangan parol
  company: ObjectId    // Qaysi korxona (superadminda bo'sh)
  role: 'admin'|'superadmin'
  isActive: boolean
}
```

### Worker (Usta)
```typescript
{
  fullName: string       // To'liq ism
  phoneNumber: string    // Telefon (unique)
  position?: string      // Lavozim
  code?: string          // 4 xonali kirish kodi (mobil ilova uchun)
  deviceId?: string      // Biriktirilgan qurilma ID
  salary?: number        // Asosiy oylik (so'm)
  telegramChatId?: string
  company: ObjectId
}
```

### Order (Buyurtma)
```typescript
{
  title: string          // Buyurtma nomi
  clientName: string     // Mijoz ismi
  deadline: Date         // Muddat
  status: 'new'|'in_progress'|'completed'
  amount: number         // Summa (so'm)
  images: string[]       // Rasm URL'lar
  company: ObjectId
}
```

### Task (Vazifa)
```typescript
{
  title: string          // Vazifa nomi
  description?: string   // Tavsif
  order?: ObjectId       // Bog'liq buyurtma (ixtiyoriy)
  worker: ObjectId       // Mas'ul usta
  department?: string    // Bo'lim
  deadline: Date
  status: 'pending'|'in_progress'|'completed'
  startedAt?: Date
  completedAt?: Date
  completionPhoto?: string  // Tugatilganda rasm
  rating?: number
  pipelineId?: ObjectId
  stepIndex?: number
  company: ObjectId
}
```

### Pipeline (Ishlab chiqarish zanjiri)
```typescript
{
  title: string
  order?: ObjectId       // Bog'liq buyurtma
  steps: [{
    department: string   // Bo'lim nomi
    worker: ObjectId     // Mas'ul usta
    deadline: Date
    title: string
  }]
  currentStep: number    // Joriy qadam indeksi
  status: 'active'|'completed'
  company: ObjectId
}
```

### Attendance (Davomat)
```typescript
{
  worker: ObjectId
  checkIn: Date
  checkOut: Date | null
  location?: { latitude, longitude }       // Kelish koordinatasi
  checkOutLocation?: { latitude, longitude } // Ketish koordinatasi
  company: ObjectId
}
```

### Transaction (Moliyaviy yozuv)
```typescript
{
  type: 'income'|'expense'
  category: string   // 'material', 'ijara', 'avans', 'buyurtma', 'boshqa'
  amount: number
  note?: string
  date: Date
  order?: ObjectId   // Buyurtmadan avtomatik daromad bo'lsa
  company: ObjectId
}
```

### Material (Ombor materiali)
```typescript
{
  name: string
  unit: string       // o'lchov birligi (kg, m, dona ...)
  quantity: number   // joriy miqdor
  minQuantity: number // minimal chegara (kam bo'lsa ogohlantirish)
  company: ObjectId
}
```

---

## API endpointlar

### Admin API (`/api/*`)
Barcha admin API endpointlari NextAuth sessiyasi talab qiladi.

| Method | URL | Tavsif |
|--------|-----|--------|
| GET | `/api/workers` | Barcha ustalar |
| POST | `/api/workers` | Yangi usta qo'shish |
| GET | `/api/workers/:id` | Bitta usta |
| PUT | `/api/workers/:id` | Ustani tahrirlash |
| DELETE | `/api/workers/:id` | Ustani o'chirish |
| GET | `/api/orders` | Barcha buyurtmalar |
| POST | `/api/orders` | Yangi buyurtma |
| PUT | `/api/orders/:id` | Buyurtmani tahrirlash |
| DELETE | `/api/orders/:id` | Buyurtmani o'chirish |
| GET | `/api/tasks` | Barcha vazifalar |
| POST | `/api/tasks` | Yangi vazifa |
| PATCH | `/api/tasks/:id` | Vazifa holatini yangilash |
| DELETE | `/api/tasks/:id` | Vazifani o'chirish |
| GET | `/api/pipelines` | Barcha pipelinelar |
| POST | `/api/pipelines` | Yangi pipeline |
| GET | `/api/finance` | Moliyaviy yozuvlar |
| POST | `/api/finance` | Yangi yozuv qo'shish |
| GET | `/api/materials` | Materiallar ro'yxati |
| POST | `/api/materials` | Yangi material |
| GET | `/api/kpi` | KPI ma'lumotlari |
| GET | `/api/salary` | Oylik ma'lumotlar |
| GET | `/api/attendance/report` | Davomat hisoboti |
| GET | `/api/sse` | Real-time SSE stream |

### Mobil API (`/api/mobile/*`)
JWT token orqali himoyalangan (ishchilар uchun).

| Method | URL | Tavsif |
|--------|-----|--------|
| POST | `/api/mobile/auth/login` | Kod bilan kirish |
| GET | `/api/mobile/me` | Joriy ishchi ma'lumoti |
| POST | `/api/mobile/attendance/check-in` | Kelish qaydlash |
| POST | `/api/mobile/attendance/check-out` | Ketish qaydlash |
| GET | `/api/mobile/attendance/report` | Davomat tarixi |
| GET | `/api/mobile/tasks` | O'ziga tegishli vazifalar |
| PATCH | `/api/mobile/tasks/:id` | Vazifani boshlash/tugatish |
| GET | `/api/mobile/office-location` | Ofis koordinatasi |
| POST | `/api/mobile/push/subscribe` | Push obuna |
| GET | `/api/mobile/push/vapid` | VAPID public key |

---

## Sahifalar

### Admin paneli (`/admin`)
NextAuth orqali himoyalangan. `/login` sahifasida login/parol bilan kirish.

| URL | Tavsif |
|-----|--------|
| `/admin` | Dashboard — statistika va so'nggi vazifalar |
| `/admin/workers` | Ustalar ro'yxati, qo'shish, tahrirlash |
| `/admin/workers/:id` | Usta tafsilotlari |
| `/admin/orders` | Buyurtmalar boshqaruvi |
| `/admin/tasks` | Vazifalar boshqaruvi |
| `/admin/pipelines` | Ishlab chiqarish zanjiri |
| `/admin/attendance` | Davomat hisoboti |
| `/admin/salary` | Oylik hisob-kitob |
| `/admin/inventory` | Materiallar ombori |
| `/admin/kpi` | KPI ko'rsatkichlari |
| `/admin/reports` | Hisobotlar |
| `/admin/office-location` | Ofis joylashuvini sozlash |

### Ishchi ilovasi (`/ish`)
Mobil qurilmalar uchun optimallashtiring PWA.

| URL | Tavsif |
|-----|--------|
| `/ish/login` | 4 xonali kod bilan kirish |
| `/ish` | Davomat tugmalari + Vazifalar ro'yxati |
| `/ish/profile` | Profil ma'lumotlari |

### Monitor (`/monitor/:department`)
Seks ekranida ko'rsatish uchun. Bo'lim nomi URL'dan olinadi va shu bo'lim vazifalari real-time ko'rsatiladi.

---

## Autentifikatsiya

### Admin
- **Texnologiya:** NextAuth.js (Credentials provider)
- **Sessiya:** JWT, 24 soat amal qiladi
- **Himoya:** `middleware.ts` barcha `/admin/*` yo'llarini himoya qiladi
- **Rollar:** `admin` va `superadmin`

**Birinchi kirish:**
Tizim bo'sh bo'lsa `.env.local` dagi `ADMIN_USERNAME` / `ADMIN_PASSWORD` bilan birinchi superadmin avtomatik yaratiladi.

### Ishchi (Mobil)
- **Texnologiya:** Custom JWT (`lib/mobileAuth.ts`)
- **Kirish:** 4 xonali unikal kod (har bir ustaga avtomatik beriladi)
- **Qurilma biriktirish:** Birinchi kirishda `deviceId` saqlanadi — boshqa qurilmadan kirish bloklanadi

---

## Real-time yangilanish

`/api/sse` endpointi **Server-Sent Events** orqali barcha ulangan mijozlarga yangilanish xabari yuboradi.

```typescript
// Klient tomonda ulanish
const es = new EventSource('/api/sse');
es.onmessage = () => fetchData(); // Ma'lumotlarni qayta yuklash
```

Admin vazifa yaratganda yoki holatini o'zgartirganida:
- Admin dashboardi yangilanadi
- Ishchi telefoni yangilanadi
- Monitor ekrani yangilanadi

---

## PWA va Push bildirishnomalar

Ishchi ilovasi (`/ish`) to'liq PWA sifatida ishlaydi:
- **Manifest:** `app/manifest.ts`
- **Service Worker:** `app/_lib/ServiceWorkerRegister.tsx`
- **O'rnatish:** `InstallPWAButton` komponenti (faqat o'rnatilmagan holda ko'rinadi)

Push bildirishnomalar uchun **Web Push API** ishlatiladi:
1. Ishchi brauzerda obunani tasdiqlaydi
2. `PushSubscription` modelida saqlanadi
3. Admin vazifa berganda server push yuboradi

---

## Rollar va ruxsatlar

| Rol | Imkoniyatlar |
|-----|-------------|
| `superadmin` | Barcha kompaniyalar, cheklovsiz |
| `admin` | Faqat o'z kompaniyasi ma'lumotlari |
| Ishchi | Faqat o'ziga tegishli davomat va vazifalar |

---

## Ishlab chiqarish uchun deploy

```bash
# Build
npm run build

# Production serverni ishga tushirish
npm start
```

**Vercel'ga deploy qilish:**
1. GitHub repoga push qiling
2. Vercel'da yangi loyiha yarating
3. Muhit o'zgaruvchilarini sozlang
4. Deploy tugadi

---

## Muammolar va yordam

Agar muammo yuzaga kelsa:
1. MongoDB ulanishini tekshiring (`MONGODB_URI`)
2. `.env.local` faylidagi barcha o'zgaruvchilar to'g'ri ekanini tekshiring
3. `npm run dev` loglarini ko'ring
