'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useLoaderStore } from '@/store/loaderStore'

const ORBIT_COLORS = ['#9b83e6', '#f5a98c', '#5a9e68'] // lilac, petal, leaf

export function GlobalLoader() {
  const { visible, label } = useLoaderStore()

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm"
          style={{ pointerEvents: 'auto' }}
        >
          {/* Logo + orbit container */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* Logo pulsante */}
            <motion.img
              src="/logo-fresia.png"
              alt="Frésia"
              className="w-24 h-auto object-contain relative z-10"
              animate={{
                scale: [1, 1.06, 1],
                opacity: [0.9, 1, 0.9],
              }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* 3 pontos orbitando — cada um é um wrapper que rotaciona e o filho ponto está deslocado */}
            {ORBIT_COLORS.map((color, idx) => (
              <motion.div
                key={idx}
                className="absolute inset-0 flex items-start justify-center"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{ rotate: idx * 120 }}
              >
                <span
                  className="w-2 h-2 rounded-full shadow-sm"
                  style={{ backgroundColor: color, marginTop: '4px' }}
                />
              </motion.div>
            ))}
          </div>

          {/* Label */}
          {label && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-2 text-sm text-ink-600 font-medium"
            >
              {label}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
