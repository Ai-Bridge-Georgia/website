// ============================================================
// Web Project Generator — Next.js 15 + Tailwind CSS v4
// 실행 가능한 Next.js 프로젝트 전체를 생성
// ============================================================

import type { ProjectGenerator } from '../interface';
import type { GeneratedFile, ProjectManifest, ScreenSpec } from '../interface';
import type { PlatformAdapter } from '../../platform-adapters/interface';

export const webProjectGenerator: ProjectGenerator = {
  platform: 'web',

  generateProject(manifest, adapter) {
    return [
      ...this.generateConfiguration(manifest),
      ...this.generateBuildFiles(manifest),
      ...this.generateAssets(manifest),
      ...this.generateLocalization(manifest),
      ...this.generateNavigation(manifest, adapter),
      ...this.generateComponents(manifest, adapter),
      ...this.generateScreens(manifest, adapter),
    ];
  },

  generateScreens(manifest, adapter) {
    return manifest.screens.map(screen => generateScreen(screen, manifest, adapter));
  },

  generateComponents(_manifest, _adapter) {
    // 공유 컴포넌트는 각 화면에 인라인 (YAGNI — 별도 파일은 필요시 분리)
    return [];
  },

  generateNavigation(manifest, _adapter) {
    const links = manifest.screens
      .filter(s => s.type !== 'dashboard')
      .map(s => `{ label: '${s.title}', href: '/${s.name}' }`)
      .join(',\n    ');

    const navContent = `"use client";
import { useState } from "react";

const NAV_LINKS = [
  ${links}
];

export function Navigation() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="text-lg font-bold">${manifest.displayName}</a>
        <div className="hidden md:flex gap-8">
          {NAV_LINKS.map(l => <a key={l.href} href={l.href} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">{l.label}</a>)}
        </div>
        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="메뉴">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>
      {open && <div className="md:hidden px-4 pb-4">{NAV_LINKS.map(l => <a key={l.href} href={l.href} className="block py-2 text-sm text-gray-600">{l.label}</a>)}</div>}
    </nav>
  );
}
`;
    return [{ path: 'components/Navigation.tsx', content: navContent }];
  },

  generateAssets(manifest) {
    return [
      {
        path: 'app/icon.svg',
        content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="${manifest.brand.primaryColor}"/><text x="50" y="65" font-size="50" text-anchor="middle" fill="white" font-family="sans-serif">${manifest.displayName.charAt(0)}</text></svg>`,
      },
      {
        path: 'public/robots.txt',
        content: 'User-agent: *\nAllow: /\n',
      },
    ];
  },

  generateLocalization(manifest) {
    return [{
      path: 'messages/ko.json',
      content: JSON.stringify({
        appName: manifest.displayName,
        screens: Object.fromEntries(manifest.screens.map(s => [s.name, { title: s.title }])),
      }, null, 2),
    }];
  },

  generateConfiguration(manifest) {
    return [
      {
        path: 'package.json',
        content: JSON.stringify({
          name: manifest.projectName,
          version: '0.1.0',
          private: true,
          scripts: { dev: 'next dev', build: 'next build', start: 'next start', lint: 'next lint' },
          dependencies: {
            next: '^15.0.0',
            react: '^19.0.0',
            'react-dom': '^19.0.0',
          },
          devDependencies: {
            '@tailwindcss/postcss': '^4.0.0',
            tailwindcss: '^4.0.0',
            typescript: '^5.0.0',
            '@types/react': '^19.0.0',
            '@types/node': '^22.0.0',
          },
        }, null, 2),
      },
      {
        path: 'tsconfig.json',
        content: JSON.stringify({
          compilerOptions: { target: 'ES2017', lib: ['dom', 'dom.iterable', 'esnext'], module: 'esnext', moduleResolution: 'bundler', jsx: 'preserve', strict: true, skipLibCheck: true, paths: { '@/*': ['./*'] } },
          include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
          exclude: ['node_modules'],
        }, null, 2),
      },
      {
        path: 'next.config.js',
        content: `/** @type {import('next').NextConfig} */\nconst nextConfig = { images: { unoptimized: true } };\nmodule.exports = nextConfig;\n`,
      },
      {
        path: 'postcss.config.mjs',
        content: `const config = { plugins: { "@tailwindcss/postcss": {} } };\nexport default config;\n`,
      },
      {
        path: 'app/globals.css',
        content: getGlobalsCss(manifest),
      },
      {
        path: 'app/layout.tsx',
        content: getLayoutTsx(manifest),
      },
    ];
  },

  generateBuildFiles(manifest) {
    return [
      {
        path: '.env.example',
        content: `NEXT_PUBLIC_API_URL=${manifest.api?.baseUrl ?? 'http://localhost:3000/api/v1'}\nNEXT_PUBLIC_SUPABASE_URL=\nNEXT_PUBLIC_SUPABASE_ANON_KEY=\n`,
      },
      {
        path: '.gitignore',
        content: 'node_modules/\n.next/\n.env\n.env.local\n',
      },
      {
        path: 'README.md',
        content: `# ${manifest.displayName}\n\nGenerated by AI Bridge Georgia Universal Software Factory.\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\nOpen [http://localhost:3000](http://localhost:3000)\n`,
      },
    ];
  },
};

// ============================================================
// Screen Generators (화면 타입별)
// ============================================================

function generateScreen(screen: ScreenSpec, manifest: ProjectManifest, adapter: PlatformAdapter): GeneratedFile {
  switch (screen.type) {
    case 'landing': return generateLanding(screen, manifest);
    case 'list': return generateListScreen(screen, manifest, adapter);
    case 'form': return generateFormScreen(screen, manifest);
    case 'dashboard':
    case 'table': return generateAdminScreen(screen, manifest);
    default: return generateLanding(screen, manifest);
  }
}

function generateLanding(screen: ScreenSpec, manifest: ProjectManifest): GeneratedFile {
  const content = `"use client";
import { Navigation } from "@/components/Navigation";
import { useEffect, useState } from "react";

export default function ${capitalize(screen.name)}Page() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <header className="pt-32 pb-24 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">${manifest.displayName}</h1>
        <p className="text-lg text-gray-600 mb-10 max-w-xl mx-auto">${screen.title}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/menu" className="px-8 py-3.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition min-h-[44px] flex items-center">메뉴 보기</a>
          <a href="/reserve" className="px-8 py-3.5 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition min-h-[44px] flex items-center">예약하기</a>
        </div>
      </header>
      <footer className="py-8 bg-gray-50 text-center text-sm text-gray-400">
        <p>© 2026 ${manifest.displayName}</p>
      </footer>
    </div>
  );
}
`;
  return { path: `app/${screen.name}/page.tsx`, content };
}

function generateListScreen(screen: ScreenSpec, _manifest: ProjectManifest, _adapter: PlatformAdapter): GeneratedFile {
  const endpoint = screen.apiEndpoint ?? `/api/v1/${screen.name}`;
  const content = `"use client";
import { Navigation } from "@/components/Navigation";
import { useState, useEffect } from "react";

export default function ${capitalize(screen.name)}Page() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("${endpoint}")
      .then(r => r.json())
      .then(d => { setItems(d.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = items.filter(i =>
    !search || JSON.stringify(i).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="pt-24 max-w-6xl mx-auto px-4 pb-24">
        <h1 className="text-3xl font-bold mb-2 text-center">${screen.title}</h1>
        <p className="text-gray-500 text-center mb-8"></p>
        <div className="max-w-md mx-auto mb-8">
          <input type="text" placeholder="검색..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-lg outline-none focus:border-gray-900 min-h-[48px]" />
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="rounded-xl border border-gray-100 overflow-hidden"><div className="aspect-[4/3] bg-gray-100 animate-pulse" /><div className="p-5"><div className="h-5 bg-gray-100 rounded animate-pulse w-2/3 mb-2" /><div className="h-4 bg-gray-100 rounded animate-pulse w-1/3" /></div></div>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20"><div className="text-5xl mb-4">🔍</div><h3 className="text-xl font-semibold mb-2">결과가 없습니다</h3><button onClick={() => setSearch("")} className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm">초기화</button></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item: any) => (
              <article key={item.id} className="rounded-xl border border-gray-100 overflow-hidden hover:border-gray-300 hover:shadow-md transition cursor-pointer">
                <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center text-5xl">🍽️</div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-lg">{item.name ?? item.title ?? 'Item'}</h3>
                    {item.price && <span className="font-bold">{item.price} ₾</span>}
                  </div>
                  {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
`;
  return { path: `app/${screen.name}/page.tsx`, content };
}

function generateFormScreen(screen: ScreenSpec, manifest: ProjectManifest): GeneratedFile {
  const endpoint = screen.apiEndpoint ?? `/api/v1/${screen.name}`;
  const fields = screen.fields ?? [
    { name: 'customer_name', label: '이름', type: 'text' as const, required: true },
    { name: 'customer_phone', label: '전화번호', type: 'text' as const, required: false },
    { name: 'date', label: '날짜 및 시간', type: 'datetime' as const, required: true },
    { name: 'party_size', label: '인원', type: 'stepper' as const, required: true },
    { name: 'notes', label: '요청사항', type: 'textarea' as const, required: false },
  ];

  const fieldHtml = fields.map(f => {
    if (f.type === 'stepper') {
      return `          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-1.5">${f.label} *</legend>
            <div className="flex items-center gap-4">
              <button type="button" className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center min-h-[44px]" onClick={() => setForm({...form, ${f.name}: Math.max(1, form.${f.name} - 1)})}>−</button>
              <span className="text-xl font-semibold w-12 text-center">{form.${f.name}}</span>
              <button type="button" className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center min-h-[44px]" onClick={() => setForm({...form, ${f.name}: Math.min(20, form.${f.name} + 1)})}>+</button>
            </div>
          </fieldset>`;
    }
    const inputType = f.type === 'datetime' ? 'datetime-local' : f.type === 'number' ? 'number' : 'text';
    const tag = f.type === 'textarea' ? `<textarea id="${f.name}" value={form.${f.name}} onChange={e => setForm({...form, ${f.name}: e.target.value})} rows={3} className={inputStyle} placeholder="${f.label}" />` :
      `<input id="${f.name}" type="${inputType}" value={form.${f.name}} onChange={e => setForm({...form, ${f.name}: e.target.value})} className={inputStyle} placeholder="${f.label}" />`;
    return `          <div>
            <label htmlFor="${f.name}" className="block text-sm font-medium text-gray-700 mb-1.5">${f.label}${f.required ? ' *' : ''}</label>
            ${tag}
          </div>`;
  }).join('\n\n');

  const initialState = fields.map(f => {
    const val = f.type === 'stepper' ? '2' : f.type === 'number' ? '0' : '""';
    return `${f.name}: ${val}`;
  }).join(',\n    ');

  const content = `"use client";
import { Navigation } from "@/components/Navigation";
import { useState } from "react";

export default function ${capitalize(screen.name)}Page() {
  const [form, setForm] = useState({ ${initialState} });
  const [status, setStatus] = useState<"idle"|"submitting"|"success"|"error">("idle");

  const inputStyle = "w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-gray-900 transition min-h-[48px]";

  if (status === "success") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-6">✅</div>
          <h1 className="text-2xl font-bold mb-3">완료!</h1>
          <button onClick={() => setStatus("idle")} className="px-6 py-3 bg-gray-900 text-white rounded-lg min-h-[44px]">다시</button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="pt-24 max-w-xl mx-auto px-4 pb-24">
        <h1 className="text-3xl font-bold mb-2">${screen.title}</h1>
        <p className="text-gray-500 mb-10">아래 정보를 입력해주세요.</p>
        <form onSubmit={async (e) => {
          e.preventDefault(); setStatus("submitting");
          await fetch("${endpoint}", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(form) });
          setStatus("success");
        }} className="space-y-6">
${fieldHtml}
          <button type="submit" disabled={status === "submitting"}
            className="w-full py-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 min-h-[48px]">
            {status === "submitting" ? "처리 중..." : "${screen.title}"}
          </button>
        </form>
      </main>
    </div>
  );
}
`;
  return { path: `app/${screen.name}/page.tsx`, content };
}

function generateAdminScreen(screen: ScreenSpec, manifest: ProjectManifest): GeneratedFile {
  const endpoint = screen.apiEndpoint ?? `/api/v1/${screen.name}`;
  const content = `"use client";
import { useState, useEffect } from "react";

export default function ${capitalize(screen.name)}Page() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("${endpoint}").then(r => r.json()).then(d => { setItems(d.data ?? []); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b"><div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between"><h1 className="font-bold">관리자 — ${screen.title}</h1></div></header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? <div className="text-center py-20"><div className="inline-block w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" /></div>
        : items.length === 0 ? <div className="text-center py-20"><div className="text-5xl mb-4">📝</div><h2 className="text-xl font-semibold mb-2">데이터가 없습니다</h2></div>
        : <div className="bg-white rounded-xl border overflow-hidden"><table className="w-full">
          <thead className="bg-gray-50 border-b"><tr>{Object.keys(items[0]).slice(0,5).map(k => <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">{k}</th>)}</tr></thead>
          <tbody className="divide-y">{items.map((item, i) => <tr key={i} className="hover:bg-gray-50">{Object.values(item).slice(0,5).map((v: any) => <td className="px-4 py-3 text-sm">{String(v)}</td>)}</tr>)}</tbody>
        </table></div>}
      </main>
    </div>
  );
}
`;
  return { path: `app/${screen.name}/page.tsx`, content };
}

// ============================================================
// Template helpers
// ============================================================

function getGlobalsCss(manifest: ProjectManifest): string {
  return `@import "tailwindcss";
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");

:root {
  --font-sans: "${manifest.brand.font}", "Inter", sans-serif;
  --color-accent: ${manifest.brand.primaryColor};
}

html { scroll-behavior: smooth; word-break: keep-all; overflow-wrap: break-word; }
body { font-family: var(--font-sans); color: #111827; background: #FFFFFF; font-display: swap; -webkit-font-smoothing: antialiased; }
:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
@keyframes skeleton-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
.skeleton { animation: skeleton-pulse 2s ease-in-out infinite; }
::selection { background: var(--color-accent); color: white; }
`;
}

function getLayoutTsx(manifest: ProjectManifest): string {
  return `import "./globals.css";

export const metadata = {
  title: "${manifest.displayName}",
  description: "${manifest.displayName} — Generated by AI Bridge Georgia",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="${manifest.brand.language}">
      <body className="bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}
`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
