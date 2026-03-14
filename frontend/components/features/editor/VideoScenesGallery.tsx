import { ParsedMedia, useWorkflowStore } from "@/store/workflowStore";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface VideoScenesGalleryProps {
    setEditingMedia: (media: ParsedMedia) => void;
    setEditedPrompt: (prompt: string) => void;
    setPreviewUrl: (url: string | null) => void;
    theme: { bg: string; text: string; [key: string]: string };
    isInteractionLocked?: boolean;
}

export function VideoScenesGallery({
    setEditingMedia,
    setEditedPrompt,
    setPreviewUrl,
    theme,
    isInteractionLocked = false,
}: VideoScenesGalleryProps) {
    const { parsedData, targetFormat, currentStage } = useWorkflowStore();
    const [isAllScenesOpen, setIsAllScenesOpen] = useState(false);

    useEffect(() => {
        if (isAllScenesOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isAllScenesOpen]);

    const videos = parsedData?.media?.filter((m) => m.type === "video") || [];
    const isVertical = targetFormat === 'youtube_short';

    const colorBase = theme.text.split('-')[1] || 'gray';
    const hoverClasses = `hover:border-${colorBase}-500 hover:shadow-lg hover:shadow-${colorBase}-500/20`;

    const openMediaEditor = (media: ParsedMedia) => {
        if (isInteractionLocked || media.isUploaded) return;
        setEditingMedia(media);
        setEditedPrompt(media.prompt);
        setPreviewUrl(null);
    };

    if (videos.length === 0) return null;

    return (
        <div className={`p-6 md:p-8 rounded-3xl backdrop-blur-xl border border-white/40 shadow-sm transition-colors mt-8 ${theme.bg}`}>
            <h4 className="text-sm font-bold uppercase mb-4 opacity-70">Video Scenes</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {videos.length > 4 ? videos.slice(0, 3).map((media) => (
                    <div 
                        key={media.id} 
                        onClick={() => openMediaEditor(media)}
                        className={`bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden border border-white/50 transition-all shadow-sm flex flex-col group ${isInteractionLocked ? 'pointer-events-none opacity-50' : `cursor-pointer ${hoverClasses}`}`}
                    >
                        <div className={`relative ${isVertical ? 'h-[200px]' : 'aspect-video'} w-full bg-black/5`}>
                            <video 
                                key={`${currentStage}-${media.id}-${media.url}`}
                                src={media.url} 
                                controls={true} 
                                playsInline
                                disablePictureInPicture
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
                        onClick={() => openMediaEditor(media)}
                        className={`bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden border border-white/50 transition-all shadow-sm flex flex-col group ${isInteractionLocked ? 'pointer-events-none opacity-50' : `cursor-pointer ${hoverClasses}`}`}
                    >
                        <div className={`relative ${isVertical ? 'h-[200px]' : 'aspect-video'} w-full bg-black/5`}>
                            <video key={`${currentStage}-${media.id}-${media.url}`} src={media.url} controls playsInline disablePictureInPicture onClick={(e) => e.stopPropagation()} className="w-full h-full object-cover rounded-t-xl" />
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
                ))}
                
                {videos.length > 4 && (
                    <div 
                        onClick={() => setIsAllScenesOpen(true)}
                        className={`bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden border border-white/50 transition-all shadow-sm flex flex-col items-center justify-center aspect-video sm:aspect-auto h-full ${isInteractionLocked ? 'pointer-events-none opacity-50' : `cursor-pointer ${hoverClasses}`}`}
                    >
                        <span className="text-3xl font-black text-gray-800 mb-2">+{videos.length - 3}</span>
                        <span className="text-xs font-bold tracking-wider text-gray-600 uppercase">More Scenes</span>
                    </div>
                )}
            </div>

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
                                    onClick={() => openMediaEditor(media)}
                                    className={`bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden border border-white/50 transition-all shadow-sm flex flex-col group h-max ${isInteractionLocked ? 'pointer-events-none opacity-50' : `cursor-pointer ${hoverClasses}`}`}
                                >
                                    <div className={`relative ${isVertical ? 'h-[200px]' : 'aspect-video'} w-full bg-black/5`}>
                                        <video key={`${currentStage}-${media.id}-${media.url}`} src={media.url} controls playsInline disablePictureInPicture onClick={(e) => e.stopPropagation()} className="w-full h-full object-cover rounded-t-xl" />
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
                            ))}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

