export function ProfileFields({
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
