import { act, type ReactNode } from "react"
import { createRoot } from "react-dom/client"

/**
 * Renders `node` into a new element under `document.body`, inside `act`, so
 * effects have run when it returns. Call `unmount` at the end of the test.
 */
export function render(node: ReactNode): { host: HTMLElement; rerender(node: ReactNode): void; unmount(): void } {
  const host = document.createElement("div")
  document.body.append(host)
  const root = createRoot(host)
  act(() => root.render(node))
  return {
    host,
    rerender: (next) => act(() => root.render(next)),
    unmount: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}
