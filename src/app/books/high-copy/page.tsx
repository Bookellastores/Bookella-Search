import { searchAllLibraries } from "@/lib/bookSources";

export const dynamic = "force-dynamic";

export default async function HighCopyBooksPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q?.trim() || "programming";
  const { books } = await searchAllLibraries(query, "all");

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-black mb-2">كتب هاي كوبي (بحث شامل)</h1>
      <p className="text-xs text-stone-500 mb-6">
        المصادر: Google, OpenLibrary, Gutenberg, Internet Archive, LOC, BookBrainz, Crossref, OpenAlex وغيرها.
      </p>
      <form method="GET" className="mb-6 flex gap-2">
        <input
          name="q"
          defaultValue={searchParams.q ?? ""}
          placeholder="ابحث بعنوان أو ISBN أو مؤلف..."
          className="flex-1 border rounded-xl px-3 py-2 text-sm"
        />
        <button className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold">
          بحث
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {books.slice(0, 60).map((book, idx) => (
          <article key={`${book.id}-${idx}`} className="border rounded-2xl p-4 bg-white">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className="w-full h-56 object-cover rounded-xl mb-3" />
            ) : null}
            <h2 className="font-bold text-sm">{book.title}</h2>
            <p className="text-xs text-stone-600 mt-1">{book.author || "غير معروف"}</p>
            <p className="text-[11px] text-stone-500 mt-2">{book.source}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
