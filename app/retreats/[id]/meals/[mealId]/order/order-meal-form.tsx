"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  requiresQuantity: boolean;
}

interface OrderMealFormProps {
  retreatId: number;
  mealId: number;
  mealPrice: number;
  menuItems: MenuItem[];
  initialSelectedItems?: Record<
    number,
    { selected: boolean; quantity?: number }
  >;
}

export function OrderMealForm({
  retreatId,
  mealId,
  mealPrice,
  menuItems,
  initialSelectedItems,
}: OrderMealFormProps) {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<
    Record<number, { selected: boolean; quantity?: number }>
  >(initialSelectedItems || {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate total price based on maximum quantity
  const calculateTotal = () => {
    const quantities = Object.values(selectedItems)
      .filter((item) => item.selected && item.quantity)
      .map((item) => item.quantity || 1);

    const maxQuantity = quantities.length > 0 ? Math.max(...quantities) : 1;
    return mealPrice * maxQuantity;
  };

  const handleItemToggle = (itemId: number, requiresQuantity: boolean) => {
    setSelectedItems((prev) => {
      const current = prev[itemId];
      if (current?.selected) {
        // Deselect
        const { [itemId]: removed, ...rest } = prev;
        return rest;
      } else {
        // Select - include quantity if required
        return {
          ...prev,
          [itemId]: {
            selected: true,
            quantity: requiresQuantity ? 1 : undefined,
          },
        };
      }
    });
  };

  const handleQuantityChange = (itemId: number, quantity: number) => {
    // Prevent zero or negative quantities
    const validQuantity = Math.max(1, quantity || 1);
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity: validQuantity,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const selectedMenuItems = Object.entries(selectedItems)
      .filter(([_, value]) => value.selected)
      .map(([itemId, value]) => {
        const menuItem = menuItems.find((item) => item.id === parseInt(itemId));
        // Validate quantity: if required, must be > 0; if not required, can be null
        let quantity = value.quantity || null;
        if (menuItem?.requiresQuantity && (!quantity || quantity <= 0)) {
          quantity = 1; // Default to 1 if invalid
        }
        return {
          menuItemId: parseInt(itemId),
          quantity: quantity,
        };
      })
      .filter((item) => {
        // Remove items with invalid quantities (shouldn't happen, but safety check)
        const menuItem = menuItems.find((m) => m.id === item.menuItemId);
        if (
          menuItem?.requiresQuantity &&
          (!item.quantity || item.quantity <= 0)
        ) {
          return false;
        }
        return true;
      });

    // Allow empty selection to cancel/delete order

    try {
      const response = await fetch(
        `/api/retreats/${retreatId}/meals/${mealId}/order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            menuItems: selectedMenuItems,
          }),
        }
      );

      if (response.ok) {
        // Navigate back to retreat detail page with a full page reload
        // This ensures the page shows the updated order state
        window.location.href = `/retreats/${retreatId}`;
        // Note: setIsSubmitting(false) not needed here as page will reload
      } else {
        const data = await response.json();
        alert(data.error || "Failed to place order");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Order error:", error);
      alert("Failed to place order. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 border border-border rounded-lg bg-card"
    >
      <h2 className="text-xl font-semibold text-card-foreground mb-4">
        Select Menu Items
      </h2>

      {menuItems.length === 0 ? (
        <p className="text-muted-foreground">No menu items available.</p>
      ) : (
        <div className="space-y-3">
          {menuItems.map((item) => {
            const isSelected = selectedItems[item.id]?.selected || false;
            const quantity = selectedItems[item.id]?.quantity;

            return (
              <div
                key={item.id}
                className="p-4 border border-border rounded-lg bg-background"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`menu-item-${item.id}`}
                    checked={isSelected}
                    onChange={() =>
                      handleItemToggle(item.id, item.requiresQuantity)
                    }
                    className="mt-1 rounded border-input"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`menu-item-${item.id}`}
                      className="font-medium text-foreground cursor-pointer block"
                    >
                      {item.name}
                    </label>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    )}
                    {item.requiresQuantity && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Quantity required (e.g., pizza slices)
                      </p>
                    )}
                  </div>
                  {isSelected && item.requiresQuantity && (
                    <div className="ml-4">
                      <label
                        htmlFor={`quantity-${item.id}`}
                        className="sr-only"
                      >
                        Quantity
                      </label>
                      <input
                        type="number"
                        id={`quantity-${item.id}`}
                        min="1"
                        value={quantity || 1}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          // Prevent empty string or zero
                          if (inputValue === "" || inputValue === "0") {
                            handleQuantityChange(item.id, 1);
                          } else {
                            const parsed = parseInt(inputValue);
                            if (!isNaN(parsed)) {
                              handleQuantityChange(item.id, parsed);
                            }
                          }
                        }}
                        onBlur={(e) => {
                          // Ensure value is at least 1 when input loses focus
                          const value = parseInt(e.target.value) || 1;
                          if (value <= 0) {
                            handleQuantityChange(item.id, 1);
                          }
                        }}
                        className="w-20 px-3 py-1 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-4 border-t border-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-card-foreground">Total:</span>
          <span className="text-xl font-semibold text-card-foreground">
            ${calculateTotal().toFixed(2)} CAD
          </span>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Selecting..." : "Select"}
        </button>
      </div>
    </form>
  );
}
