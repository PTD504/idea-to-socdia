import React from 'react';
import { useWorkflowStore } from "@/store/workflowStore";
import { Globe, ThumbsUp, MessageSquare, Share2 } from "lucide-react";

export function FacebookPostPreview() {
  const { parsedData } = useWorkflowStore();

  const content = parsedData?.content || "";
  const hashtags = parsedData?.hashtags || "";
  const images = parsedData?.media?.filter((m) => m.type === 'image') || [];

  const renderMediaGrid = () => {
    if (images.length === 0) return null;
    
    if (images.length === 1) {
      return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img 
          src={images[0].url} 
          alt="Post Media" 
          className="w-full h-auto max-h-[600px] object-cover" 
        />
      );
    }
    
    if (images.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-1 bg-white">
          {images.map((img) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              key={img.id} 
              src={img.url} 
              alt="Post Media" 
              className="w-full aspect-square object-cover" 
            />
          ))}
        </div>
      );
    }
    
    if (images.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-1 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={images[0].url} 
            alt="Post Media" 
            className="w-full h-64 object-cover col-span-2" 
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={images[1].url} 
            alt="Post Media" 
            className="w-full aspect-square object-cover" 
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={images[2].url} 
            alt="Post Media" 
            className="w-full aspect-square object-cover" 
          />
        </div>
      );
    }
    
    // 4 or more
    const displayImages = images.slice(0, 4);
    const extraCount = images.length - 4;
    return (
      <div className="grid grid-cols-2 gap-1 bg-white">
        {displayImages.map((img, i) => (
          <div key={img.id} className="relative w-full aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={img.url} 
              alt="Post Media" 
              className="w-full h-full object-cover" 
            />
            {i === 3 && extraCount > 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-3xl font-medium">+{extraCount}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.2)] max-w-[600px] w-full mx-auto overflow-hidden font-sans border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">DP</span>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900 text-[15px] leading-tight">
            dangPhan
          </span>
          <div className="flex items-center gap-1 text-gray-500 text-[13px] leading-tight mt-0.5">
            <span>Just now</span>
            <span>&middot;</span>
            <Globe size={12} className="text-gray-500 fill-current" />
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="px-3 pb-3">
        {content && (
          <div className="text-[15px] text-gray-900 leading-normal whitespace-pre-wrap">
            {content}
          </div>
        )}
        {hashtags && (
          <div className="mt-2 text-[15px]">
            {hashtags.split(/\s+/).filter(Boolean).map((tag, i) => (
              <span key={i} className="text-blue-600 cursor-pointer hover:underline mr-1 break-words inline-block">
                {tag.startsWith('#') ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Media Grid */}
      <div className="w-full">
        {renderMediaGrid()}
      </div>

      {/* Footer */}
      <div className="px-4 mt-2 mb-1">
        <div className="border-t border-gray-200" />
        <div className="flex items-center justify-between py-1 mt-1">
          <button className="flex items-center justify-center gap-2 flex-1 text-gray-500 font-semibold text-sm hover:bg-gray-100 py-2 rounded-md transition-colors">
            <ThumbsUp size={18} />
            <span>Like</span>
          </button>
          <button className="flex items-center justify-center gap-2 flex-1 text-gray-500 font-semibold text-sm hover:bg-gray-100 py-2 rounded-md transition-colors">
            <MessageSquare size={18} />
            <span>Comment</span>
          </button>
          <button className="flex items-center justify-center gap-2 flex-1 text-gray-500 font-semibold text-sm hover:bg-gray-100 py-2 rounded-md transition-colors">
            <Share2 size={18} />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}
