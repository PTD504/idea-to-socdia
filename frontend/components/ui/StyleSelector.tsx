"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StyleOption {
    id: string;
    name: string;
    imageUrl: string;
}

// Mock data using generic unsplash placeholders for now
const STYLES: StyleOption[] = [
    { id: "cinematic", name: "Cinematic", imageUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&h=150&fit=crop" },
    { id: "anime", name: "Anime", imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200&h=150&fit=crop" },
    { id: "3d-render", name: "3D Render", imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=150&fit=crop" },
    { id: "cyberpunk", name: "Cyberpunk", imageUrl: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=200&h=150&fit=crop" },
    { id: "watercolor", name: "Watercolor", imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&h=150&fit=crop" },
];

interface StyleSelectorProps {
    selectedStyle: string;
    onSelectStyle: (id: string) => void;
    className?: string;
}

export function StyleSelector({ selectedStyle, onSelectStyle, className }: StyleSelectorProps) {
    return (
        <div className={cn("w-full overflow-hidden", className)}>
            <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-1 snap-x scrollbar-hide">
                {STYLES.map((style) => (
                    <motion.button
                        key={style.id}
                        type="button"
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelectStyle(style.id)}
                        className={cn(
                            "relative flex-none w-32 h-24 rounded-xl overflow-hidden snap-center group border-2 transition-colors",
                            selectedStyle === style.id
                                ? "border-blue-500 ring-2 ring-blue-500/20"
                                : "border-transparent hover:border-soft-gray/30"
                        )}
                    >
                        {/* Using standard img for simplicity in boilerplate, normally next/image */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={style.imageUrl}
                            alt={style.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-deep-black/80 to-transparent"></div>

                        <div className="absolute bottom-2 left-2 right-2 text-left">
                            <span className="text-xs font-medium text-white shadow-sm">
                                {style.name}
                            </span>
                        </div>

                        {selectedStyle === style.id && (
                            <motion.div
                                layoutId="style-outline"
                                className="absolute inset-0 border-2 border-white rounded-xl"
                                initial={false}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
