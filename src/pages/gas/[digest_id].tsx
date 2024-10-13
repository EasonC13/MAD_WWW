import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import RingAnimation from "@/components/animation/RingAnimation";
import axios from "axios";
import Link from "next/link";
import { SuiClient } from "@mysten/sui/client";
import { getFullnodeUrl } from "@mysten/sui.js/client";

const ViewIdPage: React.FC = () => {
  const router = useRouter();
  let { digest_id, network = "mainnet" } = router.query;

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [totalGasUsed, setTotalGasUsed] = useState(0);
  const [suiPriceUSD, setSuiPriceUSD] = useState(0);
  const [baseUrl, setBaseUrl] = useState("https://gas.suigpt.tools");

  const fetchGasProfile = async (url: string) => {
    try {
      const response = await axios.get(
        `${url}/gas_profile/${network}/${digest_id}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setErrorMessage("");
    if (!digest_id) {
      setIsLoading(false);
      setErrorMessage("Invalid digest_id");
      return;
    }
    const source = axios.CancelToken.source();
    const timeoutId = setTimeout(() => {
      setErrorMessage("Request timeout");
      setIsLoading(false);
    }, 60000);

    const infoShowId = setTimeout(() => {
      setInfoMessage("Loading... This may take around 10 seconds...");
    }, 3000);
    const infoShowId2 = setTimeout(() => {
      setInfoMessage(
        "The waiting time depends on the busy level of the node. Please be patient."
      );
    }, 10000);

    // Try the primary server first, and fall back to the backup server if it fails
    fetchGasProfile("https://gas.suigpt.tools")
      .then(() => {
        clearTimeout(timeoutId);
        setErrorMessage("");
        setIsLoading(false);
        setBaseUrl("https://gas.suigpt.tools"); // Use primary server
      })
      .catch((error) => {
        console.error("Primary server error", error.message);
        fetchGasProfile("https://gas.e3.suigpt.tools")
          .then(() => {
            clearTimeout(timeoutId);
            setErrorMessage("");
            setIsLoading(false);
            setBaseUrl("https://gas.e3.suigpt.tools"); // Use backup server
          })
          .catch((error) => {
            console.error("Backup server error", error.message);
            setErrorMessage(
              `${error.message}. No meaningful gas usage was found for this transaction, it may be (1) a system transaction, (2) a transaction that did not interact with any package, (3) a digest from another network, or (4) an invalid digest. Please try another one.`
            );
            setIsLoading(false);
          });
      });

    const suiClient = new SuiClient({
      url: getFullnodeUrl(network as any),
    });
    suiClient
      .getTransactionBlock({
        digest: digest_id as string,
        options: {
          showEffects: true,
          showRawEffects: true,
          showObjectChanges: true,
        },
      })
      .then((res) => {
        const {
          computationCost,
          nonRefundableStorageFee,
          storageCost,
          storageRebate,
        } = (res.effects as any).gasUsed;
        const totalGas =
          parseFloat(computationCost) +
          parseFloat(storageCost) -
          parseFloat(storageRebate);
        setTotalGasUsed(totalGas);
      });

    // Fetch Sui price in USD
    axios
      .get("https://api-sui.cetus.zone/v2/sui/coin_price")
      .then((response) => {
        setSuiPriceUSD(
          parseFloat(
            response.data.data.list.filter(
              (item: any) =>
                item.coin_type ===
                "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
            )[0].price
          )
        );
      })
      .catch((error) => {
        console.error("Error fetching Sui price:", error.message);
      });

    return () => {
      source.cancel("Component unmounted");
      clearTimeout(timeoutId);
    };
  }, [digest_id]);

  const showExplorerButton = () => {
    return (
      <div className="absolute bottom-0 w-full flex justify-center pb-2 bg-opacity-50">
        <div className="flex flex-col items-center bg-gray-700 p-4 rounded-lg mb-5">
          <div className="text-white mb-2">
            Total Gas: {totalGasUsed / 10 ** 9} Sui
            {suiPriceUSD > 0 &&
              ` (~$${((totalGasUsed / 10 ** 9) * suiPriceUSD).toFixed(4)} USD)`}
          </div>
          <div className="flex space-x-4">
            <p className="py-1">View at:</p>
            <Link
              href={`https://suiscan.xyz/${network}/tx/${digest_id}`}
              target="_blank"
              className="mx-1 py-1 rounded-lg  hover:underline focus:outline-none"
            >
              SuiScan
            </Link>
            {network === "mainnet" && (
              <Link
                href={`https://suivision.xyz/txblock/${digest_id}`}
                target="_blank"
                className="mx-1 py-1 rounded-lg  hover:underline focus:outline-none"
              >
                SuiVision
              </Link>
            )}
            {network !== "mainnet" && (
              <Link
                href={`https://${network}.suivision.xyz/txblock/${digest_id}`}
                target="_blank"
                className="mx-1 py-1 rounded-lg  hover:underline focus:outline-none"
              >
                SuiVision
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-[80vh]">
      {isLoading ? (
        <div className="flex items-center justify-center h-[80vh]">
          <div className="m-auto items-center justify-center text-center">
            <RingAnimation />
            <div className="text-white">{infoMessage}</div>
          </div>
        </div>
      ) : errorMessage ? (
        <div className="clear-both flex items-center justify-center h-[80vh]">
          <div className="m-auto max-w-lg text-red-500">
            <p>{errorMessage}</p>
            <p className="mt-3">
              If you believe this is a bug,{" "}
              <a
                href="https://t.me/EasonC13"
                target="_blank"
                className="underline text-red-400"
              >
                report it to the developer
              </a>{" "}
              and get MoveAiBot Voucher in return.
            </p>
          </div>
        </div>
      ) : (
        <div className="clear-both flex items-center justify-center h-[80vh]">
          <iframe
            className="w-full h-full"
            src={`${baseUrl}/gas_profile/${network}/${digest_id}`}
          ></iframe>
        </div>
      )}
      {showExplorerButton()}
    </div>
  );
};

export default ViewIdPage;
