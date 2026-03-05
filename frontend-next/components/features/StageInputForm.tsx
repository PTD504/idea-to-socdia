"use client";

import { useState } from "react";
import { useWorkflowStore } from "@/store/workflowStore";
import { MagicInput } from "@/components/ui/MagicInput";
import { MagicTextarea } from "@/components/ui/MagicTextarea";
import { StyleSelector } from "@/components/ui/StyleSelector";
import { fetchStreamWorkflow, StreamChunk } from "@/lib/streamClient";
import { motion } from "framer-motion";
import { Wand2 } from "lucide-react";

export function StageInputForm() {
    const [isGenerating, setIsGenerating] = useState(false);
    const {
        topic,
        deepDescription,
        style,
        setTopic,
        setDeepDescription,
        setStyle,
        setStage,
        appendStreamBlock,
        appendContentToLastTextBlock
    } = useWorkflowStore();

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setStage("stream");

        // Temporary hardcoded target_format to pass backend validation
        const payload = {
            topic,
            deepDescription,
            style,
            target_format: "youtube_short"
        };

        await fetchStreamWorkflow(payload, (chunk: StreamChunk) => {
            // Handle streaming payload
            if (chunk.type === "text") {
                appendContentToLastTextBlock(chunk.content);
            } else if (chunk.type === "error") {
                appendStreamBlock({
                    id: crypto.randomUUID(),
                    type: chunk.type,
                    content: chunk.content
                });
            } else if (chunk.type === "tool_start") {
                appendStreamBlock({
                    id: crypto.randomUUID(),
                    type: "tool_start",
                    content: "pending...",
                    toolName: chunk.tool
                });
            } else if (chunk.type === "media_result") {
                // Find the last pending tool_start block to seamlessly replace
                // Ensure we get the latest state directly from the store resolver, 
                // but for simplicity in this closure, we rely upon the fact 
                // that tool_start will naturally precede media_result sequentially.
                useWorkflowStore.setState((state) => {
                    const blocks = [...state.streamBlocks];
                    let matchedId = "";
                    for (let i = blocks.length - 1; i >= 0; i--) {
                        if (blocks[i].type === "tool_start") {
                            matchedId = blocks[i].id;
                            break;
                        }
                    }
                    if (matchedId) {
                        return {
                            streamBlocks: blocks.map((b) =>
                                b.id === matchedId ? { ...b, type: "media_result", content: chunk.url || "" } : b
                            )
                        };
                    } else {
                        // Fallback if no tool_start found
                        return {
                            streamBlocks: [...blocks, { id: crypto.randomUUID(), type: "media_result", content: chunk.url || "" }]
                        };
                    }
                });
            }
        });
    };

    const suggestions = ["Flying Clock", "Love Definition", "Cybernetic Garden"];

    const handleSparkleClick = async () => {
        setIsGenerating(true);
        // Mock AI generation delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setDeepDescription(
            "A vintage golden pocket watch floating in a zero-gravity void, surrounded by gears and stardust, 8k resolution, cinematic lighting."
        );
        setIsGenerating(false);
    };

    return (
        <form onSubmit={handleGenerate} className="flex flex-col gap-6 w-full">
            {/* Topic Field */}
            <div className="space-y-2">
                <label htmlFor="topic" className="text-sm font-semibold text-deep-black ml-1">
                    Topic <span className="text-red-500">*</span>
                </label>
                <MagicInput
                    id="topic"
                    placeholder="What do you want to create? (e.g., A futuristic city)"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                />
                <div className="flex flex-wrap gap-2 mt-2">
                    {suggestions.map((suggestion) => (
                        <button
                            key={suggestion}
                            type="button"
                            onClick={() => setTopic(suggestion)}
                            className="text-xs px-3 py-1 rounded-full bg-soft-gray/10 text-soft-gray hover:bg-soft-gray/20 transition-colors"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            </div>

            {/* Deep Description Field */}
            <div className="space-y-2">
                <label htmlFor="deepDescription" className="text-sm font-semibold text-deep-black ml-1">
                    Deep Description <span className="text-soft-gray font-normal">(Optional)</span>
                </label>
                <MagicTextarea
                    id="deepDescription"
                    placeholder="Describe the mood, lighting, characters, and specific elements..."
                    value={deepDescription}
                    onChange={(e) => setDeepDescription(e.target.value)}
                    onSparkleClick={handleSparkleClick}
                    isGenerating={isGenerating}
                />
            </div>

            {/* Style Selector */}
            <div className="space-y-2 overflow-hidden">
                <label className="text-sm font-semibold text-deep-black ml-1">
                    Creative Style <span className="text-soft-gray font-normal">(Optional)</span>
                </label>
                <StyleSelector
                    selectedStyle={style}
                    onSelectStyle={setStyle}
                />
            </div>

            {/* Submit Button */}
            <motion.button
                type="submit"
                disabled={!topic.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-accent text-white font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Wand2 className="w-5 h-5" />
                Generate Reality
            </motion.button>
        </form>
    );
}
