import fs from 'fs';

const FILE = 'src/components/BookellaDashboard.tsx';
let content = fs.readFileSync(FILE, 'utf-8');

// 1. Add bulk actions logic
const bulkActionsLogic = `
  const handleBulkDelete = () => {
    if (!window.confirm(\`هل أنت متأكد من حذف \${selectedBookIds.size} كتاب؟\`)) return;
    setBooks(prev => prev.filter(b => !selectedBookIds.has(b.id)));
    setSelectedBookIds(new Set());
    showToast(\`تم حذف \${selectedBookIds.size} كتاب بنجاح\`, 'success');
  };

  const handleBulkSetType = (newType: "هاي كوبي" | "أوريجينال") => {
    if (!window.confirm(\`تحويل \${selectedBookIds.size} كتاب إلى \${newType}؟\`)) return;
    setBooks(prev => prev.map(b => selectedBookIds.has(b.id) ? { ...b, libraryName: newType } : b));
    showToast(\`تم تحديث نوع \${selectedBookIds.size} كتاب إلى \${newType}\`, 'success');
  };
`;

if (!content.includes('handleBulkDelete')) {
  content = content.replace(
    'const handleRefreshSelected = async () => {',
    bulkActionsLogic + '\n  const handleRefreshSelected = async () => {'
  );
}

// 2. Add UI for bulk actions near refresh button
const bulkActionsUI = `
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={selectedBookIds.size === 0}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100/80 text-rose-900 border border-rose-200 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
              title="حذف الكتب المحددة"
            >
              حذف المحدد
            </button>
            <div className="flex gap-1 border-r border-slate-300 pr-2 mr-2">
              <button
                type="button"
                onClick={() => handleBulkSetType("أوريجينال")}
                disabled={selectedBookIds.size === 0}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                title="جعل المحدد أوريجينال"
              >
                أوريجينال
              </button>
              <button
                type="button"
                onClick={() => handleBulkSetType("هاي كوبي")}
                disabled={selectedBookIds.size === 0}
                className="px-3 py-2 bg-sky-50 hover:bg-sky-100/80 text-sky-900 border border-sky-200 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                title="جعل المحدد هاي كوبي"
              >
                هاي كوبي
              </button>
            </div>
`;

if (!content.includes('onClick={handleBulkDelete}')) {
  content = content.replace(
    'title="تحديث الكتب المحددة فقط"\n            >\n              <Check className="w-3.5 h-3.5" />\n              تحديث المحدد ({selectedBookIds.size})\n            </button>',
    'title="تحديث الكتب المحددة فقط"\n            >\n              <Check className="w-3.5 h-3.5" />\n              تحديث المحدد ({selectedBookIds.size})\n            </button>\n' + bulkActionsUI
  );
}

// 3. Add S3 Upload feature
const s3UploadLogic = `
  const [isUploading, setIsUploading] = useState(false);
  const handleUploadCoverToS3 = async () => {
    if (!coverUrl) return;
    setIsUploading(true);
    try {
      const res = await fetch('/api/upload-s3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: coverUrl, title, isbn })
      });
      const data = await res.json();
      if (data.url) {
        setCoverUrl(data.url);
        showToast('تم رفع الصورة بنجاح إلى السحابة!', 'success');
      } else {
        showToast(data.error || 'فشل رفع الصورة', 'error');
      }
    } catch (e: any) {
      showToast('حدث خطأ أثناء الرفع', 'error');
    } finally {
      setIsUploading(false);
    }
  };
`;

if (!content.includes('handleUploadCoverToS3')) {
  content = content.replace(
    'const handleClearForm = () => {',
    s3UploadLogic + '\n  const handleClearForm = () => {'
  );
}

const uploadBtnUI = `
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleUploadCoverToS3}
                  disabled={isUploading || !coverUrl || coverUrl.includes('amazonaws.com')}
                  className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
                >
                  {isUploading ? 'جاري الرفع...' : 'رفع الصورة للسحابة ☁️'}
                </button>
              </div>
`;

if (!content.includes('handleUploadCoverToS3}')) {
  content = content.replace(
    'placeholder="https://..."\n                  className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1] bg-white"\n                />',
    'placeholder="https://..."\n                  className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1] bg-white"\n                />' + uploadBtnUI
  );
}

fs.writeFileSync(FILE, content);
console.log('Patch applied successfully.');
