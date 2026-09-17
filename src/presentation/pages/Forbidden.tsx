export function Forbidden() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-qor-canvas">
      <p data-testid="forbidden-message" className="text-white">
        You don't have permission to view this page.
      </p>
    </div>
  )
}
