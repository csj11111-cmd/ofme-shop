function FieldLabel({ children, required = false }) {
  return (
    <span className="field-label">
      {children}
      {required && (
        <span className="field-label__required" aria-label="필수">
          *
        </span>
      )}
    </span>
  )
}

export default FieldLabel
