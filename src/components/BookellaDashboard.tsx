"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { mergeToEnrichedMetadata } from "@/lib/bookMetadataMerge";
import {
  fetchAllBooksClient,
  searchLibrariesClient,
} from "@/lib/bookSourcesClient";
import { generateNextBookId, normalizeAuthorName } from "@/lib/bookFormatters";
import { mergeBookFillMissing, mergeBookWithMetadata } from "@/lib/inventoryMerge";
import type {
  BookSearchMode,
  EnrichedBookMetadata,
  LibrarySourceKey,
} from "@/lib/bookTypes";
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
  Check,
  Moon,
  Sun,
  Library,
  Filter,
  BookCopy,
  Pencil
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
  isbn: string;
  libraryName: string;
  lastRefreshedAt?: number;
  suggestedTitle?: string | null;
}

type SortKey =
  | "title"
  | "author"
  | "category"
  | "priceAsc"
  | "priceDesc"
  | "id"
  | "quantity";
type BatchRefreshSize = 50 | 100 | 200 | "all";

const normalizeTypeValue = (value?: string): "أوريجينال" | "هاي كوبي" => {
  const normalized = (value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[أإآ]/g, "ا");
  const originalTokens = ["اوريجينال", "اوريجنال", "original", "orig"];
  return originalTokens.some((token) => normalized.includes(token)) ? "أوريجينال" : "هاي كوبي";
};

const isOriginalBook = (book: Pick<Book, "type">): boolean => normalizeTypeValue(book.type) === "أوريجينال";

const normalizeStoredBook = (b: Book & { isbn?: string }): Book => ({
  ...b,
  type: normalizeTypeValue(b.type),
  isbn: b.isbn ?? "",
});

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
    isbn: "",
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
    isbn: "",
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
    isbn: "",
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
    isbn: "",
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
    isbn: "",
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
    isbn: "",
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
    isbn: "",
    libraryName: "دليفري بوك"
  }
];

export default function BookellaDashboard() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { data: session, status } = useSession();

  // Inventory Books state
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS.map((b) => normalizeStoredBook(b)));
  
  const [hasHydrated, setHasHydrated] = useState(false);

  const persistBooks = async (nextBooks: Book[], immediate = false) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("bookella_books", JSON.stringify(nextBooks));
    if (!immediate && !hasHydrated) return;
    try {
      await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ books: nextBooks }),
      });
    } catch {
      /* يبقى الحفظ المحلي */
    }
  };

  useEffect(() => {
    const load = async () => {
      let mongoBooks: Book[] | null = null;
      let localBooks: Book[] | null = null;

      try {
        const res = await fetch("/api/inventory", { cache: "no-store" });
        const data = await res.json();
        if (res.ok && Array.isArray(data.books) && data.books.length > 0) {
          mongoBooks = data.books.map((b: Book) => normalizeStoredBook(b));
          if (data.storage === "mongodb") setStorageMode("mongodb");
        }
      } catch {
        /* fallback local */
      }

      const stored = localStorage.getItem("bookella_books");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localBooks = parsed.map((b: Book) => normalizeStoredBook(b));
          }
        } catch (e) {
          console.error("Failed to parse persisted books", e);
        }
      }

      let loaded: Book[] | null = null;
      if (mongoBooks?.length && localBooks?.length) {
        loaded = localBooks.length >= mongoBooks.length ? localBooks : mongoBooks;
        setStorageMode(localBooks.length > mongoBooks.length ? "hybrid" : "mongodb");
      } else {
        loaded = localBooks ?? mongoBooks;
        if (mongoBooks?.length) setStorageMode("mongodb");
        else if (localBooks?.length) setStorageMode("local");
      }

      if (loaded?.length) {
        setBooks(loaded);
        if (localBooks && mongoBooks && localBooks.length > mongoBooks.length) {
          void fetch("/api/inventory", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ books: loaded }),
          });
        }
      }
      setHasHydrated(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    const timer = setTimeout(() => {
      void persistBooks(books);
    }, 800);
    return () => clearTimeout(timer);
  }, [books, hasHydrated]);

  useEffect(() => {
    fetch("/api/books-config")
      .then((r) => r.json())
      .then((cfg) =>
        setBooksApiConfig({
          hasGemini: Boolean(cfg.hasGemini),
          hasGoogleBooksServer: Boolean(cfg.hasGoogleBooksServer),
          hasGoogleBooksClient: Boolean(cfg.hasGoogleBooksClient),
        })
      )
      .catch(() => {});
  }, []);

  // Google Sheets state declarations
  const [isSheetsOpen, setIsSheetsOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [sheetsMergeMode, setSheetsMergeMode] = useState<"merge" | "replace" | "fillMissing">("fillMissing");
  const [sheetDefaultType, setSheetDefaultType] = useState<"أوريجينال" | "هاي كوبي">("هاي كوبي");
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());
  const [storageMode, setStorageMode] = useState<"local" | "mongodb" | "hybrid">("local");

  // Google Books Explorer state declarations
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [explorerQuery, setExplorerQuery] = useState("");
  const [explorerResults, setExplorerResults] = useState<any[]>([]);
  const [explorerLoading, setExplorerLoading] = useState(false);

  // Multi-Library Search state declarations
  const [isLibrarySearchOpen, setIsLibrarySearchOpen] = useState(false);
  const [librarySearchQuery, setLibrarySearchQuery] = useState("");
  const [librarySearchResults, setLibrarySearchResults] = useState<any[]>([]);
  const [librarySearchLoading, setLibrarySearchLoading] = useState(false);
  const [librarySourceFilter, setLibrarySourceFilter] = useState("all");
  const [librarySourceSummary, setLibrarySourceSummary] = useState<Record<string, number>>({});

  // Real-time Search and Advanced Filtering states
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("الكل");
  const [authorFilter, setAuthorFilter] = useState("الكل");
  const [priceLimit, setPriceLimit] = useState<number>(300);
  const [inventoryMode, setInventoryMode] = useState<"all" | "original" | "highcopy">("all");
  const [sortBy, setSortBy] = useState<SortKey>("title");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Notifications
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Dialog Overlays Toggle
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [refreshingBookId, setRefreshingBookId] = useState<string | null>(null);
  
  // New book Form states
  const [bookType, setBookType] = useState<"أوريجينال" | "هاي كوبي">("هاي كوبي");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("رواية");
  const [series, setSeries] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("40");
  const [salePrice, setSalePrice] = useState("55");
  const [language, setLanguage] = useState("عربي");
  const [pageCount, setPageCount] = useState("250");
  const [coverUrl, setCoverUrl] = useState("");
  const [publisher, setPublisher] = useState("");
  const [notes, setNotes] = useState("");
  const [isbn, setIsbn] = useState("");
  const [apiLoading, setApiLoading] = useState(false);
  const [refreshAllLoading, setRefreshAllLoading] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState({ current: 0, total: 0 });
  const [booksApiConfig, setBooksApiConfig] = useState({
    hasGemini: false,
    hasGoogleBooksServer: false,
    hasGoogleBooksClient: false,
  });
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

  const resetAddBookForm = () => {
    setBookType("هاي كوبي");
    setTitle("");
    setAuthor("");
    setCategory("رواية");
    setSeries("");
    setPurchasePrice("40");
    setSalePrice("55");
    setLanguage("عربي");
    setPageCount("250");
    setCoverUrl("");
    setPublisher("");
    setNotes("");
    setIsbn("");
  };

  const resolveBookMetadata = async (
    query: string,
    mode: BookSearchMode = "all"
  ): Promise<EnrichedBookMetadata | null> => {
    const clientBooks = await fetchAllBooksClient(query, mode);
    let metadata = mergeToEnrichedMetadata(clientBooks, query);

    try {
      const res = await fetch("/api/fetch-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: query,
          clientMetadata: metadata,
          clientBooks,
        }),
      });
      const serverData = await res.json();
      if (res.ok && !serverData.error) metadata = serverData;
    } catch {
      /* الاعتماد على نتائج المتصفح */
    }

    return metadata;
  };

  const applyEnrichedMetadata = (data: {
    title?: string;
    author?: string;
    category?: string;
    pageCount?: number;
    coverImage?: string | null;
    publisher?: string;
    language?: string;
    arabicSummary?: string;
    isbn?: string | null;
    sourcesUsed?: string[];
  }): number => {
    let filled = 0;
    if (data.title) {
      setTitle(data.title);
      filled++;
    }
    if (data.author && data.author !== "غير معروف" && data.author !== "مؤلف غير معروف") {
      setAuthor(data.author);
      filled++;
    }
    if (data.category) {
      setCategory(data.category);
      filled++;
    }
    if (data.pageCount) {
      setPageCount(String(data.pageCount));
      filled++;
    }
    if (data.coverImage) {
      setCoverUrl(data.coverImage);
      filled++;
    }
    if (data.publisher) {
      setPublisher(data.publisher);
      filled++;
    }
    if (data.language) {
      setLanguage(data.language);
      filled++;
    }
    if (data.arabicSummary) {
      setNotes(data.arabicSummary);
      filled++;
    }
    if (data.isbn) {
      setIsbn(data.isbn);
      filled++;
    }
    return filled;
  };

  // إكمال تلقائي: متصفح + سيرفر (مفاتيح API) + Gemini عند التفعيل
  const handleAutoFetch = async () => {
    if (!title.trim()) return;
    setApiLoading(true);
    try {
      const query = title.trim();
      const hasApiKeys =
        booksApiConfig.hasGemini ||
        booksApiConfig.hasGoogleBooksServer ||
        booksApiConfig.hasGoogleBooksClient;

      showToast(
        hasApiKeys
          ? "جاري البحث في المكتبات + دمج API..."
          : "جاري البحث في المكتبات وإكمال البيانات...",
        "info"
      );

      const metadata = await resolveBookMetadata(
        query,
        bookType === "أوريجينال" ? "publisher" : "all"
      );

      if (!metadata) {
        showToast(
          "لم نجد بيانات لهذا الكتاب. جرّب الاسم بالإنجليزية أو أضف اسم المؤلف.",
          "error"
        );
        return;
      }

      const filled = applyEnrichedMetadata(metadata);
      const sources = metadata.sourcesUsed?.length
        ? metadata.sourcesUsed.join("، ")
        : "المكتبات المتاحة";

      showToast(
        filled > 0
          ? `تم إكمال ${filled} حقول من: ${sources}`
          : "لم تُملأ حقول إضافية — تحقق من اسم الكتاب",
        filled > 0 ? "success" : "info"
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطأ غير معروف";
      showToast(`فشل سحب البيانات: ${message}`, "error");
    } finally {
      setApiLoading(false);
    }
  };

  const pickBooksForSmartRefresh = (
    pool: Book[],
    limit: BatchRefreshSize,
    onlySelected: boolean
  ): Book[] => {
    let candidates = pool;
    if (onlySelected && selectedBookIds.size > 0) {
      candidates = pool.filter((b) => selectedBookIds.has(b.id));
    }
    candidates = [...candidates].sort(
      (a, b) => (a.lastRefreshedAt || 0) - (b.lastRefreshedAt || 0)
    );
    if (limit === "all") return candidates;
    return candidates.slice(0, limit);
  };

  const runBatchRefresh = async (
    target: "all" | "original" | "highcopy",
    batchSize: BatchRefreshSize
  ) => {
    const pool = books.filter((b) => {
      if (target === "all") return true;
      return target === "original" ? isOriginalBook(b) : !isOriginalBook(b);
    });
    const booksToRefresh = pickBooksForSmartRefresh(
      pool,
      batchSize,
      selectedBookIds.size > 0
    );

    if (booksToRefresh.length === 0) {
      showToast("لا توجد كتب مطابقة للتحديث", "info");
      return;
    }

    const label =
      batchSize === "all"
        ? `الكل (${booksToRefresh.length})`
        : `الدفعة التالية (${booksToRefresh.length})`;

    if (
      !window.confirm(
        `تحديث ذكي: ${label}\nلن يُعاد تحديث نفس الدفعة إلا بعد دفعات أخرى.\nالأسعار والبيانات الموجودة لن تُمس.\n\nمتابعة؟`
      )
    ) {
      return;
    }

    setRefreshAllLoading(true);
    setRefreshProgress({ current: 0, total: booksToRefresh.length });
    let updated = 0;
    let skipped = 0;

    try {
      let nextBooks = [...books];
      const indexMap = () => new Map(nextBooks.map((b, idx) => [b.id, idx]));

      for (let i = 0; i < booksToRefresh.length; i++) {
        const book = booksToRefresh[i];
        setRefreshProgress({ current: i + 1, total: booksToRefresh.length });

        const query =
          book.isbn?.trim() ||
          [book.title, book.author !== "غير معروف" ? book.author : ""]
            .filter(Boolean)
            .join(" ")
            .trim();

        try {
          const meta = await resolveBookMetadata(
            query,
            target === "original" || isOriginalBook(book) ? "publisher" : "all"
          );
          const idx = indexMap().get(book.id);
          if (meta && idx !== undefined) {
            nextBooks[idx] = mergeBookWithMetadata(book, meta);
            updated++;
          } else {
            skipped++;
          }
        } catch {
          skipped++;
        }

        setBooks(nextBooks);
        await persistBooks(nextBooks, true);

        if (i < booksToRefresh.length - 1) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      showToast(
        `تم حفظ ${updated} كتاب فوراً (${skipped} بدون نتائج جديدة)`,
        updated > 0 ? "success" : "info"
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطأ غير معروف";
      showToast(`فشل التحديث: ${message}`, "error");
    } finally {
      setRefreshAllLoading(false);
      setRefreshProgress({ current: 0, total: 0 });
    }
  };

  const handleRefreshAllBooks = () => runBatchRefresh("all", "all");
  const handleSmartBatch50 = () => runBatchRefresh("all", 50);
  const handleSmartBatch100 = () => runBatchRefresh("all", 100);
  const handleSmartBatch200 = () => runBatchRefresh("all", 200);
  const handleRefreshOriginalBooks = () => runBatchRefresh("original", "all");
  const handleRefreshHighCopyBooks = () => runBatchRefresh("highcopy", "all");
  const handleBulkDelete = () => {
    if (!window.confirm(`هل أنت متأكد من حذف ${selectedBookIds.size} كتاب؟`)) return;
    setBooks(prev => prev.filter(b => !selectedBookIds.has(b.id)));
    setSelectedBookIds(new Set());
    showToast(`تم حذف ${selectedBookIds.size} كتاب بنجاح`, 'success');
  };

  const handleBulkSetType = (newType: "هاي كوبي" | "أوريجينال") => {
    if (!window.confirm(`تحويل ${selectedBookIds.size} كتاب إلى ${newType}؟`)) return;
    setBooks(prev => prev.map(b => selectedBookIds.has(b.id) ? { ...b, libraryName: newType } : b));
    showToast(`تم تحديث نوع ${selectedBookIds.size} كتاب إلى ${newType}`, 'success');
  };

  const handleRefreshSelected = () => runBatchRefresh("all", "all");

  const handleRefreshSingleBook = async (book: Book) => {
    setRefreshingBookId(book.id);
    try {
      const query =
        book.isbn?.trim() ||
        [book.title, book.author !== "غير معروف" ? book.author : ""]
          .filter(Boolean)
          .join(" ")
          .trim();

      const meta = await resolveBookMetadata(
        query,
        isOriginalBook(book) ? "publisher" : "all"
      );
      if (!meta) {
        showToast(`لم نجد بيانات محدّثة لـ «${book.title}»`, "info");
        return;
      }

      setBooks((prev) => {
        const next = prev.map((b) => (b.id === book.id ? mergeBookWithMetadata(b, meta) : b));
        void persistBooks(next, true);
        return next;
      });
      showToast(`تم تحديث بيانات «${book.title}» — الأسعار كما أدخلتها`, "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطأ غير معروف";
      showToast(`فشل التحديث: ${message}`, "error");
    } finally {
      setRefreshingBookId(null);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook?.title.trim()) {
      showToast("اسم الكتاب مطلوب", "error");
      return;
    }

    const updated = normalizeStoredBook({
      ...editingBook,
      title: editingBook.title.trim(),
      author: normalizeAuthorName(editingBook.author),
      charGroup: editingBook.title.trim().charAt(0) || editingBook.charGroup,
      originalPrice: Number(editingBook.originalPrice) || 0,
      price: Number(editingBook.price) || 0,
      pageCount: Number(editingBook.pageCount) || 0,
      quantity: Number(editingBook.quantity) || 0,
    });

    setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setEditingBook(null);
    showToast(`تم حفظ تعديلات «${updated.title}»`, "success");
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
        const importedBooks = (data.books as Book[]).map((b) =>
          normalizeStoredBook({
            ...b,
            type: normalizeTypeValue(b.type || sheetDefaultType),
            series: b.series ?? "",
            subCategories: b.subCategories ?? "",
          })
        );

        if (sheetsMergeMode === "replace") {
          setBooks(importedBooks);
          showToast(
            `تم استبدال الجرد بـ ${importedBooks.length} كتاب من Google Sheets!`,
            "success"
          );
        } else {
          let addedCount = 0;
          let updatedCount = 0;
          const mergedList = [...books];

          importedBooks.forEach((newBook) => {
            const index = mergedList.findIndex(
              (b) =>
                b.title.trim().toLowerCase() === newBook.title.trim().toLowerCase()
            );
            if (index > -1) {
              mergedList[index] =
                sheetsMergeMode === "fillMissing"
                  ? normalizeStoredBook(
                      mergeBookFillMissing(mergedList[index], newBook)
                    )
                  : normalizeStoredBook({
                      ...mergedList[index],
                      ...newBook,
                      id: mergedList[index].id,
                      libraryName: mergedList[index].libraryName,
                      originalPrice:
                        newBook.originalPrice > 0
                          ? newBook.originalPrice
                          : mergedList[index].originalPrice,
                      price: newBook.price > 0 ? newBook.price : mergedList[index].price,
                    });
              updatedCount++;
            } else {
              mergedList.push({
                ...newBook,
                id: generateNextBookId([...mergedList, ...importedBooks]),
              });
              addedCount++;
            }
          });

          setBooks(mergedList);
          showToast(
            sheetsMergeMode === "fillMissing"
              ? `شيت: ${addedCount} جديد، ${updatedCount} بحقول ناقصة فقط`
              : `مزامنة Google Sheets: ${addedCount} جديد، ${updatedCount} محدّث`,
            "success"
          );
        }
        setIsSheetsOpen(false);
      } else {
        showToast(
          data.message ||
            "لم نجد عناوين كتب بالملف. تأكدي من صف العناوين (اسم الكتاب، الكاتب...)",
          "info"
        );
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

  // Multi-Library Search Handler
  const handleLibrarySearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!librarySearchQuery.trim()) return;
    setLibrarySearchLoading(true);
    setLibrarySearchResults([]);
    try {
      const filter = (librarySourceFilter === "all"
        ? "all"
        : librarySourceFilter) as LibrarySourceKey | "all";

      let { books, sourceSummary } = await searchLibrariesClient(
        librarySearchQuery.trim(),
        filter
      );

      if (books.length === 0) {
        const res = await fetch(
          `/api/search-libraries?q=${encodeURIComponent(librarySearchQuery)}&source=${librarySourceFilter}`
        );
        const data = await res.json();
        books = data.books || [];
        sourceSummary = data.sourceSummary || {};
      }

      if (books.length > 0) {
        setLibrarySearchResults(books);
        setLibrarySourceSummary(sourceSummary);
        const activeSources = Object.values(sourceSummary).filter((n) => n > 0).length;
        showToast(`تم العثور على ${books.length} نتيجة من ${activeSources} مصدر!`, "success");
      } else {
        setLibrarySearchResults([]);
        setLibrarySourceSummary({});
        showToast("لم نجد نتائج مطابقة لبحثك في المكتبات المتاحة.", "info");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطأ غير معروف";
      showToast(`فشل البحث في المكتبات: ${message}`, "error");
    } finally {
      setLibrarySearchLoading(false);
    }
  };

  // Multi-Library Import Action
  const handleLibraryImport = (libBook: {
    title: string;
    author?: string;
    category?: string;
    language?: string;
    publisher?: string;
    pageCount?: number;
    coverUrl?: string;
    description?: string;
    isbn?: string;
    source: string;
  }) => {
    const bTitle = libBook.title;
    if (!bTitle) return;

    const isDup = books.some(b => b.title.trim().toLowerCase() === bTitle.trim().toLowerCase());
    if (isDup) {
      showToast(`تنبيه: كتاب "${bTitle}" موجود بالفعل في جردك الموحد!`, "error");
      return;
    }

    const newBook: Book = {
      id: `BOO-LIB-${Date.now()}`,
      charGroup: bTitle.charAt(0),
      title: bTitle,
      type: "هاي كوبي",
      author: libBook.author || "غير معروف",
      category: libBook.category || "عام",
      series: "",
      subCategories: libBook.category || "",
      originalPrice: 0,
      price: 0,
      quantity: 5,
      language: libBook.language || "عربي",
      publisher: libBook.publisher || "",
      pageCount: libBook.pageCount || 250,
      coverUrl: libBook.coverUrl || "",
      notes: libBook.description || "",
      isbn: libBook.isbn || "",
      libraryName: `مستورد من ${libBook.source}`
    };

    setBooks([newBook, ...books]);
    showToast(`تم استيراد "${bTitle}" — حدّدي سعر الشراء والبيع من التعديل`, "success");
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
      originalPrice: 0,
      price: 0,
      quantity: 5,
      language: info.language === "ar" ? "عربي" : "إنجليزي",
      publisher: info.publisher || "ناشر عام",
      pageCount: info.pageCount || 250,
      coverUrl: thumb,
      notes: info.description ? info.description.slice(0, 180) + "..." : "",
      isbn:
        info.industryIdentifiers?.find(
          (id: { type?: string }) => id.type === "ISBN_13" || id.type === "ISBN_10"
        )?.identifier || "",
      libraryName: "مستكشف جوجل للأبحاث"
    };

    setBooks([newBook, ...books]);
    showToast(`تم استيراد "${bTitle}" — حدّدي سعر الشراء والبيع من التعديل`, "success");
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

    const newBook: Book = {
      id: generateNextBookId(books),
      charGroup: title.trim().charAt(0),
      title: title.trim(),
      type: bookType,
      author: author.trim() || "غير معروف",
      category: category.trim(),
      series: series.trim(),
      subCategories: "",
      originalPrice: parseFloat(purchasePrice) || 0,
      price: parseFloat(salePrice) || 0,
      quantity: 5,
      language: language.trim(),
      publisher: publisher.trim(),
      pageCount: parseInt(pageCount) || 250,
      coverUrl: coverUrl.trim(),
      notes: notes.trim(),
      isbn: isbn.trim(),
      libraryName: "وحدة التحكم ويب"
    };

    setBooks([newBook, ...books]);
    setIsAddOpen(false);
    showToast(`تم إضافة كتاب "${title}" بنجاح!`);
    resetAddBookForm();
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
      const newBooks: Book[] = [];
      
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

        const purchasePr = parseFloat(cols[8]) || 0;
        const salePr = parseFloat(cols[9]) || 0;

        const nb: Book = {
          id: `BOO-CSV-${Date.now()}-${i}`,
          charGroup: bTitle.charAt(0),
          title: bTitle,
          type: normalizeTypeValue(cols[3] || "هاي كوبي"),
          author: cols[4] || "غير معروف",
          category: cols[5] || "رواية",
          series: cols[6] || "",
          subCategories: cols[7] || "",
          originalPrice: purchasePr,
          price: salePr,
          quantity: parseInt(cols[10]) || parseInt(cols[11]) || 5,
          language: cols[12] || "عربي",
          publisher: cols[13] || "",
          pageCount: parseInt(cols[14]) || 250,
          coverUrl: cols[16] || cols[15] || "",
          notes: cols[17] || cols[16] || "",
          isbn: cols[15] || "",
          libraryName: cols[18] || cols[17] || "مستورد من ملف"
        };
        newBooks.push(normalizeStoredBook(nb));
        added++;
      }
      setBooks([...books, ...newBooks]);
      setIsCsvOpen(false);
      setCsvInput("");
      showToast(`تم استيراد ${added} كتب بنجاح وتفادي مكررات لحوالي ${skipped} كتب!`, "success");
    } catch (err: any) {
      showToast(`فشل قراءة الملف: ${err.message}`, "error");
    }
  };

  // CSV Export action
  const handleExportCsv = () => {
    let header = "Book ID,الحرف,اسم الكتاب,نوع الكتاب,اسم الكاتب,التصنيف الرئيسي,اسم السلسلة,تصنيفات فرعية,سعر الشراء,سعر البيع,الكمية المتاحة,لغة الكتاب,دار النشر,عدد الصفحات,ISBN,رابط صورة الغلاف,ملاحظات,اسم المكتبة\n";
    const body = books.map(b => [
      b.id, b.charGroup, `"${b.title}"`, `"${b.type}"`, `"${b.author}"`, `"${b.category}"`, `"${b.series}"`, `"${b.subCategories}"`, b.originalPrice, b.price, b.quantity, `"${b.language}"`, `"${b.publisher}"`, b.pageCount, `"${b.isbn || ""}"`, `"${b.coverUrl}"`, `"${b.notes}"`, `"${b.libraryName}"`
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
  const inventoryStats = useMemo(() => {
    const original = books.filter((b) => isOriginalBook(b)).length;
    const highCopy = books.length - original;
    return { original, highCopy, total: books.length };
  }, [books]);

  const filteredBooks = useMemo(() => {
    const filtered = books.filter((b) => {
      // Real-time search: filters by Title and Author
      const matchesSearch = !search.trim() || 
        b.title.toLowerCase().includes(search.toLowerCase()) || 
        b.author.toLowerCase().includes(search.toLowerCase()) ||
        (b.isbn || "").toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = categoryFilter === "الكل" || b.category === categoryFilter;
      const matchesAuthor = authorFilter === "الكل" || b.author === authorFilter;
      const matchesPrice = b.price <= priceLimit;
      const matchesInventoryMode =
        inventoryMode === "all"
          ? true
          : inventoryMode === "original"
            ? isOriginalBook(b)
            : !isOriginalBook(b);

      return matchesSearch && matchesCategory && matchesAuthor && matchesPrice && matchesInventoryMode;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortBy === "priceAsc") return a.price - b.price;
      if (sortBy === "priceDesc") return b.price - a.price;
      if (sortBy === "author") return a.author.localeCompare(b.author, "ar");
      if (sortBy === "category") return a.category.localeCompare(b.category, "ar");
      if (sortBy === "id") return a.id.localeCompare(b.id, "ar");
      if (sortBy === "quantity") return (b.quantity || 0) - (a.quantity || 0);
      return a.title.localeCompare(b.title, "ar");
    });
    return sorted;
  }, [books, search, categoryFilter, authorFilter, priceLimit, inventoryMode, sortBy]);

  const toggleBookSelection = (id: string) => {
    setSelectedBookIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    const ids = filteredBooks.map((b) => b.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedBookIds.has(id));
    setSelectedBookIds((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

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
      <header className="bg-white dark:bg-[#001D35] text-[#001D35] dark:text-white py-8 px-6 sm:px-12 relative overflow-hidden border-b border-[#E1E2EC] dark:border-slate-800">

          <div className="absolute top-6 left-6 z-10 flex gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-300 hover:scale-105 transition-all"
                title="تغيير المظهر"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
          </div>

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
                <p className="text-[10px] text-stone-500 mt-1 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  التخزين:{" "}
                  {storageMode === "mongodb"
                    ? "MongoDB + محلي"
                    : storageMode === "hybrid"
                      ? "محلي (مزامنة مع السحابة)"
                      : "محلي في المتصفح"}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Link href="/books" className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#F1F4F9] border border-[#E1E2EC] hover:bg-white">
                    مكتبة الكتب
                  </Link>
                  <Link href="/books/original" className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100">
                    أوريجينال
                  </Link>
                  <Link href="/books/high-copy" className="text-[10px] font-bold px-2 py-1 rounded-lg bg-violet-50 border border-violet-200 text-violet-800 hover:bg-violet-100">
                    هاي كوبي
                  </Link>
                </div>
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
              onClick={() => setIsLibrarySearchOpen(true)}
              className="px-4 py-2 bg-violet-50 hover:bg-violet-100/80 text-violet-800 border border-violet-200 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95"
            >
              <Library className="w-3.5 h-3.5 text-violet-600" />
              البحث في المكتبات
            </button>

            <button 
              onClick={() => setIsCsvOpen(true)}
              className="px-4 py-2 bg-[#F1F4F9] hover:bg-[#E2E2E6] text-[#1A1C1E] border border-[#E1E2EC] rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-[#005AC1]" />
              استيراد CSV
            </button>
            <button
              type="button"
              onClick={handleSmartBatch50}
              disabled={refreshAllLoading || books.length === 0}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold disabled:opacity-40"
              title="تحديث 50 كتاب التالية (لم تُحدَّث مؤخراً) — حفظ فوري"
            >
              {refreshAllLoading ? `${refreshProgress.current}/${refreshProgress.total}` : "50"}
            </button>
            <button
              type="button"
              onClick={handleSmartBatch100}
              disabled={refreshAllLoading || books.length === 0}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold disabled:opacity-40"
              title="تحديث 100 كتاب التالية"
            >
              100
            </button>
            <button
              type="button"
              onClick={handleSmartBatch200}
              disabled={refreshAllLoading || books.length === 0}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold disabled:opacity-40"
              title="تحديث 200 كتاب التالية"
            >
              200
            </button>
            <button
              type="button"
              onClick={handleRefreshSelected}
              disabled={refreshAllLoading || selectedBookIds.size === 0}
              className="px-4 py-2 bg-orange-50 hover:bg-orange-100/80 text-orange-900 border border-orange-200 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all disabled:opacity-40"
              title="تحديث الكتب المحددة فقط"
            >
              <Check className="w-3.5 h-3.5" />
              تحديث المحدد ({selectedBookIds.size})
            </button>

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

            <button
              type="button"
              onClick={handleRefreshAllBooks}
              disabled={refreshAllLoading || books.length === 0}
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
              title="تحديث كل الجرد — الأسعار تبقى كما هي"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${refreshAllLoading ? "animate-spin" : ""}`} />
              {refreshAllLoading && refreshProgress.total > 0
                ? `تحديث ${refreshProgress.current}/${refreshProgress.total}`
                : "تحديث الكل"}
            </button>
            <button
              type="button"
              onClick={handleRefreshOriginalBooks}
              disabled={refreshAllLoading || books.filter((b) => isOriginalBook(b)).length === 0}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-200 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
              title="تحديث كتب الأوريجينال فقط دون تغيير الأسعار"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${refreshAllLoading ? "animate-spin" : ""}`} />
              تحديث الأوريجينال
            </button>
            <button
              type="button"
              onClick={handleRefreshHighCopyBooks}
              disabled={refreshAllLoading || books.filter((b) => !isOriginalBook(b)).length === 0}
              className="px-4 py-2 bg-sky-50 hover:bg-sky-100/80 text-sky-900 border border-sky-200 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
              title="تحديث كتب الهاي كوبي فقط دون تغيير الأسعار"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${refreshAllLoading ? "animate-spin" : ""}`} />
              تحديث الهاي كوبي
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
              <p className="text-[#001D35] text-xs font-bold opacity-80">العناوين المقيدة (عدد الكتب المختلفة)</p>
              <h3 className="text-2xl font-black text-[#001D35] mt-1">{inventoryStats.total}</h3>
              <p className="text-[10px] text-[#005AC1] font-bold mt-1">
                أوريجينال {inventoryStats.original} · هاي كوبي {inventoryStats.highCopy}
              </p>
            </div>
          </div>
          <div className="bg-[#E2E2E6] p-5 rounded-2xl border border-[#E1E2EC] flex items-center gap-4">
            <div className="p-3 bg-white/50 text-[#1A1C1E] rounded-xl"><TrendingUp className="w-6 h-6" /></div>
            <div>
              <p className="text-[#1A1C1E] text-xs font-bold opacity-80">إجمالي النسخ (مجموع الكميات)</p>
              <h3 className="text-2xl font-black text-[#1A1C1E] mt-1">{books.reduce((acc, b) => acc + (b.quantity || 5), 0)}</h3>
              <p className="text-[10px] text-stone-500 mt-0.5">{inventoryStats.total} عنوان مختلف</p>
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
                  placeholder="ابحث بالاسم أو الكاتب أو ISBN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2 bg-[#F1F4F9] border border-[#E1E2EC] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1] focus:bg-white transition-all text-[#1A1C1E]"
                />
              </div>

              <div className="w-full md:w-44">
                <label htmlFor="sort-by" className="sr-only">ترتيب الجدول</label>
                <select
                  id="sort-by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="w-full px-3 py-2 bg-[#F1F4F9] border border-[#E1E2EC] rounded-xl text-xs font-bold text-[#1A1C1E]"
                >
                  <option value="title">ترتيب: اسم الكتاب</option>
                  <option value="author">ترتيب: الكاتب</option>
                  <option value="category">ترتيب: التصنيف</option>
                  <option value="id">ترتيب: Book ID</option>
                  <option value="quantity">ترتيب: الكمية</option>
                  <option value="priceAsc">ترتيب: سعر البيع ↑</option>
                  <option value="priceDesc">ترتيب: سعر البيع ↓</option>
                </select>
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
                {(search.trim() || categoryFilter !== "الكل" || authorFilter !== "الكل" || priceLimit < 300 || inventoryMode !== "all") && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setCategoryFilter("الكل");
                      setAuthorFilter("الكل");
                      setPriceLimit(300);
                      setInventoryMode("all");
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
                  <label
                    id="author-filter-label"
                    htmlFor="author-filter"
                    className="block text-xs font-bold text-[#44474E]"
                  >
                    الكاتب المعتمد
                  </label>
                  <select
                    id="author-filter"
                    name="authorFilter"
                    aria-labelledby="author-filter-label"
                    aria-label="الكاتب المعتمد"
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
                  <label
                    id="price-limit-label"
                    htmlFor="price-limit"
                    className="flex justify-between items-center text-xs font-bold text-[#44474E]"
                  >
                    <span>تصفية الحد الأقصى للسعر</span>
                    <span className="text-[#005AC1] bg-white px-2 py-0.5 rounded-md border border-[#E1E2EC]">{priceLimit} ج.م</span>
                  </label>
                  <input
                    id="price-limit"
                    name="priceLimit"
                    type="range"
                    min="10"
                    max="500"
                    step="5"
                    value={priceLimit}
                    onChange={(e) => setPriceLimit(parseInt(e.target.value))}
                    aria-labelledby="price-limit-label"
                    aria-label="تصفية الحد الأقصى للسعر"
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

            {/* Inventory Mode Tabs */}
            <div className="flex flex-wrap gap-2 items-center pt-1">
              <span className="text-xs text-stone-500 font-bold leading-none ml-2">نوع المخزون:</span>
              {[
                { key: "all", label: "الكل" },
                { key: "original", label: "أوريجينال (دور نشر)" },
                { key: "highcopy", label: "هاي كوبي (أي مصدر)" },
              ].map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setInventoryMode(mode.key as "all" | "original" | "highcopy")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    inventoryMode === mode.key
                      ? "bg-[#001D35] text-white"
                      : "bg-[#F1F4F9] hover:bg-[#E2E2E6] text-stone-700"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

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
                    <th className="py-4 px-3 w-10">
                      <input
                        type="checkbox"
                        aria-label="تحديد كل الكتب الظاهرة"
                        checked={
                          filteredBooks.length > 0 &&
                          filteredBooks.every((b) => selectedBookIds.has(b.id))
                        }
                        onChange={toggleSelectAllFiltered}
                        className="accent-[#005AC1] w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="py-4 px-4">Book ID</th>
                    <th className="py-4 px-6">الغلاف</th>
                    <th className="py-4 px-6 cursor-pointer hover:text-[#005AC1]" onClick={() => setSortBy("title")}>اسم الكتاب ⇕</th>
                    <th className="py-4 px-6">النوع</th>
                    <th className="py-4 px-6 cursor-pointer hover:text-[#005AC1]" onClick={() => setSortBy("author")}>الكاتب ⇕</th>
                    <th className="py-4 px-6">التصنيف الرئيسي</th>
                    <th className="py-4 px-6 text-center">عدد الصفحات</th>
                    <th className="py-4 px-6">ISBN</th>
                    <th className="py-4 px-6 text-center cursor-pointer hover:text-[#005AC1]" onClick={() => setSortBy("priceAsc")}>سعر الشراء ⇕</th>
                    <th className="py-4 px-6 text-center cursor-pointer hover:text-[#005AC1]" onClick={() => setSortBy("priceDesc")}>سعر البيع ⇕</th>
                    <th className="py-4 px-6 text-center">خيارات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E2EC]">
                  {filteredBooks.map(b => (
                    <tr key={b.id} className={`hover:bg-blue-50/20 transition-all group ${selectedBookIds.has(b.id) ? "bg-blue-50/40" : ""}`}>
                      <td className="py-4 px-3">
                        <input
                          type="checkbox"
                          checked={selectedBookIds.has(b.id)}
                          onChange={() => toggleBookSelection(b.id)}
                          aria-label={`تحديد ${b.title}`}
                          className="accent-[#005AC1] w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-4 font-mono text-[11px] text-stone-500">{b.id}</td>
                      <td className="py-4 px-6">
                        <div className="w-10 h-14 rounded-md border border-[#E1E2EC] overflow-hidden bg-[#F1F4F9] flex items-center justify-center text-[10px] font-bold text-[#005AC1] text-center shadow-inner">
                          {b.coverUrl ? (
                            <img src={b.coverUrl} alt={b.title} className="w-full h-full object-cover" />
                          ) : (
                            b.title.slice(0, 2)
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold group-hover:text-[#005AC1] transition-colors">
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
</td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            isOriginalBook(b)
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-violet-100 text-violet-800 border border-violet-200"
                          }`}
                        >
                          {b.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-stone-600">{b.author}</td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 text-xs font-bold bg-[#FDF1BA] text-[#5D4037] rounded-md">
                          {b.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center text-stone-500">{b.pageCount} ص</td>
                      <td className="py-4 px-6 text-stone-500 font-mono text-[11px] ltr">
                        {b.isbn || "—"}
                      </td>
                      <td className="py-4 px-6 text-center text-amber-800 font-bold">
                        {b.originalPrice} ج.م
                      </td>
                      <td className="py-4 px-6 text-center text-[#005AC1] font-extrabold">
                        {b.price} ج.م
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingBook({ ...b })}
                            aria-label={`تعديل ${b.title}`}
                            title="تعديل"
                            className="p-1.5 text-stone-400 hover:text-[#005AC1] hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Pencil className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRefreshSingleBook(b)}
                            disabled={refreshingBookId === b.id}
                            aria-label={`تحديث بيانات ${b.title} دون تغيير الأسعار`}
                            title="تحديث البيانات (بدون أسعار)"
                            className="p-1.5 text-stone-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all disabled:opacity-40"
                          >
                            <RefreshCw
                              className={`w-4 h-4 ${refreshingBookId === b.id ? "animate-spin" : ""}`}
                              aria-hidden="true"
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBook(b.id, b.title)}
                            aria-label={`حذف كتاب ${b.title}`}
                            title={`حذف ${b.title}`}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
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
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                aria-label="إغلاق نافذة إضافة كتاب"
                title="إغلاق"
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleAddBook} className="space-y-4">
              <div>
                <label htmlFor="book-title" className="block text-xs font-bold text-stone-600 mb-1">
                  اسم الكتاب
                </label>
                <div className="flex gap-2">
                  <input 
                    id="book-title"
                    name="title"
                    type="text" 
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    aria-label="اسم الكتاب"
                    placeholder="اكتب هنا ثم اضغط سحب للحصول كلياً على البيانات..."
                    className={`flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1] ${isDuplicate ? "border-rose-400 text-rose-800" : "border-[#E1E2EC]"}`}
                  />
                  <button
                    type="button"
                    disabled={!title.trim() || apiLoading}
                    onClick={handleAutoFetch}
                    className="px-4 bg-[#005AC1] hover:bg-[#00479e] text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all active:scale-95 disabled:opacity-40 whitespace-nowrap"
                  >
                    {apiLoading ? "جاري الجلب..." : "إكمال تلقائي"}
                  </button>
                </div>
                {(booksApiConfig.hasGemini ||
                  booksApiConfig.hasGoogleBooksServer ||
                  booksApiConfig.hasGoogleBooksClient) && (
                  <p className="text-[10px] text-emerald-700 font-semibold mt-1.5 flex flex-wrap gap-1.5">
                    <span>مفاتيح API مفعّلة:</span>
                    {booksApiConfig.hasGoogleBooksClient && (
                      <span className="px-1.5 py-0.5 bg-emerald-50 rounded border border-emerald-200">
                        Google (متصفح)
                      </span>
                    )}
                    {booksApiConfig.hasGoogleBooksServer && (
                      <span className="px-1.5 py-0.5 bg-emerald-50 rounded border border-emerald-200">
                        Google (سيرفر)
                      </span>
                    )}
                    {booksApiConfig.hasGemini && (
                      <span className="px-1.5 py-0.5 bg-violet-50 rounded border border-violet-200 text-violet-800">
                        Gemini AI
                      </span>
                    )}
                  </p>
                )}
                {isDuplicate && (
                  <p className="text-rose-600 text-xs mt-1.5 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    اسم الكتاب مسجل مسبقاً بجرد Bookella لمنع تكرار المخزون!
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="book-type" className="block text-xs font-bold text-stone-600 mb-1">
                    نوع الكتاب
                  </label>
                  <select
                    id="book-type"
                    value={bookType}
                    onChange={(e) => setBookType(e.target.value as "أوريجينال" | "هاي كوبي")}
                    className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm font-bold focus:outline-none focus:ring-1 focus:ring-[#005AC1]"
                  >
                    <option value="هاي كوبي">هاي كوبي (أي مصدر)</option>
                    <option value="أوريجينال">أوريجينال (دور نشر)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="book-author" className="block text-xs font-bold text-stone-600 mb-1">
                    الكاتب
                  </label>
                  <input 
                    id="book-author"
                    name="author"
                    type="text" 
                    value={author} 
                    onChange={(e) => setAuthor(e.target.value)}
                    aria-label="الكاتب"
                    placeholder="اسم المؤلف"
                    className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1]"
                  />
                </div>
                <div>
                  <label htmlFor="book-category" className="block text-xs font-bold text-stone-600 mb-1">
                    التصنيف
                  </label>
                  <input 
                    id="book-category"
                    name="category"
                    type="text" 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    aria-label="التصنيف"
                    placeholder="مثال: رواية، تطوير الذات"
                    className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="book-publisher" className="block text-xs font-bold text-stone-600 mb-1">
                    دار النشر
                  </label>
                  <input
                    id="book-publisher"
                    name="publisher"
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    aria-label="دار النشر"
                    placeholder="اسم دار النشر"
                    className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1]"
                  />
                </div>
                <div>
                  <label htmlFor="book-page-count" className="block text-xs font-bold text-stone-600 mb-1">
                    عدد الصفحات
                  </label>
                  <input 
                    id="book-page-count"
                    name="pageCount"
                    type="number" 
                    value={pageCount} 
                    onChange={(e) => setPageCount(e.target.value)}
                    aria-label="عدد الصفحات"
                    placeholder="250"
                    className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="book-isbn" className="block text-xs font-bold text-stone-600 mb-1">
                    ISBN
                  </label>
                  <input
                    id="book-isbn"
                    name="isbn"
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    aria-label="ISBN"
                    placeholder="978-..."
                    className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1] ltr text-left"
                  />
                </div>
                <div>
                  <label htmlFor="book-language" className="block text-xs font-bold text-[#44474E] mb-1">
                    اللغة
                  </label>
                  <input 
                    id="book-language"
                    name="language"
                    type="text" 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                    aria-label="لغة الكتاب"
                    placeholder="عربي"
                    className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="book-notes" className="block text-xs font-bold text-stone-600 mb-1">
                  ملاحظات / ملخص
                </label>
                <input
                  id="book-notes"
                  name="notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  aria-label="ملاحظات أو ملخص الكتاب"
                  placeholder="ملخص قصير أو ملاحظات"
                  className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 bg-[#F8F9FF] border border-[#E1E2EC] p-4 rounded-2xl">
                <div>
                  <label htmlFor="book-purchase-price" className="block text-xs font-bold text-amber-900 mb-1">
                    سعر الشراء (ج.م) — من المكتبة
                  </label>
                  <input
                    id="book-purchase-price"
                    name="purchasePrice"
                    type="number"
                    min="0"
                    step="1"
                    value={purchasePrice} placeholder="سعر الشراء (تكلفتك)" title="سعر الشراء"
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    aria-label="سعر الشراء من المكتبة"
                    className="w-full px-3 py-2 border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="book-sale-price" className="block text-xs font-bold text-[#005AC1] mb-1">
                    سعر البيع (ج.م) — للعميل
                  </label>
                  <input
                    id="book-sale-price"
                    name="salePrice"
                    type="number"
                    min="0"
                    step="1"
                    value={salePrice} placeholder="سعر البيع للعميل" title="سعر البيع"
                    onChange={(e) => setSalePrice(e.target.value)}
                    aria-label="سعر البيع للعميل"
                    className="w-full px-3 py-2 border border-[#D6E3FF] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1] bg-white"
                  />
                </div>
                <p className="col-span-2 text-[10px] text-stone-500 font-medium">
                  الأسعار يدوية بالكامل — التحديث التلقائي من المكتبات لا يغيّرها.
                </p>
              </div>

              <div>
                <label htmlFor="book-cover-url" className="block text-xs font-bold text-[#44474E] mb-1">
                  رابط صورة الغلاف
                </label>
                <input 
                  id="book-cover-url"
                  name="coverUrl"
                  type="url" 
                  value={coverUrl} 
                  onChange={(e) => setCoverUrl(e.target.value)}
                  aria-label="رابط صورة الغلاف"
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1] ltr text-left"
                />
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

      {/* Edit book Overlay */}
      {editingBook && (
        <div className="fixed inset-0 z-50 bg-[#001D35]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-[#E1E2EC]">
            <div className="flex items-center justify-between border-b border-[#E1E2EC] pb-4 mb-4">
              <h2 className="text-xl font-bold text-[#001D35] flex items-center gap-2">
                <Pencil className="w-5 h-5 text-[#005AC1]" />
                تعديل: {editingBook.title}
              </h2>
              <button
                type="button"
                onClick={() => setEditingBook(null)}
                aria-label="إغلاق نافذة التعديل"
                title="إغلاق"
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={refreshingBookId === editingBook.id}
                  onClick={() => handleRefreshSingleBook(editingBook)}
                  className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold rounded-lg flex items-center gap-1 disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshingBookId === editingBook.id ? "animate-spin" : ""}`} />
                  تحديث البيانات (بدون أسعار)
                </button>
              </div>

              <div>
                <label htmlFor="edit-book-id" className="block text-xs font-bold text-stone-600 mb-1">
                  Book ID
                </label>
                <input
                  id="edit-book-id"
                  type="text"
                  value={editingBook.id}
                  onChange={(e) => setEditingBook({ ...editingBook, id: e.target.value.trim() })}
                  className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm font-mono ltr"
                />
              </div>

              <div>
                <label htmlFor="edit-book-type" className="block text-xs font-bold text-stone-600 mb-1">
                  نوع الكتاب
                </label>
                <select
                  id="edit-book-type"
                  value={editingBook.type}
                  onChange={(e) =>
                    setEditingBook({
                      ...editingBook,
                      type: normalizeTypeValue(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm font-bold"
                >
                  <option value="هاي كوبي">هاي كوبي</option>
                  <option value="أوريجينال">أوريجينال</option>
                </select>
              </div>

              <div>
                <label htmlFor="edit-title" className="block text-xs font-bold text-stone-600 mb-1">اسم الكتاب</label>
                <input
                  id="edit-title"
                  type="text"
                  required
                  value={editingBook.title}
                  onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#005AC1]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-author" className="block text-xs font-bold text-stone-600 mb-1">الكاتب</label>
                  <input
                    id="edit-author"
                    type="text"
                    value={editingBook.author}
                    onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="edit-category" className="block text-xs font-bold text-stone-600 mb-1">التصنيف</label>
                  <input
                    id="edit-category"
                    type="text"
                    value={editingBook.category}
                    onChange={(e) => setEditingBook({ ...editingBook, category: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-[#F8F9FF] border border-[#E1E2EC] p-4 rounded-2xl">
                <div>
                  <label htmlFor="edit-purchase" className="block text-xs font-bold text-amber-900 mb-1">سعر الشراء (ج.م)</label>
                  <input
                    id="edit-purchase"
                    type="number"
                    min="0"
                    value={editingBook.originalPrice}
                    onChange={(e) =>
                      setEditingBook({ ...editingBook, originalPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-amber-200 rounded-xl text-sm bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="edit-sale" className="block text-xs font-bold text-[#005AC1] mb-1">سعر البيع (ج.م)</label>
                  <input
                    id="edit-sale"
                    type="number"
                    min="0"
                    value={editingBook.price}
                    onChange={(e) =>
                      setEditingBook({ ...editingBook, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-[#D6E3FF] rounded-xl text-sm bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-publisher" className="block text-xs font-bold text-stone-600 mb-1">دار النشر</label>
                  <input
                    id="edit-publisher"
                    type="text"
                    value={editingBook.publisher}
                    onChange={(e) => setEditingBook({ ...editingBook, publisher: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="edit-pages" className="block text-xs font-bold text-stone-600 mb-1">عدد الصفحات</label>
                  <input
                    id="edit-pages"
                    type="number"
                    value={editingBook.pageCount}
                    onChange={(e) =>
                      setEditingBook({ ...editingBook, pageCount: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-isbn" className="block text-xs font-bold text-stone-600 mb-1">ISBN</label>
                  <input
                    id="edit-isbn"
                    type="text"
                    value={editingBook.isbn}
                    onChange={(e) => setEditingBook({ ...editingBook, isbn: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm ltr text-left"
                  />
                </div>
                <div>
                  <label htmlFor="edit-language" className="block text-xs font-bold text-stone-600 mb-1">اللغة</label>
                  <input
                    id="edit-language"
                    type="text"
                    value={editingBook.language}
                    onChange={(e) => setEditingBook({ ...editingBook, language: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-cover" className="block text-xs font-bold text-stone-600 mb-1">رابط الغلاف</label>
                <input
                  id="edit-cover"
                  type="url"
                  value={editingBook.coverUrl}
                  onChange={(e) => setEditingBook({ ...editingBook, coverUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm ltr text-left"
                />
              </div>

              <div>
                <label htmlFor="edit-notes" className="block text-xs font-bold text-stone-600 mb-1">ملاحظات</label>
                <input
                  id="edit-notes"
                  type="text"
                  value={editingBook.notes}
                  onChange={(e) => setEditingBook({ ...editingBook, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E1E2EC] rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBook(null)}
                  className="flex-1 py-2.5 border border-[#E1E2EC] text-stone-700 text-sm font-bold rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#005AC1] text-white text-sm font-bold rounded-xl"
                >
                  حفظ التعديلات
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
              <button
                type="button"
                onClick={() => setIsCsvOpen(false)}
                aria-label="إغلاق نافذة استيراد CSV"
                title="إغلاق"
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" aria-hidden="true" />
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
              <button
                type="button"
                onClick={() => setIsSheetsOpen(false)}
                aria-label="إغلاق نافذة Google Sheets"
                title="إغلاق"
                className="text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
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
                    <label className="block text-xs font-bold text-stone-700">نوع الكتب من الشيت (إن لم يُذكر في الملف)</label>
                    <div className="flex bg-[#F1F4F9] rounded-xl p-1 border border-[#E1E2EC]">
                      <button
                        type="button"
                        onClick={() => setSheetDefaultType("هاي كوبي")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          sheetDefaultType === "هاي كوبي"
                            ? "bg-white text-violet-800 shadow-sm"
                            : "text-stone-500"
                        }`}
                      >
                        هاي كوبي
                      </button>
                      <button
                        type="button"
                        onClick={() => setSheetDefaultType("أوريجينال")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          sheetDefaultType === "أوريجينال"
                            ? "bg-white text-emerald-800 shadow-sm"
                            : "text-stone-500"
                        }`}
                      >
                        أوريجينال
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">آلية مزامنة المخزون</label>
                  <div className="flex flex-wrap bg-[#F1F4F9] rounded-xl p-1 border border-[#E1E2EC] gap-1">
                    <button
                      type="button"
                      onClick={() => setSheetsMergeMode("fillMissing")}
                      className={`flex-1 min-w-[120px] py-1.5 rounded-lg text-xs font-bold transition-all ${
                        sheetsMergeMode === "fillMissing"
                          ? "bg-white text-emerald-800 shadow-sm"
                          : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      حقول ناقصة فقط
                    </button>
                    <button
                      type="button"
                      onClick={() => setSheetsMergeMode("merge")}
                      className={`flex-1 min-w-[120px] py-1.5 rounded-lg text-xs font-bold transition-all ${
                        sheetsMergeMode === "merge"
                          ? "bg-white text-emerald-800 shadow-sm"
                          : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      دمج وتحديث
                    </button>
                    <button
                      type="button"
                      onClick={() => setSheetsMergeMode("replace")}
                      className={`flex-1 min-w-[120px] py-1.5 rounded-lg text-xs font-bold transition-all ${
                        sheetsMergeMode === "replace"
                          ? "bg-white text-red-700 shadow-sm"
                          : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      استبدال الجرد
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-500">
                    «حقول ناقصة فقط» لا يغيّر بيانات موجودة — يملأ الفراغات ويفصل سعر الشراء عن البيع.
                  </p>
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
              <button
                type="button"
                onClick={() => setIsExplorerOpen(false)}
                aria-label="إغلاق مستكشف Google Books"
                title="إغلاق"
                className="text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
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
                              حدّدي الأسعار بعد الاستيراد
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
      {/* Multi-Library Search Modal */}
      {isLibrarySearchOpen && (
        <div className="fixed inset-0 z-50 bg-[#001D35]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[88vh] p-8 shadow-2xl animate-in fade-in-50 zoom-in-95 border border-violet-100 flex flex-col overflow-hidden relative">
            {/* Top decorative banner */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-l from-violet-500 via-purple-500 to-indigo-500" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E1E2EC] pb-4 mb-5 shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-gradient-to-br from-violet-50 to-purple-50 text-violet-700 rounded-xl border border-violet-100">
                  <Library className="w-6 h-6" />
                </span>
                <div>
                  <h2 className="text-xl font-extrabold text-[#001D35]">البحث الموحد في المكتبات العالمية</h2>
                  <p className="text-xs text-violet-600 font-bold mt-0.5">12 مصدر عالمي — يكفي اسم الكتاب أو المؤلف أو ISBN</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLibrarySearchOpen(false)}
                aria-label="إغلاق البحث في المكتبات"
                title="إغلاق"
                className="text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Source Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 mb-4 shrink-0">
              <span className="text-xs font-bold text-stone-500 ml-1"><Filter className="w-3.5 h-3.5 inline ml-1" />المصدر:</span>
              {[
                { key: "all", label: "الكل", icon: "🌐" },
                { key: "google", label: "Google Books", icon: "📚" },
                { key: "openlibrary", label: "Open Library", icon: "📖" },
                { key: "itbooks", label: "IT Bookstore", icon: "💻" },
                { key: "gutenberg", label: "Gutenberg", icon: "📜" },
                { key: "archive", label: "Internet Archive", icon: "🏛️" },
                { key: "wikidata", label: "Wikidata", icon: "🌐" },
                { key: "loc", label: "Library of Congress", icon: "🇺🇸" },
                { key: "bookbrainz", label: "BookBrainz", icon: "🧠" },
                { key: "crossref", label: "Crossref", icon: "🧾" },
                { key: "openalex", label: "OpenAlex", icon: "🎓" },
                { key: "nypl", label: "NYPL", icon: "🗽" },
                { key: "dpla", label: "DPLA", icon: "🇺🇸" },
              ].map(src => (
                <button
                  key={src.key}
                  onClick={() => setLibrarySourceFilter(src.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    librarySourceFilter === src.key
                      ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                      : "bg-[#F1F4F9] hover:bg-violet-50 text-stone-600 hover:text-violet-700 border border-[#E1E2EC]"
                  }`}
                >
                  <span>{src.icon}</span>
                  {src.label}
                  {librarySourceSummary[src.label === "الكل" ? "" : src.label] !== undefined && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                      librarySourceFilter === src.key ? "bg-white/20 text-white" : "bg-violet-100 text-violet-700"
                    }`}>
                      {librarySourceSummary[src.label] || 0}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search Form */}
            <form onSubmit={handleLibrarySearch} className="flex gap-2.5 mb-5 shrink-0">
              <div className="flex-1 relative">
                <span className="absolute right-3.5 top-3 text-stone-400"><Search className="w-4 h-4" /></span>
                <input
                  type="text"
                  value={librarySearchQuery}
                  onChange={(e) => setLibrarySearchQuery(e.target.value)}
                  placeholder="اكتب اسم الكتاب، المؤلف، ISBN، أو أي كلمة مفتاحية..."
                  className="w-full pr-10 pl-4 py-3 bg-[#F1F4F9] border border-[#E1E2EC] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all text-[#1A1C1E] font-semibold"
                />
              </div>
              <button
                type="submit"
                disabled={librarySearchLoading || !librarySearchQuery.trim()}
                className="px-6 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-violet-600/15"
              >
                {librarySearchLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    جاري البحث...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    بحث موحد
                  </>
                )}
              </button>
            </form>

            {/* Source Summary Bar */}
            {Object.keys(librarySourceSummary).length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4 shrink-0 p-3 bg-violet-50/50 rounded-xl border border-violet-100">
                <span className="text-xs font-bold text-violet-800">النتائج:</span>
                {Object.entries(librarySourceSummary).map(([src, count]) => (
                  <span key={src} className="px-2.5 py-1 bg-white rounded-lg text-[10px] font-bold text-stone-700 border border-violet-100 flex items-center gap-1">
                    {src === "Google Books" ? "📚" : src === "Open Library" ? "📖" : src === "IT Bookstore" ? "💻" : src === "Project Gutenberg" ? "📜" : src === "Internet Archive" ? "🏛️" : src === "Wikidata" ? "🌐" : src === "Library of Congress" ? "🇺🇸" : src === "BookBrainz" ? "🧠" : src === "Crossref" ? "🧾" : src === "OpenAlex" ? "🎓" : "📚"}
                    {src}: <span className="text-violet-700 font-black">{count}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Results Grid Scrollable */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {librarySearchLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 border-4 border-violet-200 rounded-full" />
                    <div className="absolute inset-0 w-14 h-14 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-stone-700">جاري البحث في المكتبات العالمية...</p>
                    <p className="text-xs text-stone-400 mt-1">Google • OpenLibrary • Gutenberg • Archive • Wikidata • LOC • BookBrainz • IT • Crossref • OpenAlex • NYPL • DPLA</p>
                  </div>
                </div>
              ) : librarySearchResults.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-stone-400 p-10 bg-[#F8F9FF] rounded-2xl border border-dashed border-violet-200">
                  <div className="relative">
                    <BookCopy className="w-14 h-14 text-violet-200" />
                  </div>
                  <div className="text-center max-w-md">
                    <p className="font-extrabold text-stone-600 text-sm">ابدأ البحث الموحد في المكتبات</p>
                    <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                      اكتب اسم كتاب أو مؤلف أو ISBN — النظام يبحث في 12 مصدر بالتوازي ويعرض أفضل النتائج
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {librarySearchResults
                    .filter(b => {
                      if (librarySourceFilter === "all") return true;
                      const sourceMap: Record<string, string> = {
                        google: "Google Books",
                        openlibrary: "Open Library",
                        itbooks: "IT Bookstore",
                        gutenberg: "Project Gutenberg",
                        archive: "Internet Archive",
                        wikidata: "Wikidata",
                        loc: "Library of Congress",
                        bookbrainz: "BookBrainz",
                        crossref: "Crossref",
                        openalex: "OpenAlex",
                        nypl: "NYPL",
                        dpla: "DPLA",
                      };
                      return b.source === sourceMap[librarySourceFilter];
                    })
                    .map((libBook, idx) => {
                    const isAlreadyImported = books.some(b => b.title.trim().toLowerCase() === libBook.title.trim().toLowerCase());

                    return (
                      <div key={libBook.id || idx} className="bg-white p-4 rounded-2xl border border-[#E1E2EC] hover:border-violet-200 transition-all flex gap-4 hover:shadow-lg hover:shadow-violet-50/30 group">
                        {/* Cover */}
                        <div className="w-16 h-24 bg-[#F1F4F9] rounded-xl overflow-hidden shadow-inner flex items-center justify-center shrink-0 border border-[#E1E2EC]">
                          {libBook.coverUrl ? (
                            <img src={libBook.coverUrl} alt={libBook.title} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-200" />
                          ) : (
                            <BookCopy className="w-6 h-6 text-stone-300" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-[#001D35] text-xs truncate flex-1" title={libBook.title}>{libBook.title}</h4>
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black shrink-0 bg-violet-50 text-violet-800 border border-violet-100`}>
                                {libBook.sourceIcon} {libBook.source}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#44474E] font-medium truncate mt-0.5">{libBook.author}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {libBook.category && (
                                <span className="px-2 py-0.5 bg-[#FDF1BA] text-[#5D4037] rounded text-[9px] font-bold truncate max-w-[120px]">
                                  {libBook.category}
                                </span>
                              )}
                              {libBook.pageCount > 0 && (
                                <span className="px-2 py-0.5 bg-[#E2E2E6] text-[#1A1C1E] rounded text-[9px] font-semibold">
                                  {libBook.pageCount} ص
                                </span>
                              )}
                              {libBook.language && (
                                <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded text-[9px] font-semibold">
                                  {libBook.language}
                                </span>
                              )}
                              {libBook.isbn && (
                                <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-[9px] font-mono">
                                  ISBN: {libBook.isbn}
                                </span>
                              )}
                            </div>
                            {libBook.description && (
                              <p className="text-[10px] text-stone-400 mt-1.5 line-clamp-2 leading-relaxed">{libBook.description}</p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#F1F4F9]">
                            <span className="text-[11px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-lg">
                              حدّدي الأسعار بعد الاستيراد
                            </span>

                            <div className="flex items-center gap-2">
                              {libBook.previewLink && (
                                <a
                                  href={libBook.previewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-stone-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                                  title="معاينة"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}

                              {isAlreadyImported ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-xl">
                                  <Check className="w-3.5 h-3.5" />
                                  مدرج بالجرد
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleLibraryImport(libBook)}
                                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold rounded-lg transition-all active:scale-95 shadow-sm"
                                >
                                  استيراد للجرد
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[#E1E2EC] pt-4 mt-4 flex items-center justify-between shrink-0">
              <p className="text-[10px] text-stone-400">
                يتم البحث في 8 مكتبات عالمية بالتوازي
              </p>
              <button
                type="button"
                onClick={() => setIsLibrarySearchOpen(false)}
                className="px-6 py-2 border border-[#E1E2EC] text-stone-700 text-xs font-bold rounded-xl active:scale-95 transition-all"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
