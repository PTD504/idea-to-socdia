"use client";

import { useState, useRef, useEffect } from "react";
import { ALL_STYLES, POPULAR_STYLES } from "@/lib/constants/styles";
import { ChevronDown } from "lucide-react";

interface StyleDropdownProps {
    selectedStyle: string;
    onSelectStyle: (style: string) => void;
    themeColor: string;
}

// Custom dropdown that replaces the native <select> element for premium styling
export function StyleDropdown({ selectedStyle, onSelectStyle, themeColor }: StyleDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter out popular styles that already appear as pill buttons
    const dropdownStyles = ALL_STYLES.filter((s) => !POPULAR_STYLES.includes(s));

    // Determine display label for the trigger button
    const isDropdownSelection = selectedStyle && !POPULAR_STYLES.includes(selectedStyle);
    const displayLabel = isDropdownSelection ? selectedStyle : "More Styles...";

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className={`bg-white/80 backdrop-blur-md border border-gray-200 text-gray-800 text-sm rounded-xl block w-full p-2.5 pr-10 cursor-pointer shadow-sm transition-all focus:outline-none text-left ${isDropdownSelection ? 'ring-2 border-transparent' : ''}`}
                style={isDropdownSelection ? { borderColor: themeColor, boxShadow: `0 0 0 2px ${themeColor}40` } : undefined}
            >
                {displayLabel}
            </button>

            {/* Chevron icon */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <ul className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar py-1">
                    {dropdownStyles.map((style) => (
                        <li
                            key={style}
                            onClick={() => {
                                onSelectStyle(style);
                                setIsOpen(false);
                            }}
                            className={`px-4 py-2.5 cursor-pointer text-sm transition-colors ${selectedStyle === style ? 'font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
                            style={selectedStyle === style ? { backgroundColor: `${themeColor}15`, color: themeColor } : undefined}
                        >
                            {style}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
