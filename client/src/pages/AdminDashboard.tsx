import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DollarSign, TrendingUp, History, Info, Wallet, Sparkles, User } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { useState } from "react";

interface AdminBalance {
  adminUserId: string;
  balance: number;
  paymentCount: number;
}

interface CommissionPayment {
  id: string;
  paymentId: string;
  adminUserId: string;
  amount: number;
  commissionAmount: number;
  customerUserId: string | null;
  customerEmail: string | null;
  createdAt: string;
}

interface WhopUser {
  id: string;
  username: string;
  name: string;
  profile_pic_url?: string | null;
}

interface Membership {
  id: string;
  status: "trialing" | "active" | "past_due" | "completed" | "canceled" | "expired" | "unresolved" | "drafted";
  created_at: string;
  updated_at: string;
  renewal_period_start: string | null;
  renewal_period_end: string | null;
  cancel_at_period_end: boolean;
  cancellation_reason?: string | null;
  canceled_at?: string | null;
  user: {
    id: string;
    username: string;
    name: string | null;
    profile_pic_url?: string | null;
  } | null;
  product: {
    id: string;
    title: string;
  };
  plan: {
    id: string;
  };
}

interface MembershipsResponse {
  data: Membership[];
  page_info: {
    has_next_page: boolean;
    has_previous_page: boolean;
  };
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const { data: user } = useQuery<WhopUser | null>({
    queryKey: ["/api/auth/me"],
  });

  const { data: balance, isLoading: balanceLoading } = useQuery<AdminBalance>({
    queryKey: ["/api/admin/balance"],
  });

  const { data: commissions, isLoading: commissionsLoading } = useQuery<CommissionPayment[]>({
    queryKey: ["/api/admin/commissions"],
  });

  const { data: memberships, isLoading: membershipsLoading } = useQuery<MembershipsResponse>({
    queryKey: ["/api/admin/memberships"],
    retry: false,
    meta: {
      onError: () => {
        // Silently fail - memberships feature is optional
      }
    }
  });


  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!amount || amount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      if (!balance?.balance || amount > balance.balance) {
        throw new Error("Insufficient balance");
      }

      const response = await apiRequest("POST", "/api/admin/withdraw", {
        amount
      });
      return await response.json();
    },
    onSuccess: (data: { success: boolean; message?: string }) => {
      toast({
        title: "Request Received!",
        description: data.message || "Your withdrawal request has been received. Funds will be sent to you shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/balance"] });
      setWithdrawDialogOpen(false);
      setWithdrawAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Failed to process withdrawal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleWithdraw = () => {
    const amountInDollars = parseFloat(withdrawAmount);
    if (isNaN(amountInDollars) || amountInDollars <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than $0",
        variant: "destructive",
      });
      return;
    }

    const amountInCents = Math.round(amountInDollars * 100);
    withdrawMutation.mutate(amountInCents);
  };

  const formatCurrency = (amountInCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amountInCents / 100);
  };

  const initials = user?.name
    ? user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "A";

  const getStatusCategory = (membership: Membership): {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    description: string;
  } => {
    // Active or Trialing
    if (membership.status === "active" || membership.status === "trialing") {
      if (membership.cancel_at_period_end) {
        return {
          label: "Ending Soon",
          variant: "outline",
          description: "Subscription will end at period close"
        };
      }
      return {
        label: membership.status === "trialing" ? "Trial Active" : "Active",
        variant: "default",
        description: membership.renewal_period_end
          ? "Subscription renewing"
          : "One-time purchase"
      };
    }

    // At Risk
    if (membership.status === "past_due" || membership.status === "unresolved") {
      return {
        label: "At Risk",
        variant: "destructive",
        description: membership.status === "past_due"
          ? "Payment overdue"
          : "Payment issue"
      };
    }

    // Closed statuses
    if (membership.status === "canceled" || membership.status === "expired") {
      return {
        label: membership.status === "canceled" ? "Canceled" : "Expired",
        variant: "outline",
        description: "Subscription ended"
      };
    }

    // Completed (one-time purchase)
    if (membership.status === "completed") {
      return {
        label: "Completed",
        variant: "secondary",
        description: membership.renewal_period_end
          ? "Active subscription"
          : "One-time access granted"
      };
    }

    // Default
    return {
      label: membership.status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
      variant: "secondary",
      description: ""
    };
  };


  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground" data-testid="admin-dashboard">
      <header className="relative border-b border-border bg-card/80 backdrop-blur-xl shadow-xs">
        <div className="flex items-center justify-between gap-2 md:gap-4 px-3 md:px-6 lg:px-8 py-3 md:py-4 w-full">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0 ring-2 ring-primary/20" data-testid="avatar-admin">
              {user?.profile_pic_url && (
                <AvatarImage
                  src={user.profile_pic_url}
                  alt={user.name || "Admin"}
                  crossOrigin="anonymous"
                />
              )}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <h2 className="text-xs md:text-base font-bold truncate text-foreground" data-testid="text-admin-name">
                {user?.name || "Admin Dashboard"}
              </h2>
              <p className="text-xs text-muted-foreground truncate hidden sm:block">
                Commission Earnings Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <Link href="/">
              <Button
                variant="default"
                size="sm"
                className="gap-1.5 font-medium shadow-xs bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="link-act-as-member"
              >
                <User className="w-3.5 h-3.5" />
                <span>Act as a Member</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 md:px-6 lg:px-8 py-4 md:py-8">
        <div className="space-y-4 md:space-y-8 max-w-7xl mx-auto">
          <div className="grid gap-4 md:gap-6 md:grid-cols-2">
            <Card data-testid="card-balance" className="relative overflow-hidden bg-card border-border shadow-xs">
              <CardHeader className="relative flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <div className="flex-1">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Balance</CardTitle>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                {balanceLoading ? (
                  <Skeleton className="h-10 w-32" />
                ) : (
                  <>
                    <div className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight" data-testid="text-balance">
                      {formatCurrency(balance?.balance || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 font-medium">
                      {balance?.paymentCount || 0} commission{(balance?.paymentCount || 0) !== 1 ? 's' : ''} earned
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-card border-border shadow-xs">
              <CardHeader className="relative flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <div className="flex-1">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Withdraw Funds</CardTitle>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <p className="text-sm text-muted-foreground mb-4">
                  Request a withdrawal from your available balance
                </p>
                <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      data-testid="button-withdraw"
                      disabled={!balance?.balance || balance.balance <= 0}
                      className="w-full font-semibold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90"
                      size="default"
                    >
                      Withdraw
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="dialog-withdraw" className="sm:max-w-md bg-card text-card-foreground border-border">
                    <DialogHeader className="space-y-3">
                      <div className="flex items-center gap-2">
                        <DialogTitle className="text-xl font-bold text-foreground">Request Withdrawal</DialogTitle>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-popover text-popover-foreground border-border">
                            <p className="text-xs">Instant withdrawal is not currently available.<br />Requests are processed manually.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <DialogDescription className="text-sm text-muted-foreground">
                        Enter the amount you'd like to withdraw.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4 pb-2">
                      <div className="space-y-3">
                        <Label htmlFor="amount" className="text-sm font-medium text-foreground">
                          Amount (USD)
                        </Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          min="0.01"
                          max={(balance?.balance || 0) / 100}
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          data-testid="input-withdraw-amount"
                          className="text-base h-11 bg-background text-foreground border-border"
                        />
                        <p className="text-xs text-muted-foreground font-medium">
                          Available balance: {formatCurrency(balance?.balance || 0)}
                        </p>
                      </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setWithdrawDialogOpen(false);
                          setWithdrawAmount("");
                        }}
                        data-testid="button-cancel-withdraw"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleWithdraw}
                        disabled={withdrawMutation.isPending || !withdrawAmount}
                        data-testid="button-confirm-withdraw"
                      >
                        {withdrawMutation.isPending ? "Processing..." : "Request Withdrawal"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          {/* Active Subscribers Card */}
          <Card data-testid="card-memberships" className="relative overflow-hidden bg-card border-border shadow-xs">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm md:text-base font-bold text-foreground">Active Subscribers</CardTitle>
                    <CardDescription className="mt-0.5 text-xs md:text-sm text-muted-foreground">
                      Members with active or trial subscriptions
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center justify-center min-w-[2.5rem] h-8 md:h-9 px-3 rounded-md bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800" data-testid="count-active-subscribers">
                  <span className="text-base md:text-lg font-bold text-purple-700 dark:text-purple-300">
                    {membershipsLoading ? "..." : (memberships?.data?.length ?? 0)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {membershipsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : memberships?.data && memberships.data.length > 0 ? (
                <div className="space-y-3">
                  {memberships.data.map((membership) => {
                    const statusInfo = getStatusCategory(membership);
                    const displayName = membership.user?.name || membership.user?.username || `Member ${membership.id.slice(-8)}`;
                    const userInitials = membership.user?.name
                      ? membership.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                      : membership.user?.username?.slice(0, 2).toUpperCase() || membership.id.slice(-2).toUpperCase();

                    return (
                      <div
                        key={membership.id}
                        className="flex items-start gap-3 md:gap-4 p-3.5 md:p-4 rounded-lg bg-card/60 border border-border/80 hover:border-border transition-colors shadow-2xs"
                        data-testid={`membership-${membership.id}`}
                      >
                        <Avatar className="h-9 w-9 md:h-10 md:w-10 flex-shrink-0 ring-1 ring-border" data-testid={`avatar-${membership.user?.username || membership.id}`}>
                          {membership.user?.profile_pic_url && (
                            <AvatarImage
                              src={membership.user.profile_pic_url}
                              alt={displayName}
                              crossOrigin="anonymous"
                              onError={(e) => {
                                console.error("[Avatar] Failed to load profile picture:", membership.user?.profile_pic_url);
                              }}
                            />
                          )}
                          <AvatarFallback className="bg-muted text-foreground font-semibold">{userInitials}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm md:text-base font-semibold text-foreground truncate" data-testid={`text-user-${membership.id}`}>
                                {displayName}
                              </p>
                              {membership.user?.username && (
                                <p className="text-xs text-muted-foreground truncate">@{membership.user.username}</p>
                              )}
                              {!membership.user && (
                                <p className="text-xs text-muted-foreground truncate">ID: {membership.id}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge
                                variant={statusInfo.variant as any}
                                data-testid={`badge-status-${membership.id}`}
                                className="font-medium"
                              >
                                {statusInfo.label}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-foreground">Product:</span>
                              <span className="text-foreground/80 dark:text-muted-foreground">{membership.product.title}</span>
                            </div>

                            {membership.renewal_period_end ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-foreground">
                                  {membership.cancel_at_period_end ? "Ends:" : "Renews:"}
                                </span>
                                <span className="text-foreground/80 dark:text-muted-foreground">{format(new Date(membership.renewal_period_end), "MMM d, yyyy")}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-foreground">Type:</span>
                                <span className="text-foreground/80 dark:text-muted-foreground">One-time purchase</span>
                              </div>
                            )}

                            {membership.renewal_period_start && (
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-foreground">Current period:</span>
                                <span className="text-foreground/80 dark:text-muted-foreground">
                                  {format(new Date(membership.renewal_period_start), "MMM d")} - {" "}
                                  {membership.renewal_period_end && format(new Date(membership.renewal_period_end), "MMM d, yyyy")}
                                </span>
                              </div>
                            )}

                            {membership.canceled_at && (
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-foreground">Canceled:</span>
                                <span className="text-foreground/80 dark:text-muted-foreground">{format(new Date(membership.canceled_at), "MMM d, yyyy")}</span>
                              </div>
                            )}

                            {membership.cancellation_reason && (
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-foreground">Reason:</span>
                                <span className="italic text-foreground/80 dark:text-muted-foreground">{membership.cancellation_reason}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-foreground">Member since:</span>
                              <span className="text-foreground/80 dark:text-muted-foreground">{format(new Date(membership.created_at), "MMM d, yyyy")}</span>
                            </div>

                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className="font-medium text-foreground">Status:</span>
                              <span className="text-muted-foreground italic">{statusInfo.description}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground" data-testid="text-no-memberships">
                    No active subscribers
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active member subscriptions will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Commission History Card */}
          <Card data-testid="card-commission-history" className="relative overflow-hidden bg-card border-border shadow-xs">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center flex-shrink-0">
                  <History className="h-4 w-4 md:h-5 md:w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm md:text-base font-bold text-foreground">Commission History</CardTitle>
                  <CardDescription className="mt-0.5 text-xs md:text-sm text-muted-foreground">
                    Your earnings from member subscriptions (50/50 revenue split)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {commissionsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : commissions && commissions.length > 0 ? (
                <div className="space-y-3">
                  {commissions.map((commission) => (
                    <div
                      key={commission.id}
                      className="flex items-center justify-between gap-3 md:gap-4 p-3.5 md:p-4 rounded-lg bg-card/60 border border-border/80 hover:border-border transition-colors shadow-2xs"
                      data-testid={`commission-${commission.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs font-mono border-border text-foreground">
                            {commission.paymentId.substring(0, 8)}
                          </Badge>
                        </div>
                        {commission.customerEmail && (
                          <p className="text-xs md:text-sm font-medium text-foreground truncate" data-testid={`text-customer-${commission.id}`}>
                            {commission.customerEmail}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(commission.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base md:text-xl font-bold text-emerald-600 dark:text-emerald-400" data-testid={`text-commission-amount-${commission.id}`}>
                          {formatCurrency(commission.commissionAmount)}
                        </p>
                        <p className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">
                          of {formatCurrency(commission.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground" data-testid="text-no-commissions">
                    No commissions yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Earnings will appear here when members subscribe
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* How It Works Card */}
          <Card className="relative overflow-hidden bg-card border-border shadow-xs">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Info className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base font-bold text-foreground">How It Works</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="text-sm space-y-3">
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-bold">1</span>
                  </div>
                  <span className="text-foreground/80 dark:text-muted-foreground">Earn $2.17 (50% commission after fees) for each $5 weekly subscription payment</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-bold">2</span>
                  </div>
                  <span className="text-foreground/80 dark:text-muted-foreground">Commissions are calculated automatically when members are billed</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-bold">3</span>
                  </div>
                  <span className="text-foreground/80 dark:text-muted-foreground">Both initial payments and recurring weekly renewals generate earnings</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-bold">4</span>
                  </div>
                  <span className="text-foreground/80 dark:text-muted-foreground">Request a withdrawal anytime to receive your balance</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
