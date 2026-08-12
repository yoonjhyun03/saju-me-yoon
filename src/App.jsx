import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import './App.css'
import { interpretSaju } from './gemini'
import { supabase } from './supabase'

function formatGender(gender) {
  if (gender === 'male') return '남성'
  if (gender === 'female') return '여성'
  return ''
}

function formatMeta({ birthDate, birthTime, gender, calendarType }) {
  return [
    birthDate,
    birthTime,
    formatGender(gender),
    calendarType === 'lunar' ? '음력' : calendarType === 'solar' ? '양력' : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

function App() {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [gender, setGender] = useState('')
  const [calendarType, setCalendarType] = useState('solar')

  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [listError, setListError] = useState('')
  const [toast, setToast] = useState('')

  const [readings, setReadings] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [resultKey, setResultKey] = useState(0)

  const resultRef = useRef(null)
  const nameInputRef = useRef(null)
  const formTopRef = useRef(null)
  const toastTimerRef = useRef(null)

  const isViewingSaved = Boolean(selectedId)
  const canInterpret = Boolean(name.trim() && birthDate) && !loading

  function showToast(message) {
    setToast(message)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(''), 2400)
  }

  async function loadReadings() {
    const { data, error: fetchError } = await supabase
      .from('saju_readings')
      .select(
        'id, name, birth_date, birth_time, gender, calendar_type, result, created_at',
      )
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
    loadReadings()
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!result || !selectedId) return
    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [resultKey, result, selectedId])

  async function handleInterpret() {
    if (!name.trim() || !birthDate) {
      setError('이름과 생년월일을 입력해 주세요.')
      nameInputRef.current?.focus()
      return
    }

    setLoading(true)
    setError('')
    setResult('')
    setSelectedId(null)

    try {
      const text = await interpretSaju({
        name: name.trim(),
        birthDate,
        birthTime,
        gender,
        calendarType,
      })
      setResult(text)
      setResultKey((key) => key + 1)

      const { data, error: saveError } = await supabase
        .from('saju_readings')
        .insert({
          name: name.trim() || '이름 미입력',
          birth_date: birthDate || null,
          birth_time: birthTime || null,
          gender: gender || null,
          calendar_type: calendarType,
          result: text,
        })
        .select(
          'id, name, birth_date, birth_time, gender, calendar_type, result, created_at',
        )
        .single()

      if (saveError) {
        throw new Error(`저장 실패: ${saveError.message}`)
      }

      setReadings((prev) => [data, ...prev])
      setSelectedId(data.id)
      showToast('사주가 저장됐어요')
    } catch (err) {
      setError(err.message || '해석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function handleSelectReading(reading) {
    setSelectedId(reading.id)
    setName(reading.name ?? '')
    setBirthDate(reading.birth_date ?? '')
    setBirthTime(reading.birth_time ? reading.birth_time.slice(0, 5) : '')
    setGender(reading.gender ?? '')
    setCalendarType(reading.calendar_type ?? 'solar')
    setResult(reading.result ?? '')
    setResultKey((key) => key + 1)
    setError('')
  }

  function handleNewSaju() {
    setSelectedId(null)
    setName('')
    setBirthDate('')
    setBirthTime('')
    setGender('')
    setCalendarType('solar')
    setResult('')
    setError('')
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    requestAnimationFrame(() => nameInputRef.current?.focus())
  }

  function handleFormKeyDown(event) {
    if (event.key !== 'Enter') return
    if (event.target.tagName === 'TEXTAREA') return
    if (event.target.tagName === 'BUTTON') return
    event.preventDefault()
    if (canInterpret) handleInterpret()
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-heading">
            <h2 className="sidebar-title">저장된 사주</h2>
            <span className="sidebar-count">{readings.length}</span>
          </div>
          <button
            type="button"
            className="sidebar-new-btn"
            onClick={handleNewSaju}
            disabled={loading}
          >
            새 사주
          </button>
        </div>

        {listError && <p className="sidebar-empty">{listError}</p>}

        {!listError && readings.length === 0 ? (
          <p className="sidebar-empty">아직 저장된 기록이 없어요</p>
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
                  <span className="sidebar-item-name">{reading.name}</span>
                  {reading.birth_date && (
                    <span className="sidebar-item-meta">{reading.birth_date}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <div className="app" ref={formTopRef}>
        <header className="app-header">
          <h1>사주 정보 입력</h1>
          <p
            className={
              isViewingSaved ? 'mode-badge is-saved' : 'mode-badge is-draft'
            }
          >
            {isViewingSaved ? '저장된 기록 보는 중' : '새 사주 작성 중'}
          </p>
        </header>

        {isViewingSaved && (
          <div className="notice">
            <p>저장된 사주를 보고 있어요. 새로 보려면 새 사주 만들기를 눌러 주세요.</p>
            <button
              type="button"
              className="notice-btn"
              onClick={handleNewSaju}
              disabled={loading}
            >
              새 사주 만들기
            </button>
          </div>
        )}

        <div className="form" onKeyDown={handleFormKeyDown}>
          <label className="field">
            <span>
              이름 <em className="req">필수</em>
            </span>
            <input
              ref={nameInputRef}
              type="text"
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              autoComplete="name"
            />
          </label>

          <p className="preview" aria-live="polite">
            {name || birthDate
              ? `${name || '이름 미입력'}님의 사주${birthDate ? ` (${birthDate})` : ''}`
              : '이름과 생년월일을 입력하면 미리보기가 보여요'}
          </p>

          <label className="field">
            <span>
              생년월일 <em className="req">필수</em>
            </span>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              disabled={loading}
            />
          </label>

          <label className="field">
            <span>태어난 시간</span>
            <input
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              disabled={loading}
            />
            <span className="field-hint">모르면 비워 두어도 돼요</span>
          </label>

          <div className="field-row">
            <label className="field">
              <span>성별</span>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                disabled={loading}
              >
                <option value="">선택하세요</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
              </select>
            </label>

            <label className="field">
              <span>양력 / 음력</span>
              <select
                value={calendarType}
                onChange={(e) => setCalendarType(e.target.value)}
                disabled={loading}
              >
                <option value="solar">양력</option>
                <option value="lunar">음력</option>
              </select>
            </label>
          </div>

          <div className="actions">
            <button
              type="button"
              className="new-btn"
              onClick={handleNewSaju}
              disabled={loading}
            >
              새 사주 만들기
            </button>
            <button
              type="button"
              className="analyze-btn"
              onClick={handleInterpret}
              disabled={!canInterpret}
            >
              {loading ? '해석 중...' : '사주 기본 차트 해석하기'}
            </button>
            {!name.trim() || !birthDate ? (
              <p className="actions-hint">이름과 생년월일을 입력하면 해석할 수 있어요</p>
            ) : null}
          </div>
        </div>

        {loading && (
          <div className="loading-panel" role="status" aria-live="polite">
            <span className="loading-dot" />
            <div>
              <p className="loading-title">사주를 해석하는 중이에요</p>
              <p className="loading-sub">잠시만 기다려 주세요. 완료되면 자동으로 저장됩니다.</p>
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
              <h2 className="result-title">
                {name ? `${name}님의 사주` : '사주 해석'}
              </h2>
              {formatMeta({ birthDate, birthTime, gender, calendarType }) && (
                <p className="result-meta">
                  {formatMeta({ birthDate, birthTime, gender, calendarType })}
                </p>
              )}
            </header>
            <div className="result-content">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
            <footer className="result-footer">
              <button
                type="button"
                className="new-btn"
                onClick={handleNewSaju}
              >
                이어서 새 사주 만들기
              </button>
            </footer>
          </section>
        )}
      </div>
    </div>
  )
}

export default App
