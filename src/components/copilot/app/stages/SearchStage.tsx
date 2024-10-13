import React, { useEffect, useState } from "react";
import { Spinner, Toast } from "flowbite-react";
import { FaExternalLinkAlt } from "react-icons/fa";
import Skeleton from "@/components/copilot/base/skeleton";
import { useRouter } from "next/router";

interface StageProps {
  onNextStage: () => void;
}

const SearchStage: React.FC<StageProps> = ({ onNextStage }) => {
  // Stage 2: Search from SUI Explorer (not implemented yet)
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const introduction =
    "Discovered 2 SUI smart contracts associated with your coin definition. Explore them further with MoveAiBot by clicking on each listed coin below.";
  const results = [
    {
      name: "Coin: FUD",
      image: "/coinIcons/fud.jpg",
      packageId:
        "0x76cb819b01abed502bee8a702b4c2d547532c12f25001c9dea795a5e631c26f1",
    },
    {
      name: "Coin: REAP",
      image: "/coinIcons/reap.jpg",
      packageId:
        "0xde2d3e02ba60b806f81ee9220be2a34932a513fe8d7f553167649e95de21c066",
    },
  ];

  setTimeout(async () => {
    setIsLoaded(true);
    onNextStage();
  }, 2 * 1251);

  return isLoaded ? (
    <div className="mt-5 mb-20">
      <p className="mt-2 mb-5 text-lg text-white">{introduction}</p>
      {results.map((result, index) => (
        <Toast className="mb-5 cursor-pointer" key={index}>
          <a
            href={`/decompile/${result.packageId}?language=suigpt_decompiled`}
            target="_blank"
          >
            <div className="flex w-full justify-stretch">
              <div className="flex gap-2 flex-1">
                <span className="w-6 h-6 m-0">
                  <img src={result.image} className="rounded-full" />
                </span>{" "}
                {result.name}
              </div>
              <p className="pt-1 pr-2">
                <FaExternalLinkAlt />
              </p>
            </div>
          </a>
        </Toast>
      ))}
    </div>
  ) : (
    <div className="mt-5 mb-20 w-full">
      <p className="w-full mb-5">
        <Spinner aria-label="Loading..." size="md" />
        <span className="ml-5 text-white align-bottom">
          Searching on SUI mainnet for related smart contract...
        </span>
      </p>
      <Skeleton />
    </div>
  );
};

export default SearchStage;
