"use client";

import { useState } from "react";
import { useWorkflowStore } from "@/store/workflowStore";
import { MagicInput } from "@/components/ui/MagicInput";
import { MagicTextarea } from "@/components/ui/MagicTextarea";
import { StyleSelector } from "@/components/ui/StyleSelector";
import { fetchStreamWorkflow, StreamChunk } from "@/lib/streamClient";
import { motion } from "framer-motion";
import { Wand2, Upload, X } from "lucide-react";

export function StageInputForm() {
    const [isGenerating, setIsGenerating] = useState(false);
    const {
        topic,
        deepDescription,
        style,
        targetFormat,
        referenceImageBase64,
        setTopic,
        setDeepDescription,
        setStyle,
        setTargetFormat,
        setReferenceImageBase64,
        setStage,
        appendStreamBlock,
        appendContentToLastTextBlock
    } = useWorkflowStore();

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();

        const currentState = useWorkflowStore.getState();

        if (!currentState.topic.trim()) return;

        setStage("stream");

        // Bind the selected UI target format to the backend payload
        const payload = {
            topic: currentState.topic,
            deep_description: currentState.deepDescription,
            style: currentState.style,
            target_format: currentState.targetFormat,
            reference_image_base64: currentState.referenceImageBase64
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

            {/* Target Format Selector */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-deep-black ml-1">
                    Target Format <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                    {[
                        { id: "facebook_post", label: "Facebook Post" },
                        { id: "instagram_post", label: "Instagram Post" },
                        { id: "youtube_short", label: "YouTube Short" },
                        { id: "youtube_video", label: "YouTube Video" },
                        { id: "youtube_post", label: "YouTube Post" },
                    ].map((format) => (
                        <button
                            key={format.id}
                            type="button"
                            onClick={() => setTargetFormat(format.id)}
                            className={`text-sm px-4 py-2 rounded-xl transition-colors border ${targetFormat === format.id
                                    ? "bg-deep-black text-white border-deep-black hover:bg-deep-black"
                                    : "bg-white text-deep-black border-soft-gray/30 hover:border-deep-black hover:bg-soft-gray/5"
                                }`}
                        >
                            {format.label}
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

            {/* Reference Image Uploader */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-deep-black ml-1">
                    Reference Image <span className="text-soft-gray font-normal">(Optional)</span>
                </label>
                {!referenceImageBase64 ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-soft-gray/30 rounded-xl cursor-pointer bg-white hover:bg-soft-gray/5 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-soft-gray" />
                            <p className="mb-2 text-sm text-deep-black"><span className="font-semibold">Click to upload</span> an image to guide the style</p>
                            <p className="text-xs text-soft-gray">PNG, JPG, WebP supported</p>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    const result = reader.result as string;
                                    // Strip the data URL prefix e.g., 'data:image/jpeg;base64,' for backend
                                    const base64Raw = result.split(",")[1];
                                    if (base64Raw) setReferenceImageBase64(base64Raw);
                                };
                                reader.readAsDataURL(file);
                            }}
                        />
                    </label>
                ) : (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-soft-gray/30 bg-white/50 flex items-center justify-center p-2">
                        {/* We recreate the data url to preview the base64 */}
                        <img
                            src={`data:image/jpeg;base64,${referenceImageBase64}`}
                            alt="Reference Canvas"
                            className="object-contain h-full w-full rounded-lg"
                        />
                        <button
                            type="button"
                            onClick={() => setReferenceImageBase64(null)}
                            className="absolute top-3 right-3 p-1.5 bg-red-500/90 text-white rounded-full hover:bg-red-600 transition-colors shadow-xl"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}
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
