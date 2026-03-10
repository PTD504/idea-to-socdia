import Image from "next/image";
import { ParsedMedia, useWorkflowStore } from "@/store/workflowStore";
import { createPortal } from "react-dom";

interface RegenerateModalProps {
    editingMedia: ParsedMedia | null;
    previewUrl: string | null;
    editedPrompt: string;
    setEditedPrompt: (prompt: string) => void;
    isRegenerating: boolean;
    handleCancel: () => void;
    handleRegenerate: () => void;
    handleApplyChanges: () => void;
    theme: { text: string; modalBorder: string; modalShadow: string; modalPrimaryBtn: string; focus: string; [key: string]: string };
}

export function RegenerateModal({
    editingMedia,
    previewUrl,
    editedPrompt,
    setEditedPrompt,
    isRegenerating,
    handleCancel,
    handleRegenerate,
    handleApplyChanges,
    theme
}: RegenerateModalProps) {
    const isVertical = useWorkflowStore((state) => state.targetFormat) === 'youtube_short';

    if (!editingMedia || typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
            <div className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-2 shadow-2xl rounded-3xl p-6 md:p-8 flex flex-col items-center ${theme.modalBorder} ${theme.modalShadow}`}>
                <h3 className="text-gray-900 text-2xl font-bold mb-6 tracking-wide w-full text-left">Edit Media</h3>
                
                {/* Preview Area */}
                <div className={`relative ${isVertical ? 'aspect-[9/16] w-auto max-h-[60vh]' : 'aspect-video w-full'} rounded-xl overflow-hidden mb-6 flex justify-center mx-auto bg-gray-100 border border-gray-200`}>
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
    );
}
