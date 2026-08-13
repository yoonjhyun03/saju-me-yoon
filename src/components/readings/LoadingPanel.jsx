export function LoadingPanel() {
  return (
    <div className="loading-panel" role="status" aria-live="polite">
      <span className="loading-dot" />
      <div>
        <p className="loading-title">사주를 해석하는 중이에요</p>
        <p className="loading-sub">
          프로필 정보를 기준으로 해석한 뒤 결과만 저장합니다.
        </p>
      </div>
    </div>
  )
}
