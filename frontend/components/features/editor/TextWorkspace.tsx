import { useWorkflowStore } from "@/store/workflowStore";

interface TextWorkspaceProps {
    theme: { bg: string; text: string; focus: string; [key: string]: string };
}

export function TextWorkspace({ theme }: TextWorkspaceProps) {
    const parsedData = useWorkflowStore((state) => state.parsedData);
    const updateParsedTextField = useWorkflowStore((state) => state.updateParsedTextField);

    return (
        <div className="flex flex-col space-y-6 xl:sticky xl:top-8">
            {parsedData?.title !== undefined && (
                <div className={`p-6 md:p-8 rounded-3xl backdrop-blur-xl border border-white/40 shadow-sm transition-colors ${theme.bg}`}>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${theme.text}`}>Title</label>
                    <input
                        type="text"
                        value={parsedData.title || ''}
                        onChange={(e) => updateParsedTextField('title', e.target.value)}
                        className={`w-full bg-white/60 p-4 rounded-xl font-semibold text-lg md:text-xl text-deep-black placeholder-gray-400 outline-none border border-transparent focus:ring-4 transition-all ${theme.focus}`}
                        placeholder="Enter your title..."
                    />
                </div>
            )}

            {parsedData?.content !== undefined && (
                <div className={`flex-grow p-6 md:p-8 rounded-3xl backdrop-blur-xl border border-white/40 shadow-sm flex flex-col transition-colors ${theme.bg}`}>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${theme.text}`}>Caption / Description</label>
                    <textarea
                        value={parsedData.content || ''}
                        onChange={(e) => updateParsedTextField('content', e.target.value)}
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
                        value={parsedData.hashtags || ''}
                        onChange={(e) => updateParsedTextField('hashtags', e.target.value)}
                        className={`w-full bg-white/60 p-4 rounded-xl font-medium text-deep-black placeholder-gray-400 outline-none border border-transparent focus:ring-4 transition-all ${theme.focus}`}
                        placeholder="#tags..."
                    />
                </div>
            )}

            {parsedData?.youtubeTags !== undefined && (
                <div className={`p-6 md:p-8 rounded-3xl backdrop-blur-xl border border-white/40 shadow-sm transition-colors ${theme.bg}`}>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${theme.text}`}>YouTube Tags (Comma separated)</label>
                    <textarea
                        value={parsedData.youtubeTags || ''}
                        onChange={(e) => updateParsedTextField('youtubeTags', e.target.value)}
                        rows={3}
                        className={`w-full bg-white/60 p-5 rounded-xl font-medium text-base md:text-lg leading-relaxed text-deep-black placeholder-gray-400 outline-none border border-transparent focus:ring-4 resize-none transition-all ${theme.focus}`}
                        placeholder="tags, here..."
                    />
                </div>
            )}
        </div>
    );
}
