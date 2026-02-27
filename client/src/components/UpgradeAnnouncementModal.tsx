import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Sparkles, Brain, Zap, TrendingUp, Rocket } from "lucide-react";

const STORAGE_KEY = "cryptomind_upgrade_v3.1_seen";

export default function UpgradeAnnouncementModal() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const hasSeen = localStorage.getItem(STORAGE_KEY);
        if (!hasSeen) {
            // Small delay so the page loads first, then the modal appears smoothly
            const timer = setTimeout(() => setOpen(true), 600);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem(STORAGE_KEY, "true");
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) handleDismiss();
        }}>
            <DialogContent className="sm:max-w-[480px] border-0 p-0 overflow-hidden bg-transparent shadow-2xl">
                {/* Main card with glassmorphism */}
                <div className="relative rounded-xl overflow-hidden">
                    {/* Animated gradient background */}
                    <div
                        className="absolute inset-0 animate-gradient opacity-90"
                        style={{
                            background: "linear-gradient(135deg, hsl(260 90% 15%) 0%, hsl(240 15% 8%) 40%, hsl(180 60% 12%) 70%, hsl(260 80% 20%) 100%)",
                            backgroundSize: "300% 300%",
                        }}
                    />

                    {/* Grid overlay */}
                    <div
                        className="absolute inset-0 opacity-[0.06]"
                        style={{
                            backgroundImage:
                                "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
                            backgroundSize: "24px 24px",
                        }}
                    />

                    {/* Glowing orbs */}
                    <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-purple-500/20 blur-3xl" />
                    <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-cyan-500/15 blur-3xl" />

                    {/* Content */}
                    <div className="relative z-10 px-7 pt-8 pb-7">
                        {/* Top badge */}
                        <div className="flex justify-center mb-5">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase"
                                style={{
                                    background: "linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(6,182,212,0.2) 100%)",
                                    border: "1px solid rgba(139,92,246,0.35)",
                                    color: "rgba(196,181,253,1)",
                                }}>
                                <Sparkles className="w-3.5 h-3.5" />
                                New Upgrade
                            </div>
                        </div>

                        {/* Rocket icon with glow */}
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-purple-500/30 blur-xl scale-150" />
                                <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                                    style={{
                                        background: "linear-gradient(135deg, hsl(260 85% 55%) 0%, hsl(200 80% 45%) 100%)",
                                        boxShadow: "0 0 30px rgba(139,92,246,0.4), 0 0 60px rgba(139,92,246,0.15)",
                                    }}>
                                    <Rocket className="w-8 h-8 text-white" style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.5))" }} />
                                </div>
                            </div>
                        </div>

                        <DialogHeader className="space-y-3 mb-6">
                            <DialogTitle className="text-center text-[22px] font-bold tracking-tight text-white">
                                CryptoMind AI Just Got Smarter
                            </DialogTitle>
                            <DialogDescription className="text-center text-sm leading-relaxed text-slate-300/90">
                                We've upgraded our prediction engine to <span className="font-semibold text-purple-300">Gemini 3.1 Pro</span> — Google's most advanced reasoning model. Expect sharper analysis, deeper market insights, and more confident trade signals.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Feature highlights */}
                        <div className="grid gap-3 mb-7">
                            <FeatureRow
                                icon={<Brain className="w-4 h-4" />}
                                title="Advanced Reasoning"
                                description="Deeper strategic thinking for complex market conditions"
                                accentColor="purple"
                            />
                            <FeatureRow
                                icon={<TrendingUp className="w-4 h-4" />}
                                title="Sharper Predictions"
                                description="More accurate entry, exit, and stop-loss targets"
                                accentColor="cyan"
                            />
                            <FeatureRow
                                icon={<Zap className="w-4 h-4" />}
                                title="Faster Processing"
                                description="Real-time analysis with streaming AI responses"
                                accentColor="amber"
                            />
                        </div>

                        <DialogFooter className="sm:justify-center">
                            <button
                                id="upgrade-modal-dismiss-btn"
                                onClick={handleDismiss}
                                className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                style={{
                                    background: "linear-gradient(135deg, hsl(260 85% 55%) 0%, hsl(200 80% 45%) 100%)",
                                    boxShadow: "0 4px 20px rgba(139,92,246,0.35), 0 0 40px rgba(139,92,246,0.1)",
                                }}
                            >
                                Let's Go 🚀
                            </button>
                        </DialogFooter>

                        <p className="text-center text-[11px] text-slate-500 mt-4">
                            Your predictions are now powered by Gemini 3.1 Pro
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function FeatureRow({
    icon,
    title,
    description,
    accentColor,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    accentColor: "purple" | "cyan" | "amber";
}) {
    const colors = {
        purple: {
            bg: "rgba(139,92,246,0.12)",
            border: "rgba(139,92,246,0.2)",
            icon: "rgba(196,181,253,1)",
        },
        cyan: {
            bg: "rgba(6,182,212,0.12)",
            border: "rgba(6,182,212,0.2)",
            icon: "rgba(103,232,249,1)",
        },
        amber: {
            bg: "rgba(245,158,11,0.12)",
            border: "rgba(245,158,11,0.2)",
            icon: "rgba(253,224,71,1)",
        },
    };

    const c = colors[accentColor];

    return (
        <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.01]"
            style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
            }}
        >
            <div
                className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: c.bg, color: c.icon }}
            >
                {icon}
            </div>
            <div>
                <p className="text-sm font-semibold text-white/90">{title}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
            </div>
        </div>
    );
}
