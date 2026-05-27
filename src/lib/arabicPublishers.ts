/** دور نشر عربية — تُستخدم لتعزيز البحث عن بيانات الأوريجينال والهاي كوبي. */
export interface ArabicPublisher {
  id: string;
  name: string;
  website: string;
  aliases: string[];
}

export const ARABIC_PUBLISHERS: ArabicPublisher[] = [
  { id: "shorouk", name: "دار الشروق", website: "https://www.shorouk.com", aliases: ["شروق", "Shorouk"] },
  { id: "masriya", name: "الدار المصرية اللبنانية", website: "https://www.almasriah.com", aliases: ["المصرية اللبنانية"] },
  { id: "aseer", name: "عصير الكتب", website: "https://aseeralkotb.com", aliases: ["Aseer Al Kotb"] },
  { id: "karma", name: "دار الكرمة", website: "https://alkarmapublishing.com", aliases: ["الكرمة"] },
  { id: "dawen", name: "دار دون", website: "https://dardawen.com", aliases: ["دون"] },
  { id: "rewaq", name: "دار الرواق", website: "https://www.facebook.com/rewaq.pm", aliases: ["الرواق"] },
  { id: "oktob", name: "دار اكتب", website: "https://www.facebook.com/daroktob", aliases: ["اكتب"] },
  { id: "hindawi", name: "مؤسسة هنداوي", website: "https://www.hindawi.org", aliases: ["Hindawi"] },
  { id: "gebo", name: "الهيئة المصرية العامة للكتاب", website: "https://www.gebo.gov.eg", aliases: ["هيئة الكتاب"] },
  { id: "adab", name: "دار الآداب", website: "https://daraladab.com", aliases: [] },
  { id: "saqi", name: "دار الساقي", website: "https://daralsaqi.com", aliases: ["الساقي"] },
  { id: "farabi", name: "دار الفارابي", website: "https://dar-alfarabi.com", aliases: ["الفارابي"] },
  { id: "tanweer", name: "دار التنوير", website: "https://altanweerdc.com", aliases: ["التنوير"] },
  { id: "elilm", name: "دار العلم للملايين", website: "https://www.dar-elilm.com", aliases: ["العلم للملايين"] },
  { id: "arabcc", name: "المركز الثقافي العربي", website: "https://www.arabcc.com", aliases: [] },
  { id: "madarek", name: "دار مدارك", website: "https://mdrek.com", aliases: ["مدارك"] },
  { id: "takween", name: "تكوين للنشر", website: "https://takween.com.sa", aliases: ["تكوين"] },
  { id: "athar", name: "أثر للنشر والتوزيع", website: "https://athar-pub.com", aliases: ["أثر"] },
  { id: "jarir", name: "مكتبة جرير", website: "https://www.jarir.com", aliases: ["جرير", "Jarir"] },
  { id: "kalimat", name: "كلمات للنشر", website: "https://kalimatgroup.com", aliases: ["كلمات"] },
  { id: "medad", name: "دار مداد", website: "https://medadpublishing.com", aliases: ["مداد"] },
  { id: "rawafed", name: "دار روافد", website: "https://rawafedpublishing.com", aliases: ["روافد"] },
  { id: "nova", name: "نوفا بلس", website: "https://novapluskw.com", aliases: ["Nova Plus"] },
  { id: "platinum", name: "بلاتينيوم بوك", website: "https://platinum-book.com", aliases: ["Platinum Book"] },
  { id: "rafidain", name: "دار الرافدين", website: "https://alrafidain-center.com", aliases: ["الرافدين"] },
  { id: "mada", name: "دار المدى", website: "https://almadabookstore.com", aliases: ["المدى"] },
  { id: "fikr", name: "دار الفكر", website: "https://www.darfikr.com", aliases: ["الفكر"] },
  { id: "ninawa", name: "دار نينوى", website: "https://ninarstore.com", aliases: ["نينوى"] },
  { id: "ahliyya", name: "دار الأهلية", website: "https://ahliyyaamman.com", aliases: ["الأهلية"] },
  { id: "alaan", name: "دار الآن ناشرون وموزعون", website: "https://alaanpublishers.com", aliases: ["دار الآن"] },
];

export function matchPublisherByName(name: string): ArabicPublisher | null {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  return (
    ARABIC_PUBLISHERS.find(
      (p) =>
        p.name.toLowerCase().includes(n) ||
        n.includes(p.name.toLowerCase()) ||
        p.aliases.some((a) => n.includes(a.toLowerCase()))
    ) || null
  );
}

export function buildPublisherSearchQueries(title: string, publisherName?: string): string[] {
  const q = title.trim();
  if (!q) return [];
  const queries = new Set<string>();
  queries.add(q);
  if (publisherName?.trim()) {
    queries.add(`${q} ${publisherName}`);
    queries.add(`${q} inpublisher:${publisherName}`);
  }
  const matched = matchPublisherByName(publisherName || "");
  if (matched) {
    queries.add(`${q} ${matched.name}`);
  }
  return Array.from(queries).slice(0, 4);
}
