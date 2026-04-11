"use client";

import { APIProvider } from "@vis.gl/react-google-maps";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      libraries={["places", "routes", "geometry"]}
    >
      {children}
    </APIProvider>
  );
}

// TODO(01:12): Configure global providers and context wrappers