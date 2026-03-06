"use client";

import { useWorkflowStore } from "@/store/workflowStore";
import { motion } from "framer-motion";
import { Globe, ThumbsUp, MessageSquare, Share2, ArrowLeft } from "lucide-react";

export function StagePreview() {
  const { streamBlocks, setStage, finalText } = useWorkflowStore();

  const handleBack = () => {
    setStage("editor");
  };

  const mediaBlocks = streamBlocks.filter((b) => b.type === "media_result");

  const renderText = (text: string) => {
    return text.split(/(\s+)/).map((word, index) => {
      if (word.startsWith("#")) {
        return (
          <span key={index} className="text-blue-600">
            {word}
          </span>
        );
      }
      return <span key={index}>{word}</span>;
    });
  };

  return (
    <motion.div
      className="flex flex-col h-screen w-full bg-creative-paper relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <header className="p-4 flex items-center shrink-0">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 text-deep-black hover:bg-black/5 rounded-lg transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Back to Editor
        </button>
      </header>

      {/* Main Content - Centered Card */}
      <main className="flex-grow flex items-center justify-center p-6 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 max-w-xl w-full overflow-hidden flex flex-col">
          {/* Post Header */}
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-deep-black text-[15px]">
                Creative Director Agent
              </span>
              <div className="flex items-center gap-1 text-gray-500 text-[13px]">
                <span>Just now</span>
                <span aria-hidden="true">&middot;</span>
                <Globe size={12} />
              </div>
            </div>
          </div>

          {/* Post Body */}
          <div className="px-4 pb-3 text-[15px] text-deep-black whitespace-pre-wrap leading-normal font-sans">
            {renderText(finalText)}
          </div>

          {/* Post Media */}
          {mediaBlocks.length > 0 && (
            <div
              className={`grid gap-[1px] bg-gray-200 ${
                mediaBlocks.length > 1 ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              {mediaBlocks.map((block) => {
                const url = block.content;
                const isVideo = url.match(/\.(mp4|webm|mov)$/i);
                return (
                  <div key={block.id} className="w-full aspect-square relative bg-white">
                    {isVideo ? (
                      <video
                        src={url}
                        controls
                        className="w-full h-full object-cover relative"
                      />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={url}
                        alt="Generated media"
                        className="w-full h-full object-cover relative"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Post Footer */}
          <div className="px-4 py-1 border-t border-gray-200 text-gray-500 text-[15px]">
            <div className="flex items-center justify-between py-1">
              <button className="flex items-center justify-center gap-2 flex-1 hover:bg-gray-100 py-2 rounded-md transition-colors font-medium">
                <ThumbsUp size={20} />
                <span>Like</span>
              </button>
              <button className="flex items-center justify-center gap-2 flex-1 hover:bg-gray-100 py-2 rounded-md transition-colors font-medium">
                <MessageSquare size={20} />
                <span>Comment</span>
              </button>
              <button className="flex items-center justify-center gap-2 flex-1 hover:bg-gray-100 py-2 rounded-md transition-colors font-medium">
                <Share2 size={20} />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
}
