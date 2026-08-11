import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import './App.css'
import { interpretSaju } from './gemini'

function App() {
  // 입력 state
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [gender, setGender] = useState('')
  const [calendarType, setCalendarType] = useState('solar')

  // Gemini 결과 state
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 사주 해석 버튼 클릭
  async function handleInterpret() {
    setLoading(true)
    setError('')
    setResult('')

    try {
      const text = await interpretSaju({
        name,
        birthDate,
        birthTime,
        gender,
        calendarType,
      })
      setResult(text)
    } catch (err) {
      setError(err.message || '해석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <h1>사주 정보 입력</h1>

      <label className="field">
        <span>이름</span>
        <input
          type="text"
          placeholder="이름을 입력하세요"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <p className="preview">
        {name || birthDate
          ? `${name || '이름 미입력'}님의 사주${birthDate ? ` (${birthDate})` : ''}`
          : '이름이나 생년월일을 입력하면 여기에 보여요'}
      </p>

      <label className="field">
        <span>생년월일</span>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
      </label>

      <label className="field">
        <span>태어난 시간</span>
        <input
          type="time"
          value={birthTime}
          onChange={(e) => setBirthTime(e.target.value)}
        />
      </label>

      <label className="field">
        <span>성별</span>
        <select value={gender} onChange={(e) => setGender(e.target.value)}>
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
        >
          <option value="solar">양력</option>
          <option value="lunar">음력</option>
        </select>
      </label>

      <button
        type="button"
        className="analyze-btn"
        onClick={handleInterpret}
        disabled={loading}
      >
        {loading ? '해석 중...' : '사주 기본 차트 해석하기'}
      </button>

      {error && <p className="error">{error}</p>}

      {result && (
        <section className="result">
          <h2>해석 결과</h2>
          <div className="result-content">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </section>
      )}
    </div>
  )
}

export default App
