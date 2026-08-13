import { formatMeta, formatReadingDate } from '../../utils/profile'

export function Sidebar({
  displayName,
  profile,
  profileComplete,
  profileLoaded,
  readings,
  selectedId,
  listError,
  busy,
  onEditProfile,
  onLogout,
  onNewSaju,
  onSelectReading,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-user">
          <p className="sidebar-user-label">내 프로필</p>
          <p className="sidebar-user-name">{displayName}</p>
          {profileComplete && (
            <p className="sidebar-user-meta">{formatMeta(profile)}</p>
          )}
          <div className="sidebar-user-actions">
            <button
              type="button"
              className="profile-edit-btn"
              onClick={onEditProfile}
              disabled={busy || !profileLoaded}
            >
              프로필 수정
            </button>
            <button
              type="button"
              className="logout-btn"
              onClick={onLogout}
              disabled={busy}
            >
              로그아웃
            </button>
          </div>
        </div>

        <div className="sidebar-heading">
          <h2 className="sidebar-title">내 사주 결과</h2>
          <span className="sidebar-count">{readings.length}</span>
        </div>
        <button
          type="button"
          className="sidebar-new-btn"
          onClick={onNewSaju}
          disabled={busy || !profileComplete}
        >
          새 사주
        </button>
      </div>

      {listError && <p className="sidebar-empty">{listError}</p>}

      {!listError && readings.length === 0 ? (
        <p className="sidebar-empty">아직 저장된 결과가 없어요</p>
      ) : (
        <ul className="sidebar-list">
          {readings.map((reading) => (
            <li key={reading.id}>
              <button
                type="button"
                className={
                  selectedId === reading.id
                    ? 'sidebar-item is-active'
                    : 'sidebar-item'
                }
                onClick={() => onSelectReading(reading)}
              >
                <span className="sidebar-item-name">{displayName}</span>
                <span className="sidebar-item-meta">
                  {formatReadingDate(reading.created_at)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
