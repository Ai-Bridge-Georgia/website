"use client";

import { useState, useEffect } from "react";

interface MenuItem { id: string; name: string; price: number; category: string; description: string | null; }

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [featured, setFeatured] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/menus?limit=3")
      .then((r) => r.json())
      .then((d) => { setFeatured(d.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50" aria-label="메인 네비게이션">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="text-lg font-bold tracking-tight">한국의 맛</a>
            <div className="hidden md:flex items-center gap-8">
              <a href="/menu" className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-150">메뉴</a>
              <a href="/reserve" className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-150">예약</a>
              <a href="#contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-150">연락처</a>
            </div>
            <button
              className="md:hidden p-2"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="메뉴 열기/닫기"
              aria-expanded={menuOpen}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          {menuOpen && (
            <nav className="md:hidden pb-4 flex flex-col gap-3" aria-label="모바일 네비게이션">
              <a href="/menu" className="text-sm text-gray-600 py-2">메뉴</a>
              <a href="/reserve" className="text-sm text-gray-600 py-2">예약</a>
              <a href="#contact" className="text-sm text-gray-600 py-2">연락처</a>
            </nav>
          )}
        </div>
      </nav>

      {/* Hero */}
      <header className="pt-32 pb-24 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-medium text-orange-600 mb-4 tracking-wide">AUTHENTIC KOREAN FOOD</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
            한국의 맛,<br/>
            <span className="text-gray-400">트빌리시에서</span>
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-xl mx-auto leading-relaxed">
            정통 한국 요리를 조지아에 소개합니다. 신선한 재료, 정성껏 만든 음식, 합리적인 가격.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/menu"
              className="px-8 py-3.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all duration-150 active:scale-[0.98] min-h-[44px] flex items-center justify-center"
            >
              메뉴 보기
            </a>
            <a
              href="/reserve"
              className="px-8 py-3.5 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-all duration-150 active:scale-[0.98] min-h-[44px] flex items-center justify-center"
            >
              예약하기
            </a>
          </div>
        </div>
      </header>

      {/* Featured Menu */}
      {loading ? (
        <section className="py-24 px-4 bg-gray-50" aria-label="인기 메뉴 로딩">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="aspect-[4/3] bg-gray-100 skeleton" />
                  <div className="p-5 space-y-2">
                    <div className="h-5 bg-gray-100 rounded skeleton w-2/3" />
                    <div className="h-4 bg-gray-100 rounded skeleton w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : featured.length > 0 ? (
        <section className="py-24 px-4 bg-gray-50" aria-label="인기 메뉴">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-2 text-center">인기 메뉴</h2>
            <p className="text-gray-500 text-center mb-12">가장 사랑받는 한국 요리</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {featured.map((item) => (
                <article key={item.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-150">
                  <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center text-5xl" aria-hidden="true">🍽️</div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <span className="font-bold">{item.price} ₾</span>
                    </div>
                    {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                  </div>
                </article>
              ))}
            </div>
            <div className="text-center mt-8">
              <a href="/menu" className="inline-block text-sm font-medium text-gray-900 border-b border-gray-300 pb-1 hover:border-gray-900 transition-colors duration-150">
                전체 메뉴 보기 →
              </a>
            </div>
          </div>
        </section>
      ) : null}

      {/* Value Props */}
      <section className="py-24 px-4" aria-label="우리의 약속">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-3xl mb-4" aria-hidden="true">🌱</div>
              <h3 className="font-semibold mb-2">신선한 재료</h3>
              <p className="text-sm text-gray-500">매일 장보는 신선한 채소와 고기</p>
            </div>
            <div>
              <div className="text-3xl mb-4" aria-hidden="true">👨‍🍳</div>
              <h3 className="font-semibold mb-2">정통 레시피</h3>
              <p className="text-sm text-gray-500">한국에서 검증된 전통 요리 방식</p>
            </div>
            <div>
              <div className="text-3xl mb-4" aria-hidden="true">💰</div>
              <h3 className="font-semibold mb-2">합리적인 가격</h3>
              <p className="text-sm text-gray-500">부담 없이 즐기는 한국 음식</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-gray-900 text-white" aria-label="연락처 및 영업 정보">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">영업 정보</h2>
          <div className="grid sm:grid-cols-3 gap-8 mt-8">
            <div>
              <p className="text-gray-400 text-sm mb-1">주소</p>
              <p className="font-medium">Tbilisi, Georgia</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">영업시간</p>
              <p className="font-medium">11:00 - 22:00 (매일)</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">전화</p>
              <p className="font-medium">+995 599 000 000</p>
            </div>
          </div>
          <div className="mt-12">
            <a
              href="/reserve"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-all duration-150 active:scale-[0.98] min-h-[44px]"
            >
              예약하기
            </a>
          </div>
        </div>
      </section>

      <footer className="py-8 bg-gray-950 text-gray-500 text-sm text-center">
        <p>© 2026 한국의 맛 — Tbilisi, Georgia</p>
      </footer>
    </div>
  );
}
