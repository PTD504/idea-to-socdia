"use client";

import { useWorkflowStore, ParsedMedia } from "@/store/workflowStore";
import { useState, useEffect } from "react";
import Image from "next/image";
import { regenerateMediaAPI } from "@/lib/api";
import { createPortal } from "react-dom";
import { usePreventUnload } from "@/hooks/usePreventUnload";
import { TextWorkspace } from "./editor/TextWorkspace";
import { MediaStudio } from "./editor/MediaStudio";
import { RegenerateModal } from "./editor/RegenerateModal";

export function StageEditor() {
    const { parsedData, targetFormat, setStage, setFinalText, updateMediaItem, finalVideoUrl, mergeVideoScenes, resetWorkflow } = useWorkflowStore();

    // Local state variables bound to parsedData
    const [editingMedia, setEditingMedia] = useState<ParsedMedia | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [editedPrompt, setEditedPrompt] = useState('');
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isMerging, setIsMerging] = useState(false);
    const [isAllScenesOpen, setIsAllScenesOpen] = useState(false);
    const [title, setTitle] = useState(parsedData?.title || '');
    const [content, setContent] = useState(parsedData?.content || '');
    const [hashtags, setHashtags] = useState(parsedData?.hashtags || '');
    const [youtubeTags, setYoutubeTags] = useState(parsedData?.youtubeTags || '');

    // Sync if parsedData changes externally
    useEffect(() => {
        if (parsedData) {
            setTitle(parsedData.title || '');
            setContent(parsedData.content || '');
            setHashtags(parsedData.hashtags || '');
            setYoutubeTags(parsedData.youtubeTags || '');
        }
    }, [parsedData]);

    useEffect(() => {
        if (editingMedia || isAllScenesOpen || isMerging) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [editingMedia, isAllScenesOpen, isMerging]);

    // Prevent accidental refresh
    usePreventUnload(true);

    const handleProceedToPreview = async () => {
        setFinalText(content);
        if ((targetFormat === 'youtube_video' || targetFormat === 'youtube_short') && !finalVideoUrl) {
            setIsMerging(true);
            await mergeVideoScenes();
            setIsMerging(false);
        }
        setStage("preview");
    };

    const handleRegenerate = async () => {
        if (!editingMedia) return;
        setIsRegenerating(true);
        try {
            const aspectRatio = targetFormat === 'youtube_short' ? '9:16' : '16:9';
            const newUrl = await regenerateMediaAPI(editingMedia.type, editedPrompt, aspectRatio);
            if (newUrl) {
                setPreviewUrl(newUrl);
            }
        } catch (error) {
            console.error("Failed to regenerate media", error);
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleApplyChanges = () => {
        if (editingMedia && previewUrl) {
            updateMediaItem(editingMedia.id, previewUrl, editedPrompt);
        }
        setEditingMedia(null);
        setPreviewUrl(null);
    };

    const handleCancel = () => {
        setEditingMedia(null);
        setPreviewUrl(null);
    };

    // Theme logic based on target format
    const getThemeClasses = (format: string) => {
        switch (format) {
            case 'youtube_short':
            case 'youtube_video':
                return {
                    text: 'text-red-600',
                    border: 'border-red-500/20',
                    focus: 'focus:ring-red-500/50 focus:border-red-500',
                    bg: 'bg-red-500/5',
                    button: 'bg-red-600 hover:bg-red-700 text-white',
                    modalBorder: 'border-red-200',
                    modalShadow: 'shadow-red-500/20',
                    modalPrimaryBtn: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                };
            case 'instagram_post':
                return {
                    text: 'text-pink-600',
                    border: 'border-pink-500/20',
                    focus: 'focus:ring-pink-500/50 focus:border-pink-500',
                    bg: 'bg-pink-500/5',
                    button: 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white',
                    modalBorder: 'border-pink-200',
                    modalShadow: 'shadow-pink-500/20',
                    modalPrimaryBtn: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700'
                };
            case 'facebook_post':
            default:
                return {
                    text: 'text-blue-600',
                    border: 'border-blue-500/20',
                    focus: 'focus:ring-blue-500/50 focus:border-blue-500',
                    bg: 'bg-blue-500/5',
                    button: 'bg-blue-600 hover:bg-blue-700 text-white',
                    modalBorder: 'border-blue-200',
                    modalShadow: 'shadow-blue-500/20',
                    modalPrimaryBtn: 'bg-blue-600 hover:bg-blue-700 text-white'
                };
        }
    };

    const theme = getThemeClasses(targetFormat);

    // Filter media
    const mediaItems = parsedData?.media || [];
    const thumbnails = mediaItems.filter(m => m.isThumbnail);
    const images = mediaItems.filter(m => m.type === 'image' && !m.isThumbnail);
    const videos = mediaItems.filter(m => m.type === 'video');

    return (
        <div className="min-h-screen w-full bg-creative-paper p-6 md:p-10 font-sans text-deep-black flex justify-center selection:bg-black/10">
            <div className="max-w-7xl w-full flex flex-col space-y-8">
                
                {/* Header Area */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-6 gap-4">
                    <div>
                        <span className={`text-xs font-bold tracking-widest uppercase mb-1 block ${theme.text}`}>
                            Phase 2
                        </span>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-deep-black tracking-tight">
                            Workbench
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                const confirmDiscard = window.confirm("Are you sure you want to discard your current content and start a new one?");
                                if (confirmDiscard) {
                                    resetWorkflow();
                                }
                            }}
                            className="border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-full px-4 py-2 text-sm font-medium transition-colors bg-white/50 backdrop-blur-sm"
                        >
                            New Content
                        </button>
                        <button
                            onClick={handleProceedToPreview}
                            className={`px-8 py-3 rounded-xl font-bold uppercase tracking-wide shadow-lg transition-transform hover:-translate-y-0.5 ${theme.button}`}
                        >
                            Proceed to Delivery
                        </button>
                    </div>
                </header>

                {/* Main Bento Box Grid */}
                <main className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-grow items-start">
                    <TextWorkspace 
                        title={title} setTitle={setTitle}
                        content={content} setContent={setContent}
                        hashtags={hashtags} setHashtags={setHashtags}
                        youtubeTags={youtubeTags} setYoutubeTags={setYoutubeTags}
                        parsedData={parsedData} theme={theme}
                    />
                    <MediaStudio 
                        mediaItems={mediaItems}
                        thumbnails={thumbnails}
                        images={images}
                        videos={videos}
                        isAllScenesOpen={isAllScenesOpen}
                        setIsAllScenesOpen={setIsAllScenesOpen}
                        setEditingMedia={setEditingMedia}
                        setEditedPrompt={setEditedPrompt}
                        setPreviewUrl={setPreviewUrl}
                        theme={theme}
                    />
                </main>

                <RegenerateModal 
                    editingMedia={editingMedia}
                    previewUrl={previewUrl}
                    editedPrompt={editedPrompt}
                    setEditedPrompt={setEditedPrompt}
                    isRegenerating={isRegenerating}
                    handleCancel={handleCancel}
                    handleRegenerate={handleRegenerate}
                    handleApplyChanges={handleApplyChanges}
                    theme={theme}
                />

                {isMerging && typeof document !== 'undefined' && createPortal(
                    <div className="fixed inset-0 z-[9990] flex items-center justify-center w-screen h-screen bg-black/90 backdrop-blur-md overflow-hidden p-4">
                        <div className="flex flex-col items-center flex-wrap max-w-lg text-center gap-6">
                            <svg className="animate-spin h-16 w-16 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <h2 className="text-white text-xl md:text-2xl font-bold tracking-wide leading-relaxed">
                                Stitching your video scenes together. This might take a moment...
                            </h2>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
}
