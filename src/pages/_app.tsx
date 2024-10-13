import "@/styles/globals.css";
import "@/styles/markdown.css";
import "@mysten/dapp-kit/dist/index.css";
import type { AppProps } from "next/app";

import Footer from "@/components/footer";
import Header from "@/components/header";
import Layout from "@/components/layout/Layout";
import Seo from "@/components/layout/Seo";

import { useEffect, useRef, useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactGA from "react-ga4";
ReactGA.initialize("G-DGMMEKSPE7");

import dynamic from "next/dynamic";
import { getLiquidLinkReferrer, LiquidLinkRegisterReferrer } from "liquidlink";
import { useRouter } from "next/router";
const SuiWalletProvider = dynamic(() => import("../providers/WalletProvider"), {
  ssr: false,
});
const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  const scrollingRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const { api_key, ...restQueryParams } = router.query;

    if (api_key) {
      window.localStorage.setItem("openAI_ApiKey", api_key.toString());
      const newPath = {
        pathname: router.pathname,
        query: restQueryParams,
      };
      router.replace(newPath, undefined, { shallow: true });
    }
  }, [router.query]);

  return (
    <QueryClientProvider client={queryClient}>
      <SuiWalletProvider>
        <LiquidLinkRegisterReferrer />
        <main>
          <Layout>
            <Seo />
            <Header
              scrollingRef={scrollingRef}
              isOpen={isOpen}
              setIsOpen={setIsOpen}
            />

            <div className="flex-1 bg-black text-white">
              <div className="flexmd:px-20 md:mx-auto items-center justify-center ">
                <Component {...pageProps} />
              </div>
            </div>
            <Footer />
          </Layout>
        </main>
      </SuiWalletProvider>
    </QueryClientProvider>
  );
}
