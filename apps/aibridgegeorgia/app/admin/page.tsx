"use client";

import { useState, useEffect } from "react";

interface MenuItem {
  id: string; name: string; description: string | null;
  price: number; category: string; is_available: boolean; sort_order: number;
}

const CATEGORY_OPTIONS = [
  { value: "main", label: "메인" },
  { value: "side", label: "사이드" },
  { value: "drink", label: "음료" },
];

export default function AdminPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", price: 0, category: "main", is_available: true,
  });

  const loadMenus = () => {
    fetch("/api/v1/menus")
      .then((r) => r.json())
      .then((d) => { setMenus(d.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadMenus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/v1/menus/${editingId}` : "/api/v1/menus";
    const method = editingId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setEditingId(null);
      setForm({ name: "", description: "", price: 0, category: "main", is_available: true });
      loadMenus();
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name, description: item.description ?? "",
      price: item.price, category: item.category, is_available: item.is_available,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/v1/menus/${id}`, { method: "DELETE" });
    if (res.ok) loadMenus();
  };

  const inputStyle = "w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-900 transition-colors duration-150 text-sm min-h-[44px]";
  const labelStyle = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-lg font-bold">관리자 — 메뉴 관리</h1>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setForm({ name: "", description: "", price: 0, category: "main", is_available: true });
            }}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all duration-150 active:scale-[0.98] min-h-[44px]"
          >
            {showForm ? "취소" : "+ 새 메뉴"}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {showForm && (
          <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6" aria-label="메뉴 추가/수정">
            <h2 className="font-semibold mb-4">{editingId ? "메뉴 수정" : "새 메뉴 추가"}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="form-name" className={labelStyle}>메뉴명 *</label>
                <input id="form-name" type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputStyle} />
              </div>
              <div>
                <label htmlFor="form-price" className={labelStyle}>가격 (₾) *</label>
                <input id="form-price" type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className={inputStyle} />
              </div>
              <div>
                <label htmlFor="form-category" className={labelStyle}>카테고리</label>
                <select id="form-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputStyle}>
                  {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="form-status" className={labelStyle}>판매 가능</label>
                <select id="form-status" value={form.is_available ? "true" : "false"} onChange={(e) => setForm({ ...form, is_available: e.target.value === "true" })} className={inputStyle}>
                  <option value="true">판매중</option>
                  <option value="false">품절</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="form-desc" className={labelStyle}>설명</label>
                <textarea id="form-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputStyle} rows={2} />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors duration-150 min-h-[44px]">
                  {editingId ? "수정" : "추가"}
                </button>
              </div>
            </form>
          </section>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400" role="status" aria-live="polite">
            <div className="inline-block w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-3" />
            <p>불러오는 중...</p>
          </div>
        ) : menus.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4" aria-hidden="true">📝</div>
            <h2 className="text-xl font-semibold mb-2">아직 메뉴가 없습니다</h2>
            <p className="text-gray-500 mb-6">첫 메뉴를 추가해보세요.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors duration-150 min-h-[44px]"
            >
              + 첫 메뉴 추가하기
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <caption className="sr-only">메뉴 목록</caption>
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-gray-500">메뉴명</th>
                  <th scope="col" className="text-left px-4 py-3 text-xs font-medium text-gray-500">카테고리</th>
                  <th scope="col" className="text-right px-4 py-3 text-xs font-medium text-gray-500">가격</th>
                  <th scope="col" className="text-center px-4 py-3 text-xs font-medium text-gray-500">상태</th>
                  <th scope="col" className="text-right px-4 py-3 text-xs font-medium text-gray-500">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {menus.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-100">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{item.name}</div>
                      {item.description && <div className="text-xs text-gray-400">{item.description}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {CATEGORY_OPTIONS.find((c) => c.value === item.category)?.label ?? item.category}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-sm">{item.price} ₾</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded ${item.is_available ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                        {item.is_available ? "판매중" : "품절"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => handleEdit(item)} className="text-xs text-gray-600 hover:text-gray-900 mr-3 min-h-[44px]">수정</button>
                      <button onClick={() => handleDelete(item.id)} className="text-xs text-red-500 hover:text-red-700 min-h-[44px]">삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
