"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function WelcomeSplash() {
  // null = not decided yet (prevents initial flash); false = don't show; true = show
  const [show, setShow] = useState<boolean | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const seen = sessionStorage.getItem('revo_welcome_shown');
      if (seen) {
        setShow(false);
        return;
      }
      // show for a shorter, non-blocking duration
      setShow(true);
      sessionStorage.setItem('revo_welcome_shown', '1');
      timer = setTimeout(() => setShow(false), 1200);
    } catch (e) {
      setShow(true);
      timer = setTimeout(() => setShow(false), 1200);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (show === null) return null; // avoid flicker while deciding

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#07102a]/95 to-[#220036]/95"
        >
          <motion.div
            initial={{ scale: 0.92 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="flex flex-col items-center justify-center rounded-2xl p-8 bg-white/3 backdrop-blur-md border border-white/5"
          >
            <div className="w-36 h-36 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#5B2BFF] to-[#FF4DD2] p-2 shadow-2xl">
              <Image src="/icons/icon-base.svg" alt="Revo Panel" width={96} height={96} priority />
            </div>
            <h1 className="mt-6 text-2xl font-semibold text-white">Welcome to Revo Panel</h1>
            <p className="mt-2 text-sm text-white/80">SMS Traffic Monetization Platform</p>
            <div className="w-60 mt-6">
              <div className="w-full h-2 bg-white/6 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#00F0FF] via-[#5B2BFF] to-[#FF4DD2]"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.0, ease: 'easeInOut' }}
                />
              </div>
              <div className="mt-2 text-xs text-white/70 text-center">Initializing System...</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
