import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_STEPS = [
  "Booting agent runtime",
  "Connecting infrastructure",
  "Synchronizing environments",
  "Loading control center",
];

export default function Loading() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s + 1) % STATUS_STEPS.length);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-6">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08),transparent_55%)]" />
        <div
          className="absolute inset-0 opacity-[0.18] mask-[radial-gradient(ellipse_at_center,black,transparent_70%)]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--border)) 1px,transparent 1px),linear-gradient(90deg,hsl(var(--border)) 1px,transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-130 w-130 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle,hsl(var(--primary)/0.16),transparent 65%)",
          }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Main stack */}
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        {/* Animated orbital mark */}
        <div className="relative mb-10 h-28 w-28">
          <motion.svg
            viewBox="0 0 120 120"
            className="absolute inset-0 h-full w-full text-primary"
            fill="none"
          >
            {/* outer faint ring */}
            <motion.circle
              cx="60"
              cy="60"
              r="56"
              stroke="currentColor"
              strokeWidth="1"
              opacity={0.12}
              style={{ transformOrigin: "60px 60px" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
            />
            {/* dashed mid ring */}
            <motion.circle
              cx="60"
              cy="60"
              r="44"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="6 10"
              opacity={0.35}
              style={{ transformOrigin: "60px 60px" }}
              animate={{ rotate: -360 }}
              transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
            />
            {/* orbiting electron */}
            <motion.g
              style={{ transformOrigin: "60px 60px" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "linear" }}
            >
              <circle cx="60" cy="12" r="4" fill="currentColor" />
              <circle
                cx="60"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="1"
                opacity={0.25}
              />
            </motion.g>
            {/* inner ring */}
            <motion.circle
              cx="60"
              cy="60"
              r="30"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity={0.5}
              style={{ transformOrigin: "60px 60px" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />
            {/* pulsing hex core */}
            <motion.path
              d="M60 38 L78 48.5 L78 71.5 L60 82 L42 71.5 L42 48.5 Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              style={{ transformOrigin: "60px 60px" }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.circle
              cx="60"
              cy="60"
              r="3.5"
              fill="currentColor"
              animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.25, 1] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.svg>
        </div>

        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-2 text-2xl font-semibold tracking-tight text-foreground"
        >
          Forge<span className="text-primary">Ops</span>
        </motion.div>

        {/* Cycling status */}
        <div className=" relative h-5 w-full">
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 text-sm text-muted-foreground"
            >
              {STATUS_STEPS[step]}
              <span className="ml-0.5 inline-flex">
                <motion.span
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  .
                </motion.span>
                <motion.span
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.2,
                  }}
                >
                  .
                </motion.span>
                <motion.span
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.4,
                  }}
                >
                  .
                </motion.span>
              </span>
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Indeterminate progress bar */}
        <div className="relative mt-7 h-1 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="absolute inset-y-0 w-1/3 rounded-full bg-linear-to-r from-transparent via-primary to-transparent"
            initial={{ left: "-33%" }}
            animate={{ left: "100%" }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
}
