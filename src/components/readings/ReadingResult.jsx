import ReactMarkdown from 'react-markdown'
import { formatMeta } from '../../utils/profile'

export function ReadingResult({
  resultRef,
  resultKey,
  displayName,
  profile,
  result,
  isViewingSaved,
  canUpdateResult,
  busy,
  saving,
  onUpdate,
  onDelete,
  onNewSaju,
}) {
  return (
    <section className="result" ref={resultRef} key={resultKey}>
      <header className="result-header">
        <p className="result-eyebrow">해석 결과</p>
        <h2 className="result-title">{displayName}님의 사주</h2>
        <p className="result-meta">{formatMeta(profile)}</p>
      </header>
      <div className="result-content">
        <ReactMarkdown>{result}</ReactMarkdown>
      </div>
      <footer className="result-footer">
        <div className="result-footer-actions">
          {isViewingSaved && (
            <>
              <button
                type="button"
                className="update-btn"
                onClick={onUpdate}
                disabled={!canUpdateResult}
              >
                {saving ? '저장 중...' : '결과 저장'}
              </button>
              <button
                type="button"
                className="delete-btn"
                onClick={onDelete}
                disabled={busy}
              >
                결과 삭제
              </button>
            </>
          )}
          <button
            type="button"
            className="new-btn"
            onClick={onNewSaju}
            disabled={busy}
          >
            이어서 새 사주 만들기
          </button>
        </div>
      </footer>
    </section>
  )
}
