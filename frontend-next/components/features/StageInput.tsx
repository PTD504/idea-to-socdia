"use client";

import { useState } from "react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { useWorkflowStore } from "../../store/workflowStore";
import { FacebookPostForm } from "./forms/FacebookPostForm";
import { InstagramPostForm } from "./forms/InstagramPostForm";
import { YouTubePostForm } from "./forms/YouTubePostForm";
import { YouTubeVideoForm } from "./forms/YouTubeVideoForm";
import { YouTubeShortForm } from "./forms/YouTubeShortForm";
import { ArrowLeft } from "lucide-react";

const formatOptions = [
    { id: "youtube_video", label: "YouTube Video", icon: "/social-media-icons/youtube.svg" },
    { id: "youtube_short", label: "YouTube Short", icon: "/social-media-icons/youtubeshorts.svg" },
    { id: "youtube_post", label: "YouTube Post", icon: "/social-media-icons/youtube.svg" },
    { id: "facebook_post", label: "Facebook Post", icon: "/social-media-icons/facebook.svg" },
    { id: "instagram_post", label: "Instagram Post", icon: "/social-media-icons/instagram.svg" }
];

const FORMAT_COLORS: Record<string, string> = {
    facebook_post: "#0866FF",
    instagram_post: "#FF0069",
    youtube_short: "#FF0000",
    youtube_video: "#FF0000",
    youtube_post: "#FF0000",
};

const BackgroundParticles = () => {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-slate-50">
            {/* Bright, vibrant, oversized gradient orbs */}
            <motion.div
                className="absolute top-[-15%] left-[-10%] w-[60vw] h-[60vw] bg-pink-400/30 rounded-full blur-[160px]"
                animate={{
                    scale: [1, 1.15, 1],
                    x: [0, 60, 0],
                    y: [0, 40, 0],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-[-20%] right-[-15%] w-[70vw] h-[70vw] bg-indigo-400/25 rounded-full blur-[180px]"
                animate={{
                    scale: [1, 1.25, 1],
                    x: [0, -70, 0],
                    y: [0, -50, 0],
                }}
                transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />
            <motion.div
                className="absolute top-[30%] right-[10%] w-[45vw] h-[45vw] bg-amber-300/30 rounded-full blur-[140px]"
                animate={{
                    scale: [1, 1.35, 1],
                    x: [0, 50, 0],
                    y: [0, 70, 0],
                }}
                transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
        </div>
    );
};

export function StageInput() {
    const [selectedFormatLocal, setSelectedFormatLocal] = useState<string | null>(null);
    const [hoveredFormatId, setHoveredFormatId] = useState<string | null>(null);
    const setTargetFormat = useWorkflowStore((state) => state.setTargetFormat);

    const handleFormatSelect = (formatId: string) => {
        setTargetFormat(formatId);
        setSelectedFormatLocal(formatId);
    };

    const handleBack = () => {
        setSelectedFormatLocal(null);
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 md:p-12 overflow-x-hidden bg-slate-50 font-sans text-slate-900">
            <BackgroundParticles />

            <AnimatePresence>
                {selectedFormatLocal && (
                    <motion.button
                        key="back-btn"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onClick={handleBack}
                        className="absolute top-8 left-8 z-50 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/40 backdrop-blur-md border border-white/60 text-slate-700 font-medium hover:bg-white/60 transition-colors shadow-sm hover:shadow"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {selectedFormatLocal ? (
                    <motion.div
                        key="form-view"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="relative z-10 w-full max-w-3xl flex flex-col items-center p-12 rounded-3xl bg-white/80 backdrop-blur-3xl border border-white/60 shadow-2xl"
                    >
                        {/* Subtle glow effect behind the form */}
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent rounded-3xl pointer-events-none" />
                        
                        <h2 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">
                            Configure {" "}
                            <span 
                                style={{ color: FORMAT_COLORS[selectedFormatLocal] || "#1e293b" }} 
                                className="font-extrabold tracking-tight drop-shadow-sm"
                            >
                                {formatOptions.find((f) => f.id === selectedFormatLocal)?.label}
                            </span>
                        </h2>
                        <p className="text-slate-500 text-lg mb-10 text-center">
                            Customize the details for a perfect result.
                        </p>
                        
                        <div className="w-full flex items-center justify-center">
                            {selectedFormatLocal === "facebook_post" ? (
                                <FacebookPostForm />
                            ) : selectedFormatLocal === "instagram_post" ? (
                                <InstagramPostForm />
                            ) : selectedFormatLocal === "youtube_post" ? (
                                <YouTubePostForm />
                            ) : selectedFormatLocal === "youtube_video" ? (
                                <YouTubeVideoForm />
                            ) : selectedFormatLocal === "youtube_short" ? (
                                <YouTubeShortForm />
                            ) : (
                                <div className="w-full p-6 rounded-3xl bg-slate-100/50 border border-slate-200/50 flex items-center justify-center min-h-[300px] shadow-inner">
                                    <p className="text-slate-600 text-xl font-medium tracking-wide">
                                        Form for {formatOptions.find((f) => f.id === selectedFormatLocal)?.label} goes here
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="selection-view"
                        className="relative z-10 w-full max-w-6xl flex flex-col items-center"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, y: -30, transition: { duration: 0.4 } }}
                    >
                        <motion.div variants={itemVariants} className="text-center mb-16 w-full px-4">
                            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-slate-800 drop-shadow-sm">
                                What will you create?
                            </h1>
                            <p className="text-slate-500 text-xl md:text-2xl font-medium max-w-2xl mx-auto tracking-wide">
                                Select a format to begin generating elegant content
                            </p>
                        </motion.div>

                        <motion.div 
                            variants={itemVariants}
                            className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto w-full"
                        >
                            {formatOptions.map((format) => {
                                const isHovered = hoveredFormatId === format.id;
                                const isSomethingHovered = hoveredFormatId !== null;
                                const opacity = isSomethingHovered ? (isHovered ? 1 : 0.6) : 1;

                                return (
                                    <motion.button
                                        key={format.id}
                                        onClick={() => handleFormatSelect(format.id)}
                                        onHoverStart={() => setHoveredFormatId(format.id)}
                                        onHoverEnd={() => setHoveredFormatId(null)}
                                        animate={{ 
                                            scale: isHovered ? 1.05 : 1, 
                                            y: isHovered ? -10 : 0,
                                            opacity: opacity,
                                            boxShadow: isHovered 
                                                ? "0 20px 40px -10px rgba(99, 102, 241, 0.25), 0 0 20px rgba(236, 72, 153, 0.15)" 
                                                : "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)"
                                        }}
                                        whileTap={{ scale: 0.96 }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className="relative overflow-hidden flex flex-col items-center justify-center p-8 text-center bg-white/80 backdrop-blur-md border border-gray-200 rounded-[2rem] min-w-[260px] flex-grow md:max-w-[calc(50%-0.75rem)] lg:max-w-[calc(33.333%-1rem)] transition-colors duration-300"
                                    >
                                        <motion.div 
                                            className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-pink-50/50 pointer-events-none"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: isHovered ? 1 : 0 }}
                                            transition={{ duration: 0.4 }}
                                        />
                                        
                                        <div className="relative z-10 flex flex-col items-center justify-center h-full w-full pointer-events-none">
                                            <motion.img 
                                                src={format.icon} 
                                                alt={format.label} 
                                                className="w-16 h-16 mb-5 drop-shadow-md"
                                                animate={{
                                                    scale: isHovered ? 1.1 : 1,
                                                    y: isHovered ? -4 : 0
                                                }}
                                                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                            />
                                            
                                            <motion.h3 
                                                className="text-xl md:text-2xl font-bold text-slate-800"
                                                animate={{
                                                    color: isHovered ? "#312e81" : "#1e293b", // Indigo 900 on hover, Slate 800 default
                                                }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                {format.label}
                                            </motion.h3>
                                            
                                            {/* Vibrant gradient border on hover
                                            <motion.div
                                                className="absolute inset-0 rounded-[2rem] border-2 border-transparent pointer-events-none"
                                                animate={{ 
                                                    borderColor: isHovered ? "rgba(99, 102, 241, 0.3)" : "rgba(255,255,255,0)"
                                                }}
                                                transition={{ duration: 0.4 }}
                                            /> */}
                                        </div>
                                        <motion.div
                                            className="absolute inset-4 rounded-[1.5rem] border-2 border-transparent pointer-events-none z-20"
                                            animate={{ 
                                                borderColor: isHovered ? "rgba(99, 102, 241, 0.3)" : "rgba(255,255,255,0)"
                                            }}
                                            transition={{ duration: 0.4 }}
                                        />
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
