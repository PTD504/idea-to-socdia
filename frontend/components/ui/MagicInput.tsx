import * as React from "react";
import { cn } from "@/lib/utils";

export interface MagicInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

const MagicInput = React.forwardRef<HTMLInputElement, MagicInputProps>(
    ({ className, error, ...props }, ref) => {
        return (
            <div className="relative group w-full">
                {/* Animated gradient border on focus */}
                <div className={cn(
                    "absolute -inset-0.5 rounded-xl bg-gradient-accent opacity-0 group-focus-within:opacity-100 transition duration-500 blur-sm",
                    error && "bg-red-500 opacity-50"
                )}></div>

                <input
                    className={cn(
                        "relative flex w-full rounded-xl border border-soft-gray/20 bg-glass-white px-4 py-3 text-sm text-deep-black shadow-sm transition-all outline-none",
                        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                        "placeholder:text-soft-gray focus-visible:ring-1 focus-visible:ring-soft-gray/30",
                        "disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-md",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
            </div>
        );
    }
);
MagicInput.displayName = "MagicInput";

export { MagicInput };
