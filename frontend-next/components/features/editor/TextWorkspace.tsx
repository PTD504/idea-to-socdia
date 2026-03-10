import { ParsedData } from "@/store/workflowStore";

interface TextWorkspaceProps {
    title: string;
    setTitle: (val: string) => void;
    content: string;
    setContent: (val: string) => void;
    hashtags: string;
    setHashtags: (val: string) => void;
    youtubeTags: string;
    setYoutubeTags: (val: string) => void;
    parsedData: ParsedData | null;
    theme: { bg: string; text: string; focus: string; [key: string]: string };
}

export function TextWorkspace({
    title, setTitle,
    content, setContent,
    hashtags, setHashtags,
    youtubeTags, setYoutubeTags,
    parsedData, theme
}: TextWorkspaceProps) {
    return (
        <div className="flex flex-col space-y-6 xl:sticky xl:top-8">
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
    );
}
