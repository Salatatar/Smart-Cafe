import Link from 'next/link';

export default function Home() {
  return (
    <main className="py-10">
      <h1 className="text-3xl font-bold">Smart Café</h1>
      <p className="mt-2 text-gray-600">สั่ง–จ่าย–รับเครื่องดื่มแบบไม่ต้องต่อคิว</p>
      <div className="mt-6">
        <Link href="/menu" className="inline-block rounded-xl bg-black px-5 py-3 text-white">
          ดูเมนูเครื่องดื่ม
        </Link>
      </div>
    </main>
  );
}
