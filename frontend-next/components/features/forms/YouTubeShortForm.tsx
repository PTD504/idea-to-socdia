"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useWorkflowStore } from "../../../store/workflowStore";
import { fetchStreamWorkflow, StreamChunk } from "../../../lib/streamClient";
import { enhanceText } from "../../../lib/api";
import { Sparkles, UploadCloud, X, Loader2 } from "lucide-react";

export function YouTubeShortForm() {
    // Local state
    const [localTopic, setLocalTopic] = useState("");
    const [localAesthetic, setLocalAesthetic] = useState("");
    const [localDescription, setLocalDescription] = useState("");
    const [localImages, setLocalImages] = useState<{ id: string; base64: string }[]>([]);
    const [localInstructions, setLocalInstructions] = useState("");
    
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Global store actions
    const setTopic = useWorkflowStore((state) => state.setTopic);
    const setStyle = useWorkflowStore((state) => state.setStyle);
    const setDeepDescription = useWorkflowStore((state) => state.setDeepDescription);
    const setReferenceImages = useWorkflowStore((state) => state.setReferenceImages);
    const setReferenceImageBase64 = useWorkflowStore((state) => state.setReferenceImageBase64);
    const setImageInstructions = useWorkflowStore((state) => state.setImageInstructions);
    const setStage = useWorkflowStore((state) => state.setStage);
    const appendStreamBlock = useWorkflowStore((state) => state.appendStreamBlock);
    const appendContentToLastTextBlock = useWorkflowStore((state) => state.appendContentToLastTextBlock);

    const handleEnhanceClick = async () => {
        if (!localTopic.trim()) return;
        setIsEnhancing(true);
        try {
            const enhancedText = await enhanceText({
                target_format: "youtube_short",
                main_field_label: "The Hook / Core Idea",
                main_field_text: localTopic,
                target_field_label: "Script Outline & Key Beats",
                target_field_text: localDescription || undefined
            });
            if (enhancedText) {
                setLocalDescription(enhancedText);
            }
        } catch (error) {
            console.error("Failed to enhance text:", error);
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                const base64Raw = result.split(",")[1];
                if (base64Raw) {
                    setLocalImages((prev) => [
                        ...prev, 
                        { id: crypto.randomUUID(), base64: base64Raw }
                    ]);
                }
            };
            reader.readAsDataURL(file);
        });

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const removeImage = (idToRemove: string) => {
        setLocalImages((prev) => prev.filter(img => img.id !== idToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!localTopic.trim() || isSubmitting) return;

        setIsSubmitting(true);

        setTopic(localTopic);
        setStyle(localAesthetic);
        
        setDeepDescription(`Visual Vibe: ${localAesthetic}\nScript Outline Notes: ${localDescription}`);
        
        const base64Images = localImages.map(img => img.base64);
        setReferenceImages(base64Images);
        
        if (base64Images.length > 0) {
            setReferenceImageBase64(base64Images[0]);
        } else {
            setReferenceImageBase64(null);
        }
        
        setImageInstructions(localInstructions);
        
        setStage("stream");

        const payload = {
            topic: localTopic,
            deep_description: `Visual Vibe: ${localAesthetic}\nScript Outline Notes: ${localDescription}`,
            style: localAesthetic,
            target_format: "youtube_short",
            reference_images: base64Images.length > 0 ? base64Images : null,
            image_instructions: localInstructions || null,
            include_media_in_post: false
        };

        await fetchStreamWorkflow(payload, (chunk: StreamChunk) => {
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
                        return {
                            streamBlocks: [...blocks, { id: crypto.randomUUID(), type: "media_result", content: chunk.url || "" }]
                        };
                    }
                });
            }
        });

        setIsSubmitting(false);
    };

    const aestheticOptions = ["High-Energy", "Storytime", "Aesthetic", "Trendy"];

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-2xl p-8 flex flex-col gap-6">
            {/* Field 1: The Hook / Core Idea */}
            <div className="flex flex-col gap-2">
                <label htmlFor="topic" className="text-sm font-semibold text-slate-700 ml-1">
                    The Hook / Core Idea <span className="text-rose-500">*</span>
                </label>
                <input
                    id="topic"
                    type="text"
                    required
                    value={localTopic}
                    onChange={(e) => setLocalTopic(e.target.value)}
                    placeholder="e.g., 3 secrets to glowing skin..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF0000]/50 transition-all font-medium text-lg"
                />
            </div>

            {/* Field 2: Visual Vibe */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">
                    Visual Vibe <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                    {aestheticOptions.map((vibe) => (
                        <button
                            key={vibe}
                            type="button"
                            onClick={() => setLocalAesthetic(vibe === localAesthetic ? "" : vibe)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${localAesthetic === vibe ? 'bg-[#FF0000] text-white shadow-md shadow-[#FF0000]/20 border-[#FF0000]' : 'bg-white/50 text-slate-600 border border-slate-200 hover:bg-white hover:border-[#FF0000]/40'}`}
                        >
                            {vibe}
                        </button>
                    ))}
                </div>
            </div>

            {/* Field 3: Script Outline & Key Beats */}
            <div className="flex flex-col gap-2 relative">
                <div className="flex items-center justify-between ml-1">
                    <label htmlFor="description" className="text-sm font-semibold text-slate-700">
                        Script Outline & Key Beats <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <button
                        type="button"
                        onClick={handleEnhanceClick}
                        disabled={isEnhancing}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#FF0000] bg-[#FF0000]/10 py-1 px-3 rounded-full hover:bg-[#FF0000]/20 transition-colors disabled:opacity-50"
                    >
                        {isEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        Enhance with AI
                    </button>
                </div>
                <textarea
                    id="description"
                    value={localDescription}
                    onChange={(e) => setLocalDescription(e.target.value)}
                    placeholder="Add text for voiceover narration or on-screen captions targetting 15-60 seconds..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF0000]/50 transition-all resize-none"
                />
            </div>

            {/* Field 4: Reference Assets */}
            <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-slate-700 ml-1">
                    Reference Assets <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full min-h-[120px] border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-[#FF0000]/5 hover:border-[#FF0000]/40 transition-colors py-6"
                >
                    <UploadCloud className="w-10 h-10 mb-2 text-[#FF0000]/70" />
                    <p className="mb-1 text-sm text-slate-600"><span className="font-semibold text-[#FF0000]">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-slate-400">PNG, JPG, WebP supported</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                    />
                </div>

                {localImages.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-3 mt-2">
                        {localImages.map((img) => (
                            <motion.div 
                                key={img.id} 
                                initial={{ scale: 0.8, opacity: 0 }} 
                                animate={{ scale: 1, opacity: 1 }}
                                className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 shadow-sm"
                            >
                                <Image
                                    src={`data:image/jpeg;base64,${img.base64}`}
                                    alt="Reference Thumbnail"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(img.id)}
                                    className="absolute top-1 right-1 p-1 bg-[#FF0000]/90 text-white rounded-md hover:bg-[#FF0000] transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                <input
                    type="text"
                    value={localInstructions}
                    onChange={(e) => setLocalInstructions(e.target.value)}
                    placeholder="Instructions for AI regarding these assets (e.g., 'Make it flashy')"
                    className="w-full mt-2 px-4 py-2.5 text-sm rounded-lg border border-slate-200 bg-white/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF0000]/50 transition-all"
                />
            </div>

            {/* Footer / Submit */}
            <div className="flex flex-col items-center mt-2 w-full">
                <motion.button
                    type="submit"
                    disabled={!localTopic.trim() || isSubmitting}
                    whileHover={!isSubmitting && localTopic.trim() ? { scale: 1.02, y: -2 } : {}}
                    whileTap={!isSubmitting && localTopic.trim() ? { scale: 0.98 } : {}}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all ${!localTopic.trim() || isSubmitting ? 'bg-slate-300 shadow-none cursor-not-allowed text-slate-500' : 'bg-gradient-to-r from-red-600 to-[#FF0000] hover:shadow-[#FF0000]/30 shadow-[#FF0000]/20'}`}
                >
                    {isSubmitting ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Generating Reality...</>
                    ) : (
                        <><Sparkles className="w-5 h-5" /> Generate Reality</>
                    )}
                </motion.button>
                <p className="text-xs text-slate-400 text-center mt-4">
                    AI video generation may take 1-3 minutes depending on complexity.
                </p>
            </div>
        </form>
    );
}
