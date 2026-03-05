"use client";

import { useWorkflowStore } from "@/store/workflowStore";
import { SceneCard } from "@/components/ui/SceneCard";
import { motion } from "framer-motion";

export function StageScript() {
    const { scenes, topic } = useWorkflowStore();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    return (
        // Transparent container, max-w-4xl to center focus
        <div className="relative min-h-screen w-full flex flex-col items-center pt-24 pb-32 px-4 md:px-8">

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl w-full text-center mb-12"
            >
                <span className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-2 block">
                    Stage 2: The Storyboard
                </span>
                <h2 className="text-3xl md:text-5xl font-extrabold text-deep-black mb-4">
                    Visualizing <span className="text-transparent bg-clip-text bg-gradient-accent">&quot;{topic || 'Your Idea'}&quot;</span>
                </h2>
                <p className="text-soft-gray max-w-lg mx-auto">
                    We&apos;ve broken down your concept into an interactive stream. Edit the narration or regenerate visuals to perfect your story.
                </p>
            </motion.div>

            <motion.div
                className="w-full max-w-4xl flex flex-col gap-8 relative"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Visual connecting line behind cards */}
                <div className="absolute left-8 top-10 bottom-10 w-px bg-gradient-to-b from-transparent via-soft-gray/20 to-transparent -z-10 hidden md:block" />

                {scenes.map((scene, index) => (
                    <SceneCard key={scene.id} scene={scene} index={index} />
                ))}
            </motion.div>
        </div>
    );
}
