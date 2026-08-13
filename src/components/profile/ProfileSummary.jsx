import { formatGender, formatMeta } from '../../utils/profile'

export function ProfileSummary({
  profile,
  displayName,
  profileComplete,
  profileLoaded,
  busy,
  onEditProfile,
}) {
  return (
    <section className="profile-summary">
      <div className="profile-summary-top">
        <div>
          <p className="profile-summary-label">해석에 사용할 내 정보</p>
          <h2 className="profile-summary-name">{displayName}</h2>
          {profileComplete ? (
            <p className="profile-summary-meta">{formatMeta(profile)}</p>
          ) : (
            <p className="profile-summary-meta">
              기본 정보가 아직 없어요. 모달에서 먼저 입력해 주세요.
            </p>
          )}
        </div>
        <button
          type="button"
          className="profile-edit-btn"
          onClick={onEditProfile}
          disabled={!profileLoaded || busy}
        >
          프로필 수정
        </button>
      </div>

      <div className="profile-chips">
        <span className="chip">이름 {profile.name || '-'}</span>
        <span className="chip">생년월일 {profile.birthDate || '-'}</span>
        <span className="chip">시간 {profile.birthTime || '미입력'}</span>
        <span className="chip">성별 {formatGender(profile.gender) || '-'}</span>
        <span className="chip">
          {profile.calendarType === 'lunar' ? '음력' : '양력'}
        </span>
      </div>
    </section>
  )
}
