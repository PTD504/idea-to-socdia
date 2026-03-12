"use client";

import { useEffect, useRef, useState } from "react";
import { useWorkflowStore } from "@/store/workflowStore";
import { motion } from "framer-motion";
import { ArrowLeft, Send } from "lucide-react";
import { FacebookPostPreview } from "./previews/FacebookPostPreview";
import { InstagramPostPreview } from "./previews/InstagramPostPreview";
import { YouTubePostPreview } from "./previews/YouTubePostPreview";
import { YouTubeShortPreview } from "./previews/YouTubeShortPreview";
import { YouTubeVideoPreview } from "./previews/YouTubeVideoPreview";

// Returns a platform-branded gradient background based on the target format
function getGradientBg(format: string): string {
  switch (format) {
    case 'facebook_post':
      return 'bg-gradient-to-br from-blue-50 via-white to-blue-100';
    case 'instagram_post':
      return 'bg-gradient-to-br from-fuchsia-50 via-white to-orange-100';
    case 'youtube_post':
    case 'youtube_short':
    case 'youtube_video':
      return 'bg-gradient-to-br from-red-50 via-white to-gray-100';
    default:
      return 'bg-[#f0f2f5]';
  }
}

// Returns a platform-branded primary button style
function getPrimaryButtonStyle(format: string): string {
  switch (format) {
    case 'facebook_post':
      return 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30';
    case 'instagram_post':
      return 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-pink-500/30';
    case 'youtube_post':
    case 'youtube_short':
    case 'youtube_video':
      return 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/30';
    default:
      return 'bg-blue-600 hover:bg-blue-700 text-white';
  }
}

export function StagePreview() {
  const { setStage, targetFormat, resetWorkflow } = useWorkflowStore();
  const [showToast, setShowToast] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previewNode = previewRef.current;

    return () => {
      previewNode?.querySelectorAll("video").forEach((video) => {
        video.pause();
      });
    };
  }, []);

  const handleBack = () => {
    setStage("editor");
  };

  const handlePostContent = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const containerBg = getGradientBg(targetFormat);
  const primaryBtn = getPrimaryButtonStyle(targetFormat);

  return (
    <motion.div
      ref={previewRef}
      className={`flex flex-col h-screen w-full ${containerBg} relative transition-colors duration-300`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Top Right Action Buttons */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        <button
          onClick={resetWorkflow}
          className="border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-full px-4 py-2 text-sm font-medium transition-colors shadow-sm backdrop-blur-sm"
        >
          New Content
        </button>
        <button
          onClick={handlePostContent}
          className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-all shadow-xl hover:-translate-y-0.5 ${primaryBtn}`}
        >
          <Send size={16} />
          Post this content
        </button>
      </div>

      {/* Header */}
      <header className="p-4 flex items-center shrink-0">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-black/5 rounded-lg transition-colors font-medium"
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
          <div className="bg-white p-6 rounded-xl shadow-2xl flex items-center justify-center max-w-xl w-full">
            <span className="text-gray-500 font-medium text-[15px]">Preview not supported for this format yet.</span>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] bg-gray-900/95 backdrop-blur-xl text-white px-6 py-3.5 rounded-2xl shadow-xl text-sm font-medium"
        >
          Automated posting to this platform is coming soon!
        </motion.div>
      )}
    </motion.div>
  );
}
