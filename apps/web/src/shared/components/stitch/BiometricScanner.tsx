import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * BiometricScanner - Efecto visual de escaneo biométrico
 * Se activa cuando los datos se sincronizan o actualizan.
 */

interface BiometricScannerProps {
  scanning: boolean;
  onComplete?: () => void;
  color?: string;
}

export const BiometricScanner: React.FC<BiometricScannerProps> = ({
  scanning,
  onComplete,
  color = "#8b3dff",
}) => {
  const [show, setShow] = useState(scanning);

  useEffect(() => {
    if (scanning) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [scanning, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden"
        >
          {/* Laser Line Horiz */}
          <motion.div
            initial={{ top: "-10%" }}
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="absolute left-0 right-0 h-1 blur-[2px] z-20"
            style={{
              background: `linear-gradient(to right, transparent, ${color}, transparent)`,
            }}
          />

          {/* Laser Line Vert */}
          <motion.div
            initial={{ left: "-10%" }}
            animate={{ left: ["0%", "100%"] }}
            transition={{ duration: 1.5, ease: "easeInOut", repeat: 1 }}
            className="absolute top-0 bottom-0 w-1 blur-[2px] z-20"
            style={{
              background: `linear-gradient(to bottom, transparent, ${color}, transparent)`,
            }}
          />

          {/* Central Reticle */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.1, 1], opacity: [0, 1, 0.5] }}
            className="relative w-64 h-64 border-2 border-dashed rounded-full flex items-center justify-center"
            style={{ borderColor: color }}
          >
            <div className="absolute inset-0 rounded-full animate-spin-slow border-t-2 border-primary" />
            <div
              className="text-[10px] font-black uppercase tracking-[0.2em]"
              style={{ color }}
            >
              Securing Data...
            </div>
          </motion.div>

          {/* Flash Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.2, 0] }}
            transition={{ delay: 2 }}
            className="absolute inset-0 bg-white"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
