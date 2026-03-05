"use client";

import { motion, Variants } from "framer-motion";
import { StageInputForm } from "./StageInputForm";

const BackgroundParticles = () => {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-creative-paper">
            <motion.div
                className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-accent rounded-full opacity-[0.03] blur-[100px]"
                animate={{
                    x: [0, 100, 0],
                    y: [0, -50, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-primary rounded-full opacity-[0.03] blur-[120px]"
                animate={{
                    x: [0, -100, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />
            {/* Floating subtle particles can go here if needed */}
        </div>
    );
};

export function StageInput() {
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2, // Stagger fade-in for children
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 md:p-12 overflow-x-hidden">
            <BackgroundParticles />

            <motion.div
                className="relative z-10 w-full max-w-2xl flex flex-col items-center"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header Section */}
                <motion.div variants={itemVariants} className="text-center mb-10 w-full">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
                        <span className="bg-gradient-primary bg-clip-text text-transparent inline-block pb-1">
                            From Idea to Reality
                        </span>
                    </h1>
                    <p className="text-soft-gray text-lg md:text-xl font-medium">
                        Powered by Gemini 3 Pro & Imagen 4
                    </p>
                </motion.div>

                {/* Form Container */}
                <motion.div
                    variants={itemVariants}
                    className="w-full p-6 md:p-8 rounded-3xl bg-glass-white/80 backdrop-blur-xl border border-white/40 shadow-xl shadow-soft-gray/5"
                >
                    <StageInputForm />
                </motion.div>
            </motion.div>
        </div>
    );
}
