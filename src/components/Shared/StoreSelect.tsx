"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { useGetAllStoresQuery } from "@/redux/api/Stores/stores";

interface StoreSelectProps {
  value?: string;
  onChange: (value: string) => void;
  initialStore?: { _id: string; name: string };
}

export const StoreSelect: React.FC<StoreSelectProps> = ({
  value,
  onChange,
  initialStore,
}) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isInteractingWithSearch = useRef(false);

  const { data, isLoading, refetch } = useGetAllStoresQuery({
    search,
    limit: 10,
    page: 1,
  });

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

  return (
    <div className="space-y-1">
      <Select
        value={value ?? ""}
        onValueChange={onChange}
        open={open}
        onOpenChange={(newOpen) => {
          // Prevent closing if user is interacting with search
          if (!newOpen && isInteractingWithSearch.current) {
            return;
          }

          // On mobile, check if the focus is moving to the search input
          if (!newOpen) {
            setTimeout(() => {
              const activeElement = document.activeElement;
              const isSearchInput =
                activeElement?.getAttribute("data-search-input") === "true";
              if (!isSearchInput) {
                setOpen(newOpen);
              }
            }, 0);
          } else {
            setOpen(newOpen);
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a store" />
        </SelectTrigger>

        <SelectContent
          position="popper"
          sideOffset={5}
          className="max-h-[300px]"
        >
          {/* Search bar inside dropdown */}
          <div
            ref={searchContainerRef}
            className="sticky top-0 bg-white z-10 px-2 py-2 border-b"
            onClick={(e) => {
              e.stopPropagation();
              isInteractingWithSearch.current = true;
              setOpen(true); // Explicitly keep dropdown open on Android
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              isInteractingWithSearch.current = true;
            }}
            onMouseUp={() => {
              setTimeout(() => {
                isInteractingWithSearch.current = false;
              }, 100);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              isInteractingWithSearch.current = true;
            }}
            onTouchEnd={() => {
              setTimeout(() => {
                isInteractingWithSearch.current = false;
              }, 100);
            }}
            onTouchCancel={() => {
              isInteractingWithSearch.current = false;
            }}
            onKeyDown={(e) => e.stopPropagation()}
            onPointerMove={(e) => e.stopPropagation()}
            onPointerDown={(e) => {
              e.stopPropagation();
              isInteractingWithSearch.current = true;
            }}
            onPointerUp={() => {
              setTimeout(() => {
                isInteractingWithSearch.current = false;
              }, 100);
            }}
          >
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                data-search-input="true"
                placeholder="Search stores..."
                className="pl-8 text-sm h-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => {
                  e.stopPropagation();
                  isInteractingWithSearch.current = true;
                }}
                onFocus={(e) => {
                  e.stopPropagation();
                  isInteractingWithSearch.current = true;
                  // Ensure the dropdown stays open
                  setOpen(true);
                }}
                onBlur={() => {
                  // Delay clearing the flag to allow other events to process
                  setTimeout(() => {
                    isInteractingWithSearch.current = false;
                  }, 200);
                }}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            </div>
          ) : stores.length ? (
            stores.map((store: any) => (
              <SelectItem key={store._id} value={store._id}>
                <div className="flex flex-col">
                  <span className="font-medium">{store.name}</span>
                  <span className="text-xs text-gray-500">
                    {store.city ? `${store.city}, ` : ""}
                    {store.address || ""}
                  </span>
                </div>
              </SelectItem>
            ))
          ) : (
            <div className="text-gray-500 text-sm p-2 text-center">
              No stores found
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
