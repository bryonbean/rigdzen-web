"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface PayPalCheckoutButtonProps {
  retreatId: number;
  totalAmount: number;
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError: (err: unknown) => void;
      }) => {
        render: (container: string | HTMLElement) => void;
      };
    };
  }
}

export function PayPalCheckoutButton({
  retreatId,
  totalAmount,
}: PayPalCheckoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  // Load PayPal SDK
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

    if (!clientId) {
      setError(
        "PayPal Client ID not configured. Please set NEXT_PUBLIC_PAYPAL_CLIENT_ID in your .env file."
      );
      setIsLoading(false);
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector(
      'script[src*="paypal.com/sdk/js"]'
    );
    if (existingScript) {
      // Script already loaded, check if PayPal is available
      if (window.paypal) {
        setPaypalLoaded(true);
        setIsLoading(false);
      } else {
        // Wait for PayPal to be available
        const checkPayPal = setInterval(() => {
          if (window.paypal) {
            setPaypalLoaded(true);
            setIsLoading(false);
            clearInterval(checkPayPal);
          }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkPayPal);
          if (!window.paypal) {
            setError("PayPal SDK failed to initialize");
            setIsLoading(false);
          }
        }, 5000);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=CAD`;
    script.async = true;
    script.onload = () => {
      // Small delay to ensure PayPal object is available
      setTimeout(() => {
        if (window.paypal) {
          setPaypalLoaded(true);
          setIsLoading(false);
        } else {
          setError("PayPal SDK loaded but not available");
          setIsLoading(false);
        }
      }, 100);
    };
    script.onerror = () => {
      setError(
        "Failed to load PayPal SDK. Please check your internet connection and PayPal Client ID."
      );
      setIsLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      // Only remove if we added it
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Render PayPal button when SDK is loaded
  useEffect(() => {
    if (!paypalLoaded || !window.paypal) {
      return;
    }

    setIsLoading(false);

    window.paypal
      .Buttons({
        createOrder: async () => {
          try {
            const response = await fetch(
              `/api/retreats/${retreatId}/payments/create`,
              {
                method: "POST",
              }
            );

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "Failed to create order");
            }

            const data = await response.json();
            return data.orderId;
          } catch (err: unknown) {
            const message =
              err instanceof Error
                ? err.message
                : "Failed to create PayPal order";
            setError(message);
            throw err;
          }
        },
        onApprove: async (data: { orderID: string }) => {
          try {
            const response = await fetch(
              `/api/retreats/${retreatId}/payments/capture`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ orderId: data.orderID }),
              }
            );

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "Failed to capture payment");
            }

            // Refresh page to show updated payment status
            router.refresh();
            router.push(`/retreats/${retreatId}?payment=success`);
          } catch (err: unknown) {
            const message =
              err instanceof Error ? err.message : "Failed to process payment";
            setError(message);
            console.error("Payment capture error:", err);
          }
        },
        onError: (err: unknown) => {
          setError("An error occurred with PayPal checkout");
          console.error("PayPal error:", err);
        },
      })
      .render("#paypal-button-container");
  }, [paypalLoaded, retreatId, router]);

  if (error) {
    return (
      <div className="p-2 text-sm text-red-600 bg-red-50 rounded">{error}</div>
    );
  }

  return (
    <div>
      {isLoading && (
        <div className="text-sm text-muted-foreground mb-2">
          Loading PayPal...
        </div>
      )}
      <div id="paypal-button-container"></div>
    </div>
  );
}
