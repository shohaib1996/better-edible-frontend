"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ChevronDown, Check } from "lucide-react";
import { useGetAllStoresQuery } from "@/redux/api/Stores/stores";
import { cn } from "@/lib/utils";

interface StoreSelectProps {
  value?: string;
  onChange: (value: string) => void;
  initialStore?: { _id: string; name: string };
  onStoreSelect?: (store: any) => void;
}

export const StoreSelect: React.FC<StoreSelectProps> = ({
  value,
  onChange,
  initialStore,
  onStoreSelect,
}) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  // Keep track of the selected store object to display it even if it's not in the current API list
  const [cachedSelectedStore, setCachedSelectedStore] =
    useState<any>(initialStore);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, refetch } = useGetAllStoresQuery({
    search,
    limit: 10,
    page: 1,
  });

  useEffect(() => {
    if (initialStore) {
      setCachedSelectedStore(initialStore);
    }
  }, [initialStore]);

  useEffect(() => {
    const fetchedStores = data?.stores || [];
    if (
      initialStore &&
      !fetchedStores.some((s: any) => s._id === initialStore._id)
    ) {
      setStores([initialStore, ...fetchedStores]);
    } else {
      setStores(fetchedStores);
    }
  }, [data, initialStore]);

  // Debounce search
  useEffect(() => {
    const delay = setTimeout(() => {
      if (open) refetch();
    }, 500);
    return () => clearTimeout(delay);
  }, [search, open]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Find store in current list, or fallback to cached store if IDs match
  const selectedStore =
    stores.find((s) => s._id === value) ||
    (cachedSelectedStore?._id === value ? cachedSelectedStore : null);

  const handleStoreSelect = (storeId: string) => {
    onChange(storeId);

    // Find the full store object and pass it up
    const store = stores.find((s) => s._id === storeId);

    if (store) {
      setCachedSelectedStore(store); // Cache it so it persists when list changes
      if (onStoreSelect) {
        onStoreSelect(store);
      }
    }

    setOpen(false);
    setSearch("");
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-xs transition-colors",
          "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
          !selectedStore && "text-gray-500"
        )}
      >
        <span className="truncate">
          {selectedStore ? selectedStore.name : "Select a store"}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 opacity-50 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          {/* Search Input */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search stores..."
                className="pl-8 text-sm h-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Store List */}
          <div className="max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              </div>
            ) : stores.length ? (
              <div className="p-1">
                {stores.map((store: any) => (
                  <button
                    key={store._id}
                    type="button"
                    onClick={() => handleStoreSelect(store._id)}
                    className={cn(
                      "relative flex w-full cursor-pointer items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors",
                      "hover:bg-gray-100 focus:bg-gray-100",
                      value === store._id && "bg-emerald-50"
                    )}
                  >
                    <div className="flex flex-col flex-1 items-start">
                      <span className="font-medium">{store.name}</span>
                      <span className="text-xs text-gray-500">
                        {store.city ? `${store.city}, ` : ""}
                        {store.address || ""}
                      </span>
                    </div>
                    {value === store._id && (
                      <Check className="h-4 w-4 text-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm p-4 text-center">
                No stores found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
