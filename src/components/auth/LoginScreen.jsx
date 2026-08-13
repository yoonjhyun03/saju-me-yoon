export function LoginScreen({ onLogin, error }) {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <p className="auth-eyebrow">윤정현의 사주</p>
        <h1>Google로 로그인</h1>
        <p className="auth-desc">
          로그인 후 내 정보를 한 번만 저장하면, 다음부터는 바로 사주를 볼 수
          있어요.
        </p>
        <button type="button" className="google-btn" onClick={onLogin}>
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
