import { useEffect, useRef, useState } from 'react'
import { interpretSaju } from '../lib/gemini'
import { supabase } from '../lib/supabase'
import {
  EMPTY_PROFILE,
  isProfileComplete,
  profileFromRow,
} from '../utils/profile'

export function useSajuApp() {
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
  const displayName = profile.name || user?.email || '사용자'

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
    const ok = window.confirm(
      '이 사주 결과를 삭제할까요? 프로필 정보는 유지됩니다.',
    )
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

  function closeProfileModal() {
    if (profileModal === 'onboarding') return
    setProfileModal(null)
    setModalError('')
  }

  return {
    authLoading,
    user,
    displayName,
    profile,
    draft,
    setDraft,
    profileLoaded,
    profileComplete,
    profileModal,
    readings,
    selectedId,
    listError,
    result,
    resultRef,
    resultKey,
    loading,
    saving,
    busy,
    error,
    modalError,
    toast,
    isViewingSaved,
    canInterpret,
    canUpdateResult,
    modalNameRef,
    handleGoogleLogin,
    handleLogout,
    handleSaveProfileModal,
    handleInterpret,
    handleUpdate,
    handleDelete,
    handleSelectReading,
    handleNewSaju,
    openProfileModal,
    closeProfileModal,
  }
}
