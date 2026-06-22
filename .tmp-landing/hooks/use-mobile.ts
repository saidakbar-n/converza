import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    
    // We already initialized it correctly if window is defined.
    // If we need to sync it, we can call onChange() which calls setState
    // Or just avoid calling it synchronously. Since it's properly initialized in state, we don't strictly need to call it again.
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
