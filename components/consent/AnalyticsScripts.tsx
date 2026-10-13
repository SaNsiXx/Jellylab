"use client";

import { useEffect } from "react";
import Script from "next/script";
import { useConsent } from "@/lib/analytics/consent";
import { captureAttribution } from "@/lib/attribution";

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const LINKEDIN_ID = process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID;

/**
 * Loads third-party tags ONLY after the matching consent:
 *  - GA4 (analytics consent), with Google Consent Mode v2 defaults set to "denied" beforehand.
 *  - LinkedIn Insight Tag (marketing consent).
 * With no IDs configured nothing is loaded at all.
 */
export function AnalyticsScripts() {
  const consent = useConsent();
  useEffect(() => captureAttribution(), []);

  return (
    <>
      {GA4_ID && (
        <Script id="consent-default" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});`}
        </Script>
      )}
      {GA4_ID && consent?.analytics && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`gtag('consent','update',{analytics_storage:'granted',ad_storage:'${consent.marketing ? "granted" : "denied"}',ad_user_data:'${consent.marketing ? "granted" : "denied"}',ad_personalization:'${consent.marketing ? "granted" : "denied"}'});
gtag('js',new Date());gtag('config','${GA4_ID}');`}
          </Script>
        </>
      )}
      {LINKEDIN_ID && consent?.marketing && (
        <Script id="linkedin-insight" strategy="afterInteractive">
          {`window._linkedin_partner_id="${LINKEDIN_ID}";window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push(window._linkedin_partner_id);
(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}var s=document.getElementsByTagName("script")[0];var b=document.createElement("script");b.type="text/javascript";b.async=true;b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";s.parentNode.insertBefore(b,s);})(window.lintrk);`}
        </Script>
      )}
    </>
  );
}
