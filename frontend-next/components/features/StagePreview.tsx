"use client";

import { useWorkflowStore } from "@/store/workflowStore";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { FacebookPostPreview } from "./previews/FacebookPostPreview";
import { InstagramPostPreview } from "./previews/InstagramPostPreview";
import { YouTubePostPreview } from "./previews/YouTubePostPreview";
import { YouTubeShortPreview } from "./previews/YouTubeShortPreview";
import { YouTubeVideoPreview } from "./previews/YouTubeVideoPreview";

export function StagePreview() {
  const { setStage, targetFormat, resetWorkflow } = useWorkflowStore();

  const handleBack = () => {
    setStage("editor");
  };

  const isDarkTheme = targetFormat === 'youtube_short';
  const containerBg = isDarkTheme ? 'bg-[#0f0f0f]' : 'bg-[#f0f2f5]';
  const textColor = isDarkTheme ? 'text-white' : 'text-gray-700';

  return (
    <motion.div
      className={`flex flex-col h-screen w-full ${containerBg} relative transition-colors duration-300`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Absolute New Content Button */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => {
            const confirmDiscard = window.confirm("Are you sure you want to discard your current content and start a new one?");
            if (confirmDiscard) {
                resetWorkflow();
            }
          }}
          className={`border ${isDarkTheme ? 'border-white/20 text-white hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-100'} rounded-full px-4 py-2 text-sm font-medium transition-colors shadow-sm backdrop-blur-sm`}
        >
          New Content
        </button>
      </div>
      {/* Header */}
      <header className="p-4 flex items-center shrink-0">
        <button
          onClick={handleBack}
          className={`flex items-center gap-2 px-4 py-2 ${textColor} hover:bg-black/5 rounded-lg transition-colors font-medium`}
        >
          <ArrowLeft size={20} />
          Back to Editor
        </button>
      </header>

      {/* Main Content - Centered Card */}
      <main className="flex-grow flex items-start justify-center p-6 overflow-y-auto w-full">
        {targetFormat === 'facebook_post' ? (
          <FacebookPostPreview />
        ) : targetFormat === 'instagram_post' ? (
          <InstagramPostPreview />
        ) : targetFormat === 'youtube_post' ? (
          <YouTubePostPreview />
        ) : targetFormat === 'youtube_short' ? (
          <YouTubeShortPreview />
        ) : targetFormat === 'youtube_video' ? (
          <YouTubeVideoPreview />
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-center max-w-xl w-full">
            <span className="text-gray-500 font-medium text-[15px]">Preview not supported for this format yet.</span>
          </div>
        )}
      </main>
    </motion.div>
  );
}
