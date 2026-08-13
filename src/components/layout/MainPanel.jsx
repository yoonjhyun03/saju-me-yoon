import { ProfileSummary } from '../profile/ProfileSummary'
import { LoadingPanel } from '../readings/LoadingPanel'
import { ReadingResult } from '../readings/ReadingResult'
import { Toast } from '../common/Toast'

export function MainPanel({
  isViewingSaved,
  profile,
  displayName,
  profileComplete,
  profileLoaded,
  busy,
  loading,
  saving,
  canInterpret,
  canUpdateResult,
  error,
  toast,
  result,
  resultRef,
  resultKey,
  onEditProfile,
  onNewSaju,
  onUpdate,
  onDelete,
  onInterpret,
}) {
  return (
    <div className="app">
      <header className="app-header">
        <h1>{isViewingSaved ? '저장된 사주 결과' : '사주 보기'}</h1>
        <p
          className={
            isViewingSaved ? 'mode-badge is-saved' : 'mode-badge is-draft'
          }
        >
          {isViewingSaved ? '결과 상세' : '내 정보로 해석'}
        </p>
      </header>

      <ProfileSummary
        profile={profile}
        displayName={displayName}
        profileComplete={profileComplete}
        profileLoaded={profileLoaded}
        busy={busy}
        onEditProfile={onEditProfile}
      />

      {isViewingSaved && (
        <div className="notice">
          <p>저장된 해석 결과를 보고 있어요. 결과는 프로필과 따로 관리됩니다.</p>
          <div className="notice-actions">
            <button
              type="button"
              className="notice-btn"
              onClick={onNewSaju}
              disabled={busy}
            >
              새 사주 만들기
            </button>
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
          </div>
        </div>
      )}

      <div className="actions main-actions">
        <button
          type="button"
          className="analyze-btn"
          onClick={onInterpret}
          disabled={!canInterpret}
        >
          {loading
            ? '해석 중...'
            : isViewingSaved
              ? '다시 해석해서 결과 수정'
              : '내 정보로 사주 해석하기'}
        </button>
        {!profileComplete && (
          <p className="actions-hint">프로필을 먼저 완성하면 해석할 수 있어요</p>
        )}
      </div>

      {loading && <LoadingPanel />}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <Toast message={toast} />

      {result && !loading && (
        <ReadingResult
          resultRef={resultRef}
          resultKey={resultKey}
          displayName={displayName}
          profile={profile}
          result={result}
          isViewingSaved={isViewingSaved}
          canUpdateResult={canUpdateResult}
          busy={busy}
          saving={saving}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onNewSaju={onNewSaju}
        />
      )}
    </div>
  )
}
