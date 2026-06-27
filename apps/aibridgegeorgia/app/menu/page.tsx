"use client";

import { useState, useEffect } from "react";

interface MenuItem {
  id: string; name: string; description: string | null;
  price: number; category: string; image_url: string | null; is_available: boolean;
}

const CATEGORY_LABELS: Record<string, string> = { main: "메인", side: "사이드", drink: "음료" };

export default function MenuPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/v1/menus")
      .then((res) => res.json())
      .then((data) => { setMenus(data.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categories = ["all", ...Array.from(new Set(menus.map((m) => m.category)))];

  const filtered = menus.filter((m) => {
    const matchCat = activeCategory === "all" || m.category === activeCategory;
    const matchSearch = !searchQuery ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="text-lg font-bold tracking-tight">한국의 맛</a>
          <a
            href="/reserve"
            className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all duration-150 active:scale-[0.98] min-h-[44px] flex items-center"
          >
            예약하기
          </a>
        </div>
      </header>

      <main>
        <section className="pt-16 pb-8 px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">메뉴</h1>
          <p className="text-gray-500">신선한 재료로 만드는 정통 한국 요리</p>
        </section>

        {/* Search */}
        <div className="max-w-md mx-auto px-4 mb-6">
          <label htmlFor="menu-search" className="sr-only">메뉴 검색</label>
          <div className="relative">
            <input
              id="menu-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="메뉴 검색..."
              aria-label="메뉴 검색"
              className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-lg outline-none focus:border-gray-900 transition-colors duration-150 min-h-[48px]"
            />
            <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Category Filter */}
        <nav className="max-w-6xl mx-auto px-4 mb-10" aria-label="카테고리 필터">
          <div className="flex gap-2 justify-center flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                aria-pressed={activeCategory === cat}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.98] min-h-[44px] ${
                  activeCategory === cat ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat === "all" ? "전체" : CATEGORY_LABELS[cat] ?? cat}
              </button>
            ))}
          </div>
        </nav>

        {/* Menu Grid */}
        <section className="max-w-6xl mx-auto px-4 pb-24" aria-label="메뉴 목록">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" role="status" aria-live="polite">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="aspect-[4/3] bg-gray-100 skeleton" />
                  <div className="p-5 space-y-2">
                    <div className="h-5 bg-gray-100 rounded skeleton w-2/3" />
                    <div className="h-4 bg-gray-100 rounded skeleton w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4" aria-hidden="true">🔍</div>
              <h2 className="text-xl font-semibold mb-2">검색 결과가 없습니다</h2>
              <p className="text-gray-500 mb-6">
                {searchQuery ? `"${searchQuery}"에 대한 결과가 없습니다.` : "메뉴가 없습니다."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors duration-150 min-h-[44px]"
                >
                  검색어 초기화
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-gray-100 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-150"
                >
                  <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center text-5xl" aria-hidden="true">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt={`${item.name} 사진`} className="w-full h-full object-cover" />
                    ) : (
                      <span>🍽️</span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                      <span className="text-lg font-bold">{item.price} ₾</span>
                    </div>
                    {item.description && <p className="text-sm text-gray-500 mb-3">{item.description}</p>}
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </span>
                      {!item.is_available && (
                        <span className="text-xs px-2 py-1 bg-red-50 rounded text-red-600">품절</span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="py-8 bg-gray-50 text-center text-sm text-gray-400">
        <a href="/" className="hover:text-gray-600 transition-colors duration-150">← 홈으로</a>
      </footer>
    </div>
  );
}
