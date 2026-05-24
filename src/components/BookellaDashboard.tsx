"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Search, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  Coins, 
  Layers, 
  X, 
  TrendingUp,
  BookMarked,
  LogOut,
  User,
  SlidersHorizontal,
  FolderOpen,
  Mail,
  Lock,
  ArrowRight,
  Database,
  RefreshCw,
  Globe,
  Table,
  ExternalLink,
  Check
} from "lucide-react";

interface Book {
  id: string;
  charGroup: string;
  title: string;
  type: string;
  author: string;
  category: string;
  series: string;
  subCategories: string;
  originalPrice: number;
  price: number;
  discountedPrice?: number;
  quantity: number;
  language: string;
  publisher: string;
  pageCount: number;
  coverUrl: string;
  notes: string;
  libraryName: string;
}

const INITIAL_BOOKS: Book[] = [
  {
    id: "BOO-1",
    charGroup: "ا",
    title: "ارض زيكولا",
    type: "هاي كوبي",
    author: "عمرو عبد الحميد",
    category: "رواية فانتازيا",
    series: "",
    subCategories: "خيال، دراما",
    originalPrice: 40,
    price: 55,
    quantity: 5,
    language: "عربي",
    publisher: "عصير الكتب",
    pageCount: 320,
    coverUrl: "https://m.media-amazon.com/images/I/71QCfs1TvGL._AC_SL1500_.jpg",
    notes: "",
    libraryName: "مكتبة سيرا"
  },
  {
    id: "BOO-2",
    charGroup: "ا",
    title: "ازر",
    type: "هاي كوبي",
    author: "عمرو عبد الحميد",
    category: "رواية فانتازيا",
    series: "",
    subCategories: "خيال، أدب عربي",
    originalPrice: 70,
    price: 80,
    quantity: 5,
    language: "عربي",
    publisher: "دليفري بوك",
    pageCount: 319,
    coverUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMsPUcrC9ayiGle67wdebLd1c9xpY1cwxvhQ&s",
    notes: "",
    libraryName: "دليفري بوك"
  },
  {
    id: "BOO-3",
    charGroup: "ا",
    title: "الشيطان والمياه المظلمة",
    type: "هاي كوبي",
    author: "ستيوارت تورتون",
    category: "رواية غموض",
    series: "",
    subCategories: "تحقيق، جريمة، أدب مترجم",
    originalPrice: 165,
    price: 170,
    quantity: 5,
    language: "عربي",
    publisher: "دليفري بوك",
    pageCount: 676,
    coverUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDVXk00b_eWfSEDjee_nRXvXw2iQn-tL_muQ&s",
    notes: "",
    libraryName: "دليفري بوك"
  },
  {
    id: "BOO-4",
    charGroup: "ا",
    title: "اماريتا",
    type: "هاي كوبي",
    author: "عمرو عبد الحميد",
    category: "رواية فانتازيا",
    series: "",
    subCategories: "",
    originalPrice: 40,
    price: 55,
    quantity: 5,
    language: "عربي",
    publisher: "دليفري بوك",
    pageCount: 320,
    coverUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTer0X45PW8YIvh3jJCQmGpjG_KDi1HPBVp4w&s",
    notes: "",
    libraryName: "دليفري بوك"
  },
  {
    id: "BOO-8",
    charGroup: "ق",
    title: "قضية ذيل القط",
    type: "هاي كوبي",
    author: "ميرنا المهدي",
    category: "رواية بوليسية",
    series: "تحقيقات نوح الالفي 4",
    subCategories: "تحقيق، غموض، فانتازيا",
    originalPrice: 60,
    price: 70,
    quantity: 5,
    language: "عربي",
    publisher: "دار الشروق",
    pageCount: 320,
    coverUrl: "",
    notes: "",
    libraryName: "بياع الكتب"
  },
  {
    id: "BOO-13",
    charGroup: "ا",
    title: "العادات الذريه مترجم",
    type: "هاي كوبي",
    author: "جيمس كلير",
    category: "تطوير الذات",
    series: "",
    subCategories: "إدارة الوقت، سلوك",
    originalPrice: 40,
    price: 55,
    quantity: 5,
    language: "عربي",
    publisher: "الدار الأهلية",
    pageCount: 304,
    coverUrl: "",
    notes: "",
    libraryName: "عالم الكتب"
  },
  {
    id: "BOO-14",
    charGroup: "ك",
    title: "كوني صحابيه",
    type: "هاي كوبي",
    author: "حنان لاشين",
    category: "ديني/مقالات",
    series: "",
    subCategories: "إرشاد الفتيات، تنمية ذاتية",
    originalPrice: 65,
    price: 75,
    quantity: 5,
    language: "عربي",
    publisher: "دار الشروق",
    pageCount: 191,
    coverUrl: "",
    notes: "",
    libraryName: "دليفري بوك"
  }
];

export default function BookellaDashboard() {
  const { data: session, status } = useSession();

  // Inventory Books state
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  
  // LocalStorage Persistence Client-side effect
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("bookella_books");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBooks(parsed);
          }
        } catch (e) {
          console.error("Failed to parse persisted books", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && books !== INITIAL_BOOKS) {
      localStorage.setItem("bookella_books", JSON.stringify(books));
    }
  }, [books]);

  // Google Sheets state declarations
  const [isSheetsOpen, setIsSheetsOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [sheetsMergeMode, setSheetsMergeMode] = useState<"merge" | "replace">("merge");

  // Google Books Explorer state declarations
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [explorerQuery, setExplorerQuery] = useState("");
  const [explorerResults, setExplorerResults] = useState<any[]>([]);
  const [explorerLoading, setExplorerLoading] = useState(false);

  // Real-time Search and Advanced Filtering states
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("الكل");
  const [authorFilter, setAuthorFilter] = useState("الكل");
  const [priceLimit, setPriceLimit] = useState<number>(300);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Notifications
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Dialog Overlays Toggle
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  
  // New book Form states
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("رواية");
  const [series, setSeries] = useState("");
  const [originalPrice, setOriginalPrice] = useState("40");
  const [language, setLanguage] = useState("عربي");
  const [pageCount, setPageCount] = useState("250");
  const [coverUrl, setCoverUrl] = useState("");
  const [publisher, setPublisher] = useState("");
  const [notes, setNotes] = useState("");
  const [apiLoading, setApiLoading] = useState(false);
  const [csvInput, setCsvInput] = useState("");

  // Sign in / Sign up states
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Dynamic values based on books loaded
  const uniqueAuthors = useMemo(() => {
    const authorsSet = new Set(books.map(b => b.author.trim()).filter(Boolean));
    return ["الكل", ...Array.from(authorsSet)];
  }, [books]);

  const uniqueCategories = useMemo(() => {
    const categoriesSet = new Set(books.map(b => b.category.trim()).filter(Boolean));
    return ["الكل", ...Array.from(categoriesSet)];
  }, [books]);

  // Toast trigger
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Title-based Duplicate check
  const isDuplicate = useMemo(() => {
    if (!title.trim()) return false;
    return books.some(b => b.title.trim().toLowerCase() === title.trim().toLowerCase());
  }, [title, books]);

  // Bookella automated pricing logic (<30 -> 50, 40-50 -> +15, 60-77 -> +10)
  const livePrice = useMemo(() => {
    const orig = parseFloat(originalPrice) || 0;
    if (orig < 30) return 50;
    if (orig >= 40 && orig <= 50) return orig + 15;
    if (orig >= 60 && orig <= 77) return orig + 10;
    return orig;
  }, [originalPrice]);

  // AI-powered Omni fetch
  const handleAutoFetch = async () => {
    if (!title.trim()) return;
    setApiLoading(true);
    try {
      showToast("جاري البحث في المصادر وتحليل البيانات بالذكاء الاصطناعي...", "info");
      const res = await fetch("/api/fetch-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() })
      });
      
      const data = await res.json();
      
      if (!res.ok || data.error) {
        showToast(data.error || "لم نجد بيانات دقيقة لهذا الكتاب، يمكنك كتابتها يدوياً", "error");
        return;
      }
      
      if (data.title) setTitle(data.title);
      if (data.author) setAuthor(data.author);
      if (data.category) setCategory(data.category);
      if (data.pageCount) setPageCount(String(data.pageCount));
      if (data.coverImage) setCoverUrl(data.coverImage);
      if (data.arabicSummary) setNotes(data.arabicSummary);
      
      showToast("تم تحليل وإثراء بيانات الكتاب بنجاح بواسطة الذكاء الاصطناعي!", "success");
    } catch (err: any) {
      showToast(`فشل سحب البيانات: ${err.message}`, "error");
    } finally {
      setApiLoading(false);
    }
  };

  // Google Sheets Sync Handler
  const handleSheetsSync = async () => {
    if (!sheetUrl.trim()) {
      showToast("يرجى إدخال رابط أو معرف Google Sheet", "error");
      return;
    }
    setSheetsLoading(true);
    try {
      const res = await fetch(`/api/sheets?spreadsheetId=${encodeURIComponent(sheetUrl)}&sheetName=${encodeURIComponent(sheetName)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "فشلت المزامنة");
      }

      if (data.books && data.books.length > 0) {
        const importedBooks = data.books as Book[];
        if (sheetsMergeMode === "replace") {
          setBooks(importedBooks);
          showToast(`تم استبدال كامل الجرد بنجاح بمخزون Google Sheet البالغ ${importedBooks.length} كتاباً!`, "success");
        } else {
          // Merge mode: Add only books with unique titles
          const existingTitles = new Set(books.map(b => b.title.trim().toLowerCase()));
          let addedCount = 0;
          let updatedCount = 0;
          const mergedList = [...books];

          importedBooks.forEach(newBook => {
            const index = mergedList.findIndex(b => b.title.trim().toLowerCase() === newBook.title.trim().toLowerCase());
            if (index > -1) {
              // Upgrade pricing / details of existing book
              mergedList[index] = {
                ...mergedList[index],
                originalPrice: newBook.originalPrice,
                price: newBook.price,
                quantity: newBook.quantity,
                coverUrl: newBook.coverUrl || mergedList[index].coverUrl,
                notes: newBook.notes || mergedList[index].notes,
                publisher: newBook.publisher || mergedList[index].publisher,
                pageCount: newBook.pageCount || mergedList[index].pageCount,
                libraryName: "Google Sheets"
              };
              updatedCount++;
            } else {
              mergedList.push({
                ...newBook,
                id: `BOO-SHEET-${Date.now()}-${addedCount}`
              });
              addedCount++;
            }
          });

          setBooks(mergedList);
          showToast(`اكتملت المزامنة الذكية: تم إضافة ${addedCount} عنوان جديد وتحديث تفاصيل/أسعار ${updatedCount} عنوان مسبق!`, "success");
        }
        setIsSheetsOpen(false);
      } else {
        showToast("لم نجد عناوين كتب بالملف أو أن التنسيق غير ملائم", "info");
      }
    } catch (err: any) {
      showToast(err.message || "حدث خطأ غير متوقع", "error");
    } finally {
      setSheetsLoading(false);
    }
  };

  // Google Books Explorer Query Search Component Handler
  const handleExplorerSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!explorerQuery.trim()) return;
    setExplorerLoading(true);
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(explorerQuery)}&maxResults=15`);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        setExplorerResults(data.items);
        showToast(`تم العثور على ${data.items.length} كتاب في مكتبة Google!`, "success");
      } else {
        setExplorerResults([]);
        showToast("لم نجد نتائج مطابقة لبحثك في مكتبة Google.", "info");
      }
    } catch (err: any) {
      showToast(`فشل السحب من مكتبة جوجل: ${err.message}`, "error");
    } finally {
      setExplorerLoading(false);
    }
  };

  // Google Library Import Action
  const handleExplorerImport = (googleBook: any) => {
    const info = googleBook.volumeInfo;
    if (!info) return;

    const bTitle = info.title;
    // Check duplication
    const isDup = books.some(b => b.title.trim().toLowerCase() === bTitle.trim().toLowerCase());
    if (isDup) {
      showToast(`تنبيه: كتاب "${bTitle}" موجود بالفعل في جردك الموحد!`, "error");
      return;
    }

    const origPrice = 50; // default initial estimate
    // Premium custom pricing formula auto application
    let finalPrice = origPrice;
    if (origPrice < 30) finalPrice = 50;
    else if (origPrice >= 40 && origPrice <= 50) finalPrice = origPrice + 15;
    else if (origPrice >= 60 && origPrice <= 77) finalPrice = origPrice + 10;

    let thumb = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || "";
    if (thumb.startsWith("http://")) {
      thumb = thumb.replace("http://", "https://");
    }

    const newBook: Book = {
      id: `BOO-GEXPL-${Date.now()}`,
      charGroup: bTitle.charAt(0),
      title: bTitle,
      type: "هاي كوبي",
      author: info.authors?.join(", ") || "غير معروف",
      category: info.categories?.[0] || "رواية مجلة",
      series: "",
      subCategories: info.categories?.slice(1).join("، ") || "",
      originalPrice: origPrice,
      price: finalPrice,
      quantity: 5,
      language: info.language === "ar" ? "عربي" : "إنجليزي",
      publisher: info.publisher || "ناشر عام",
      pageCount: info.pageCount || 250,
      coverUrl: thumb,
      notes: info.description ? info.description.slice(0, 180) + "..." : "",
      libraryName: "مستكشف جوجل للأبحاث"
    };

    setBooks([newBook, ...books]);
    showToast(`تم استيراد "${bTitle}" بنجاح، وجرى جدولته وتثبيت تسعيره التلقائي!`, "success");
  };

  // Credentials User Login Action
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setAuthSubmitting(true);

    if (authMode === "login") {
      try {
        const res = await signIn("credentials", {
          redirect: false,
          email: authEmail,
          password: authPassword
        });

        if (res?.error) {
          setAuthError(res.error);
        } else {
          showToast(`أهلاً بك مجدداً! تم تسجيل الدخول بنجاح`, "success");
        }
      } catch (err: any) {
        setAuthError("حدث خطأ ما أثناء المصادقة");
      }
    } else {
      // signup Mode
      try {
        const req = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: authName,
            email: authEmail,
            password: authPassword
          })
        });

        const resData = await req.json();
        if (!req.ok) {
          setAuthError(resData.message || "فشلت عملية التسجيل.");
        } else {
          setAuthSuccess(resData.message || "تم تسجيل حسابك بنجاح! جاري الدخول...");
          // Log user in automatically
          await signIn("credentials", {
            redirect: false,
            email: authEmail,
            password: authPassword
          });
          showToast(`مرحباً بك في منصة Bookella!`, "success");
        }
      } catch (err) {
        setAuthError("فشل الاتصال بالخادم الرئيسي.");
      }
    }
    setAuthSubmitting(false);
  };

  // Add Book Action
  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("اسم الكتاب مطلوب", "error");
      return;
    }
    if (isDuplicate) {
      showToast("كتاب مكرر! يمنع النظام إضافة كتب مسجلة مسبقاً", "error");
      return;
    }

    const orig = parseFloat(originalPrice) || 0;
    const newBook: Book = {
      id: `BOO-${Date.now()}`,
      charGroup: title.trim().charAt(0),
      title: title.trim(),
      type: "هاي كوبي",
      author: author.trim() || "غير معروف",
      category: category.trim(),
      series: series.trim(),
      subCategories: "",
      originalPrice: orig,
      price: livePrice,
      quantity: 5,
      language: language.trim(),
      publisher: publisher.trim(),
      pageCount: parseInt(pageCount) || 250,
      coverUrl: coverUrl.trim(),
      notes: notes.trim(),
      libraryName: "وحدة التحكم ويب"
    };

    setBooks([newBook, ...books]);
    setIsAddOpen(false);
    showToast(`تم إضافة كتاب "${title}" بنجاح وجرى تسعيره تلقائياً!`);
    
    // reset fields
    setTitle("");
    setAuthor("");
    setSeries("");
    setCoverUrl("");
    setNotes("");
    setPublisher("");
  };

  // Delete Book Action
  const handleDeleteBook = (id: string, titleName: string) => {
    setBooks(books.filter(b => b.id !== id));
    showToast(`تم إزالة كتاب "${titleName}" من الجرد`);
  };

  // Dynamic CSV Import integration
  const handleCsvImport = () => {
    if (!csvInput.trim()) return;
    try {
      const lines = csvInput.split("\n");
      let added = 0;
      let skipped = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
        
        const bTitle = cols[2] || cols[1] || "";
        if (!bTitle) continue;
        
        // Deduplicate check
        const dup = books.some(b => b.title.toLowerCase() === bTitle.toLowerCase());
        if (dup) {
          skipped++;
          continue;
        }

        const origPr = parseFloat(cols[8]) || 40;
        let finalPr = origPr;
        if (origPr < 30) finalPr = 50;
        else if (origPr >= 40 && origPr <= 50) finalPr = origPr + 15;
        else if (origPr >= 60 && origPr <= 77) finalPr = origPr + 10;

        const nb: Book = {
          id: `BOO-CSV-${Date.now()}-${i}`,
          charGroup: bTitle.charAt(0),
          title: bTitle,
          type: cols[3] || "هاي كوبي",
          author: cols[4] || "غير معروف",
          category: cols[5] || "رواية",
          series: cols[6] || "",
          subCategories: cols[7] || "",
          originalPrice: origPr,
          price: finalPr,
          quantity: parseInt(cols[11]) || 5,
          language: cols[12] || "عربي",
          publisher: cols[13] || "",
          pageCount: parseInt(cols[14]) || 250,
          coverUrl: cols[15] || "",
          notes: cols[16] || "",
          libraryName: cols[17] || "مستورد من ملف"
        };
        books.push(nb);
        added++;
      }
      setBooks([...books]);
      setIsCsvOpen(false);
      setCsvInput("");
      showToast(`تم استيراد ${added} كتب بنجاح وتفادي مكررات لحوالي ${skipped} كتب!`, "success");
    } catch (err: any) {
      showToast(`فشل قراءة الملف: ${err.message}`, "error");
    }
  };

  // CSV Export action
  const handleExportCsv = () => {
    let header = "Book ID,الحرف,اسم الكتاب,نوع الكتاب,اسم الكاتب,التصنيف الرئيسي,اسم السلسلة,تصنيفات فرعية,Original Price,Price,الكمية المتاحة,لغة الكتاب,دار النشر,عدد الصفحات,رابط صورة الغلاف,ملاحظات,اسم المكتبة\n";
    const body = books.map(b => [
      b.id, b.charGroup, `"${b.title}"`, `"${b.type}"`, `"${b.author}"`, `"${b.category}"`, `"${b.series}"`, `"${b.subCategories}"`, b.originalPrice, b.price, b.quantity, `"${b.language}"`, `"${b.publisher}"`, b.pageCount, `"${b.coverUrl}"`, `"${b.notes}"`, `"${b.libraryName}"`
    ].join(",")).join("\n");
    
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "bookella_inventory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("تم توليد وتنزيل ملف CSV الموحد بنجاح!", "success");
  };

  // Filter and real-time query search logic
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      // Real-time search: filters by Title and Author
      const matchesSearch = !search.trim() || 
        b.title.toLowerCase().includes(search.toLowerCase()) || 
        b.author.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = categoryFilter === "الكل" || b.category === categoryFilter;
      const matchesAuthor = authorFilter === "الكل" || b.author === authorFilter;
      const matchesPrice = b.price <= priceLimit;

      return matchesSearch && matchesCategory && matchesAuthor && matchesPrice;
    });
  }, [books, search, categoryFilter, authorFilter, priceLimit]);

  // Derived Statistics 
  const totalUnique = books.length;
  const totalCategories = new Set(books.map(b => b.category)).size;
  const averagePrice = books.length ? Math.round(books.reduce((acc, b) => acc + b.price, 0) / books.length) : 0;

  // Session state handler inside client view
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#F8F9FF] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#005AC1] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-bold text-[#001D35] text-sm">جاري مراجعة جلسة التسجيل...</p>
      </div>
    );
  }

  // If unauthenticated, show majestic sleek login / sign up page layout
  if (status === "unauthenticated" || !session) {
    return (
      <div className="min-h-screen bg-[#F8F9FF] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#E1E2EC] shadow-2xl overflow-hidden p-8 transition-all">
          <div className="text-center mb-6">
            <div className="inline-flex p-3.5 bg-[#D6E3FF] rounded-full border border-[#D6E3FF]/40 mb-3 justify-center items-center">
              <BookOpen className="w-8 h-8 text-[#005AC1]" />
            </div>
            <h2 className="text-3xl font-extrabold text-[#001D35] tracking-tight">Bookella</h2>
            <p className="text-sm text-[#44474E] mt-1.5 font-medium">منصة إدارة وغلال مخزون الكتب الموحد</p>
          </div>

          <div className="flex bg-[#F1F4F9] rounded-2xl p-1.5 mb-6 border border-[#E1E2EC]/50">
            <button
              onClick={() => { setAuthMode("login"); setAuthError(""); setAuthSuccess(""); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                authMode === "login" ? "bg-white text-[#001D35] shadow" : "text-[#44474E] hover:text-[#001D35]"
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => { setAuthMode("signup"); setAuthError(""); setAuthSuccess(""); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                authMode === "signup" ? "bg-white text-[#001D35] shadow" : "text-[#44474E] hover:text-[#001D35]"
              }`}
            >
              حساب جديد
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === "signup" && (
              <div>
                <label className="block text-xs font-bold text-[#44474E] mb-1">الاسم التجاري أو الشخصي</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-[#44474E]/80"><User className="w-4 h-4" /></span>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="على سبيل المثال: مكتبة بغداد"
                    className="w-full pl-10 pr-4 py-2 bg-[#F1F4F9] border border-[#E1E2EC] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1] focus:bg-white text-[#1A1C1E]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#44474E] mb-1">البريد الإلكتروني</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-[#44474E]/80"><Mail className="w-4 h-4" /></span>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2 bg-[#F1F4F9] border border-[#E1E2EC] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1] focus:bg-white text-[#1A1C1E] text-left ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#44474E] mb-1">كلمة المرور</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-[#44474E]/80"><Lock className="w-4 h-4" /></span>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 bg-[#F1F4F9] border border-[#E1E2EC] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1] focus:bg-white text-[#1A1C1E] text-left ltr"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-3 bg-[#005AC1] hover:bg-[#00479e] active:scale-[0.98] text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 mt-2"
            >
              {authSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>{authMode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}</span>
              )}
            </button>
          </form>

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-[#E1E2EC]"></div>
            <span className="flex-shrink mx-3 text-[11px] text-[#44474E] font-medium uppercase">خيار بديل</span>
            <div className="flex-grow border-t border-[#E1E2EC]"></div>
          </div>

          <button
            onClick={() => signIn("google")}
            className="w-full py-2.5 bg-[#F1F4F9] hover:bg-[#E2E2E6] text-[#1A1C1E] border border-[#E1E2EC] rounded-xl flex items-center justify-center gap-2 text-xs font-bold active:scale-[0.98] transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.65 1.58 14.97 1 12 1 7.24 1 3.2 3.74 1.25 7.72l3.85 2.99C6.01 7.11 8.78 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.88 3.39-8.48z"
              />
              <path
                fill="#FBBC05"
                d="M5.1 13.68a6.52 6.52 0 0 1 0-4.36L1.25 6.33a11.97 11.97 0 0 0 0 11.33l3.85-2.98z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-4.3 1.09-3.22 0-5.99-2.07-6.96-5.67l-3.85 2.99C3.2 20.26 7.24 23 12 23z"
              />
            </svg>
            <span>الدخول عبر حساب Google</span>
          </button>
        </div>
      </div>
    );
  }

  // Dashboard layout for authenticated users
  return (
    <div className="min-h-screen bg-[#F8F9FF] pb-20">
      {/* Toast Alert popup */}
      {toast && (
        <div className={`fixed top-4 left-4 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl border text-sm font-bold transition-all animate-bounce ${
          toast.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
          toast.type === "error" ? "bg-rose-50 text-rose-800 border-rose-200" : "bg-blue-50 text-blue-800 border-blue-200"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Hero Header */}
      <header className="bg-white text-[#001D35] py-8 px-6 sm:px-12 relative overflow-hidden border-b border-[#E1E2EC]">
        <div className="absolute inset-0 bg-left-bottom bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-[#D6E3FF] rounded-full flex items-center justify-center w-12 h-12">
                <BookOpen className="w-6 h-6 text-[#005AC1]" />
              </span>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#001D35]">Bookella Console</h1>
                <p className="text-xs text-[#005AC1] font-bold tracking-wider mt-0.5">منصة الجرد والتسعير الموحد</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Logged in User state */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#F1F4F9] rounded-2xl border border-[#E1E2EC]">
              {session.user?.image ? (
                <img src={session.user.image} alt="User Avatar" className="w-7 h-7 rounded-full object-cover border border-white" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#005AC1] text-white flex items-center justify-center text-xs font-bold leading-none">
                  {session.user?.name ? session.user.name.slice(0, 2) : "مك"}
                </div>
              )}
              <div className="text-right">
                <p className="text-xs font-bold text-[#001D35] truncate max-w-[120px]">{session.user?.name}</p>
                <p className="text-[9px] text-stone-500 ltr truncate max-w-[120px]">{session.user?.email}</p>
              </div>
              <button 
                onClick={() => signOut()}
                className="p-1 px-2 border border-red-200 hover:bg-red-50 text-red-700 rounded-lg text-[9px] font-black transition-all flex items-center gap-0.5"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3 h-3 text-red-600" />
                خروج
              </button>
            </div>

            <button 
              onClick={() => setIsSheetsOpen(true)}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95"
            >
              <Table className="w-3.5 h-3.5 text-emerald-600" />
              ربط Google Sheets
            </button>

            <button 
              onClick={() => setIsExplorerOpen(true)}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-850 border border-indigo-200 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              مستكشف مكتبات Google
            </button>

            <button 
              onClick={() => setIsCsvOpen(true)}
              className="px-4 py-2 bg-[#F1F4F9] hover:bg-[#E2E2E6] text-[#1A1C1E] border border-[#E1E2EC] rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-[#005AC1]" />
              استيراد CSV
            </button>
            <button 
              onClick={handleExportCsv}
              className="px-4 py-2 bg-[#F1F4F9] hover:bg-[#E2E2E6] text-[#1A1C1E] border border-[#E1E2EC] rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-[#005AC1]" />
              تصدير جردك
            </button>
            <button 
              onClick={() => setIsAddOpen(true)}
              className="px-5 py-2.5 bg-[#005AC1] hover:bg-[#00479e] active:scale-95 transition-all text-white rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-lg shadow-[#005AC133]"
            >
              <Plus className="w-4 h-4" />
              إضافة عنوان
            </button>
          </div>
        </div>
      </header>

      {/* KPI Stats Widgets */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 mt-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#D3E4FF] p-5 rounded-2xl border border-[#E1E2EC] flex items-center gap-4">
            <div className="p-3 bg-white/50 text-[#001D35] rounded-xl"><BookMarked className="w-6 h-6" /></div>
            <div>
              <p className="text-[#001D35] text-xs font-bold opacity-80">العناوين المقيدة</p>
              <h3 className="text-2xl font-black text-[#001D35] mt-1">{totalUnique}</h3>
            </div>
          </div>
          <div className="bg-[#E2E2E6] p-5 rounded-2xl border border-[#E1E2EC] flex items-center gap-4">
            <div className="p-3 bg-white/50 text-[#1A1C1E] rounded-xl"><TrendingUp className="w-6 h-6" /></div>
            <div>
              <p className="text-[#1A1C1E] text-xs font-bold opacity-80">إجمالي النسخ بالجرد</p>
              <h3 className="text-2xl font-black text-[#1A1C1E] mt-1">{books.reduce((acc, b) => acc + (b.quantity || 5), 0)}</h3>
            </div>
          </div>
          <div className="bg-[#D3E4FF] p-5 rounded-2xl border border-[#E1E2EC] flex items-center gap-4">
            <div className="p-3 bg-white/50 text-[#001D35] rounded-xl"><Layers className="w-6 h-6" /></div>
            <div>
              <p className="text-[#001D35] text-xs font-bold opacity-80">التصنيفات الموحدة</p>
              <h3 className="text-2xl font-black text-[#001D35] mt-1">{totalCategories}</h3>
            </div>
          </div>
          <div className="bg-[#E2E2E6] p-5 rounded-2xl border border-[#E1E2EC] flex items-center gap-4">
            <div className="p-3 bg-white/50 text-[#1A1C1E] rounded-xl"><Coins className="w-6 h-6" /></div>
            <div>
              <p className="text-[#1A1C1E] text-xs font-bold opacity-80">متوسط التسعير</p>
              <h3 className="text-2xl font-black text-[#1A1C1E] mt-1">{averagePrice} ج.م</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Table Container */}
      <main className="max-w-7xl mx-auto px-6 sm:px-12 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E1E2EC] overflow-hidden">
          
          {/* Real-time search & filter bar controller */}
          <div className="p-6 border-b border-[#E1E2EC] space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Real-time Search Input */}
              <div className="w-full md:w-96 relative">
                <span className="absolute left-3.5 top-2.5 text-stone-400"><Search className="w-5 h-5" /></span>
                <input 
                  type="text"
                  placeholder="ابحث بالاسم أو اسم الكاتب..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2 bg-[#F1F4F9] border border-[#E1E2EC] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1] focus:bg-white transition-all text-[#1A1C1E]"
                />
              </div>

              {/* Toggle Advanced filter pill */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                    showAdvanced || authorFilter !== "الكل" || priceLimit < 300
                      ? "bg-[#D6E3FF] text-[#001B3D] border-[#005AC1]"
                      : "bg-[#F1F4F9] border-[#E1E2EC] text-stone-700 hover:bg-[#E2E2E6]"
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4 text-[#005AC1]" />
                  تخصيص الفرز المتقدم
                  {(authorFilter !== "الكل" || priceLimit < 300) && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  )}
                </button>

                {/* Reset filters */}
                {(search.trim() || categoryFilter !== "الكل" || authorFilter !== "الكل" || priceLimit < 300) && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setCategoryFilter("الكل");
                      setAuthorFilter("الكل");
                      setPriceLimit(300);
                    }}
                    className="text-xs text-red-600 font-bold hover:underline"
                  >
                    إعادة ضبط
                  </button>
                )}
              </div>
            </div>

            {/* Expanded Advanced Filters Panel */}
            {(showAdvanced || authorFilter !== "الكل" || priceLimit < 300) && (
              <div className="p-5 bg-[#F1F4F9] rounded-2xl border border-[#E1E2EC] grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in-40">
                
                {/* Author Dropdown Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#44474E]">الكاتب المعتمد</label>
                  <select
                    value={authorFilter}
                    onChange={(e) => setAuthorFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E1E2EC] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#005AC1] text-[#1A1C1E]"
                  >
                    {uniqueAuthors.map(auth => (
                      <option key={auth} value={auth}>{auth}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range limit slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-[#44474E]">
                    <span>تصفية الحد الأقصى للسعر</span>
                    <span className="text-[#005AC1] bg-white px-2 py-0.5 rounded-md border border-[#E1E2EC]">{priceLimit} ج.م</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="5"
                    value={priceLimit}
                    onChange={(e) => setPriceLimit(parseInt(e.target.value))}
                    className="w-full accent-[#005AC1] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-500 font-bold">
                    <span>10 ج.م</span>
                    <span>250 ج.م</span>
                    <span>500 ج.م</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Category Tab Pills */}
            <div className="flex flex-wrap gap-2 items-center pt-2">
              <span className="text-xs text-stone-500 font-bold leading-none ml-2">الأقسام:</span>
              {["الكل", "رواية فانتازيا", "رواية بوليسية", "تطوير الذات", "ديني/مقالات"].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    categoryFilter === cat 
                      ? "bg-[#005AC1] text-white" 
                      : "bg-[#F1F4F9] hover:bg-[#E2E2E6] text-stone-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

          </div>

          {/* Data Grid table */}
          {filteredBooks.length === 0 ? (
            <div className="p-20 text-center text-stone-400 flex flex-col items-center justify-center gap-3 bg-stone-50/50">
              <BookOpen className="w-12 h-12 text-stone-300 animate-pulse" />
              <p className="font-bold text-stone-600">لا توجد كتب مطابقة لخيارات الفلترة المطروحة</p>
              <p className="text-xs text-stone-400">حاول إعادة تصفير حقول البحث والفرز</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-[#F8F9FF] border-b border-[#E1E2EC] text-stone-500 font-bold">
                    <th className="py-4 px-6">الغلاف</th>
                    <th className="py-4 px-6">اسم الكتاب</th>
                    <th className="py-4 px-6">الكاتب</th>
                    <th className="py-4 px-6">التصنيف الرئيسي</th>
                    <th className="py-4 px-6 text-center">عدد الصفحات</th>
                    <th className="py-4 px-6 text-left">السعر النهائي المقترح</th>
                    <th className="py-4 px-6 text-center">خيارات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E2EC]">
                  {filteredBooks.map(b => (
                    <tr key={b.id} className="hover:bg-blue-50/20 transition-all group">
                      <td className="py-4 px-6">
                        <div className="w-10 h-14 rounded-md border border-[#E1E2EC] overflow-hidden bg-[#F1F4F9] flex items-center justify-center text-[10px] font-bold text-[#005AC1] text-center shadow-inner">
                          {b.coverUrl ? (
                            <img src={b.coverUrl} alt={b.title} className="w-full h-full object-cover" />
                          ) : (
                            b.title.slice(0, 2)
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold group-hover:text-[#005AC1] transition-colors">{b.title}</td>
                      <td className="py-4 px-6 text-stone-600">{b.author}</td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 text-xs font-bold bg-[#FDF1BA] text-[#5D4037] rounded-md">
                          {b.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center text-stone-500">{b.pageCount} ص</td>
                      <td className="py-4 px-6 text-left">
                        <div className="flex flex-col items-end">
                          <span className="font-extrabold text-[#005AC1] text-base">{b.price} ج.م</span>
                          {b.originalPrice !== b.price && (
                            <span className="text-[10px] text-stone-400 line-through">الأصل: {b.originalPrice} ج.م</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button 
                          onClick={() => handleDeleteBook(b.id, b.title)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add book Overlay Modals */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-[#001D35]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 border border-[#E1E2EC]">
            <div className="flex items-center justify-between border-b border-[#E1E2EC] pb-4 mb-4">
              <h2 className="text-xl font-bold text-[#001D35] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#005AC1]" />
                إثراء وإضافة عنوان جديد
              </h2>
              <button onClick={() => setIsAddOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBook} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">اسم الكتاب</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="اكتب هنا ثم اضغط سحب للحصول كلياً على البيانات..."
                    className={`flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1] ${isDuplicate ? "border-rose-400 text-rose-800" : "border-[#E1E2EC]"}`}
                  />
                  <button
                    type="button"
                    disabled={!title.trim() || apiLoading}
                    onClick={handleAutoFetch}
                    className="px-4 bg-[#005AC1] hover:bg-[#00479e] text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all active:scale-95 disabled:opacity-40 whitespace-nowrap"
                  >
                    {apiLoading ? "تحليل AI..." : "جلب ذكي (AI)"}
                  </button>
                </div>
                {isDuplicate && (
                  <p className="text-rose-600 text-xs mt-1.5 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    اسم الكتاب مسجل مسبقاً بجرد Bookella لمنع تكرار المخزون!
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">الكاتب</label>
                  <input 
                    type="text" 
                    value={author} 
                    onChange={(e) => setAuthor(e.target.value)} 
                    className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">التصنيف</label>
                  <input 
                    type="text" 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)} 
                    className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">عدد الصفحات</label>
                  <input 
                    type="number" 
                    value={pageCount} 
                    onChange={(e) => setPageCount(e.target.value)} 
                    className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#44474E] mb-1">اللغة</label>
                  <input 
                    type="text" 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)} 
                    className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1]"
                  />
                </div>
              </div>

              {/* Live pricing adjusted section */}
              <div className="bg-[#F8F9FF] border border-[#E1E2EC] p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-[#44474E] mb-1">السعر الأصلي (ج.م)</label>
                  <input 
                    type="number" 
                    value={originalPrice} 
                    onChange={(e) => setOriginalPrice(e.target.value)} 
                    className="px-3 py-1.5 w-32 border border-[#E1E2EC] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1]"
                  />
                </div>
                <div className="text-left">
                  <p className="text-xs text-[#44474E]">سعر البيع المقترح</p>
                  <h4 className="text-2xl font-black text-[#005AC1]">{livePrice} ج.م</h4>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#44474E] mb-1">رابط صورة الغلاف</label>
                <input 
                  type="text" 
                  value={coverUrl} 
                  onChange={(e) => setCoverUrl(e.target.value)} 
                  className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1]"
                />
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-2.5 border border-[#E1E2EC] text-stone-700 text-sm font-bold rounded-xl active:scale-95 transition-all text-center"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isDuplicate}
                  className="flex-1 py-2.5 bg-[#005AC1] hover:bg-[#00479e] disabled:opacity-40 text-white text-sm font-bold rounded-xl active:scale-95 transition-all text-center flex items-center justify-center"
                >
                  حفظ الكتاب بمجلة الجرد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Overlay */}
      {isCsvOpen && (
        <div className="fixed inset-0 z-50 bg-[#001D35]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 border border-[#E1E2EC]">
            <div className="flex items-center justify-between border-b border-[#E1E2EC] pb-4 mb-4">
              <h2 className="text-xl font-bold text-[#001D35] flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#005AC1]" />
                استيراد جدول مخزون CSV
              </h2>
              <button onClick={() => setIsCsvOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-[#44474E]">
                انسخ النص بالكامل من ورقة العمل (Excel / CSV) والصقه أدناه. سيتكفل الخادم بالتحليل الإحصائي وتخطي التكرار وتعديل الأسعار أوتوماتيكياً!
              </p>
              <textarea
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder="Book ID,اسم الكتاب,اسم الكاتب,التصنيف الرئيسي,Original Price..."
                className="w-full h-48 p-3 border border-[#E1E2EC] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#005AC1]"
              />
              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCsvOpen(false)}
                  className="flex-1 py-2 border border-[#E1E2EC] text-[#005AC1] text-xs font-bold rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleCsvImport}
                  className="flex-1 py-2 bg-[#005AC1] text-white text-xs font-bold rounded-xl active:scale-95 transition-all"
                >
                  بدء الاستيراد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheets Sync Integration Overlay */}
      {isSheetsOpen && (
        <div className="fixed inset-0 z-50 bg-[#001D35]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-7 shadow-2xl animate-in fade-in-50 zoom-in-95 border border-emerald-100 overflow-hidden relative">
            {/* Top decorative banner */}
            <div className="absolute top-0 inset-x-0 h-2 bg-emerald-500" />
            
            <div className="flex items-center justify-between border-b border-[#E1E2EC] pb-4 mb-5">
              <h2 className="text-xl font-extrabold text-[#001D35] flex items-center gap-2.5">
                <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Table className="w-5 h-5" />
                </span>
                مزامنة وربط Google Sheets
              </h2>
              <button onClick={() => setIsSheetsOpen(false)} className="text-stone-400 hover:text-stone-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Dynamic Guidelines Card */}
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-xs text-emerald-950 space-y-2.5">
                <span className="font-extrabold text-emerald-900 block text-sm">💡 خطوات تفعيل الربط السريع:</span>
                <ol className="list-decimal list-inside space-y-1.5 font-medium opacity-90 leading-relaxed">
                  <li>افتح ملف Google Sheets الخاص بك المخصّص للمخزون.</li>
                  <li>اضغط على زر <strong className="text-emerald-800">"مشاركة" (Share)</strong> بالأعلى.</li>
                  <li>غيّر الصلاحية إلى <strong className="text-emerald-800">"أي شخص لديه الرابط يمكنه العرض" (Anyone with link can view)</strong>.</li>
                  <li>انسخ رابط الصفحة من شريط العنوان بالمتصفّح والصقه بالأسفل للربط!</li>
                </ol>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">رابط ورقة العمل Google Sheet أو المعرّف (ID)</label>
                  <input
                    type="text"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                    className="w-full px-4 py-2.5 bg-[#F1F4F9] border border-[#E1E2EC] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-[#1A1C1E] font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-700">اسم الورقة المحددة (اختياري)</label>
                    <input
                      type="text"
                      value={sheetName}
                      onChange={(e) => setSheetName(e.target.value)}
                      placeholder="مثال: Sheet1 أو جرد_اليوم"
                      className="w-full px-4 py-2.5 bg-[#F1F4F9] border border-[#E1E2EC] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-[#1A1C1E] font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-700">آلية مزامنة المخزون</label>
                    <div className="flex bg-[#F1F4F9] rounded-xl p-1 border border-[#E1E2EC]">
                      <button
                        type="button"
                        onClick={() => setSheetsMergeMode("merge")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          sheetsMergeMode === "merge" ? "bg-white text-emerald-800 shadow-sm" : "text-stone-500 hover:text-stone-800"
                        }`}
                      >
                        دمج ذكي وتحديث
                      </button>
                      <button
                        type="button"
                        onClick={() => setSheetsMergeMode("replace")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          sheetsMergeMode === "replace" ? "bg-white text-red-750 shadow-sm" : "text-stone-500 hover:text-stone-800"
                        }`}
                      >
                        استبدال الجرد تماماً
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSheetsOpen(false)}
                  className="flex-1 py-3 border border-[#E1E2EC] text-stone-700 text-xs font-bold rounded-xl active:scale-95 transition-all text-center"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={sheetsLoading || !sheetUrl.trim()}
                  onClick={handleSheetsSync}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl active:scale-95 transition-all text-center flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10"
                >
                  {sheetsLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري سحب الجرد...
                    </>
                  ) : (
                    <>
                      <Table className="w-4 h-4" />
                      بدء المزامنة والربط الفوري
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Books Catalog Explorer Overlay */}
      {isExplorerOpen && (
        <div className="fixed inset-0 z-50 bg-[#001D35]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] p-8 shadow-2xl animate-in fade-in-50 zoom-in-95 border border-indigo-100 flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E1E2EC] pb-4 mb-5 shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <Globe className="w-6 h-6" />
                </span>
                <div>
                  <h2 className="text-xl font-extrabold text-[#001D35]">مستكشف مكتبات Google للأبحاث والكتب</h2>
                  <p className="text-xs text-indigo-600 font-bold mt-0.5">ابحث في مليارات الكتب برعاية جوجل واستوردها مباشرة لجردك</p>
                </div>
              </div>
              <button onClick={() => setIsExplorerOpen(false)} className="text-stone-400 hover:text-stone-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick search input form */}
            <form onSubmit={handleExplorerSearch} className="flex gap-2.5 mb-5 shrink-0">
              <input
                type="text"
                value={explorerQuery}
                onChange={(e) => setExplorerQuery(e.target.value)}
                placeholder="اكتب اسم الرواية، الكاتب، دار النشر أو الكود الدولي (ISBN)..."
                className="flex-1 px-4 py-3 bg-[#F1F4F9] border border-[#E1E2EC] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-[#1A1C1E] font-semibold"
              />
              <button
                type="submit"
                disabled={explorerLoading || !explorerQuery.trim()}
                className="px-6 bg-indigo-650 hover:bg-indigo-750 disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-indigo-600/10"
              >
                {explorerLoading ? "جاري البحث..." : "بحث جوجل"}
              </button>
            </form>

            {/* Results Grid Scrollable */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {explorerLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-stone-600 animate-pulse">جاري الاستعلام وفهرسة النتائج في قواعد بيانات Google...</p>
                </div>
              ) : explorerResults.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-[#98A2B3] p-10 bg-[#F8F9FF] rounded-2xl border border-dashed border-[#E1E2EC]">
                  <Globe className="w-12 h-12 text-stone-300 animate-pulse" />
                  <p className="font-extrabold text-stone-600 text-sm">ابدأ بالبحث عن مؤلف أو عنوان في مكتبات Google المفتوحة</p>
                  <p className="text-xs text-stone-400 max-w-sm text-center leading-relaxed">
                    النظام سيتكفل بجلب تفاصيل العناوين، صور الأغلفة، عدد الصفحات والناشر ثم إضافة خيارات التسعير المقترحة تلقائياً.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {explorerResults.map((item, idx) => {
                    const info = item.volumeInfo;
                    const titleStr = info?.title || "عنوان غير معروف";
                    const isAlreadyImported = books.some(b => b.title.trim().toLowerCase() === titleStr.trim().toLowerCase());
                    let thumb = info?.imageLinks?.thumbnail || info?.imageLinks?.smallThumbnail || "";
                    if (thumb.startsWith("http://")) {
                      thumb = thumb.replace("http://", "https://");
                    }

                    return (
                      <div key={item.id || idx} className="bg-white p-4 rounded-2xl border border-[#E1E2EC] hover:border-indigo-200 transition-all flex gap-4 hover:shadow-lg hover:shadow-indigo-50/20 group">
                        {/* Book image thumb */}
                        <div className="w-16 h-24 bg-[#F1F4F9] rounded-xl overflow-hidden shadow-inner flex items-center justify-center shrink-0 border border-[#E1E2EC]">
                          {thumb ? (
                            <img src={thumb} alt={titleStr} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-200" />
                          ) : (
                            <span className="text-xs font-bold text-stone-400">لا غلاف</span>
                          )}
                        </div>

                        {/* Mid Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-[#001D35] text-xs truncate" title={titleStr}>{titleStr}</h4>
                            <p className="text-[11px] text-[#44474E] font-medium truncate mt-0.5">{info?.authors?.join("، ") || "مؤلف غير معروف"}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {info?.categories?.[0] && (
                                <span className="px-2 py-0.5 bg-[#FDF1BA] text-[#5D4037] rounded text-[9px] font-bold truncate max-w-[120px]">
                                  {info.categories[0]}
                                </span>
                              )}
                              {info?.pageCount && (
                                <span className="px-2 py-0.5 bg-[#E2E2E6] text-[#1A1C1E] rounded text-[9px] font-semibold">
                                  {info.pageCount} ص
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 mt-2 border-t border-[#F1F4F9]">
                            {/* Live Pricing simulation */}
                            <span className="text-[11px] font-bold text-[#005AC1] bg-[#D6E3FF]/30 px-2 py-0.5 rounded-lg">
                              تسعير مقترح: 65 ج.م
                            </span>

                            {isAlreadyImported ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-xl">
                                <Check className="w-3.5 h-3.5" />
                                مدرج بالجرد
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleExplorerImport(item)}
                                className="px-3 py-1.5 bg-[#005AC1] hover:bg-[#00479e] text-white text-[10px] font-bold rounded-lg transition-all active:scale-95"
                              >
                                استيراد للجرد
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="border-t border-[#E1E2EC] pt-4 mt-4 text-left shrink-0">
              <button
                type="button"
                onClick={() => setIsExplorerOpen(false)}
                className="px-6 py-2 border border-[#E1E2EC] text-stone-700 text-xs font-bold rounded-xl active:scale-95 transition-all"
              >
                إغلاق المستكشف
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// Inline Prototype helpers
declare global {
  interface Array<T> {
    sumOfCopies(): number;
  }
}
Array.prototype.sumOfCopies = function() {
  return this.reduce((acc, current) => acc + (current.quantity || 5), 0);
};
