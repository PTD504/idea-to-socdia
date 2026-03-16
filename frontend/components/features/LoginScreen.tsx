"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { verifyAccess } from "@/lib/api";

type LoginScreenProps = {
    onAuthenticated: () => void;
};

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorMessage(null);
        setIsSubmitting(true);

        try {
            const authenticated = await verifyAccess(password);
            if (!authenticated) {
                setErrorMessage("Invalid password. Please try again.");
                return;
            }
            onAuthenticated();
        } catch {
            setErrorMessage("Unable to verify access right now. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100 font-sans">
            <div className="pointer-events-none absolute inset-0">
                <motion.div
                    className="absolute top-[-20%] left-[-10%] h-[60vw] w-[60vw] rounded-full bg-cyan-500/20 blur-[140px]"
                    animate={{ scale: [1, 1.15, 1], x: [0, 60, 0], y: [0, 40, 0] }}
                    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-[-25%] right-[-12%] h-[65vw] w-[65vw] rounded-full bg-indigo-500/20 blur-[160px]"
                    animate={{ scale: [1, 1.2, 1], x: [0, -70, 0], y: [0, -50, 0] }}
                    transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="w-full max-w-md rounded-3xl border border-slate-700/70 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-xl"
                >
                    <div className="mb-7">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                            Idea2Socdia Access
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Enter Password</h1>
                        <p className="mt-2 text-sm text-slate-400">
                            This demo is protected to prevent unauthorized generation costs.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="app-password" className="block text-sm font-medium text-slate-300">
                                Password
                            </label>
                            <input
                                id="app-password"
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="Enter access password"
                                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/40"
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        {errorMessage && (
                            <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                {errorMessage}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-slate-950 transition hover:from-cyan-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? "Verifying..." : "Unlock Workspace"}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
