import { isProfileComplete } from '../../utils/profile'
import { ProfileFields } from './ProfileFields'

export function ProfileModal({
  mode,
  values,
  onChange,
  onSave,
  onClose,
  saving,
  error,
  nameRef,
}) {
  const requiredOk = isProfileComplete(values)
  const isOnboarding = mode === 'onboarding'

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        <header className="modal-header">
          <div>
            <p className="modal-eyebrow">
              {isOnboarding ? '시작하기' : '프로필'}
            </p>
            <h2 id="profile-modal-title">
              {isOnboarding ? '기본 정보를 입력해 주세요' : '프로필 수정'}
            </h2>
            <p className="modal-desc">
              {isOnboarding
                ? '처음 한 번만 입력하면, 다음부터는 자동으로 불러와서 사주를 볼 수 있어요.'
                : '저장된 내 정보를 수정할 수 있어요. 다음 사주 해석에 바로 반영됩니다.'}
            </p>
          </div>
          {!isOnboarding && (
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="닫기"
            >
              ×
            </button>
          )}
        </header>

        <ProfileFields
          values={values}
          onChange={onChange}
          disabled={saving}
          nameRef={nameRef}
        />

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <div className="modal-actions">
          {!isOnboarding && (
            <button
              type="button"
              className="ghost-btn"
              onClick={onClose}
              disabled={saving}
            >
              취소
            </button>
          )}
          <button
            type="button"
            className="analyze-btn"
            onClick={onSave}
            disabled={!requiredOk || saving}
          >
            {saving
              ? '저장 중...'
              : isOnboarding
                ? '저장하고 시작하기'
                : '프로필 저장'}
          </button>
        </div>
        {!requiredOk && (
          <p className="actions-hint">이름, 생년월일, 성별은 꼭 입력해 주세요</p>
        )}
      </div>
    </div>
  )
}
