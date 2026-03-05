import * as React from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface MagicTextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    onSparkleClick?: () => Promise<void> | void;
    isGenerating?: boolean;
}

const MagicTextarea = React.forwardRef<HTMLTextAreaElement, MagicTextareaProps>(
    ({ className, onSparkleClick, isGenerating, disabled, ...props }, ref) => {
        return (
            <div className="relative group w-full">
                {/* Animated gradient border on focus */}
                <div className="absolute -inset-0.5 rounded-xl bg-gradient-primary opacity-0 group-focus-within:opacity-100 transition duration-500 blur-sm"></div>

                <div className={cn(
                    "relative bg-glass-white rounded-xl backdrop-blur-md border border-soft-gray/20 overflow-hidden",
                    isGenerating && "after:absolute after:inset-0 after:bg-gradient-shimmer after:animate-shimmer after:pointer-events-none"
                )}>
                    <textarea
                        className={cn(
                            "flex min-h-[120px] w-full rounded-xl bg-transparent px-4 py-3 text-sm text-deep-black shadow-sm transition-colors outline-none resize-y",
                            "placeholder:text-soft-gray",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            className
                        )}
                        disabled={disabled || isGenerating}
                        ref={ref}
                        {...props}
                    />

                    <motion.button
                        type="button"
                        disabled={disabled || isGenerating}
                        whileHover={{ scale: 1.1, rotate: 15 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onSparkleClick}
                        className="absolute bottom-3 right-3 p-2 rounded-full bg-creative-paper text-deep-black shadow-sm border border-soft-gray/10 hover:border-soft-gray/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Enhance with AI"
                    >
                        <AnimatePresence mode="wait">
                            {isGenerating ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0, rotate: -90 }}
                                    animate={{ opacity: 1, rotate: 0 }}
                                    exit={{ opacity: 0, rotate: 90 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="sparkles"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Sparkles className="w-4 h-4 text-blue-500" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <span className="sr-only">Enhance prompt</span>
                    </motion.button>
                </div>
            </div>
        );
    }
);
MagicTextarea.displayName = "MagicTextarea";

export { MagicTextarea };
