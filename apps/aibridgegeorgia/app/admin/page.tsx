"use client";

import { useState, useEffect } from "react";

// ============================================================
// 관리자 페이지 — 메뉴 CRUD (간단)
// 사장님 취향: 네이버 쇼핑 톤, 사각 버튼
// ============================================================

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

  const inputStyle = "w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-900 transition text-sm";
  const labelStyle = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-lg font-bold">관리자 — 메뉴 관리</h1>
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: "", description: "", price: 0, category: "main", is_available: true }); }}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition">
            {showForm ? "취소" : "+ 새 메뉴"}
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="font-semibold mb-4">{editingId ? "메뉴 수정" : "새 메뉴 추가"}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>메뉴명 *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>가격 (₾) *</label>
                <input type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>카테고리</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputStyle}>
                  {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelStyle}>판매 가능</label>
                <select value={form.is_available ? "true" : "false"} onChange={(e) => setForm({ ...form, is_available: e.target.value === "true" })} className={inputStyle}>
                  <option value="true">판매중</option>
                  <option value="false">품절</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelStyle}>설명</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputStyle} rows={2} />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition">
                  {editingId ? "수정" : "추가"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Menu List — 테이블 */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">불러오는 중...</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">메뉴명</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">카테고리</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">가격</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">상태</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {menus.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{item.name}</div>
                      {item.description && <div className="text-xs text-gray-400">{item.description}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {CATEGORY_OPTIONS.find((c) => c.value === item.category)?.label ?? item.category}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-sm">{item.price} ₾</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded ${item.is_available ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                        {item.is_available ? "판매중" : "품절"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEdit(item)} className="text-xs text-gray-600 hover:text-gray-900 mr-3">수정</button>
                      <button onClick={() => handleDelete(item.id)} className="text-xs text-red-500 hover:text-red-700">삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
