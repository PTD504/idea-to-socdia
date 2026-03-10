import Image from "next/image";
import { ParsedMedia, useWorkflowStore } from "@/store/workflowStore";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface MediaStudioProps {
    mediaItems: ParsedMedia[];
    thumbnails: ParsedMedia[];
    images: ParsedMedia[];
    videos: ParsedMedia[];
    setEditingMedia: (media: ParsedMedia) => void;
    setEditedPrompt: (prompt: string) => void;
    setPreviewUrl: (url: string | null) => void;
    isAllScenesOpen: boolean;
    setIsAllScenesOpen: (isOpen: boolean) => void;
    theme: { bg: string; text: string; [key: string]: string };
}

export function MediaStudio({
    mediaItems,
    thumbnails,
    images,
    videos,
    setEditingMedia,
    setEditedPrompt,
    setPreviewUrl,
    isAllScenesOpen,
    setIsAllScenesOpen,
    theme
}: MediaStudioProps) {
    const { targetFormat, finalVideoUrl, mergeVideoScenes } = useWorkflowStore();
    const [isMergingLocal, setIsMergingLocal] = useState(false);
    
    const isVideoFormat = targetFormat === 'youtube_video' || targetFormat === 'youtube_short';
    const isVertical = targetFormat === 'youtube_short';

    const colorBase = theme.text.split('-')[1] || 'gray';
    const hoverClasses = `hover:border-${colorBase}-500 hover:shadow-lg hover:shadow-${colorBase}-500/20`;

    const handleMerge = async () => {
        setIsMergingLocal(true);
        await mergeVideoScenes();
        setIsMergingLocal(false);
    };

    return (
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
                                className={`relative w-full ${isVertical ? 'aspect-[9/16] w-auto max-h-[60vh] mx-auto' : 'aspect-video'} rounded-2xl overflow-hidden shadow-md group ${media.isUploaded ? '' : 'cursor-pointer'}`}
                            >
                                {media.isUploaded && (
                                    <div className="absolute top-3 right-3 z-20 bg-white/80 backdrop-blur-md text-deep-black text-xs font-extrabold px-3 py-1.5 rounded-full shadow-sm tracking-wide border border-white/40">
                                        Uploaded Asset
                                    </div>
                                )}
                                {!media.isUploaded && (
                                    <div className="absolute top-3 right-3 z-20 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-bold px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        Edit
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10 pointer-events-none" />
                                <Image src={media.url} alt="Cover Thumbnail" fill className={`object-contain transition-transform duration-700 ${media.isUploaded ? '' : 'group-hover:scale-105'}`} unoptimized />
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
                                className={`relative ${isVertical ? 'aspect-[9/16] w-auto max-h-[60vh] mx-auto' : 'aspect-square sm:aspect-[4/3]'} rounded-2xl overflow-hidden shadow-sm group bg-white/50 border border-white/30 ${media.isUploaded ? '' : 'cursor-pointer'}`}
                            >
                                {media.isUploaded && (
                                    <div className="absolute top-3 right-3 z-20 bg-white/80 backdrop-blur-md text-deep-black text-xs font-extrabold px-3 py-1.5 rounded-full shadow-sm tracking-wide border border-white/40">
                                        Uploaded Asset
                                    </div>
                                )}
                                {!media.isUploaded && (
                                    <div className="absolute top-3 right-3 z-20 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-bold px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        Edit
                                    </div>
                                )}
                                <Image 
                                    src={media.url} 
                                    alt="Generated Image" 
                                    fill
                                    className={`object-contain relative z-10 transition-transform duration-700 ${media.isUploaded ? '' : 'group-hover:scale-105'}`} 
                                    unoptimized
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isVideoFormat && (
                <div className={`p-6 md:p-8 rounded-3xl backdrop-blur-xl border border-white/40 shadow-sm transition-colors ${theme.bg}`}>
                    <h2 className={`text-xs font-bold uppercase tracking-wider mb-4 ${theme.text}`}>Master Video</h2>
                    {finalVideoUrl ? (
                        <div className="flex flex-col items-center">
                            <video src={finalVideoUrl} controls className={`${isVertical ? 'aspect-[9/16] w-auto max-h-[70vh] mx-auto' : 'aspect-video w-full'} rounded-xl mb-6 bg-black shadow-md border border-white/20`} />
                            <button
                                onClick={handleMerge}
                                disabled={isMergingLocal}
                                className={`px-6 py-3 rounded-xl font-bold uppercase tracking-wide text-xs transition-transform hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none ${theme.button}`}
                            >
                                {isMergingLocal ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Stitching scenes...
                                    </>
                                ) : "Re-merge Videos"}
                            </button>
                        </div>
                    ) : (
                        <div className="flex justify-center py-4">
                            <button
                                onClick={handleMerge}
                                disabled={isMergingLocal}
                                className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-transform hover:-translate-y-0.5 shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:transform-none w-full md:w-auto ${theme.button}`}
                            >
                                {isMergingLocal ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Stitching scenes together...
                                    </>
                                ) : "Merge Video Scenes"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {videos.length > 0 && (
                <div className={`p-6 md:p-8 rounded-3xl backdrop-blur-xl border border-white/40 shadow-sm transition-colors ${theme.bg}`}>
                    <h4 className="text-sm font-bold uppercase mb-4 opacity-70 mt-6 md:mt-0">Video Scenes</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {videos.length > 4 ? videos.slice(0, 3).map((media) => (
                            <div 
                                key={media.id} 
                                onClick={() => {
                                    setEditingMedia(media);
                                    setEditedPrompt(media.prompt);
                                    setPreviewUrl(null);
                                }}
                                className={`bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden border border-white/50 transition-all cursor-pointer shadow-sm flex flex-col group ${hoverClasses}`}
                            >
                                <div className={`relative ${isVertical ? 'aspect-[9/16]' : 'aspect-video'} w-full bg-black/5`}>
                                    <video 
                                        src={media.url} 
                                        controls={true} 
                                        onClick={(e) => e.stopPropagation()} 
                                        className="w-full h-full object-cover rounded-t-xl" 
                                    />
                                    <div className="absolute top-2 right-2 z-20 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-bold px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pointer-events-none">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        Edit
                                    </div>
                                </div>
                                <div className="p-3 border-t border-white/50 bg-white/60 flex items-center justify-between">
                                    <span className="text-xs font-bold tracking-wider text-gray-800 group-hover:text-black transition-colors">
                                        SCENE {media.order}
                                    </span>
                                </div>
                            </div>
                        )) : videos.map((media) => (
                            <div 
                                key={media.id} 
                                onClick={() => {
                                    setEditingMedia(media);
                                    setEditedPrompt(media.prompt);
                                    setPreviewUrl(null);
                                }}
                                className={`bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden border border-white/50 transition-all cursor-pointer shadow-sm flex flex-col group ${hoverClasses}`}
                            >
                                <div className="relative aspect-video w-full bg-black/5">
                                    <video src={media.url} controls className="w-full aspect-video object-cover rounded-t-xl" />
                                </div>
                                <div className="p-3 border-t border-white/50 bg-white/60 flex items-center justify-between">
                                    <span className="text-xs font-bold tracking-wider text-gray-800 group-hover:text-black transition-colors">
                                        SCENE {media.order}
                                    </span>
                                </div>
                            </div>
                        ))}
                        
                        {videos.length > 4 && (
                            <div 
                                onClick={() => setIsAllScenesOpen(true)}
                                className={`bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden border border-white/50 transition-all cursor-pointer shadow-sm flex flex-col items-center justify-center aspect-video sm:aspect-auto h-full ${hoverClasses}`}
                            >
                                <span className="text-3xl font-black text-gray-800 mb-2">+{videos.length - 3}</span>
                                <span className="text-xs font-bold tracking-wider text-gray-600 uppercase">More Scenes</span>
                            </div>
                        )}
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

            {isAllScenesOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[8000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-8 overflow-hidden w-screen h-screen">
                    <div className="w-full max-w-5xl h-full max-h-[90vh] bg-white/95 backdrop-blur-2xl border-2 shadow-2xl rounded-3xl p-6 flex flex-col border-white/50">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 sticky top-0 bg-transparent z-10 p-2">
                            <h2 className="text-2xl font-bold tracking-wide text-gray-900">All Video Scenes</h2>
                            <button 
                                onClick={() => setIsAllScenesOpen(false)}
                                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-8 pr-2">
                            {videos.map((media) => (
                                <div 
                                    key={media.id} 
                                    onClick={() => {
                                        setEditingMedia(media);
                                        setEditedPrompt(media.prompt);
                                        setPreviewUrl(null);
                                    }}
                                    className={`bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden border border-white/50 transition-all cursor-pointer shadow-sm flex flex-col group h-max ${hoverClasses}`}
                                >
                                    <div className="relative aspect-video w-full bg-black/5">
                                        <video src={media.url} controls className="w-full aspect-video object-cover rounded-t-xl" />
                                    </div>
                                    <div className="p-3 border-t border-white/50 bg-white/60 flex items-center justify-between">
                                        <span className="text-xs font-bold tracking-wider text-gray-800 group-hover:text-black transition-colors">
                                            SCENE {media.order}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
