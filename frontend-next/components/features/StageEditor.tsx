"use client";

import { useWorkflowStore } from "@/store/workflowStore";
import { useState, useEffect } from "react";

export function StageEditor() {
    const { streamBlocks } = useWorkflowStore();
    const [editorText, setEditorText] = useState("");

    useEffect(() => {
        const textBlocks = streamBlocks.filter((b) => b.type === "text");
        const combinedText = textBlocks.map((b) => b.content).join("\n");
        setEditorText(combinedText);
    }, [streamBlocks]);

    const mediaBlocks = streamBlocks.filter((b) => b.type === "media_result");

    const handleProceed = () => {
        const store = useWorkflowStore.getState();
        store.setFinalText(editorText);
        store.setStage("preview");
    };

    return (
        <div className="flex flex-col h-screen w-full bg-creative-paper">
            {/* Header Area */}
            <header className="p-4 border-b border-gray-200">
                <h1 className="text-xl font-bold">Workbench</h1>
            </header>

            {/* Main Area */}
            <main className="flex-grow flex overflow-hidden">
                {/* Left Column: Text Editor */}
                <div className="w-[60%] h-full p-6 flex flex-col border-r border-gray-200">
                    <textarea
                        className="flex-grow resize-none p-4 rounded-xl glass-panel text-deep-black focus:outline-none"
                        value={editorText}
                        onChange={(e) => setEditorText(e.target.value)}
                        placeholder="Edit your generated content here..."
                    />
                </div>

                {/* Right Column: Media Pool */}
                <div className="w-[40%] h-full p-6 overflow-y-auto bg-black/5">
                    <div className="grid grid-cols-1 gap-4">
                        {mediaBlocks.map((block) => {
                            const url = block.content;
                            const isVideo = url.match(/\.(mp4|webm|mov)$/i);

                            return (
                                <div key={block.id} className="w-full flex justify-center">
                                    {isVideo ? (
                                        <video
                                            src={url}
                                            controls
                                            className="w-full h-auto object-contain rounded-lg"
                                        />
                                    ) : (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={url}
                                            alt="Generated media"
                                            className="w-full h-auto object-contain rounded-lg"
                                        />
                                    )}
                                </div>
                            );
                        })}
                        {mediaBlocks.length === 0 && (
                            <div className="text-sm text-black/40 italic flex items-center justify-center h-32">
                                No media generated yet.
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Bottom Bar */}
            <footer className="p-4 border-t border-gray-200 flex justify-end bg-white">
                <button
                    onClick={handleProceed}
                    className="px-6 py-2 bg-deep-black text-white rounded-md font-medium hover:bg-black/80 transition-colors"
                >
                    Proceed to Preview
                </button>
            </footer>
        </div>
    );
}
