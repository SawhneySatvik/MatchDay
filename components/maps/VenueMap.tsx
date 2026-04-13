// components/maps/VenueMap.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Map,
  AdvancedMarker,
  Pin,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { motion } from "framer-motion";
import { MapPin, Navigation, Utensils, Cross, DoorOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { VenueInfo, FoodStall, Gate } from "@/lib/store";

type MapMode = "travel" | "venue";

interface VenueMapProps {
  venueCoords: { lat: number; lng: number };
  userCoords?: { lat: number; lng: number } | null;
  venueInfo?: VenueInfo | null;
  mode?: MapMode;
  className?: string;
}

// Inner component that draws the route — needs map context
function RouteLayer({
  origin,
  destination,
}: {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary("routes");

  useEffect(() => {
    if (!map || !routesLib) return;

    const directionsService = new routesLib.DirectionsService();
    const directionsRenderer = new routesLib.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "hsl(38, 92%, 55%)",
        strokeWeight: 4,
        strokeOpacity: 0.85,
      },
    });

    directionsService.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.TRANSIT,
      },
      (result, status) => {
        if (status === "OK" && result) {
          directionsRenderer.setDirections(result);
        }
      }
    );

    return () => {
      directionsRenderer.setMap(null);
    };
  }, [map, routesLib, origin, destination]);

  return null;
}

// Active filter chip state
type FilterType = "all" | "food" | "gates" | "medical";

export function VenueMap({
  venueCoords,
  userCoords,
  venueInfo,
  mode = "travel",
  className,
}: VenueMapProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  const center = mode === "travel" && userCoords
    ? {
        lat: (venueCoords.lat + userCoords.lat) / 2,
        lng: (venueCoords.lng + userCoords.lng) / 2,
      }
    : venueCoords;

  const zoom = mode === "travel" ? 13 : 16;

  const filters: { id: FilterType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "food", label: "Food" },
    { id: "gates", label: "Gates" },
    { id: "medical", label: "Aid" },
  ];

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Filter chips — venue mode only */}
      {mode === "venue" && venueInfo && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                activeFilter === f.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Map */}
      <div className="map-container h-64 w-full rounded-2xl overflow-hidden">
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          mapId="matchday-map"
          disableDefaultUI
          gestureHandling="greedy"
          colorScheme="DARK"
          style={{ width: "100%", height: "100%" }}
        >
          {/* Venue marker */}
          <AdvancedMarker position={venueCoords} title="Venue">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-primary border-2 border-background flex items-center justify-center shadow-lg glow-amber">
                <MapPin className="w-5 h-5 text-primary-foreground" fill="currentColor" />
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45" />
            </div>
          </AdvancedMarker>

          {/* User location marker */}
          {userCoords && (
            <AdvancedMarker position={userCoords} title="Your location">
              <div className="w-8 h-8 rounded-full bg-accent border-2 border-background flex items-center justify-center shadow-lg">
                <Navigation className="w-4 h-4 text-accent-foreground" />
              </div>
            </AdvancedMarker>
          )}

          {/* Route line */}
          {mode === "travel" && userCoords && (
            <RouteLayer origin={userCoords} destination={venueCoords} />
          )}

          {/* Food stalls */}
          {venueInfo && (activeFilter === "all" || activeFilter === "food") &&
            venueInfo.foodStalls.map((stall: FoodStall) => (
              <AdvancedMarker
                key={stall.id}
                position={stall.coords}
                title={stall.name}
                onClick={() =>
                  setSelectedMarker(selectedMarker === stall.id ? null : stall.id)
                }
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full border-2 border-background flex items-center justify-center transition-transform",
                    "bg-orange-500",
                    selectedMarker === stall.id && "scale-125"
                  )}
                >
                  <Utensils className="w-3.5 h-3.5 text-white" />
                </div>
                {selectedMarker === stall.id && (
                  <div className="absolute bottom-9 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl px-3 py-2 shadow-xl min-w-40 z-10">
                    <p className="text-xs font-semibold text-foreground whitespace-nowrap">
                      {stall.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stall.speciality}
                    </p>
                    <p className="text-xs text-primary mt-0.5">
                      {stall.walkTime} walk
                    </p>
                  </div>
                )}
              </AdvancedMarker>
            ))}

          {/* Gates */}
          {venueInfo && (activeFilter === "all" || activeFilter === "gates") &&
            venueInfo.gates.map((gate: Gate) => (
              <AdvancedMarker
                key={gate.id}
                position={gate.coords}
                title={gate.name}
                onClick={() =>
                  setSelectedMarker(selectedMarker === gate.id ? null : gate.id)
                }
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full border-2 border-background flex items-center justify-center transition-transform",
                    gate.congestionLevel === "low" && "bg-accent",
                    gate.congestionLevel === "medium" && "bg-yellow-500",
                    gate.congestionLevel === "high" && "bg-red-500",
                    selectedMarker === gate.id && "scale-125"
                  )}
                >
                  <DoorOpen className="w-3.5 h-3.5 text-white" />
                </div>
                {selectedMarker === gate.id && (
                  <div className="absolute bottom-9 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl px-3 py-2 shadow-xl min-w-40 z-10">
                    <p className="text-xs font-semibold text-foreground whitespace-nowrap">
                      {gate.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      Congestion: {gate.congestionLevel}
                    </p>
                  </div>
                )}
              </AdvancedMarker>
            ))}

          {/* Medical */}
          {venueInfo && (activeFilter === "all" || activeFilter === "medical") &&
            venueInfo.medicalPoints.map((med) => (
              <AdvancedMarker key={med.id} position={med.coords} title={med.name}>
                <div className="w-7 h-7 rounded-full bg-red-600 border-2 border-background flex items-center justify-center">
                  <Cross className="w-3.5 h-3.5 text-white" />
                </div>
              </AdvancedMarker>
            ))}
        </Map>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground">Venue</span>
        </div>
        {userCoords && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-accent" />
            <span className="text-xs text-muted-foreground">You</span>
          </div>
        )}
        {venueInfo && (
          <>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="text-xs text-muted-foreground">Food</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-accent" />
              <span className="text-xs text-muted-foreground">Gate (open)</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// TODO(01:12): Integrate interactive venue map for navigation