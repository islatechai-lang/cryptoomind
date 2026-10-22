import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { purchaseCredits } from "@/lib/whop-payment";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experienceId?: string;
  companyId?: string;
  currentPlan?: "free" | "starter" | "pro";
}

export const STARTER_PLAN_ID = "plan_ZLLdnJssCPIpY";
export const PRO_PLAN_ID = "plan_mndBT74OUdiNB";

export function UpgradeModal({
  open,
  onOpenChange,
  experienceId,
  companyId,
  currentPlan = "free",
}: UpgradeModalProps) {
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<"starter" | "pro" | null>(null);

  const handleSelectPlan = async (planType: "starter" | "pro", planId: string) => {
    try {
      setLoadingPlan(planType);
      const success = await purchaseCredits({
        planId,
        planType,
        experienceId,
        companyId,
      });

      if (success) {
        queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        toast({
          title: planType === "pro" ? "Checkout opened!" : "Checkout opened!",
          description:
            planType === "pro"
              ? "Complete your checkout to activate your 3-day free trial of Pro!"
              : "Complete your checkout to activate your Starter Plan with 20 monthly predictions!",
        });
        onOpenChange(false);
      }
    } catch (err) {
      console.error("[UpgradeModal] Purchase error:", err);
      toast({
        title: "Checkout Notice",
        description: "Opening Whop checkout page...",
      });
      window.open(`https://whop.com/checkout/${planId}`, "_blank");
      onOpenChange(false);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[calc(100%-1.5rem)] max-w-4xl max-h-[92vh] overflow-y-auto
          p-5 sm:p-7 rounded-2xl border border-border bg-card text-card-foreground shadow-2xl
        "
        data-testid="modal-upgrade"
      >
        {/* Centered Header across all screen sizes */}
        <DialogHeader className="flex flex-col items-center justify-center text-center sm:text-center space-y-2 mb-2 w-full">
          <div className="flex justify-center w-full">
            <Badge
              variant="outline"
              className="gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border-primary/30 bg-primary/10 text-primary mx-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Upgrade Your Intelligence
            </Badge>
          </div>
          <DialogTitle className="text-center sm:text-center text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground w-full">
            Choose Your CryptoMind Plan
          </DialogTitle>
          <DialogDescription className="text-center sm:text-center text-sm text-muted-foreground max-w-lg mx-auto w-full">
            Supercharge your market edge with Google's most advanced reasoning AI model,{" "}
            <span className="font-semibold text-foreground">Gemini 3.8 Flash</span>.
          </DialogDescription>
        </DialogHeader>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-4 pt-3">
          {/* 1. FREE PLAN - order-1 on both mobile and desktop */}
          <div
            className="
              order-1 md:order-1
              relative flex flex-col justify-between p-5 rounded-xl border border-border/70 bg-card
              hover:border-border transition-colors
            "
            data-testid="plan-free"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-base font-bold text-foreground">Free</span>
                <Badge variant="secondary" className="text-[11px] font-medium">
                  Starter
                </Badge>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-foreground">$0</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Free forever</p>
              </div>

              <div className="border-t border-border/50 pt-4 mb-5">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2.5">
                  Includes:
                </p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span>1 complimentary crypto analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/90 font-medium">
                      Standard Google Gemini 3.1 model
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Standard technical indicators (RSI, MACD)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Basic market trend bias detection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Interactive web chat access</span>
                  </li>
                </ul>
              </div>
            </div>

            <Button
              variant="outline"
              disabled
              className="w-full text-xs font-semibold text-muted-foreground cursor-default border-border/80"
              data-testid="button-plan-free"
            >
              Current
            </Button>
          </div>

          {/* 2. STARTER PLAN ($10 / month) - order-3 on mobile (bottom), order-2 on desktop (middle) */}
          <div
            className="
              order-3 md:order-2
              relative flex flex-col justify-between p-5 rounded-xl border border-border/90 bg-card
              hover:border-primary/50 transition-colors shadow-xs
            "
            data-testid="plan-starter"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-base font-bold text-foreground">Starter</span>
                <Badge
                  variant="outline"
                  className="text-[11px] font-medium border-border text-foreground"
                >
                  Monthly
                </Badge>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-foreground">$10</span>
                  <span className="text-xs text-muted-foreground font-medium">/ month</span>
                </div>
                <p className="text-xs text-primary font-semibold mt-0.5">
                  20 analyses every month
                </p>
              </div>

              <div className="border-t border-border/50 pt-4 mb-5">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2.5">
                  Everything in Free, plus:
                </p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/90 font-medium">20 AI market analyses / month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-primary font-semibold">
                      Google Gemini 3.8 Flash (Advanced Reasoning)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Multi-timeframe trend alignment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Precise Entry, Target & Stop levels</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Standard response processing</span>
                  </li>
                </ul>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => handleSelectPlan("starter", STARTER_PLAN_ID)}
              disabled={loadingPlan !== null}
              className="w-full text-xs font-semibold gap-1.5 border-border hover:bg-muted"
              data-testid="button-plan-starter"
            >
              {loadingPlan === "starter" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Opening Checkout...</span>
                </>
              ) : (
                <>
                  <span>Choose Starter</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>

          {/* 3. PRO PLAN ($5 / week, 3-day trial) - order-2 on mobile (IN THE MIDDLE), order-3 on desktop */}
          <div
            className="
              order-2 md:order-3
              relative flex flex-col justify-between p-5 rounded-xl
              border-2 border-primary bg-primary/5 dark:bg-primary/[0.07]
              shadow-md
            "
            data-testid="plan-pro"
          >
            {/* Top Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground shadow-xs">
                <Zap className="w-3 h-3 fill-current" />
                3-Day Free Trial • Most Popular
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-3 mt-1">
                <span className="text-base font-bold text-foreground">Pro</span>
                <Badge
                  variant="default"
                  className="text-[11px] font-semibold bg-primary text-primary-foreground"
                >
                  Best Value
                </Badge>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-foreground">$5</span>
                  <span className="text-xs text-muted-foreground font-medium">/ week</span>
                </div>
                <p className="text-xs text-primary font-semibold mt-0.5">
                  10 analyses every week • 3-Day Free Trial
                </p>
              </div>

              <div className="border-t border-primary/20 pt-4 mb-5">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2.5">
                  Pro Power Features:
                </p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground font-semibold">
                      3-Day Free Trial included (cancel anytime)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/90 font-medium">10 high-conviction analyses / week</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-primary font-bold">
                      Google Gemini 3.8 Flash (Deep Reasoning)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Real-time AI thinking process stream</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Dynamic duration targets (Scalp, Day, Swing)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Priority speed & 24/7 market monitoring</span>
                  </li>
                </ul>
              </div>
            </div>

            <Button
              variant="default"
              onClick={() => handleSelectPlan("pro", PRO_PLAN_ID)}
              disabled={loadingPlan !== null}
              className="w-full text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              data-testid="button-plan-pro"
            >
              {loadingPlan === "pro" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Opening Checkout...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Start 3-Day Free Trial</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="flex items-center justify-center gap-1.5 pt-3 text-center text-[11px] text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Secure checkout via Whop • Cancel anytime in your Whop dashboard with 1 click</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
