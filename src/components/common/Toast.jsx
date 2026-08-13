export function Toast({ message }) {
  if (!message) return null
  return (
    <p className="toast" role="status">
      {message}
    </p>
  )
}
