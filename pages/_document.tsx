import Document, { Html, Head, Main, NextScript } from "next/document";
import { SITE_URL, SEO } from "../lib/seo";
import { GOOGLE_SITE_VERIFICATION } from "../lib/config";

export default class MyDocument extends Document {
  render() {
    const gscVerification = GOOGLE_SITE_VERIFICATION;

    return (
      <Html lang="en">
        <Head>
          {/* Google Search Console Verification */}
          {gscVerification && (
            <meta name="google-site-verification" content={gscVerification} />
          )}

          {/* Favicon & manifest */}
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="apple-touch-icon" href="/favicon.svg" />
          <link rel="manifest" href="/site.webmanifest" />

          {/* Theme */}
          <meta name="theme-color" content="#8b5cf6" />
          <meta name="color-scheme" content="dark" />

          {/* Robots */}
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

          {/* Open Graph base */}
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content={SEO.siteName} />
          <meta property="og:locale" content="en_US" />

          {/* Twitter / X Card */}
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:site" content="@tempmail" />

          {/* App meta */}
          <meta name="application-name" content={SEO.siteName} />
          <meta name="msapplication-TileColor" content="#8b5cf6" />
          <meta name="format-detection" content="telephone=no" />

          {/* Canonical base (overridden per page) */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />

          {/* JSON-LD: WebSite (sitelinks search) */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: SEO.siteName,
                url: SITE_URL,
                description: SEO.defaultDescription,
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${SITE_URL}/?q={search_term_string}`,
                  },
                  "query-input": "required name=search_term_string",
                },
              }),
            }}
          />

          {/* JSON-LD: Organization */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                name: SEO.siteName,
                url: SITE_URL,
                logo: {
                  "@type": "ImageObject",
                  url: `${SITE_URL}/favicon.svg`,
                },
              }),
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
          <script dangerouslySetInnerHTML={{ __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `}} />
        </body>
      </Html>
    );
  }
}
