"use client";

import { StageInput } from "@/components/features/StageInput";
import { StageStream } from "@/components/features/StageStream";
import { StageEditor } from "@/components/features/StageEditor";
import { StagePreview } from "@/components/features/StagePreview";
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
        {currentStage === "editor" && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6 }}
            className="w-full"
          >
            <StageEditor />
          </motion.div>
        )}
        {currentStage === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6 }}
            className="w-full"
          >
            <StagePreview />
          </motion.div>
        )}
        {!["input", "result", "stream", "editor", "preview"].includes(currentStage) && (
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
