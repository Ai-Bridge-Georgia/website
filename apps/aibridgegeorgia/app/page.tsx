"use client";

import { useState } from "react";

const NAV = [
  { label: "회사 소개", href: "#about" },
  { label: "서비스", href: "#services" },
  { label: "팀", href: "#team" },
  { label: "연락처", href: "#contact" },
];

const SERVICES = [
  {
    title: "풀스택 개발",
    desc: "Next.js, React, Supabase 기반 모던 웹사이트 & 웹앱 개발. 디자인부터 배포까지 한 번에.",
    icon: "💻",
  },
  {
    title: "광고 대행",
    desc: "Google Ads, Meta Ads 캠페인 운영. GA4 데이터 기반 최적화로 ROI 극대화.",
    icon: "📣",
  },
];

const VALUES = [
  { title: "Think Different", desc: "기존의 틀을 깨고 더 좋은 것을 만듭니다." },
  { title: "Work Simple", desc: "복잡함을 덜어내고 단순하게 일합니다." },
  { title: "Live Easier", desc: "고객의 삶을 더 편하게 만듭니다." },
];

const TEAM = [
  { name: "Aiden", role: "영업", icon: "🤝" },
  { name: "Pria", role: "프로젝트 관리", icon: "📋" },
  { name: "Daria", role: "UI/UX 디자인", icon: "🎨" },
  { name: "Felix", role: "프론트엔드", icon: "💻" },
  { name: "Beck", role: "백엔드", icon: "🖥️" },
  { name: "Ada", role: "광고 운영", icon: "📣" },
  { name: "Cara", role: "콘텐츠", icon: "✍️" },
  { name: "Ana", role: "분석", icon: "📊" },
  { name: "Otto", role: "운영", icon: "⚙️" },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="#" className="text-lg font-bold tracking-tight">
              AI Bridge Georgia
            </a>
            <div className="hidden md:flex items-center gap-8">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm text-gray-600 hover:text-gray-900 transition"
                >
                  {item.label}
                </a>
              ))}
            </div>
            <button
              className="md:hidden p-2"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Bridging Korea and Georgia
            <br />
            <span className="text-gray-400">through AI</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            풀스택 개발과 광고대행 전문. 다르게 생각하고, 단순하게 일하고, 고객의 삶을 편하게 만듭니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
            >
              문의하기
            </a>
            <a
              href="#services"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              서비스 보기
            </a>
          </div>
        </div>
      </section>

      {/* Slogan */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-4">
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Do Better, Think More
          </p>
          <p className="text-gray-500">더 잘하자, 더 생각하자</p>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">회사 소개</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {VALUES.map((v) => (
              <div key={v.title} className="text-center">
                <h3 className="text-xl font-semibold mb-2">{v.title}</h3>
                <p className="text-gray-600">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">서비스</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {SERVICES.map((s) => (
              <div key={s.title} className="bg-white rounded-xl p-8 border border-gray-100">
                <div className="text-4xl mb-4">{s.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                <p className="text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-2">팀</h2>
          <p className="text-gray-600 mb-8">9명의 AI 직원이 24/7 일합니다</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
            {TEAM.map((member) => (
              <div key={member.name} className="text-center p-6 rounded-xl border border-gray-100 hover:border-gray-300 transition">
                <div className="text-3xl mb-2">{member.icon}</div>
                <div className="font-semibold">{member.name}</div>
                <div className="text-sm text-gray-500">{member.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-gray-900 text-white">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">연락처</h2>
          <p className="text-gray-400 mb-8">
            프로젝트 문의, 협업 제안, 기타 문의사항을 남겨주세요.
          </p>
          <div className="flex flex-col gap-4 items-center">
            <a
              href="mailto:hello@aibridgegeorgia.tech"
              className="text-lg font-medium hover:underline"
            >
              hello@aibridgegeorgia.tech
            </a>
            <a
              href="https://github.com/Ai-Bridge-Georgia"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition"
            >
              github.com/Ai-Bridge-Georgia
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-950 text-gray-500 text-sm">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>© 2026 AI Bridge Georgia. All rights reserved.</p>
          <p className="mt-1">Tbilisi, Georgia — aibridgegeorgia.tech</p>
        </div>
      </footer>
    </div>
  );
}
