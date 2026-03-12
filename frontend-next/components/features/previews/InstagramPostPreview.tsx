import React, { useState, useRef, useEffect } from 'react';
import { useWorkflowStore } from "@/store/workflowStore";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";

export function InstagramPostPreview() {
  const { parsedData } = useWorkflowStore();

  const content = parsedData?.content || "";
  const hashtags = parsedData?.hashtags || "";
  const images = parsedData?.media?.filter((m) => m.type === 'image') || [];

  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const width = scrollContainerRef.current.offsetWidth;
    const newSlide = Math.round(scrollLeft / width);
    if (newSlide !== currentSlide) {
      setCurrentSlide(newSlide);
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [currentSlide]);

  const renderMedia = () => {
    if (images.length === 0) return null;
    
    if (images.length === 1) {
      return (
        <div className="w-full aspect-square bg-gray-100 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={images[0].url} 
            alt="Instagram Post Media" 
            className="w-full h-full object-cover" 
          />
        </div>
      );
    }
    
    return (
      <div className="w-full aspect-square bg-gray-100 relative group overflow-hidden">
        <div 
          ref={scrollContainerRef}
          className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {images.map((img) => (
            <div key={img.id} className="w-full flex-none snap-center h-full relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={img.url} 
                alt="Instagram Post Media" 
                className="w-full h-full object-cover" 
              />
            </div>
          ))}
        </div>
        
        {/* Badge Indicator */}
        <div className="absolute top-4 right-4 bg-black/70 text-white text-xs px-2 py-1 rounded-full font-medium z-10">
          {currentSlide + 1}/{images.length}
        </div>

        {/* Carousel Dots */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1 z-10">
          {images.map((_, i) => (
            <div 
              key={i} 
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === currentSlide ? 'bg-blue-500' : 'bg-white/40'
              }`} 
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white max-w-[470px] w-full mx-auto overflow-hidden font-sans border border-gray-200">
      {/* Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-fuchsia-600 flex items-center justify-center p-[2px] shrink-0">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center border border-transparent">
              <span className="text-gray-900 font-bold text-[10px]">DP</span>
            </div>
          </div>
          <span className="text-[14px] font-semibold text-gray-900 ml-3">
            dangPhan
          </span>
        </div>
        <MoreHorizontal size={20} className="text-gray-900" />
      </div>

      {/* Media */}
      {renderMedia()}

      {/* Action Bar */}
      <div className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Heart size={24} className="text-gray-900 hover:text-gray-500 cursor-pointer" />
            <MessageCircle size={24} className="text-gray-900 hover:text-gray-500 cursor-pointer" style={{ transform: 'scaleX(-1)' }} />
            <Send size={24} className="text-gray-900 hover:text-gray-500 cursor-pointer -rotate-12 outline-none" />
          </div>
          <Bookmark size={24} className="text-gray-900 hover:text-gray-500 cursor-pointer" />
        </div>
        <div className="text-[14px] font-semibold text-gray-900 mt-2">
          0 likes
        </div>
      </div>

      {/* Caption & Footer */}
      <div className="px-3 pb-3">
        <div className="text-[14px] text-gray-900 leading-[18px] whitespace-pre-wrap">
          <span className="font-semibold mr-1">dangPhan</span>
          {content}
        </div>
        
        {hashtags && (
          <div className="mt-1 text-[14px] text-blue-900 leading-[18px]">
            {hashtags.split(/\s+/).filter(Boolean).map((tag, i) => (
              <span key={i} className="mr-1 break-words inline-block">
                {tag.startsWith('#') ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        )}

        <div className="text-[10px] text-gray-500 mt-2 tracking-wide uppercase font-medium">
          JUST NOW
        </div>
      </div>
    </div>
  );
}
