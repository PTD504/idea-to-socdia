"use client";

import { useWorkflowStore, ParsedMedia } from "@/store/workflowStore";
import { useState, useEffect } from "react";
import Image from "next/image";
import { regenerateMediaAPI } from "@/lib/api";
import { createPortal } from "react-dom";

export function StageEditor() {
    const { parsedData, targetFormat, setStage, setFinalText, updateMediaItem } = useWorkflowStore();

    // Local state variables bound to parsedData
    const [editingMedia, setEditingMedia] = useState<ParsedMedia | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [editedPrompt, setEditedPrompt] = useState('');
    const [isRegenerating, setIsRegenerating] = useState(false);
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
        if (editingMedia) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [editingMedia]);

    // Prevent accidental refresh
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    const handleProceed = () => {
        setFinalText(content);
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
                    <button
                        onClick={handleProceed}
                        className={`px-8 py-3 rounded-xl font-bold uppercase tracking-wide shadow-lg transition-transform hover:-translate-y-0.5 ${theme.button}`}
                    >
                        Proceed to Delivery
                    </button>
                </header>

                {/* Main Bento Box Grid */}
                <main className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-grow">
                    
                    {/* Left Column: Text Editor Workspace */}
                    <div className="flex flex-col space-y-6">
                        {parsedData?.title !== undefined && (
                            <div className={`p-6 md:p-8 rounded-3xl backdrop-blur-xl border border-white/40 shadow-sm transition-colors ${theme.bg}`}>
                                <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${theme.text}`}>Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className={`w-full bg-white/60 p-4 rounded-xl font-semibold text-lg md:text-xl text-deep-black placeholder-gray-400 outline-none border border-transparent focus:ring-4 transition-all ${theme.focus}`}
                                    placeholder="Enter your title..."
                                />
                            </div>
                        )}

                        {parsedData?.content !== undefined && (
                            <div className={`flex-grow p-6 md:p-8 rounded-3xl backdrop-blur-xl border border-white/40 shadow-sm flex flex-col transition-colors ${theme.bg}`}>
                                <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${theme.text}`}>Content / Caption</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={12}
                                    className={`w-full flex-grow bg-white/60 p-5 rounded-xl font-medium text-base md:text-lg leading-relaxed text-deep-black placeholder-gray-400 outline-none border border-transparent focus:ring-4 resize-none transition-all ${theme.focus}`}
                                    placeholder="Sculpt your narrative here..."
                                />
                            </div>
                        )}

                        {parsedData?.hashtags !== undefined && (
                            <div className={`p-6 md:p-8 rounded-3xl backdrop-blur-xl border border-white/40 shadow-sm transition-colors ${theme.bg}`}>
                                <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${theme.text}`}>Hashtags</label>
                                <input
                                    type="text"
                                    value={hashtags}
                                    onChange={(e) => setHashtags(e.target.value)}
                                    className={`w-full bg-white/60 p-4 rounded-xl font-medium text-deep-black placeholder-gray-400 outline-none border border-transparent focus:ring-4 transition-all ${theme.focus}`}
                                    placeholder="#tags..."
                                />
                            </div>
                        )}

                        {parsedData?.youtubeTags !== undefined && (
                            <div className={`p-6 md:p-8 rounded-3xl backdrop-blur-xl border border-white/40 shadow-sm transition-colors ${theme.bg}`}>
                                <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${theme.text}`}>YouTube Tags (Comma separated)</label>
                                <textarea
                                    value={youtubeTags}
                                    onChange={(e) => setYoutubeTags(e.target.value)}
                                    rows={3}
                                    className={`w-full bg-white/60 p-5 rounded-xl font-medium text-base md:text-lg leading-relaxed text-deep-black placeholder-gray-400 outline-none border border-transparent focus:ring-4 resize-none transition-all ${theme.focus}`}
                                    placeholder="tags, here..."
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col space-y-6">
                        {thumbnails.length > 0 && (
                            <div className={`p-6 md:p-8 rounded-3xl backdrop-blur-xl border border-white/40 shadow-sm transition-colors ${theme.bg}`}>
                                <h2 className={`text-xs font-bold uppercase tracking-wider mb-4 ${theme.text}`}>Cover / Thumbnail</h2>
                                <div className="space-y-4">
                                    {thumbnails.map((media) => (
                                        <div 
                                            key={media.id} 
                                            onClick={() => {
                                                if (media.isUploaded) return;
                                                setEditingMedia(media);
                                                setEditedPrompt(media.prompt);
                                            }}
                                            className={`relative w-full aspect-video rounded-2xl overflow-hidden shadow-md group ${media.isUploaded ? '' : 'cursor-pointer'}`}
                                        >
                                            {media.isUploaded && (
                                                <div className="absolute top-3 right-3 z-20 bg-white/80 backdrop-blur-md text-deep-black text-xs font-extrabold px-3 py-1.5 rounded-full shadow-sm tracking-wide border border-white/40">
                                                    Uploaded Asset
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10 pointer-events-none" />
                                            <Image src={media.url} alt="Cover Thumbnail" fill className={`object-cover transition-transform duration-700 ${media.isUploaded ? '' : 'group-hover:scale-105'}`} unoptimized />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {images.length > 0 && (
                            <div className={`p-6 md:p-8 rounded-3xl backdrop-blur-xl border border-white/40 shadow-sm transition-colors ${theme.bg}`}>
                                <h4 className="text-sm font-bold uppercase mb-4 opacity-70">Images</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {images.map((media) => (
                                        <div 
                                            key={media.id} 
                                            onClick={() => {
                                                if (media.isUploaded) return;
                                                setEditingMedia(media);
                                                setEditedPrompt(media.prompt);
                                            }}
                                            className={`relative aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden shadow-sm group bg-white/50 border border-white/30 ${media.isUploaded ? '' : 'cursor-pointer'}`}
                                        >
                                            {media.isUploaded && (
                                                <div className="absolute top-3 right-3 z-20 bg-white/80 backdrop-blur-md text-deep-black text-xs font-extrabold px-3 py-1.5 rounded-full shadow-sm tracking-wide border border-white/40">
                                                    Uploaded Asset
                                                </div>
                                            )}
                                            <Image 
                                                src={media.url} 
                                                alt="Generated Image" 
                                                fill
                                                className={`object-cover relative z-10 transition-transform duration-700 ${media.isUploaded ? '' : 'group-hover:scale-105'}`} 
                                                unoptimized
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {videos.length > 0 && (
                            <div className={`p-6 md:p-8 rounded-3xl backdrop-blur-xl border border-white/40 shadow-sm transition-colors ${theme.bg}`}>
                                <h4 className="text-sm font-bold uppercase mb-4 opacity-70 mt-6 md:mt-0">Video Scenes</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {videos.map((media) => (
                                        <div 
                                            key={media.id} 
                                            onClick={() => {
                                                setEditingMedia(media);
                                                setEditedPrompt(media.prompt);
                                                setPreviewUrl(null);
                                            }}
                                            className="relative aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden shadow-sm group bg-white/50 border border-white/30 cursor-pointer"
                                        >
                                            {media.order !== undefined && (
                                                <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-md text-deep-black text-xs font-extrabold px-3 py-1.5 rounded-full shadow-sm tracking-wide">
                                                    Scene {media.order}
                                                </div>
                                            )}
                                            <video 
                                                src={media.url} 
                                                controls 
                                                className="w-full h-full object-cover relative z-10" 
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {mediaItems.length === 0 && (
                            <div className={`p-10 rounded-3xl backdrop-blur-xl border border-white/40 shadow-sm flex flex-col items-center justify-center text-center transition-colors h-64 ${theme.bg}`}>
                                <div className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center bg-white/50 ${theme.text}`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <p className="text-gray-500 font-medium">No media assets generated for this content.</p>
                            </div>
                        )}
                    </div>
                </main>

                {/* Media Regeneration Modal via React Portal */}
                {editingMedia && typeof document !== 'undefined' && createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
                        <div className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-2 shadow-2xl rounded-3xl p-6 md:p-8 flex flex-col items-center ${theme.modalBorder} ${theme.modalShadow}`}>
                            <h3 className="text-gray-900 text-2xl font-bold mb-6 tracking-wide w-full text-left">Edit Media</h3>
                            
                            {/* Preview Area */}
                            <div className="relative w-full h-64 rounded-xl overflow-hidden mb-6 flex justify-center bg-gray-100 border border-gray-200">
                                {isRegenerating && (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                                        <svg className={`animate-spin h-10 w-10 ${theme.text}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>
                                )}
                                {editingMedia.type === 'video' ? (
                                    <video src={previewUrl || editingMedia.url} controls className="max-w-full h-full object-contain" />
                                ) : (
                                    <Image src={previewUrl || editingMedia.url} alt="Media Preview" fill className="object-contain" unoptimized />
                                )}
                            </div>
                            
                            <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-3 w-full text-left">Prompt</label>
                            <textarea
                                value={editedPrompt}
                                onChange={(e) => setEditedPrompt(e.target.value)}
                                rows={4}
                                disabled={isRegenerating}
                                className={`w-full bg-gray-50 text-gray-900 border border-gray-200 p-5 rounded-xl font-medium text-base outline-none focus:ring-2 resize-none transition-all mb-8 placeholder-gray-400 disabled:opacity-50 ${theme.focus}`}
                                placeholder="Describe your media..."
                            />
                            
                            <div className="flex justify-end w-full gap-4 flex-wrap">
                                <button
                                    onClick={handleCancel}
                                    disabled={isRegenerating}
                                    className="px-6 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 tracking-wide uppercase text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRegenerate}
                                    disabled={isRegenerating || !editedPrompt.trim()}
                                    className={`px-8 py-3 rounded-xl font-bold uppercase tracking-wide text-sm transition-transform hover:-translate-y-0.5 shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:transform-none ${theme.modalPrimaryBtn}`}
                                >
                                    {isRegenerating ? "Regenerating..." : "Regenerate"}
                                </button>
                                {previewUrl && (
                                    <button
                                        onClick={handleApplyChanges}
                                        disabled={isRegenerating}
                                        className={`px-8 py-3 rounded-xl font-bold uppercase tracking-wide text-sm transition-transform hover:-translate-y-0.5 shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:transform-none ${theme.modalPrimaryBtn}`}
                                    >
                                        Apply Changes
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
}
