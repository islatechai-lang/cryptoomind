import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  cryptoPairs,
  forexPairs,
  type TradingPair
} from "@shared/schema";
import {
  Search,
  X,
  Plus,
  Loader2,
  Sparkles,
  TrendingUp,
  DollarSign,
  Layers,
  Trash2
} from "lucide-react";

interface PairSelectorProps {
  onSelectPair: (pair: TradingPair) => void;
  selectedPair?: TradingPair;
}

const CUSTOM_PAIRS_STORAGE_KEY = "cryptomind_custom_pairs_v1";

const PAIR_LABELS: Record<string, string> = {
  "XAU/USD": "Gold",
  "XAG/USD": "Silver",
  "XPT/USD": "Platinum",
  "XPD/USD": "Palladium",
  "BTC/USDT": "Bitcoin",
  "ETH/USDT": "Ethereum",
  "SOL/USDT": "Solana",
  "XRP/USDT": "Ripple",
  "DOGE/USDT": "Dogecoin",
  "SUI/USDT": "Sui",
  "NEAR/USDT": "Near",
  "PEPE/USDT": "Pepe",
  "SHIB/USDT": "Shiba",
  "TAO/USDT": "Bittensor",
  "RENDER/USDT": "Render",
  "FET/USDT": "ASI Alliance",
  "EUR/USD": "Euro",
  "GBP/USD": "Pound",
  "USD/JPY": "Yen",
  "AUD/USD": "Aussie",
  "USD/CAD": "Loonie",
  "USD/CHF": "Swiss",
};

export function PairSelector({ onSelectPair, selectedPair }: PairSelectorProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"all" | "crypto" | "forex" | "custom">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customPairs, setCustomPairs] = useState<string[]>([]);
  const [customInputOpen, setCustomInputOpen] = useState(false);
  const [customPairText, setCustomPairText] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  // Load saved custom pairs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_PAIRS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCustomPairs(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to load custom pairs from localStorage:", e);
    }
  }, []);

  const saveCustomPairs = (newPairs: string[]) => {
    setCustomPairs(newPairs);
    try {
      localStorage.setItem(CUSTOM_PAIRS_STORAGE_KEY, JSON.stringify(newPairs));
    } catch (e) {
      console.warn("Failed to save custom pairs to localStorage:", e);
    }
  };

  const handleAddCustomPair = async (pairToAdd?: string) => {
    const raw = (pairToAdd || customPairText).trim();
    if (!raw) return;

    setIsValidating(true);
    try {
      const res = await fetch("/api/market/validate-pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pair: raw }),
      });

      const data = await res.json();

      if (data.valid && data.pair) {
        const normalized = data.pair;
        if (!customPairs.includes(normalized)) {
          const updated = [...customPairs, normalized];
          saveCustomPairs(updated);
        }

        toast({
          title: "Pair Verified & Selected",
          description: `Added ${normalized}${data.currentPrice ? ` (Live: $${data.currentPrice.toLocaleString()})` : ""} to your pairs!`,
        });

        onSelectPair(normalized as TradingPair);
        setCustomPairText("");
        setCustomInputOpen(false);
        setSearchQuery("");
      } else {
        toast({
          title: "Pair Not Found",
          description: data.error || `Could not find live market data for "${raw}". Please check the symbol and try again.`,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Validation Error",
        description: err.message || "Failed to verify market data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCustomPair = (pairToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customPairs.filter((p) => p !== pairToRemove);
    saveCustomPairs(updated);
    toast({
      title: "Custom Pair Removed",
      description: `${pairToRemove} was removed from your custom list.`,
    });
  };

  // Filter pairs based on search and active tab
  const filterList = (pairs: readonly string[]) => {
    if (!searchQuery.trim()) return pairs;
    const q = searchQuery.toLowerCase().trim();
    return pairs.filter((pair) => {
      const label = PAIR_LABELS[pair]?.toLowerCase() || "";
      return pair.toLowerCase().includes(q) || label.includes(q);
    });
  };

  const filteredCrypto = useMemo(() => filterList(cryptoPairs), [searchQuery]);
  const filteredForex = useMemo(() => filterList(forexPairs), [searchQuery]);
  const filteredCustom = useMemo(() => filterList(customPairs), [searchQuery, customPairs]);

  const hasAnyResults = filteredCrypto.length > 0 || filteredForex.length > 0 || filteredCustom.length > 0;

  return (
    <div
      className="space-y-4 md:space-y-5 p-4 md:p-5 rounded-2xl bg-card border border-border/80 shadow-md backdrop-blur-md"
      data-testid="pair-selector"
    >
      {/* Header with Search and Category Pills */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Select Market Pair</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Choose from popular crypto, forex & precious metals, or add any custom pair
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                activeTab === "all"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("crypto")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                activeTab === "crypto"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Crypto
            </button>
            <button
              onClick={() => setActiveTab("forex")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                activeTab === "forex"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Forex & Metals
            </button>
            {customPairs.length > 0 && (
              <button
                onClick={() => setActiveTab("custom")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                  activeTab === "custom"
                    ? "bg-card text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Custom</span>
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.2 rounded-full font-bold">
                  {customPairs.length}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Live Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pair (e.g. BTC, SOL, GOLD, EUR, PEPE, SUI)..."
            className="pl-9 pr-9 h-9 text-xs md:text-sm bg-background/50 border-border/80 focus-visible:ring-primary/40 rounded-xl"
            data-testid="input-search-pairs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* No Search Results - Prompt to add as Custom Pair */}
      {!hasAnyResults && searchQuery.trim() && (
        <div className="p-4 rounded-xl border border-dashed border-border bg-muted/20 text-center space-y-3">
          <p className="text-xs text-muted-foreground">
            No matching pairs found for <span className="font-semibold text-foreground">"{searchQuery}"</span>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <Button
              size="sm"
              onClick={() => handleAddCustomPair(searchQuery)}
              disabled={isValidating}
              className="text-xs gap-1.5 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Validating market data...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add & Select "{searchQuery.toUpperCase()}"</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Pair Groups */}
      <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
        {/* CUSTOM PAIRS SECTION */}
        {(activeTab === "all" || activeTab === "custom") && filteredCustom.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground/80 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>Your Custom Pairs</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                {filteredCustom.length}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredCustom.map((pair) => (
                <div key={pair} className="relative group">
                  <Button
                    variant={selectedPair === pair ? "default" : "outline"}
                    size="sm"
                    onClick={() => onSelectPair(pair as TradingPair)}
                    className="text-xs pr-6 font-semibold"
                    data-testid={`button-pair-custom-${pair.replace('/', '-')}`}
                  >
                    <span>{pair}</span>
                  </Button>
                  <button
                    onClick={(e) => handleRemoveCustomPair(pair, e)}
                    title="Remove custom pair"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive opacity-70 hover:opacity-100 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CRYPTO SECTION */}
        {(activeTab === "all" || activeTab === "crypto") && filteredCrypto.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground/80 uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span>Cryptocurrency</span>
              <span className="text-[11px] text-muted-foreground font-normal lowercase">
                ({filteredCrypto.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredCrypto.map((pair) => {
                const label = PAIR_LABELS[pair];
                const isSelected = selectedPair === pair;
                return (
                  <Button
                    key={pair}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => onSelectPair(pair)}
                    className="text-xs md:text-sm font-medium gap-1.5 hover-elevate transition-all"
                    data-testid={`button-pair-${pair.replace('/', '-')}`}
                  >
                    <span>{pair}</span>
                    {label && !isSelected && (
                      <span className="text-[10px] opacity-60 hidden sm:inline">
                        {label}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* FOREX & METALS SECTION */}
        {(activeTab === "all" || activeTab === "forex") && filteredForex.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground/80 uppercase tracking-wider">
              <DollarSign className="w-3.5 h-3.5 text-primary" />
              <span>Forex & Precious Metals</span>
              <span className="text-[11px] text-muted-foreground font-normal lowercase">
                ({filteredForex.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredForex.map((pair) => {
                const label = PAIR_LABELS[pair];
                const isSelected = selectedPair === pair;
                const isMetal = pair.startsWith("XAU") || pair.startsWith("XAG") || pair.startsWith("XPT") || pair.startsWith("XPD");

                return (
                  <Button
                    key={pair}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => onSelectPair(pair)}
                    className={`text-xs md:text-sm font-medium gap-1.5 hover-elevate transition-all ${
                      isMetal && !isSelected ? "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 dark:border-amber-400/30" : ""
                    }`}
                    data-testid={`button-pair-${pair.replace('/', '-')}`}
                  >
                    <span>{pair}</span>
                    {label && (
                      <Badge
                        variant="secondary"
                        className={`text-[9px] px-1.5 py-0 rounded-sm font-semibold ${
                          isSelected
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : isMetal
                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                            : ""
                        }`}
                      >
                        {label}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* "Don't see your pair?" Footer Callout with Inline Add Form */}
      <div className="pt-2 border-t border-border/50">
        {!customInputOpen ? (
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Don't see the pair you're looking for?</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCustomInputOpen(true)}
              className="text-xs text-primary font-semibold hover:text-primary/80 gap-1 h-7 px-2"
              data-testid="button-open-custom-pair"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Pair</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-2 p-3 rounded-xl bg-muted/40 border border-border/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Add Custom Trading Pair
              </span>
              <button
                onClick={() => setCustomInputOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Enter any crypto or forex pair (e.g. <span className="font-mono text-foreground font-medium">INJ/USDT</span>, <span className="font-mono text-foreground font-medium">KAS/USDT</span>, <span className="font-mono text-foreground font-medium">EUR/CHF</span>). We verify live market data automatically.
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={customPairText}
                onChange={(e) => setCustomPairText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isValidating) {
                    handleAddCustomPair();
                  }
                }}
                placeholder="e.g. INJ/USDT or KAS"
                className="h-8 text-xs bg-background"
                autoFocus
                data-testid="input-custom-pair"
              />
              <Button
                size="sm"
                onClick={() => handleAddCustomPair()}
                disabled={isValidating || !customPairText.trim()}
                className="h-8 text-xs gap-1 font-semibold whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-submit-custom-pair"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3" />
                    <span>Verify & Add</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
