import { whopIframeSdk } from "./whop-iframe";

export interface PurchaseOptions {
  planId?: string;
  planType?: "starter" | "pro";
  experienceId?: string;
  companyId?: string;
}

export async function purchaseCredits(options?: PurchaseOptions): Promise<boolean> {
  const planId =
    options?.planId ||
    (options?.planType === "starter" ? "plan_ZLLdnJssCPIpY" : "plan_mndBT74OUdiNB");

  const isIframe = typeof window !== "undefined" && window.self !== window.top;

  console.log(`[Payment] Initiating checkout for plan ${planId} (${options?.planType || "pro"}), isIframe: ${isIframe}`);

  // Send notification email when user clicks upgrade (fire-and-forget)
  fetch("/api/notifications/unlimited-access-clicked", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      planType: options?.planType || "pro",
      planId: planId,
    }),
  }).catch((err) => {
    console.debug("[Payment] Notification error (non-critical):", err);
  });

  // Try to create checkout configuration on the backend for admin attribution
  let checkoutConfigId: string | undefined;
  try {
    const configResponse = await fetch("/api/credits/checkout-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: planId,
        planType: options?.planType,
        experienceId: options?.experienceId,
        companyId: options?.companyId,
      }),
    });

    if (configResponse.ok) {
      const data = await configResponse.json();
      if (data?.checkoutConfigId) {
        checkoutConfigId = data.checkoutConfigId;
        console.log("[Payment] Received checkoutConfigId:", checkoutConfigId);
      }
    }
  } catch (err) {
    console.warn("[Payment] Could not create checkout config, proceeding with planId directly:", err);
  }

  // 1. If running inside Whop iframe and SDK is available, try in-app modal
  if (isIframe && whopIframeSdk) {
    try {
      console.log("[Payment] Opening Whop in-app purchase modal with:", { planId, checkoutConfigId });

      const purchaseParams: { planId: string; id?: string } = { planId };
      if (checkoutConfigId) {
        purchaseParams.id = checkoutConfigId;
      }

      const result = await whopIframeSdk.inAppPurchase(purchaseParams);
      console.log("[Payment] In-app purchase modal result:", result);

      if (result && result.status === "ok") {
        console.log("[Payment] Payment completed successfully! Receipt ID:", result.data.receiptId);

        try {
          const processResponse = await fetch("/api/credits/process-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId: result.data.receiptId }),
          });
          const processData = await processResponse.json();
          console.log("[Payment] process-payment result:", processData);
        } catch (procErr) {
          console.error("[Payment] Error during process-payment:", procErr);
        }

        return true;
      } else {
        console.log("[Payment] In-app purchase modal was closed or returned non-ok:", result);
        return false;
      }
    } catch (sdkError) {
      console.warn("[Payment] whopIframeSdk.inAppPurchase failed or unsupported, falling back to direct checkout URL:", sdkError);
      // Fall through to window.open checkout URL below
    }
  }

  // 2. Direct Checkout Fallback (used when outside Whop iframe or if in-app modal fails)
  const checkoutUrl = `https://whop.com/checkout/${planId}`;
  console.log(`[Payment] Opening Whop checkout URL in new tab: ${checkoutUrl}`);

  // In development mode, also trigger dev credit simulation
  if (import.meta.env.DEV) {
    try {
      await fetch("/api/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType: options?.planType || "pro",
          planId: planId,
        }),
      });
    } catch {}
  }

  window.open(checkoutUrl, "_blank");
  return true;
}
