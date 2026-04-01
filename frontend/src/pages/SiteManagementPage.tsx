import { useState, useRef, useEffect } from 'react';
import { createUploadUrl, validateSite, deploySite, getSiteSettings, saveSiteSettings } from '../api';
import { ProgressRing } from '../components/common/ProgressRing';
import { OgTagEditor } from '../components/og/OgTagEditor';
import { OgPreviewCards } from '../components/og/OgPreviewCards';
import type { HeadSnippets, ValidateResult, DeployResult } from '../types';

type FocusedColumn = 'left' | 'center' | 'right' | null;

const SEO_FIX_GUIDES: Record<string, { guide: string; tooltip: string }> = {
  'index.html': {
    guide: 'ZIP 파일 최상위에 index.html 파일을 포함해 주세요.',
    tooltip: '현황: index.html 파일이 없습니다.\n할일: HTML 파일의 이름을 index.html로 변경하거나 새로 생성하세요.',
  },
  'robots.txt': {
    guide: 'ZIP 파일 최상위에 robots.txt 파일을 추가하세요.',
    tooltip: '현황: robots.txt가 없어 검색엔진이 크롤링 규칙을 알 수 없습니다.\n할일: robots.txt 파일을 다운로드하여 ZIP에 포함하세요.',
  },
  'sitemap.xml': {
    guide: 'ZIP 파일 최상위에 sitemap.xml 파일을 추가하세요.',
    tooltip: '현황: sitemap.xml이 없어 검색엔진이 페이지 구조를 파악하기 어렵습니다.\n할일: sitemap.xml 파일을 다운로드하여 ZIP에 포함하세요.',
  },
  'title': {
    guide: 'index.html의 <head> 안에 <title> 태그를 추가하세요.',
    tooltip: '현황: <title> 태그가 없어 검색 결과에 페이지 제목이 표시되지 않습니다.\n할일: <head> 섹션에 <title>페이지 제목</title>을 추가하세요.',
  },
  'meta-description': {
    guide: 'index.html의 <head> 안에 <meta name="description"> 태그를 추가하세요.',
    tooltip: '현황: meta description이 없어 검색 결과에 설명이 표시되지 않습니다.\n할일: <head> 섹션에 <meta name="description" content="설명">을 추가하세요.',
  },
};

const inputStyle = { width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' as const, marginBottom: 8 };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 } as const;

/* ── Collapsed column: shows only title + expand button ── */
function CollapsedColumn({ title, icon, onClick }: { title: string; icon: string; onClick: () => void }) {
  return (
    <div style={{
      width: 48, minWidth: 48, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 8, borderRight: '1px solid #e2e8f0', background: '#f8fafc',
      cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
    }}
      onClick={onClick}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ writingMode: 'vertical-rl', fontSize: 12, fontWeight: 600, color: '#475569', letterSpacing: '0.05em' }}>
        {title}
      </span>
      <span style={{ fontSize: 14, color: '#2563eb', marginTop: 4 }}>▸</span>
    </div>
  );
}

export function SiteManagementPage({ siteId, initialFocus }: { siteId: string; initialFocus?: FocusedColumn }) {
  const [focused, setFocused] = useState<FocusedColumn>(initialFocus || null);
  const [objectKey, setObjectKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validateResult, setValidateResult] = useState<ValidateResult | null>(null);
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);
  const [snippets, setSnippets] = useState<HeadSnippets>({});
  const [savingSnippets, setSavingSnippets] = useState(false);
  const [snippetMsg, setSnippetMsg] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialFocus) setFocused(initialFocus);
  }, [initialFocus]);

  useEffect(() => {
    if (!siteId) return;
    getSiteSettings(siteId)
      .then((data: { headSnippets: HeadSnippets }) => setSnippets(data.headSnippets || {}))
      .catch(() => {});
  }, [siteId]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] || null);
  };

  const handleReupload = () => {
    setUploadedFileName('');
    setSelectedFile(null);
    setValidateResult(null);
    setObjectKey('');
    if (fileRef.current) fileRef.current.value = '';
    setTimeout(() => fileRef.current?.click(), 100);
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError('ZIP 파일을 선택하세요.'); return; }
    if (!file.name.endsWith('.zip')) { setError('.zip 파일만 업로드 가능합니다.'); return; }

    setLoading(true);
    setError('');
    try {
      const data = await createUploadUrl({ siteId, fileName: file.name, fileSize: file.size });
      setObjectKey(data.objectKey);
      await fetch(data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'application/zip' }, body: file });
      const vResult = await validateSite({ siteId, objectKey: data.objectKey });
      setValidateResult(vResult);
      setUploadedFileName(file.name);
      setFocused('center');
    } catch (e) {
      setError(e instanceof Error ? e.message : '업로드/검증 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async (env: string) => {
    if (!objectKey) { setError('먼저 파일을 업로드하세요.'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await deploySite({ siteId, objectKey, env });
      setDeployResult(data);
      setFocused('right');
    } catch (e) {
      setError(e instanceof Error ? e.message : '배포 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSnippets = async () => {
    setSavingSnippets(true);
    setSnippetMsg('');
    try {
      await saveSiteSettings({ siteId, headSnippets: snippets });
      setSnippetMsg('저장 완료. 다음 배포 시 반영됩니다.');
    } catch (e) {
      setSnippetMsg(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSavingSnippets(false);
    }
  };

  const passed = validateResult?.summary.passed || 0;
  const total = validateResult?.summary.total || 5;

  const isCollapsed = (col: FocusedColumn) => focused !== null && focused !== col;
  const isExpanded = (col: FocusedColumn) => focused === col;
  const colWidth = (col: FocusedColumn, defaultWidth: string) =>
    focused === null ? defaultWidth : isExpanded(col) ? '100%' : undefined;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Left Column ── */}
      {isCollapsed('left') ? (
        <CollapsedColumn title="사이트 파일" icon="📁" onClick={() => setFocused('left')} />
      ) : (
        <div style={{
          width: colWidth('left', '270px'), flex: isExpanded('left') ? 1 : undefined,
          borderRight: '1px solid #e2e8f0', padding: 20, background: '#fff', overflowY: 'auto',
          position: 'relative', transition: 'flex 0.3s ease', flexShrink: 0,
        }}>
          {isExpanded('left') && (
            <button onClick={() => setFocused(null)} style={{
              position: 'absolute', top: 8, right: 8, background: '#f1f5f9', border: 'none',
              borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', color: '#64748b',
            }}>✕ 축소</button>
          )}

          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#1e293b' }}>사이트 파일</h3>

          <input ref={fileRef} type="file" accept=".zip" style={{ display: 'none' }} onChange={handleFileChange} />

          {uploadedFileName ? (
            <>
              <div style={{ borderRadius: 8, padding: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>✅</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>업로드 완료</span>
                </div>
                <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>{uploadedFileName}</div>
                {validateResult && (
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    검증: {validateResult.summary.passed}/{validateResult.summary.total} 항목 통과
                  </div>
                )}
              </div>
              <button onClick={handleReupload} style={{
                width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #d1d5db',
                background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16,
              }}>
                재업로드
              </button>
            </>
          ) : (
            <>
              <div
                style={{
                  border: `2px dashed ${selectedFile ? '#2563eb' : '#cbd5e1'}`,
                  borderRadius: 8, padding: 20, textAlign: 'center',
                  background: selectedFile ? '#eff6ff' : '#f8fafc',
                  marginBottom: 16, cursor: 'pointer', transition: 'all 0.2s',
                }}
                onClick={() => fileRef.current?.click()}
              >
                {selectedFile ? (
                  <>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>📦</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', wordBreak: 'break-all' }}>{selectedFile.name}</div>
                    <div style={{ fontSize: 11, color: '#2563eb', marginTop: 4 }}>{formatFileSize(selectedFile.size)}</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>📁</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>ZIP 파일을 선택하세요</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>최대 50MB</div>
                  </>
                )}
              </div>

              <button onClick={handleUpload} disabled={loading} style={{
                width: '100%', padding: '10px', borderRadius: 6, border: 'none',
                background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16,
              }}>
                {loading ? '처리 중...' : '업로드 & 검증'}
              </button>
            </>
          )}

          {error && <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 12, padding: 8, background: '#fef2f2', borderRadius: 6 }}>{error}</div>}

          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>레퍼런스 사이트 & 메모</h4>
          <div style={{ padding: 12, borderRadius: 6, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12, color: '#64748b', marginBottom: 12 }}>
            레퍼런스 사이트와 메모를 추가하여 컨설턴트에게 전달할 수 있습니다.
          </div>

          <div style={{ padding: 12, borderRadius: 6, background: '#fefce8', border: '1px solid #fde68a', fontSize: 12, color: '#78350f' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>컨설턴트 메모</div>
            아직 등록된 메모가 없습니다.
          </div>
        </div>
      )}

      {/* ── Center Column ── */}
      {isCollapsed('center') ? (
        <CollapsedColumn title="SEO & 마케팅" icon="🔍" onClick={() => setFocused('center')} />
      ) : (
        <div style={{
          flex: 1, padding: 20, background: '#fff', overflowY: 'auto',
          position: 'relative', transition: 'flex 0.3s ease',
        }}>
          {isExpanded('center') && (
            <button onClick={() => setFocused(null)} style={{
              position: 'absolute', top: 8, right: 8, background: '#f1f5f9', border: 'none',
              borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', color: '#64748b',
            }}>✕ 축소</button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <ProgressRing value={passed} max={total} size={56} strokeWidth={5} color={passed === total ? '#22c55e' : '#2563eb'} />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#1e293b' }}>SEO 검증 결과</h3>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {validateResult ? `${passed}/${total} 항목 통과` : '파일을 업로드하면 자동으로 검증됩니다'}
              </div>
            </div>
          </div>

          {validateResult && (
            <div style={{ marginBottom: 24 }}>
              {validateResult.checks.map((check, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 16 }}>{check.passed ? '✅' : '⚠️'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: check.passed ? '#166534' : '#92400e' }}>{check.reason}</div>
                    {!check.passed && check.key && SEO_FIX_GUIDES[check.key] && (
                      <>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{SEO_FIX_GUIDES[check.key].guide}</div>
                        <div style={{ position: 'relative', display: 'inline-block', marginTop: 6 }}>
                          <button
                            className="seo-guide-btn"
                            onClick={() => {/* 추후 실제 다운로드 연결 */}}
                            onMouseEnter={(e) => {
                              const tip = e.currentTarget.nextElementSibling as HTMLElement;
                              if (tip) tip.style.display = 'block';
                            }}
                            onMouseLeave={(e) => {
                              const tip = e.currentTarget.nextElementSibling as HTMLElement;
                              if (tip) tip.style.display = 'none';
                            }}
                            style={{
                              padding: '3px 10px', fontSize: 11, borderRadius: 4,
                              border: '1px solid #fbbf24', background: '#fffbeb', color: '#92400e',
                              cursor: 'pointer', fontWeight: 500,
                            }}
                          >
                            📥 가이드 다운로드
                          </button>
                          <div style={{
                            display: 'none', position: 'absolute', bottom: '100%', left: 0,
                            marginBottom: 6, padding: '10px 12px', borderRadius: 6,
                            background: '#fef9c3', border: '1px solid #fde68a',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 11, color: '#78350f',
                            whiteSpace: 'pre-line', minWidth: 220, zIndex: 10, lineHeight: 1.5,
                          }}>
                            {SEO_FIX_GUIDES[check.key].tooltip}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <OgTagEditor snippets={snippets} siteId={siteId} onChange={setSnippets} />
          <OgPreviewCards snippets={snippets} siteId={siteId} />

          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>마케팅 코드 설정</h3>

          <label style={labelStyle}>GA4 측정 ID</label>
          <input value={snippets.ga4Id || ''} onChange={(e) => setSnippets({ ...snippets, ga4Id: e.target.value })} placeholder="G-XXXXXXXXXX" style={{ ...inputStyle, borderColor: snippets.ga4Id ? '#22c55e' : '#d1d5db' }} />

          <label style={labelStyle}>Google Ads 전환 ID</label>
          <input value={snippets.googleAdsId || ''} onChange={(e) => setSnippets({ ...snippets, googleAdsId: e.target.value })} placeholder="AW-XXXXXXXXX (선택)" style={inputStyle} />

          <label style={labelStyle}>Google Search Console 메타</label>
          <input value={snippets.gscMeta || ''} onChange={(e) => setSnippets({ ...snippets, gscMeta: e.target.value })} placeholder='<meta name="google-site-verification" ...>' style={inputStyle} />

          <label style={labelStyle}>Naver 웹마스터 메타</label>
          <input value={snippets.naverMeta || ''} onChange={(e) => setSnippets({ ...snippets, naverMeta: e.target.value })} placeholder='<meta name="naver-site-verification" ...>' style={inputStyle} />

          <label style={labelStyle}>커스텀 {'<head>'} 코드</label>
          <textarea value={snippets.customHead || ''} onChange={(e) => setSnippets({ ...snippets, customHead: e.target.value })} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="기타 삽입할 HTML 코드" />

          {snippetMsg && <div style={{ fontSize: 12, color: snippetMsg.includes('실패') ? '#dc2626' : '#059669', marginBottom: 8 }}>{snippetMsg}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={handleSaveSnippets} disabled={savingSnippets} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
              {savingSnippets ? '저장 중...' : '설정 저장'}
            </button>
            <button onClick={() => handleDeploy('dev')} disabled={loading || !objectKey} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#475569' }}>
              Dev 배포
            </button>
            <button onClick={() => handleDeploy('prod')} disabled={loading || !objectKey} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#059669', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
              🚀 Prod 배포
            </button>
          </div>
        </div>
      )}

      {/* ── Right Column ── */}
      {isCollapsed('right') ? (
        <CollapsedColumn title="배포 & 인사이트" icon="🚀" onClick={() => setFocused('right')} />
      ) : (
        <div style={{
          width: colWidth('right', '290px'), flex: isExpanded('right') ? 1 : undefined,
          borderLeft: '1px solid #e2e8f0', padding: 20, background: '#f8fafc', overflowY: 'auto',
          position: 'relative', transition: 'flex 0.3s ease', flexShrink: 0,
        }}>
          {isExpanded('right') && (
            <button onClick={() => setFocused(null)} style={{
              position: 'absolute', top: 8, right: 8, background: '#e2e8f0', border: 'none',
              borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', color: '#64748b',
            }}>✕ 축소</button>
          )}

          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 12 }}>배포된 사이트</h4>
          {deployResult ? (
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 16 }}>
              {snippets.ogImage ? (
                <div style={{ height: 160, overflow: 'hidden' }}>
                  <img src={snippets.ogImage} alt="사이트 대표 이미지" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ height: 160, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#94a3b8' }}>
                  사이트 미리보기
                </div>
              )}
              <div style={{ padding: 12 }}>
                <a href={deployResult.deployedUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#2563eb', wordBreak: 'break-all' }}>
                  {deployResult.deployedUrl}
                </a>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  {deployResult.uploadedCount}개 파일 배포됨
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12, marginBottom: 16 }}>
              배포 후 미리보기가 표시됩니다
            </div>
          )}

          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 12 }}>검색 결과 미리보기</h4>
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#059669', marginBottom: 2 }}>{siteId}.aiseo.tips</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a0dab', marginBottom: 2 }}>{snippets.ogTitle || '사이트 제목'}</div>
            <div style={{ fontSize: 12, color: '#545454' }}>{snippets.ogDescription || '사이트 설명이 여기에 표시됩니다...'}</div>
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검색어 입력"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`, '_blank');
                }
              }}
              style={{ flex: 1, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12 }}
            />
            <button
              onClick={() => {
                if (searchQuery.trim()) {
                  window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`, '_blank');
                }
              }}
              style={{
                padding: '6px 12px', borderRadius: 6, border: 'none',
                background: '#4285f4', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Google
            </button>
          </div>

          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 12 }}>💡 인사이트 & 다음 단계</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ padding: 10, borderRadius: 6, background: '#fff', border: '1px solid #e2e8f0', fontSize: 12, color: '#475569' }}>
              <strong>Search Console 등록</strong> — 사이트를 Google에 등록하고 검색 노출을 시작하세요
            </div>
            <div style={{ padding: 10, borderRadius: 6, background: '#fff', border: '1px solid #e2e8f0', fontSize: 12, color: '#475569' }}>
              <strong>GA4 데이터 확인</strong> — 측정 ID 연결 후 실시간 데이터를 확인하세요
            </div>
            <div style={{ padding: 10, borderRadius: 6, background: '#fff', border: '1px solid #e2e8f0', fontSize: 12, color: '#475569' }}>
              <strong>Naver 웹마스터 등록</strong> — 네이버 검색 노출을 위해 등록하세요
            </div>
          </div>

          <div style={{ marginTop: 16, padding: 16, borderRadius: 8, background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>Search Console 설정이 어려우신가요?</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>15분 가이드 영상을 시청해 보세요</div>
            <button style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, cursor: 'pointer' }}>
              교육 신청
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
