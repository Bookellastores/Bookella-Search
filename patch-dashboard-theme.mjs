import fs from 'fs';

const FILE = 'src/components/BookellaDashboard.tsx';
let content = fs.readFileSync(FILE, 'utf-8');

// Add import for useTheme and Moon/Sun icons if not exists
if (!content.includes('useTheme')) {
  content = content.replace(
    'import { useState, useEffect, useMemo, useRef } from "react";',
    'import { useState, useEffect, useMemo, useRef } from "react";\nimport { useTheme } from "next-themes";'
  );
}

if (!content.includes('Moon')) {
  content = content.replace(
    'Check,',
    'Check,\n  Moon,\n  Sun,'
  );
}

// Add theme hook in component
if (!content.includes('const { theme, setTheme } = useTheme();')) {
  content = content.replace(
    'export default function BookellaDashboard() {',
    'export default function BookellaDashboard() {\n  const { theme, setTheme } = useTheme();\n  const [mounted, setMounted] = useState(false);\n  useEffect(() => setMounted(true), []);'
  );
}

// Add ThemeToggle Button in Hero Header
const themeToggleUI = `
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
`;

if (!content.includes('تغيير المظهر')) {
  content = content.replace(
    '<header className="bg-white text-[#001D35] py-8 px-6 sm:px-12 relative overflow-hidden border-b border-[#E1E2EC]">',
    '<header className="bg-white dark:bg-[#001D35] text-[#001D35] dark:text-white py-8 px-6 sm:px-12 relative overflow-hidden border-b border-[#E1E2EC] dark:border-slate-800">\n' + themeToggleUI
  );
}

fs.writeFileSync(FILE, content);
console.log('Theme patch applied.');
