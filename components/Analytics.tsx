"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { GA_ID, pageview } from "@/lib/analytics";

// Sends a page_view on every client-side route change (GA's snippet only fires
// one automatically on first load).
function PageViews() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    const url = pathname + (search.toString() ? `?${search}` : "");
    pageview(url);
  }, [pathname, search]);

  return null;
}

// Loads GA4 and tracks navigation. Renders nothing (and loads no script) unless
// NEXT_PUBLIC_GA_ID is set, so local dev stays clean.
export function Analytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
      <Suspense fallback={null}>
        <PageViews />
      </Suspense>
    </>
  );
}
