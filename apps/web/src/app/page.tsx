import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white text-stone-900">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-stone-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span aria-hidden>☕</span>
            <span className="font-semibold tracking-tight">Smart Café</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-stone-600">
            <Link href="/menu" className="hover:text-stone-900 transition-colors">
              เมนู
            </Link>
            <Link href="/barista" className="hover:text-stone-900 transition-colors">
              บาริสต้า
            </Link>
            <Link href="/analytics" className="hover:text-stone-900 transition-colors">
              ผู้จัดการ
            </Link>
          </nav>
          <div className="sm:hidden" />
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Decorative beans */}
        <svg
          aria-hidden
          viewBox="0 0 600 600"
          className="pointer-events-none absolute -top-32 -right-24 h-[28rem] w-[28rem] opacity-10"
        >
          <defs>
            <linearGradient id="g1" x1="0" x2="1">
              <stop offset="0%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <g fill="url(#g1)">
            <ellipse cx="140" cy="260" rx="80" ry="120" transform="rotate(-20,140,260)" />
            <ellipse cx="320" cy="200" rx="70" ry="110" transform="rotate(25,320,200)" />
            <ellipse cx="450" cy="340" rx="95" ry="140" transform="rotate(-10,450,340)" />
          </g>
        </svg>

        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20 lg:py-24 grid gap-8 lg:grid-cols-2 items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-stone-900">
              ร้านกาแฟ Smart Café
            </h1>
            <p className="mt-3 sm:mt-4 text-stone-600 max-w-prose">
              สั่ง–จ่าย–รับเครื่องดื่มแบบไม่ต้องต่อคิว ผ่าน Smart Café ใช้งานง่าย รองรับทุกอุปกรณ์
              และรวดเร็วเหมือนยกบาร์มาไว้ในมือคุณ
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/menu"
                className="inline-flex items-center justify-center rounded-2xl bg-stone-900 px-5 py-3 text-white text-sm font-medium shadow-sm hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
                aria-label="ดูเมนูเครื่องดื่ม"
              >
                ดูเมนูเครื่องดื่ม
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center rounded-2xl border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                ดูวิธีการทำงาน
              </Link>
            </div>
          </div>

          {/* Card preview */}
          <div className="relative">
            <div className="mx-auto w-full max-w-md rounded-3xl border border-stone-200 bg-white shadow-sm">
              <div className="p-5 border-b border-stone-100">
                <div className="flex items-center gap-2 text-stone-700">
                  <span aria-hidden>📱</span>
                  <span className="text-sm font-medium">สั่งผ่านมือถือ</span>
                </div>
              </div>
              <ul className="divide-y divide-stone-100">
                {[
                  { name: 'Americano', price: 60 },
                  { name: 'Latte', price: 75 },
                  { name: 'Caramel Macchiato', price: 85 },
                ].map((m, i) => (
                  <li key={i} className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-100" aria-hidden />
                      <div>
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-stone-500">เย็น/ร้อน เลือกได้</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">฿{m.price}</span>
                  </li>
                ))}
              </ul>
              <div className="p-5">
                <Link
                  href="/menu"
                  className="block w-full text-center rounded-xl bg-amber-600 px-4 py-2 text-white text-sm font-semibold hover:bg-amber-700"
                >
                  ไปที่เมนู
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <h2 className="text-xl sm:text-2xl font-bold">ครบในที่เดียว</h2>
        <p className="mt-2 text-stone-600 max-w-prose">
          ประสบการณ์ร้านกาแฟที่ลื่นไหล ตั้งแต่สั่งซื้อจนรับเครื่องดื่ม
        </p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              title: 'สั่งง่าย',
              desc: 'เลือกเมนู โปรโมชัน และท็อปปิ้งได้ในไม่กี่คลิก',
              icon: '📝',
            },
            {
              title: 'จ่ายไว',
              desc: 'สแกน QR พร้อมเพย์ ออกใบเสร็จอัตโนมัติ',
              icon: '💸',
            },
            {
              title: 'รับสะดวก',
              desc: 'คิวเรียลไทม์ แจ้งเตือนเมื่อเครื่องดื่มพร้อมเสิร์ฟ',
              icon: '✅',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm hover:shadow transition-shadow"
            >
              <div className="text-2xl" aria-hidden>
                {f.icon}
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-stone-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Menu preview grid */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">เมนูแนะนำ</h2>
            <p className="mt-2 text-stone-600">ลองชิมเมนูยอดนิยมของเรา</p>
          </div>
          <Link
            href="/menu"
            className="hidden sm:inline-block text-sm font-medium underline underline-offset-4"
          >
            ดูทั้งหมด
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { name: 'Cappuccino', price: 70 },
            { name: 'Mocha', price: 80 },
            { name: 'Cold Brew', price: 90 },
          ].map((m) => (
            <div
              key={m.name}
              className="rounded-3xl border border-stone-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="h-36 bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,.25),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(120,53,15,.2),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(245,158,11,.2),transparent_40%)]" />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{m.name}</h3>
                  <span className="text-sm font-semibold">฿{m.price}</span>
                </div>
                <p className="mt-1 text-sm text-stone-600">หอมกลมกล่อม เหมาะกับทุกวัน</p>
                <Link
                  href="/menu"
                  className="mt-4 inline-flex text-sm font-medium underline underline-offset-4"
                >
                  สั่งเลย
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-stone-600 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>&copy; {new Date().getFullYear()} Smart Café</p>
          <nav className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-stone-900">
              นโยบายความเป็นส่วนตัว
            </Link>
            <Link href="/terms" className="hover:text-stone-900">
              ข้อตกลงการใช้งาน
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
