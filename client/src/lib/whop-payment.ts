import { whopIframeSdk } from "./whop-iframe";

export interface PurchaseOptions {
  planId?: string;
  planType?: "starter" | "pro";
  experienceId?: string;
  companyId?: string;
}

export async function purchaseCredits(options?: PurchaseOptions): Promise<boolean> {
  // Send notification email when user clicks the button
  try {
    console.log("[Notification] Sending upgrade clicked notification...");
    await fetch("/api/notifications/unlimited-access-clicked", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planType: options?.planType || "pro",
        planId: options?.planId,
      }),
    });
  } catch (error) {
    console.error("[Notification] Failed to send notification:", error);
    // Continue with purchase flow even if notification fails
  }

  if (!whopIframeSdk) {
    console.warn("Whop iframe SDK not available - simulating purchase in dev mode");

    try {
      const response = await fetch("/api/credits/purchase", {
        method: "POST",
        body: JSON.stringify({
          success: true,
          planType: options?.planType || "pro",
          planId: options?.planId,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Purchase request failed");
      }

      return true;
    } catch (error) {
      console.error("Error simulating purchase:", error);
      return false;
    }
  }

  try {
    console.log("[Payment] Creating checkout configuration with options:", options);

    const configResponse = await fetch("/api/credits/checkout-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: options?.planId,
        planType: options?.planType,
        experienceId: options?.experienceId,
        companyId: options?.companyId,
      }),
    });

    if (!configResponse.ok) {
      throw new Error("Failed to create checkout configuration");
    }

    const { checkoutConfigId, planId } = await configResponse.json();

    if (!checkoutConfigId || !planId) {
      console.error("Checkout configuration missing required data");
      return false;
    }

    console.log("[Payment] Opening payment modal with config:", { checkoutConfigId, planId });

    const result = await whopIframeSdk.inAppPurchase({
      planId: planId,
      id: checkoutConfigId,
    });

    if (result.status === "ok") {
      console.log("[Payment] Payment successful! Processing payment directly...");
      console.log("[Payment] Payment ID:", result.data.receiptId);

      // Process payment immediately without waiting for webhook
      try {
        const processResponse = await fetch("/api/credits/process-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId: result.data.receiptId }),
        });

        if (!processResponse.ok) {
          const errorData = await processResponse.json();
          console.error("[Payment] Failed to process payment:", errorData);

          if (processResponse.status >= 400 && processResponse.status < 500) {
            console.error("[Payment] ❌ Payment processing failed:", errorData.error);
            return false;
          }

          console.error("[Payment] ❌ Server error processing payment:", errorData.error);
          return false;
        }

        const processData = await processResponse.json();
        console.log("[Payment] ✅ Payment processed:", processData);

        if (!processData.success) {
          console.error("[Payment] ❌ Payment processing returned success: false");
          return false;
        }

        console.log("[Payment] ✅ Access granted successfully!");
        return true;
      } catch (processError) {
        console.error("[Payment] ❌ Exception during payment processing:", processError);
        return false;
      }
    } else {
      console.log("[Payment] Modal closed without purchase or error:", result);
      return false;
    }
  } catch (error) {
    console.error("[Payment] ❌ Error during purchase flow:", error);
    return false;
  }
}
