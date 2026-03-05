"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkflowStore } from "@/store/workflowStore";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export function StageStream() {
    const { streamBlocks, isStreaming, setStage } = useWorkflowStore();
    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll logic
    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    }, [streamBlocks]);

    return (
        <div className="min-h-screen w-full bg-creative-paper p-8 flex flex-col items-center">
            <style>{`
                .scrollbar-none::-webkit-scrollbar { display: none; }
                .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            <div className="max-w-3xl w-full space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl w-full text-center mb-8"
                >
                    <span className="text-sm font-bold tracking-widest text-blue-500 uppercase mb-2 block">
                        Active Synthesis
                    </span>
                    <h2 className="text-3xl md:text-5xl font-extrabold text-deep-black mb-4">
                        Generating <span className="text-transparent bg-clip-text bg-gradient-accent">Live</span>
                    </h2>
                    <p className="text-soft-gray max-w-lg mx-auto">
                        Watch as we weave your story and generate visuals in real-time.
                    </p>
                </motion.div>

                <div
                    ref={scrollRef}
                    className="w-full flex flex-col gap-6 relative max-h-[70vh] overflow-y-auto px-4 pb-12 scrollbar-none"
                >
                    <AnimatePresence initial={false}>
                        {streamBlocks.length === 0 ? (
                            <motion.div
                                key="empty-state"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-20 text-center"
                            >
                                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                                <h3 className="text-xl font-semibold text-deep-black mb-2">Connecting to Creative Director Agent...</h3>
                                <p className="text-soft-gray text-sm">Please wait while we initialize the synthesis pipeline.</p>
                            </motion.div>
                        ) : (
                            streamBlocks.map((block) => (
                                <motion.div
                                    key={block.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.4 }}
                                    className="w-full"
                                >
                                    {block.type === 'text' && (
                                        <div className="text-deep-black font-sans text-lg leading-relaxed space-y-4">
                                            <ReactMarkdown
                                                components={{
                                                    p: ({ children }) => <p className="mb-4">{children}</p>,
                                                    h1: ({ children }) => <h1 className="text-3xl font-extrabold mt-8 mb-4 border-b pb-2">{children}</h1>,
                                                    h2: ({ children }) => <h2 className="text-2xl font-bold mt-6 mb-3">{children}</h2>,
                                                    h3: ({ children }) => <h3 className="text-xl font-bold mt-5 mb-2">{children}</h3>,
                                                    strong: ({ children }) => <strong className="font-semibold text-blue-900">{children}</strong>,
                                                    ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                                                    ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                                                    li: ({ children }) => <li className="">{children}</li>,
                                                    code: ({ children }) => <code className="bg-gray-100 rounded px-1.5 py-0.5 font-mono text-sm">{children}</code>,
                                                    blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-4">{children}</blockquote>
                                                }}
                                            >
                                                {block.content}
                                            </ReactMarkdown>
                                        </div>
                                    )}

                                    {block.type === 'tool_start' && (
                                        <div className="relative flex flex-col items-center justify-center aspect-video rounded-2xl overflow-hidden bg-soft-gray/5 border border-soft-gray/10 shadow-inner">
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-shimmer animate-shimmer">
                                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                                                <span className="text-sm font-medium text-soft-gray mix-blend-multiply">
                                                    Executing: {block.toolName || "Synthesis Tool"}...
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {block.type === 'media_result' && (
                                        <div className="relative flex flex-col items-center justify-center aspect-video rounded-2xl overflow-hidden shadow-xl border border-white/30 group">
                                            <img
                                                src={block.content}
                                                alt="Generated Media"
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </div>
                                    )}

                                    {block.type === 'error' && (
                                        <div className="bg-red-50/80 backdrop-blur-md border border-red-200 rounded-2xl p-4 shadow-sm text-red-600 text-sm font-medium">
                                            ⚠️ Error: {block.content}
                                        </div>
                                    )}
                                </motion.div>
                            )))}
                    </AnimatePresence>

                    {!isStreaming && streamBlocks.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full flex justify-center pt-8 pb-4"
                        >
                            <button
                                onClick={() => setStage('script')}
                                className="px-8 py-3 bg-gradient-primary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                            >
                                Refine & Edit
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
