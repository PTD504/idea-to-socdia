import React from 'react';
import { useWorkflowStore } from "@/store/workflowStore";
import { ThumbsUp, ThumbsDown, Share2, Download, MoreHorizontal, Bell } from "lucide-react";
import { useRef, useEffect } from 'react';

export function YouTubeVideoPreview() {
  const { parsedData, finalVideoUrl, currentStage } = useWorkflowStore();

  const title = parsedData?.title || "Untitled Video";
  const content = parsedData?.content || "";
  const hashtags = parsedData?.hashtags || "";
  
  // Use the merged final video, or fallback to the first video in media, or null
  const fallbackVideo = parsedData?.media?.find(m => m.type === 'video')?.url || null;
  const videoSrc = finalVideoUrl || fallbackVideo;

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [videoSrc]);

  return (
    <div className="bg-white w-full max-w-5xl mx-auto rounded-xl shadow-sm border border-gray-200 overflow-hidden font-sans">
      <div className="p-4 sm:p-6">
        {/* Main Video Player */}
        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden relative flex items-center justify-center shadow-md">
          {videoSrc ? (
            <video
              ref={videoRef}
              key={`${currentStage}-${videoSrc}`}
              src={videoSrc}
              controls={true}
              autoPlay={true}
              playsInline={true}
              disablePictureInPicture
              className="w-full h-full object-contain relative z-0"
            />
          ) : (
            <div className="text-gray-500 font-medium">
              No Video Source
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-[#0f0f0f] mt-4 line-clamp-2 leading-tight">
          {title}
        </h1>

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 gap-4">
          
          {/* Left Side: Channel Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center shrink-0">
              <span className="text-white font-medium text-lg">DP</span>
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-semibold text-[15px] text-[#0f0f0f] leading-tight">
                dangPhan
              </span>
              <span className="text-xs text-gray-500 mt-0.5">
                1.2T subscribers
              </span>
            </div>
            
            <button className="bg-[#0f0f0f] text-white px-4 py-2 rounded-full font-medium text-sm ml-4 hover:bg-gray-800 transition-colors flex items-center gap-2">
              <Bell size={16} className="fill-white" />
              Subscribed
            </button>
          </div>

          {/* Right Side: Action Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto scrollbar-hide">
            {/* Like/Dislike Pill */}
            <div className="flex items-center bg-[#f2f2f2] rounded-full shrink-0">
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-[#e5e5e5] rounded-l-full font-medium text-sm text-[#0f0f0f] transition-colors">
                <ThumbsUp size={20} />
                <span>0</span>
              </button>
              <div className="w-[1px] h-6 bg-gray-300" />
              <button className="px-3 py-2 hover:bg-[#e5e5e5] rounded-r-full transition-colors text-[#0f0f0f]">
                <ThumbsDown size={20} />
              </button>
            </div>

            {/* Share */}
            <button className="flex items-center gap-2 bg-[#f2f2f2] hover:bg-[#e5e5e5] px-4 py-2 rounded-full font-medium text-sm text-[#0f0f0f] transition-colors shrink-0">
              <Share2 size={20} className="fill-transparent" />
              <span>Share</span>
            </button>

            {/* Download */}
            <button className="hidden sm:flex items-center gap-2 bg-[#f2f2f2] hover:bg-[#e5e5e5] px-4 py-2 rounded-full font-medium text-sm text-[#0f0f0f] transition-colors shrink-0">
              <Download size={20} />
              <span>Download</span>
            </button>

            {/* Save / More */}
            <button className="flex items-center justify-center bg-[#f2f2f2] hover:bg-[#e5e5e5] w-9 h-9 rounded-full transition-colors shrink-0 text-[#0f0f0f]">
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>

        {/* Description Box */}
        <div className="bg-[#f2f2f2] hover:bg-[#e5e5e5] transition-colors rounded-xl p-3 mt-4 text-sm text-[#0f0f0f]">
          <div className="font-semibold text-[14px]">
            <span>0 views  &middot;  Just now</span>
          </div>
          
          {content && (
            <div className="mt-2 whitespace-pre-wrap leading-relaxed font-sans">
              {content}
            </div>
          )}

          {hashtags && (
            <div className="mt-3 whitespace-pre-wrap text-[#065fd4] font-medium">
              {hashtags}
            </div>
          )}
          
          <div className="mt-4 font-medium text-xs text-gray-500">
            Show less
          </div>
        </div>
        
      </div>
    </div>
  );
}
