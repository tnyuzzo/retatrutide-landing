"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "/ingest",
    ui_host: "https://eu.posthog.com",
    capture_pageview: false, // manual pageview for SPA routing
    capture_pageleave: true,
    autocapture: true,
    persistence: "localStorage+cookie",
  });
}

function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (pathname && ph) {
      let url = window.origin + pathname;
      const search = searchParams?.toString();
      if (search) url += "?" + search;
      ph.capture("$pageview", { $current_url: url });

      // Set person properties on every pageview
      const locale = pathname?.split("/")[1] || "en";
      ph.setPersonPropertiesForFlags({ locale });
      ph.capture("$set", {
        $set: { locale, last_seen_page: pathname },
        $set_once: { landing_page: pathname, first_locale: locale },
      });
    }
  }, [pathname, searchParams, ph]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageview />
      </Suspense>
      {children}
    </PHProvider>
  );
}
