"use client";

import { StageInput } from "@/components/features/StageInput";
import { StageProcessing } from "@/components/features/StageProcessing";
import { StageScript } from "@/components/features/StageScript";
import { StageStream } from "@/components/features/StageStream";
import { useWorkflowStore } from "@/store/workflowStore";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const { currentStage } = useWorkflowStore();

  return (
    <main className="min-h-screen w-full text-deep-black font-sans selection:bg-blue-200 overflow-hidden bg-creative-paper">
      <AnimatePresence mode="wait">
        {currentStage === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <StageInput />
          </motion.div>
        )}
        {currentStage === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <StageProcessing />
          </motion.div>
        )}
        {currentStage === "script" && (
          <motion.div
            key="script"
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6 }}
            className="w-full"
          >
            <StageScript />
          </motion.div>
        )}
        {currentStage === "stream" && (
          <motion.div
            key="stream"
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6 }}
            className="w-full"
          >
            <StageStream />
          </motion.div>
        )}
        {!["input", "processing", "script", "stream"].includes(currentStage) && (
          <motion.div
            key="fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex items-center justify-center min-h-screen text-deep-black"
          >
            <h2>Invalid state mapping.</h2>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
