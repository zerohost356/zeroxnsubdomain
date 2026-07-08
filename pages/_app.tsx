import "../styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "../components/Layout";
import ErrorBoundary from "../components/ErrorBoundary";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout title={(pageProps as any).title} description={(pageProps as any).description}>
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    </Layout>
  );
}
