"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  value: string;
  onChange: (displayValue: string, coordinates: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export function LocationPicker({ value, onChange, disabled, placeholder, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [ready, setReady] = useState(false);

  const stableOnChange = useRef(onChange);
  useEffect(() => { stableOnChange.current = onChange; }, [onChange]);

  useEffect(() => {
    if (!apiKey) {
      console.warn("[LocationPicker] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set — autocomplete disabled.");
      return;
    }

    setOptions({ key: apiKey, v: "weekly" });

    importLibrary("places")
      .then(() => setReady(true))
      .catch((err) => console.error("[LocationPicker] Failed to load Places library:", err));
  }, []);

  useEffect(() => {
    if (!ready || !inputRef.current || autocompleteRef.current) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["geocode", "establishment"],
      fields: ["geometry", "formatted_address", "name"],
    });

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current!.getPlace();
      const lat = place.geometry?.location?.lat();
      const lng = place.geometry?.location?.lng();
      const display = place.formatted_address ?? place.name ?? inputRef.current?.value ?? "";

      if (lat !== undefined && lng !== undefined) {
        stableOnChange.current(display, `${lat},${lng}`);
      } else {
        stableOnChange.current(display, display);
      }
    });
  }, [ready]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    stableOnChange.current(e.target.value, e.target.value);
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleChange}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      autoComplete="off"
    />
  );
}
