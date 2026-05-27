import Link from "next/link";

export default function BooksPage() {
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-3">مكتبة الكتب</h1>
      <p className="text-sm text-stone-600 mb-8">
        اختر نوع الصفحة: كتب أوريجينال من مصادر دور نشر فقط، أو كتب هاي كوبي من كل المصادر المتاحة.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/books/original"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 hover:shadow-md transition"
        >
          <h2 className="font-bold text-emerald-800">كتب أوريجينال</h2>
          <p className="text-xs text-emerald-700 mt-2">
            مصادر موثوقة من دور النشر وفهارسها فقط.
          </p>
        </Link>

        <Link
          href="/books/high-copy"
          className="rounded-2xl border border-violet-200 bg-violet-50 p-5 hover:shadow-md transition"
        >
          <h2 className="font-bold text-violet-800">كتب هاي كوبي</h2>
          <p className="text-xs text-violet-700 mt-2">
            بحث واسع في كل المصادر العامة والأكاديمية.
          </p>
        </Link>
      </div>
    </main>
  );
}
