import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import './App.css'
import { interpretSaju } from './gemini'
import { supabase } from './supabase'

const EMPTY_PROFILE = {
  name: '',
  birthDate: '',
  birthTime: '',
  gender: '',
  calendarType: 'solar',
}

function formatGender(gender) {
  if (gender === 'male') return '남성'
  if (gender === 'female') return '여성'
  return ''
}

function formatMeta(profile) {
  return [
    profile.birthDate,
    profile.birthTime,
    formatGender(profile.gender),
    profile.calendarType === 'lunar' ? '음력' : '양력',
  ]
    .filter(Boolean)
    .join(' · ')
}

function formatReadingDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function profileFromRow(row, fallbackName = '') {
  return {
    name: row?.name ?? fallbackName ?? '',
    birthDate: row?.birth_date ?? '',
    birthTime: row?.birth_time ? String(row.birth_time).slice(0, 5) : '',
    gender: row?.gender ?? '',
    calendarType: row?.calendar_type ?? 'solar',
  }
}

function isProfileComplete(profile) {
  return Boolean(
    profile.name?.trim() &&
      profile.birthDate &&
      profile.gender &&
      profile.calendarType,
  )
}

function ProfileFields({
  values,
  onChange,
  disabled = false,
  nameRef = null,
}) {
  function update(key, value) {
    onChange({ ...values, [key]: value })
  }

  return (
    <div className="profile-fields">
      <label className="field">
        <span>
          이름 <em className="req">필수</em>
        </span>
        <input
          ref={nameRef}
          type="text"
          placeholder="이름을 입력하세요"
          value={values.name}
          onChange={(e) => update('name', e.target.value)}
          disabled={disabled}
          autoComplete="name"
        />
      </label>

      <label className="field">
        <span>
          생년월일 <em className="req">필수</em>
        </span>
        <input
          type="date"
          value={values.birthDate}
          onChange={(e) => update('birthDate', e.target.value)}
          disabled={disabled}
        />
      </label>

      <label className="field">
        <span>태어난 시간</span>
        <input
          type="time"
          value={values.birthTime}
          onChange={(e) => update('birthTime', e.target.value)}
          disabled={disabled}
        />
        <span className="field-hint">모르면 비워 두어도 돼요</span>
      </label>

      <div className="field-row">
        <label className="field">
          <span>
            성별 <em className="req">필수</em>
          </span>
          <select
            value={values.gender}
            onChange={(e) => update('gender', e.target.value)}
            disabled={disabled}
          >
            <option value="">선택하세요</option>
            <option value="male">남성</option>
            <option value="female">여성</option>
          </select>
        </label>

        <label className="field">
          <span>
            양력 / 음력 <em className="req">필수</em>
          </span>
          <select
            value={values.calendarType}
            onChange={(e) => update('calendarType', e.target.value)}
            disabled={disabled}
          >
            <option value="solar">양력</option>
            <option value="lunar">음력</option>
          </select>
        </label>
      </div>
    </div>
  )
}

function ProfileModal({
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

function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [profile, setProfile] = useState(EMPTY_PROFILE)
  const [draft, setDraft] = useState(EMPTY_PROFILE)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [profileModal, setProfileModal] = useState(null)

  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [listError, setListError] = useState('')
  const [toast, setToast] = useState('')

  const [readings, setReadings] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [resultKey, setResultKey] = useState(0)

  const resultRef = useRef(null)
  const modalNameRef = useRef(null)
  const toastTimerRef = useRef(null)

  const user = session?.user ?? null
  const userId = user?.id ?? null
  const profileComplete = isProfileComplete(profile)
  const isViewingSaved = Boolean(selectedId)
  const busy = loading || saving
  const canInterpret = Boolean(userId && profileComplete) && !busy
  const canUpdateResult = Boolean(userId && selectedId && result) && !busy

  function showToast(message) {
    setToast(message)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(''), 2400)
  }

  function openProfileModal(mode, source = profile) {
    setDraft(source)
    setModalError('')
    setProfileModal(mode)
    requestAnimationFrame(() => modalNameRef.current?.focus())
  }

  async function upsertProfile(userIdValue, values) {
    const { data, error: profileError } = await supabase
      .from('users')
      .upsert(
        {
          id: userIdValue,
          name: values.name.trim(),
          birth_date: values.birthDate || null,
          birth_time: values.birthTime || null,
          gender: values.gender || null,
          calendar_type: values.calendarType || 'solar',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select('id, name, birth_date, birth_time, gender, calendar_type')
      .single()

    if (profileError) {
      throw new Error(`프로필 저장 실패: ${profileError.message}`)
    }

    return profileFromRow(data)
  }

  async function loadProfile(userIdValue, fallbackName = '') {
    const { data, error: profileError } = await supabase
      .from('users')
      .select('id, name, birth_date, birth_time, gender, calendar_type')
      .eq('id', userIdValue)
      .maybeSingle()

    if (profileError) {
      throw new Error(`프로필 불러오기 실패: ${profileError.message}`)
    }

    let nextProfile

    if (!data) {
      const { data: created, error: createError } = await supabase
        .from('users')
        .insert({
          id: userIdValue,
          name: fallbackName || null,
          calendar_type: 'solar',
        })
        .select('id, name, birth_date, birth_time, gender, calendar_type')
        .single()

      if (createError) {
        throw new Error(`프로필 생성 실패: ${createError.message}`)
      }

      nextProfile = profileFromRow(created, fallbackName)
    } else {
      nextProfile = profileFromRow(data, fallbackName)
    }

    setProfile(nextProfile)
    setProfileLoaded(true)

    if (!isProfileComplete(nextProfile)) {
      openProfileModal('onboarding', nextProfile)
    } else {
      setProfileModal(null)
    }
  }

  async function loadReadings() {
    const { data, error: fetchError } = await supabase
      .from('saju_readings')
      .select('id, result, created_at, user_id')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error(fetchError)
      setListError('저장된 사주 목록을 불러오지 못했어요.')
      return
    }

    setListError('')
    setReadings(data ?? [])
  }

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session: current } }) => {
      if (!mounted) return
      setSession(current)
      setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!userId) {
      setReadings([])
      setProfile(EMPTY_PROFILE)
      setProfileLoaded(false)
      setProfileModal(null)
      return
    }

    const fallbackName =
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email ||
      ''

    loadProfile(userId, fallbackName).catch((err) => {
      console.error(err)
      setError(err.message)
    })
    loadReadings()
  }, [userId])

  useEffect(() => {
    if (!result || !selectedId) return
    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [resultKey, result, selectedId])

  async function handleGoogleLogin() {
    setError('')
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (authError) {
      setError(`로그인 실패: ${authError.message}`)
    }
  }

  async function handleLogout() {
    setError('')
    const { error: authError } = await supabase.auth.signOut()
    if (authError) {
      setError(`로그아웃 실패: ${authError.message}`)
      return
    }
    setSelectedId(null)
    setResult('')
    setReadings([])
    setProfile(EMPTY_PROFILE)
    setProfileLoaded(false)
    setProfileModal(null)
    showToast('로그아웃했어요')
  }

  async function handleSaveProfileModal() {
    if (!userId) return
    if (!isProfileComplete(draft)) {
      setModalError('이름, 생년월일, 성별을 모두 입력해 주세요.')
      return
    }

    setSaving(true)
    setModalError('')

    try {
      const mode = profileModal
      const saved = await upsertProfile(userId, draft)
      setProfile(saved)
      setProfileModal(null)
      showToast(
        mode === 'onboarding'
          ? '환영해요! 이제 사주를 볼 수 있어요'
          : '프로필을 저장했어요',
      )
    } catch (err) {
      setModalError(err.message || '프로필 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleInterpret() {
    if (!userId) {
      setError('먼저 Google로 로그인해 주세요.')
      return
    }
    if (!profileComplete) {
      openProfileModal('onboarding', profile)
      return
    }

    setLoading(true)
    setError('')
    setResult('')

    try {
      const text = await interpretSaju({
        name: profile.name.trim(),
        birthDate: profile.birthDate,
        birthTime: profile.birthTime,
        gender: profile.gender,
        calendarType: profile.calendarType,
      })
      setResult(text)
      setResultKey((key) => key + 1)

      if (selectedId) {
        const { data, error: updateError } = await supabase
          .from('saju_readings')
          .update({ result: text })
          .eq('id', selectedId)
          .select('id, result, created_at, user_id')
          .single()

        if (updateError) {
          throw new Error(`수정 실패: ${updateError.message}`)
        }

        setReadings((prev) =>
          prev.map((item) => (item.id === data.id ? data : item)),
        )
        showToast('사주가 다시 해석되어 수정됐어요')
      } else {
        const { data, error: saveError } = await supabase
          .from('saju_readings')
          .insert({
            user_id: userId,
            result: text,
          })
          .select('id, result, created_at, user_id')
          .single()

        if (saveError) {
          throw new Error(`저장 실패: ${saveError.message}`)
        }

        setReadings((prev) => [data, ...prev])
        setSelectedId(data.id)
        showToast('사주가 저장됐어요')
      }
    } catch (err) {
      setError(err.message || '해석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate() {
    if (!selectedId || !userId || !result) return

    setSaving(true)
    setError('')

    try {
      const { data, error: updateError } = await supabase
        .from('saju_readings')
        .update({ result })
        .eq('id', selectedId)
        .select('id, result, created_at, user_id')
        .single()

      if (updateError) {
        throw new Error(`수정 실패: ${updateError.message}`)
      }

      setReadings((prev) =>
        prev.map((item) => (item.id === data.id ? data : item)),
      )
      showToast('결과를 저장했어요')
    } catch (err) {
      setError(err.message || '수정 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedId) return
    const ok = window.confirm('이 사주 결과를 삭제할까요? 프로필 정보는 유지됩니다.')
    if (!ok) return

    setSaving(true)
    setError('')

    try {
      const { error: deleteError } = await supabase
        .from('saju_readings')
        .delete()
        .eq('id', selectedId)

      if (deleteError) {
        throw new Error(`삭제 실패: ${deleteError.message}`)
      }

      setReadings((prev) => prev.filter((item) => item.id !== selectedId))
      handleNewSaju()
      showToast('사주 결과를 삭제했어요')
    } catch (err) {
      setError(err.message || '삭제 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  function handleSelectReading(reading) {
    setSelectedId(reading.id)
    setResult(reading.result ?? '')
    setResultKey((key) => key + 1)
    setError('')
  }

  function handleNewSaju() {
    setSelectedId(null)
    setResult('')
    setError('')
  }

  if (authLoading) {
    return (
      <div className="auth-screen">
        <p>로그인 상태 확인 중...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <p className="auth-eyebrow">윤정현의 사주</p>
          <h1>Google로 로그인</h1>
          <p className="auth-desc">
            로그인 후 내 정보를 한 번만 저장하면, 다음부터는 바로 사주를 볼 수
            있어요.
          </p>
          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleLogin}
          >
            Google로 계속하기
          </button>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    )
  }

  const displayName = profile.name || user.email || '사용자'

  return (
    <div className="layout">
      {profileModal && (
        <ProfileModal
          mode={profileModal}
          values={draft}
          onChange={setDraft}
          onSave={handleSaveProfileModal}
          onClose={() => {
            if (profileModal === 'onboarding') return
            setProfileModal(null)
            setModalError('')
          }}
          saving={saving}
          error={modalError}
          nameRef={modalNameRef}
        />
      )}

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
                onClick={() => openProfileModal('edit', profile)}
                disabled={busy || !profileLoaded}
              >
                프로필 수정
              </button>
              <button
                type="button"
                className="logout-btn"
                onClick={handleLogout}
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
            onClick={handleNewSaju}
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
                  onClick={() => handleSelectReading(reading)}
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
              onClick={() => openProfileModal('edit', profile)}
              disabled={!profileLoaded || busy}
            >
              프로필 수정
            </button>
          </div>

          <div className="profile-chips">
            <span className="chip">이름 {profile.name || '-'}</span>
            <span className="chip">생년월일 {profile.birthDate || '-'}</span>
            <span className="chip">시간 {profile.birthTime || '미입력'}</span>
            <span className="chip">
              성별 {formatGender(profile.gender) || '-'}
            </span>
            <span className="chip">
              {profile.calendarType === 'lunar' ? '음력' : '양력'}
            </span>
          </div>
        </section>

        {isViewingSaved && (
          <div className="notice">
            <p>저장된 해석 결과를 보고 있어요. 결과는 프로필과 따로 관리됩니다.</p>
            <div className="notice-actions">
              <button
                type="button"
                className="notice-btn"
                onClick={handleNewSaju}
                disabled={busy}
              >
                새 사주 만들기
              </button>
              <button
                type="button"
                className="update-btn"
                onClick={handleUpdate}
                disabled={!canUpdateResult}
              >
                {saving ? '저장 중...' : '결과 저장'}
              </button>
              <button
                type="button"
                className="delete-btn"
                onClick={handleDelete}
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
            onClick={handleInterpret}
            disabled={!canInterpret}
          >
            {loading
              ? '해석 중...'
              : isViewingSaved
                ? '다시 해석해서 결과 수정'
                : '내 정보로 사주 해석하기'}
          </button>
          {!profileComplete && (
            <p className="actions-hint">
              프로필을 먼저 완성하면 해석할 수 있어요
            </p>
          )}
        </div>

        {loading && (
          <div className="loading-panel" role="status" aria-live="polite">
            <span className="loading-dot" />
            <div>
              <p className="loading-title">사주를 해석하는 중이에요</p>
              <p className="loading-sub">
                프로필 정보를 기준으로 해석한 뒤 결과만 저장합니다.
              </p>
            </div>
          </div>
        )}

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {toast && (
          <p className="toast" role="status">
            {toast}
          </p>
        )}

        {result && !loading && (
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
                      onClick={handleUpdate}
                      disabled={!canUpdateResult}
                    >
                      {saving ? '저장 중...' : '결과 저장'}
                    </button>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={handleDelete}
                      disabled={busy}
                    >
                      결과 삭제
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="new-btn"
                  onClick={handleNewSaju}
                  disabled={busy}
                >
                  이어서 새 사주 만들기
                </button>
              </div>
            </footer>
          </section>
        )}
      </div>
    </div>
  )
}

export default App
