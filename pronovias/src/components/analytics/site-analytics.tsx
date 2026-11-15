import Script from 'next/script'
import { AttributionCapture } from '@/components/analytics/attribution-capture'
import { ga4MeasurementId, metaPixelId } from '@/lib/attribution'

/**
 * GA4 and the Meta Pixel load only when their public IDs are set.
 * Invalid values are ignored so a bad env var cannot be interpolated into a script.
 */
export function SiteAnalytics() {
  const gaId = ga4MeasurementId()
  const pixelId = metaPixelId()

  return (
    <>
      <AttributionCapture />
      {gaId ? (
        <>
          <Script id="ga4-gtag" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
          <Script
            id="ga4-src"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          />
        </>
      ) : null}
      {pixelId ? (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${pixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            {/* Meta's base snippet requires this raw pixel. next/image would rewrite the URL. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              height={1}
              width={1}
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      ) : null}
    </>
  )
}
