import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const WORDS = ['Learn.', 'Support.', 'Thrive.']

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [wordIndex, setWordIndex] = useState(0)
  const [showWord, setShowWord] = useState(true)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    // Each word: 0.5s fade-in + 0.7s hold + 0.3s fade-out = 1.5s per word
    // After all 3 words (4.5s total), fade out screen

    let cancelled = false

    async function run() {
      for (let i = 0; i < WORDS.length; i++) {
        if (cancelled) return
        setWordIndex(i)
        setShowWord(true)
        // hold: fade-in (500ms) + hold (700ms)
        await wait(1200)
        if (cancelled) return
        setShowWord(false)
        // fade-out (300ms)
        await wait(350)
      }
      if (cancelled) return
      setExiting(true)
      await wait(500)
      if (!cancelled) onComplete()
    }

    run()
    return () => { cancelled = true }
  }, [onComplete])

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: '#0a0a0f' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence mode="wait">
            {showWord && (
              <motion.span
                key={wordIndex}
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.08 }}
                transition={{
                  enter: { duration: 0.5, ease: 'easeOut' },
                  exit: { duration: 0.3, ease: 'easeIn' },
                }}
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: 'clamp(2.5rem, 8vw, 5rem)',
                  fontWeight: 300,
                  color: '#f5f5f5',
                  letterSpacing: '-0.02em',
                  userSelect: 'none',
                }}
              >
                {WORDS[wordIndex]}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
