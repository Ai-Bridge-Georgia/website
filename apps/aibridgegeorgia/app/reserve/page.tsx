"use client";

import { useState } from "react";

// ============================================================
// 예약 페이지 — API POST
// ============================================================

export default function ReservePage() {
  const [form, setForm] = useState({
    customer_name: "", customer_phone: "", date: "", party_size: 2, notes: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/v1/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message ?? "예약 실패"); }
      setStatus("success");
      setForm({ customer_name: "", customer_phone: "", date: "", party_size: 2, notes: "" });
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "오류 발생");
    }
  };

  const inputStyle = "w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-gray-900 transition text-base";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1.5";

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4 bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-6">✅</div>
          <h1 className="text-2xl font-bold mb-3">예약 완료!</h1>
          <p className="text-gray-500 mb-8">예약해주셔서 감사합니다. 확인 후 연락드리겠습니다.</p>
          <div className="flex gap-3 justify-center">
            <a href="/menu" className="px-6 py-3 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition">메뉴 보기</a>
            <button onClick={() => setStatus("idle")} className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition">다시 예약</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="text-lg font-bold tracking-tight">한국의 맛</a>
          <a href="/menu" className="text-sm text-gray-600 hover:text-gray-900 transition">메뉴 보기 →</a>
        </div>
      </header>

      <section className="max-w-xl mx-auto px-4 py-16 sm:py-24">
        <h1 className="text-3xl font-bold tracking-tight mb-2">예약하기</h1>
        <p className="text-gray-500 mb-10">방문하실 날짜와 인원을 알려주세요.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={labelStyle}>이름 *</label>
            <input type="text" required value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              className={inputStyle} placeholder="홍길동" />
          </div>
          <div>
            <label className={labelStyle}>전화번호</label>
            <input type="tel" value={form.customer_phone}
              onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
              className={inputStyle} placeholder="+995 599 000 000" />
          </div>
          <div>
            <label className={labelStyle}>방문 날짜 및 시간 *</label>
            <input type="datetime-local" required value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={inputStyle} />
          </div>
          <div>
            <label className={labelStyle}>인원 *</label>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => setForm({ ...form, party_size: Math.max(1, form.party_size - 1) })}
                className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition">−</button>
              <span className="text-xl font-semibold w-12 text-center">{form.party_size}</span>
              <button type="button" onClick={() => setForm({ ...form, party_size: Math.min(20, form.party_size + 1) })}
                className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition">+</button>
              <span className="text-gray-400 text-sm">명</span>
            </div>
          </div>
          <div>
            <label className={labelStyle}>요청사항</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className={inputStyle} rows={3} placeholder="창가 자리, 알레르기 등" />
          </div>
          {status === "error" && (
            <div className="px-4 py-3 bg-red-50 rounded-lg text-sm text-red-600">{errorMsg}</div>
          )}
          <button type="submit" disabled={status === "submitting"}
            className="w-full py-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50">
            {status === "submitting" ? "예약 중..." : "예약하기"}
          </button>
        </form>
      </section>
    </div>
  );
}
