import React from 'react';
import { useWorkflowStore } from "@/store/workflowStore";
import { ThumbsUp, ThumbsDown, MessageSquare, Share2, MoreVertical } from "lucide-react";

export function YouTubePostPreview() {
  const { parsedData } = useWorkflowStore();

  const content = parsedData?.content || "";
  const hashtags = parsedData?.hashtags || "";
  const images = parsedData?.media?.filter((m) => m.type === 'image') || [];
  const firstImage = images.length > 0 ? images[0] : null;

  return (
    <div className="bg-white rounded-xl max-w-[600px] w-full mx-auto overflow-hidden font-sans border border-gray-200">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center shrink-0">
            <span className="text-white font-medium text-lg">DP</span>
          </div>
          <div className="ml-3 flex flex-col">
            <div className="flex items-center flex-wrap">
              <span className="text-[15px] font-medium text-[#0f0f0f]">
                dangPhan
              </span>
              <span className="text-[13px] text-gray-500 ml-1">
                &middot; Just now
              </span>
            </div>
          </div>
        </div>
        <button className="text-[#0f0f0f] hover:bg-gray-100 p-2 rounded-full transition-colors flex-shrink-0">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Text Content */}
      <div className="px-4 pb-2">
        {content && (
          <div className="text-[15px] text-[#0f0f0f] leading-relaxed whitespace-pre-wrap flex-grow">
            {content}
          </div>
        )}
        {hashtags && (
          <div className="mt-1 text-[15px] leading-relaxed">
            {hashtags.split(/\s+/).filter(Boolean).map((tag, i) => (
              <span key={i} className="text-[#065fd4] cursor-pointer mr-1 break-words inline-block">
                {tag.startsWith('#') ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Media Section */}
      {firstImage && (
        <div className="px-4 pb-4">
          <div className="w-full relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={firstImage.url} 
              alt="Community Post Media" 
              className="w-full rounded-lg object-cover border border-gray-100 max-h-[600px]" 
            />
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="px-4 pb-4 flex flex-wrap items-center gap-4 text-[#0f0f0f]">
        {/* Thumbs Group */}
        <div className="flex items-center bg-gray-100 rounded-full">
          <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-200 cursor-pointer rounded-l-full transition-colors">
            <ThumbsUp size={18} />
            <span className="text-[14px] font-medium">0</span>
          </button>
          <div className="w-[1px] h-4 bg-gray-300" />
          <button className="px-3 py-1.5 hover:bg-gray-200 cursor-pointer rounded-r-full transition-colors">
            <ThumbsDown size={18} />
          </button>
        </div>

        {/* Share Button */}
        <button className="flex items-center gap-2 hover:bg-gray-100 px-3 py-1.5 rounded-full font-medium text-[14px] transition-colors">
          <Share2 size={18} />
          <span>Share</span>
        </button>

        {/* Comment Button */}
        <button className="flex items-center gap-2 hover:bg-gray-100 px-3 py-1.5 rounded-full font-medium text-[14px] transition-colors">
          <MessageSquare size={18} />
          <span>0</span>
        </button>
      </div>
    </div>
  );
}
