import React from 'react';
import { useWorkflowStore } from "@/store/workflowStore";
import { ThumbsUp, ThumbsDown, MessageSquare, Share2, MoreHorizontal, X, Repeat } from "lucide-react";

export function YouTubeShortPreview() {
  const { parsedData, finalVideoUrl } = useWorkflowStore();

  const title = parsedData?.title || "Untitled Short";
  const content = parsedData?.content || "";
  const hashtags = parsedData?.hashtags || "";
  const youtubeTags = parsedData?.youtubeTags || "";
  
  // Use the merged final video, or fallback to the first video in media, or null
  const fallbackVideo = parsedData?.media?.find(m => m.type === 'video')?.url || null;
  const videoSrc = finalVideoUrl || fallbackVideo;

  return (
    <div className="w-full flex items-center justify-center font-sans tracking-wide">
      {/* Video + Actions Container */}
      <div className="flex flex-row relative">
        
        {/* Video Player */}
        <div className="relative w-auto h-[80vh] aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-2xl flex items-center justify-center">
          {videoSrc ? (
            <video 
              src={videoSrc}
              controls
              autoPlay
              loop
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-500 flex flex-col items-center">
              <span>No Video Source</span>
            </div>
          )}

          {/* Gradient Overlay for Readability */}
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-10 rounded-b-xl" />

          {/* Bottom Left Overlay */}
          <div className="absolute bottom-32 left-4 right-16 flex flex-col gap-2 z-20 pointer-events-none">
            <div className="flex items-center">
              <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center shrink-0">
                <span className="text-white font-medium text-sm">DP</span>
              </div>
              <span className="text-white font-medium ml-2 text-sm drop-shadow-md">
                dangPhan
              </span>
              <button className="bg-white text-black px-3 py-1 rounded-full font-medium text-xs ml-3 pointer-events-auto hover:bg-gray-200 transition-colors">
                Subscribe
              </button>
            </div>
            <div className="text-white font-medium text-[15px] drop-shadow-md line-clamp-2">
              {title}
            </div>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex flex-col justify-end gap-5 ml-4 pb-4 h-[80vh]">
          {/* Like */}
          <div className="flex flex-col items-center gap-1 cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-[#272727] group-hover:bg-[#3f3f3f] flex items-center justify-center transition-colors">
              <ThumbsUp size={24} className="text-white fill-white" />
            </div>
            <span className="text-white text-sm font-medium">20K</span>
          </div>

          {/* Dislike */}
          <div className="flex flex-col items-center gap-1 cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-[#272727] group-hover:bg-[#3f3f3f] flex items-center justify-center transition-colors">
              <ThumbsDown size={24} className="text-white fill-white" />
            </div>
            <span className="text-white text-sm font-medium">Dislike</span>
          </div>

          {/* Comment */}
          <div className="flex flex-col items-center gap-1 cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-[#272727] group-hover:bg-[#3f3f3f] flex items-center justify-center transition-colors">
              <MessageSquare size={24} className="text-white fill-white" />
            </div>
            <span className="text-white text-sm font-medium">1,100</span>
          </div>

          {/* Share */}
          <div className="flex flex-col items-center gap-1 cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-[#272727] group-hover:bg-[#3f3f3f] flex items-center justify-center transition-colors">
              <Share2 size={24} className="text-white fill-white" />
            </div>
            <span className="text-white text-sm font-medium">Share</span>
          </div>
          
          {/* Remix */}
          <div className="flex flex-col items-center gap-1 cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-[#272727] group-hover:bg-[#3f3f3f] flex items-center justify-center transition-colors">
              <Repeat size={24} className="text-white fill-white" />
            </div>
            <span className="text-white text-sm font-medium">Remix</span>
          </div>

          {/* More */}
          <div className="flex flex-col items-center gap-1 cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-[#272727] group-hover:bg-[#3f3f3f] flex items-center justify-center transition-colors">
              <MoreHorizontal size={24} className="text-white fill-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Description Panel */}
      <div className="w-[350px] bg-[#212121] rounded-xl flex flex-col h-[80vh] overflow-hidden ml-6 shadow-xl border border-white/5">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <span className="text-white font-bold text-lg">Description</span>
          <button className="text-white hover:bg-white/10 rounded-full p-2 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto flex-1 text-white">
          <h2 className="font-bold text-xl mb-4 leading-tight">{title}</h2>
          
          <div className="flex items-center gap-3 text-sm text-gray-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis mb-4">
            <span>20K Likes</span>
            <span>2,777,422 Views</span>
            <span>7 Mar 2026</span>
          </div>

          <div className="w-full h-px bg-white/10 mb-4" />

          {content && (
            <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
              {content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
