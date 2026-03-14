import React from 'react';
import { useWorkflowStore } from "@/store/workflowStore";
import { ThumbsUp, ThumbsDown, MessageSquare, Share2, MoreHorizontal, X, Repeat } from "lucide-react";
import { useRef, useEffect } from 'react';

export function YouTubeShortPreview() {
  const { parsedData, finalVideoUrl, currentStage } = useWorkflowStore();

  const title = parsedData?.title || "Untitled Short";
  const content = parsedData?.content || "";
  const hashtags = parsedData?.hashtags || "";
  
  // Use the merged final video, or fallback to the first video in media, or null
  const fallbackVideo = parsedData?.media?.find(m => m.type === 'video')?.url || null;
  const videoSrc = finalVideoUrl || fallbackVideo;

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();   // Reset the video to the start when source changes
      videoRef.current.play().catch(() => {});
    }
  }, [videoSrc]);

  return (
    <div className="w-full flex items-center justify-center font-sans tracking-wide">
      {/* Video + Actions Container */}
      <div className="flex flex-row relative">
        
        {/* Video Player */}
        <div className="relative w-auto h-[80vh] aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-2xl flex items-center justify-center">
          {videoSrc ? (
            <video 
              ref={videoRef}
              key={`${currentStage}-${videoSrc}`}
              src={videoSrc}
              controls
              autoPlay
              loop
              muted
              playsInline
              disablePictureInPicture
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
          <div className="absolute bottom-8 left-4 right-16 flex flex-col gap-2 z-20 pointer-events-none">
            <div className="flex items-center">
              <div className="w-9 h-9 rounded-full bg-gray-600 flex items-center justify-center shrink-0">
                <span className="text-white font-medium text-sm">DP</span>
              </div>
              <span className="text-white font-medium ml-2 text-sm drop-shadow-md">
                @dangPhan
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

        {/* Right Action Bar - Light theme */}
        <div className="flex flex-col justify-end gap-5 ml-4 pb-4 h-[80vh]">
          {/* Like */}
          <div className="flex flex-col items-center gap-1 cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
              <ThumbsUp size={24} className="text-[#0f0f0f]" />
            </div>
            <span className="text-[#0f0f0f] text-sm font-medium">0</span>
          </div>

          {/* Dislike */}
          <div className="flex flex-col items-center gap-1 cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
              <ThumbsDown size={24} className="text-[#0f0f0f]" />
            </div>
            <span className="text-[#0f0f0f] text-sm font-medium">Dislike</span>
          </div>

          {/* Comment */}
          <div className="flex flex-col items-center gap-1 cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
              <MessageSquare size={24} className="text-[#0f0f0f]" />
            </div>
            <span className="text-[#0f0f0f] text-sm font-medium">0</span>
          </div>

          {/* Share */}
          <div className="flex flex-col items-center gap-1 cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
              <Share2 size={24} className="text-[#0f0f0f]" />
            </div>
            <span className="text-[#0f0f0f] text-sm font-medium">Share</span>
          </div>
          
          {/* Remix */}
          <div className="flex flex-col items-center gap-1 cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
              <Repeat size={24} className="text-[#0f0f0f]" />
            </div>
            <span className="text-[#0f0f0f] text-sm font-medium">Remix</span>
          </div>

          {/* More */}
          <div className="flex flex-col items-center gap-1 cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
              <MoreHorizontal size={24} className="text-[#0f0f0f]" />
            </div>
          </div>
        </div>
      </div>

      {/* Description Panel - Light theme */}
      <div className="w-[350px] bg-white rounded-xl flex flex-col h-[80vh] overflow-hidden ml-6 shadow-xl border border-gray-200 text-[#0f0f0f]">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0 bg-white">
          <span className="text-[#0f0f0f] font-bold text-lg">Description</span>
          <button className="text-[#0f0f0f] hover:bg-gray-100 rounded-full p-2 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto flex-1 text-[#0f0f0f] bg-white">
          <h2 className="font-bold text-xl mb-4 leading-tight">{title}</h2>
          
          <div className="bg-[#f2f2f2] rounded-xl p-3">
            <div className="flex items-center gap-3 text-sm text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
              <span>0 Likes</span>
              <span>0 Views</span>
              <span>Just now</span>
            </div>

            {content && (
              <div className="mt-4 text-sm text-[#0f0f0f] whitespace-pre-wrap leading-relaxed">
                {content}
              </div>
            )}

            {hashtags && (
              <div className="mt-4 text-sm whitespace-pre-wrap text-[#065fd4] font-medium">
                {hashtags}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
