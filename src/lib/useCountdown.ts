import { useEffect, useRef, useState } from 'react'

/**
 * Contagem regressiva ancorada no `remainingSeconds` do servidor.
 *
 * O relógio do cliente não é confiável (e o servidor ignora qualquer tempo enviado por ele), então o
 * prazo local é recalculado como `agora + remainingSeconds` toda vez que chega um payload novo —
 * identificado por `resetKey`, normalmente o `questionId`.
 */
export function useCountdown(remainingSeconds: number | null, resetKey: string | null): number {
  const deadlineRef = useRef<number | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.ceil(remainingSeconds ?? 0)))

  useEffect(() => {
    if (remainingSeconds === null || resetKey === null) {
      deadlineRef.current = null
      setSecondsLeft(0)
      return
    }

    deadlineRef.current = Date.now() + remainingSeconds * 1000
    setSecondsLeft(Math.max(0, Math.ceil(remainingSeconds)))

    const tick = () => {
      const deadline = deadlineRef.current
      if (deadline === null) return
      setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)))
    }

    const timer = window.setInterval(tick, 200)
    return () => window.clearInterval(timer)
  }, [remainingSeconds, resetKey])

  return secondsLeft
}
