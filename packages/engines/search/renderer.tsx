'use client';

import { useState, useCallback, useEffect } from 'react';
import type { SearchSchema, SearchQuery, SearchResponse } from './schema';
import { buildApiUrl, highlightText } from './query-builder';

// ============================================================
// Search Engine — Renderer
// 사장님 취향: 아마존 스타일 서치바 + 네이버 쇼핑 그리드
// ============================================================

const STYLE = {
  container: {
    fontFamily: 'Pretendard, Inter, sans-serif',
    color: '#0A0A0A',
  },
  searchBox: {
    display: 'flex',
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto 24px',
  },
  searchInput: {
    flex: 1,
    padding: '12px 20px',
    fontSize: '16px',
    fontFamily: 'Pretendard, Inter, sans-serif',
    border: '2px solid #0A0A0A',
    borderRadius: '8px 0 0 8px',     // 사장님: 왼쪽만 둥글게 (아마존 스타일)
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  searchButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'Pretendard, Inter, sans-serif',
    backgroundColor: '#0A0A0A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '0 8px 8px 0',     // 사장님: 오른쪽만 둥글게
    cursor: 'pointer',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
    marginBottom: '24px',
  },
  filterSelect: {
    padding: '8px 12px',
    fontSize: '14px',
    fontFamily: 'Pretendard, Inter, sans-serif',
    border: '1px solid #E5E5E5',
    borderRadius: '8px',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gap: '16px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E5E5',
    borderRadius: '12px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'box-shadow 150ms ease',
  },
  cardImage: {
    width: '100%',
    aspectRatio: '4 / 3',
    objectFit: 'cover' as const,
    backgroundColor: '#F5F5F5',
  },
  cardBody: {
    padding: '16px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '4px',
  },
  cardSubtitle: {
    fontSize: '14px',
    color: '#525252',
    marginBottom: '8px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  cardPrice: {
    fontSize: '20px',
    fontWeight: 700,
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: '#F5F5F5',
    borderRadius: '8px',
    marginBottom: '4px',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '48px',
    color: '#A3A3A3',
    fontSize: '16px',
  },
  empty: {
    textAlign: 'center' as const,
    padding: '48px',
    color: '#525252',
    fontSize: '16px',
  },
};

interface SearchRendererProps {
  schema: SearchSchema;
  primaryColor?: string;
}

export function SearchRenderer({ schema, primaryColor }: SearchRendererProps) {
  const [query, setQuery] = useState<SearchQuery>({ text: '', page: 1 });
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [autocomplete, setAutocomplete] = useState<string[]>([]);

  // 검색 실행
  const executeSearch = useCallback(async (q: SearchQuery) => {
    setLoading(true);
    try {
      const url = buildApiUrl(schema, q);
      if (!url) {
        setLoading(false);
        return;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch {
      // 에러 무시 (데모용)
    } finally {
      setLoading(false);
    }
  }, [schema]);

  // 자동완성
  useEffect(() => {
    if (!schema.autocomplete?.enabled || !query.text || query.text.length < (schema.autocomplete.minChars ?? 2)) {
      setAutocomplete([]);
      return;
    }
    // Phase 2: API 자동완성 호출
    setAutocomplete([]);
  }, [query.text, schema.autocomplete]);

  // 정렬 변경
  const handleSort = (sortName: string) => {
    const newQuery = { ...query, sort: sortName, page: 1 };
    setQuery(newQuery);
    executeSearch(newQuery);
  };

  // 필터 변경
  const handleFilter = (name: string, value: unknown) => {
    const filters = { ...query.filters, [name]: value };
    const newQuery = { ...query, filters, page: 1 };
    setQuery(newQuery);
    executeSearch(newQuery);
  };

  // 페이지 변경
  const handlePage = (page: number) => {
    const newQuery = { ...query, page };
    setQuery(newQuery);
    executeSearch(newQuery);
  };

  const cols = schema.resultDisplay.columns ?? 3;

  return (
    <div style={STYLE.container}>
      {/* 검색바 (아마존 스타일) */}
      <div style={STYLE.searchBox}>
        <input
          type="text"
          placeholder={schema.name + '...'}
          value={query.text ?? ''}
          onChange={(e) => setQuery({ ...query, text: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') executeSearch({ ...query, page: 1 }); }}
          style={{
            ...STYLE.searchInput,
            borderColor: primaryColor ?? '#0A0A0A',
          }}
        />
        <button
          onClick={() => executeSearch({ ...query, page: 1 })}
          style={{
            ...STYLE.searchButton,
            backgroundColor: primaryColor ?? '#0A0A0A',
          }}
        >
          검색
        </button>
      </div>

      {/* 필터 (topbar) */}
      {schema.filters && (
        <div style={STYLE.filters}>
          {schema.filters.filter((f) => f.placement === 'topbar' || f.placement === 'dropdown').map((filter) => (
            <select
              key={filter.name}
              value={String(query.filters?.[filter.name] ?? filter.defaultValue ?? '')}
              onChange={(e) => handleFilter(filter.name, e.target.value)}
              style={STYLE.filterSelect}
            >
              <option value="">{filter.label}</option>
              {filter.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ))}

          {/* 정렬 */}
          {schema.sortOptions && (
            <select
              value={query.sort ?? schema.defaultSort ?? 'relevance'}
              onChange={(e) => handleSort(e.target.value)}
              style={{ ...STYLE.filterSelect, marginLeft: 'auto' }}
            >
              {schema.sortOptions.map((opt) => (
                <option key={opt.name} value={opt.name}>{opt.label}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* 결과 */}
      {loading && <div style={STYLE.loading}>검색 중...</div>}

      {!loading && results && results.results.length === 0 && (
        <div style={STYLE.empty}>검색 결과가 없습니다</div>
      )}

      {!loading && results && results.results.length > 0 && (
        <>
          <div style={{
            ...STYLE.grid,
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
          }}>
            {results.results.map((item, i) => {
              const card = schema.resultDisplay.card;
              const img = item[card.image ?? ''] as string | undefined;
              const badge = item[card.badge ?? ''] as string | undefined;
              const title = String(item[card.title] ?? '');
              const subtitle = card.subtitle ? String(item[card.subtitle] ?? '') : '';
              return (
                <div key={i} style={STYLE.card}>
                  {img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={title}
                      style={STYLE.cardImage}
                    />
                  )}
                  <div style={STYLE.cardBody}>
                    {badge && (
                      <span style={STYLE.badge}>{badge}</span>
                    )}
                    <div style={STYLE.cardTitle}>{title}</div>
                    {card.subtitle && subtitle && (
                      <div style={STYLE.cardSubtitle}>{subtitle}</div>
                    )}
                    {card.price && item[card.price] !== undefined && (
                      <div style={STYLE.cardPrice}>
                        {Number(item[card.price]).toLocaleString()} ₾
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 페이지네이션 */}
          {results.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
              {Array.from({ length: Math.min(results.totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePage(p)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #E5E5E5',
                    borderRadius: '8px',
                    backgroundColor: p === query.page ? '#0A0A0A' : '#FFFFFF',
                    color: p === query.page ? '#FFFFFF' : '#0A0A0A',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
