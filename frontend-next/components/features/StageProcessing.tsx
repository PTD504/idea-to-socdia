"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useWorkflowStore } from "@/store/workflowStore";

export function StageProcessing() {
    const setScenes = useWorkflowStore(state => state.setScenes);
    const setStage = useWorkflowStore(state => state.setStage);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setScenes([
                {
                    id: "scene-1",
                    text: "The camera pans across a sprawling, neon-lit metropolis, rain slicking the pavement while flying cars weave between towering spires.",
                    image_prompt: "cyberpunk city, rainy night, neon lights, flying cars, towering skyscrapers, cinematic lighting, 8k",
                    estimated_duration: "5s",
                },
                {
                    id: "scene-2",
                    text: "Focusing onto a rusty, abandoned alleyway where an intricately designed golden pocket watch floats defying gravity.",
                    image_prompt: "golden pocket watch, floating, zero gravity, rusty alleyway, glowing runes, cinematic, highly detailed",
                    estimated_duration: "8s",
                },
                {
                    id: "scene-3",
                    text: "The watch shatters into a million shimmering particles, wrapping the screen in a blindingly beautiful, abstract expression of eternal love.",
                    image_prompt: "shattering watch, glowing particles, abstract love, bright ethereal light, masterpiece, stunning visuals",
                    estimated_duration: "6s",
                }
            ]);
            setStage("script");
        }, 2000);

        return () => clearTimeout(timer);
    }, [setScenes, setStage]);

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 overflow-hidden bg-creative-paper">
            {/* Hypnotic Breathing Core */}
            <div className="relative w-40 h-40 flex items-center justify-center mb-12">
                <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-accent blur-xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                <motion.div
                    className="relative z-10 w-24 h-24 rounded-full bg-gradient-accent shadow-lg shadow-blue-500/50"
                    animate={{
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </div>

            {/* Text */}
            <motion.h2
                className="text-2xl md:text-3xl font-bold tracking-wide"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                    Weaving your story...
                </span>
            </motion.h2>
        </div>
    );
}
