import fs from 'fs';

const FILE = 'src/components/BookellaDashboard.tsx';
let content = fs.readFileSync(FILE, 'utf-8');

// 1. Change "ليس عدد العناوين" label in stats cards
content = content.replace(
  '<p className="text-[#001D35] text-xs font-bold opacity-80">العناوين المقيدة</p>',
  '<p className="text-[#001D35] text-xs font-bold opacity-80">العناوين المقيدة (عدد الكتب المختلفة)</p>'
);
content = content.replace(
  '<p className="text-[10px] text-stone-500 mt-0.5">{inventoryStats.total} عنوان · ليس عدد العناوين</p>',
  '<p className="text-[10px] text-stone-500 mt-0.5">{inventoryStats.total} عنوان مختلف</p>'
);

// 2. Add suggestedTitle to the table row
const rowTitleCell = `<td className="py-4 px-6 font-semibold group-hover:text-[#005AC1] transition-colors">{b.title}</td>`;
const newRowTitleCell = `<td className="py-4 px-6 font-semibold group-hover:text-[#005AC1] transition-colors">
  {b.title}
  {b.suggestedTitle && (
    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm text-xs text-yellow-800">
      <div className="font-bold mb-1">اقتراح تصحيح الاسم:</div>
      <div className="flex items-center gap-2">
        <span className="flex-1 font-mono">{b.suggestedTitle}</span>
        <button
          onClick={() => {
            const next = [...books];
            const idx = next.findIndex(bk => bk.id === b.id);
            if(idx > -1) {
              next[idx] = { ...next[idx], title: b.suggestedTitle!, suggestedTitle: null };
              setBooks(next);
              persistBooks(next, true);
              showToast("تم تطبيق التصحيح بنجاح", "success");
            }
          }}
          className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 font-bold"
        >موافق</button>
        <button
          onClick={() => {
            const next = [...books];
            const idx = next.findIndex(bk => bk.id === b.id);
            if(idx > -1) {
              next[idx] = { ...next[idx], suggestedTitle: null };
              setBooks(next);
              persistBooks(next, true);
            }
          }}
          className="px-2 py-1 bg-stone-200 text-stone-700 rounded hover:bg-stone-300 font-bold"
        >رفض</button>
      </div>
    </div>
  )}
</td>`;
content = content.replace(rowTitleCell, newRowTitleCell);

// 3. Add toggleBookSelection logic in sorting header
content = content.replace(
  `<th className="py-4 px-6">اسم الكتاب</th>`,
  `<th className="py-4 px-6 cursor-pointer hover:text-[#005AC1]" onClick={() => setSortBy("title")}>اسم الكتاب ⇕</th>`
);
content = content.replace(
  `<th className="py-4 px-6 text-center">سعر البيع</th>`,
  `<th className="py-4 px-6 text-center cursor-pointer hover:text-[#005AC1]" onClick={() => setSortBy("priceDesc")}>سعر البيع ⇕</th>`
);
content = content.replace(
  `<th className="py-4 px-6 text-center">سعر الشراء</th>`,
  `<th className="py-4 px-6 text-center cursor-pointer hover:text-[#005AC1]" onClick={() => setSortBy("priceAsc")}>سعر الشراء ⇕</th>`
);
content = content.replace(
  `<th className="py-4 px-6">الكاتب</th>`,
  `<th className="py-4 px-6 cursor-pointer hover:text-[#005AC1]" onClick={() => setSortBy("author")}>الكاتب ⇕</th>`
);

// 4. Expose the generated ID in the Add Book form
// Find where the title input is in the Add Modal, and inject the ID display
const addModalHeader = `<h3 className="text-xl font-extrabold text-[#001D35] mb-4">إضافة كتاب جديد يدوياً</h3>`;
const nextIdCode = `
<div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center">
  <span className="text-sm font-bold text-[#005AC1]">المعرف القادم (Book ID):</span>
  <span className="font-mono text-lg font-black text-[#001D35]">{generateNextBookId(books)}</span>
</div>
`;
content = content.replace(addModalHeader, addModalHeader + nextIdCode);

// 5. Separate Buy/Sell price in forms
// Currently it might be asking for both, let's make sure it handles both. The file already has purchasePrice and salePrice hooks!
// Wait, I just need to make sure originalPrice and price are labeled clearly.
content = content.replace(
  `value={purchasePrice}`,
  `value={purchasePrice} placeholder="سعر الشراء (تكلفتك)" title="سعر الشراء"`
);
content = content.replace(
  `value={salePrice}`,
  `value={salePrice} placeholder="سعر البيع للعميل" title="سعر البيع"`
);

// 6. Update smart batch buttons in the UI
const refreshAllBtn = `<button
                onClick={handleRefreshAllBooks}
                disabled={refreshAllLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FDF1BA] hover:bg-[#FBE585] text-[#5D4037] text-[11px] font-extrabold rounded-lg transition-all"
              >
                <Sparkles className="w-3 h-3" />
                تحديث شامل ذكي
              </button>`;

const newRefreshBtns = `
<button
  onClick={handleSmartBatch50}
  disabled={refreshAllLoading}
  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-[11px] font-extrabold rounded-lg transition-all"
>
  تحديث 50
</button>
<button
  onClick={handleSmartBatch100}
  disabled={refreshAllLoading}
  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-[11px] font-extrabold rounded-lg transition-all"
>
  تحديث 100
</button>
<button
  onClick={handleRefreshSelected}
  disabled={refreshAllLoading || selectedBookIds.size === 0}
  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-extrabold rounded-lg transition-all disabled:opacity-50"
>
  <CheckCircle className="w-3 h-3" />
  تحديث المحدد
</button>
` + refreshAllBtn;

content = content.replace(refreshAllBtn, newRefreshBtns);

fs.writeFileSync(FILE, content, 'utf-8');
console.log("Successfully updated BookellaDashboard.tsx via script.");
