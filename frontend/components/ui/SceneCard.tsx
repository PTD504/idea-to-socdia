"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { RefreshCw, Edit2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Scene, useWorkflowStore } from "@/store/workflowStore";

interface SceneCardProps {
    scene: Scene;
    index: number;
}

export function SceneCard({ scene, index }: SceneCardProps) {
    const updateScene = useWorkflowStore(state => state.updateScene);
    const [isGeneratingImg, setIsGeneratingImg] = React.useState(!scene.imageUrl);

    // Mock an imagery generation layer on mount
    React.useEffect(() => {
        if (!scene.imageUrl) {
            const timer = setTimeout(() => {
                // Determine a keyword placeholder image URL
                let keyword = "abstract";
                if (scene.image_prompt.includes("cyberpunk")) keyword = "cyberpunk";
                if (scene.image_prompt.includes("clock")) keyword = "clock";

                updateScene(scene.id, {
                    imageUrl: `https://source.unsplash.com/random/800x450/?${keyword},cinematic`
                });
                setIsGeneratingImg(false);
            }, 2500 + index * 500); // Stagger loading times
            return () => clearTimeout(timer);
        }
    }, [scene.imageUrl, scene.image_prompt, scene.id, index, updateScene]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group relative bg-glass-white backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:border-white/40 transition-all duration-300"
        >
            {/* Numbering Badge */}
            <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 opacity-50 select-none">
                {String(index + 1).padStart(2, '0')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-4">
                {/* Left: Script Editor (Col-span 7 on Desktop) */}
                <div className="md:col-span-7 flex flex-col">
                    <div className="flex items-center justify-between mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-semibold text-soft-gray uppercase tracking-wider">
                            Narration Script
                        </span>
                        <button className="p-1 text-soft-gray hover:text-blue-500 transition-colors" title="Edit Properties">
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <textarea
                        value={scene.text}
                        onChange={(e) => updateScene(scene.id, { text: e.target.value })}
                        className={cn(
                            "w-full flex-grow bg-transparent border-none outline-none resize-none font-serif text-deep-black text-lg leading-relaxed",
                            "placeholder:text-soft-gray/50 hover:bg-white/30 focus:bg-white/50 rounded-lg p-2 transition-colors duration-200"
                        )}
                        placeholder="Write the narration script for this scene..."
                        spellCheck={false}
                    />

                    <div className="mt-4 text-xs font-medium text-slate-400 flex items-center gap-2">
                        <span className="px-2 py-1 rounded bg-black/5">Duration: {scene.estimated_duration}</span>
                    </div>
                </div>

                {/* Right: Visual Placeholder (Col-span 5 on Desktop) */}
                <div className="md:col-span-5 relative flex flex-col items-center justify-center aspect-video rounded-xl overflow-hidden bg-soft-gray/10 border border-soft-gray/20 group/image">
                    <AnimatePresence mode="wait">
                        {isGeneratingImg || !scene.imageUrl ? (
                            <motion.div
                                key="generating"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center bg-gradient-shimmer animate-shimmer"
                            >
                                <span className="text-sm font-medium text-soft-gray mix-blend-multiply">Generating Visual...</span>
                            </motion.div>
                        ) : (
                            <motion.img
                                key="image"
                                initial={{ opacity: 0, scale: 1.05 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6 }}
                                src={scene.imageUrl}
                                alt={scene.image_prompt}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        )}
                    </AnimatePresence>

                    {/* Image Controls Overlay */}
                    {!isGeneratingImg && scene.imageUrl && (
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover/image:opacity-100 transition-opacity">
                            <button
                                onClick={() => {
                                    setIsGeneratingImg(true);
                                    updateScene(scene.id, { imageUrl: undefined });
                                }}
                                className="p-2 rounded-lg bg-black/50 backdrop-blur text-white hover:bg-black/70 transition-colors"
                                title="Regenerate Variation"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
