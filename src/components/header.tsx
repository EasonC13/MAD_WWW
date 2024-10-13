"use client";

import { NAV_LIST } from "@/constants/navList";
import Link from "next/link";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { AiOutlineMenu } from "react-icons/ai";
import { IoMdClose } from "react-icons/io";
import Image from "next/image";

import { useCurrentWallet } from "@mysten/dapp-kit";

import WalletConnected from "@/components/wallet/WalletConnected";

import Disconnected from "@/components/wallet/Disconnected";

import DisconnectedInCard from "./wallet/DisconnectedInCard";

// import mixpanel from "mixpanel-browser";
// import { motion } from "framer-motion";
interface HeaderProps {
  scrollingRef: React.RefObject<HTMLDivElement>;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

const Header = ({ scrollingRef, isOpen, setIsOpen }: HeaderProps) => {
  const { currentWallet, connectionStatus } = useCurrentWallet();

  const address = currentWallet?.accounts[0].address;
  const isConnected = connectionStatus === "connected";
  // console.log({
  //   connectionStatus,
  //   address,
  //   currentWallet,
  //   isConnected,
  // });

  const [isSuiGive, setIsSuiGive] = useState(false);
  useEffect(() => {
    if (window.location.origin.includes("sui.gives")) {
      setIsSuiGive(true);
    } else {
      setIsSuiGive(false);
    }
  }, []);

  return (
    <>
      <header className={"left-0 top-0 z-20 w-full bg-[rgb(16,31,61)]"}>
        <div className="max-w-360 mx-auto flex w-full items-center justify-between px-4.5 py-3 md:py-1 px-7 xl:px-20">
          <Link
            href="/"
            className="flex ml-0 sm:ml-2 w-32 md:w-48 xl:w-40 h1 text-xl text-white"
          >
            {/* <Image
              src="/images/MoveAiBot-Picture.png"
              width={9144 / 12}
              height={2355 / 12}
              alt="Logo"
            /> */}
            <div className="flex justify-center items-center">
              <p className="ml-3 border hidden md:flex rounded-lg py-1 px-2 border-white text-white">
                Move AI Decompiler
              </p>
            </div>

            {/* <p className="ml-3 border hidden md:inline rounded-lg p-1 border-black text-black">
              Send
            </p> */}
          </Link>
          <nav className="flex items-center justify-between xl:w-114">
            <div
              className="hidden w-full items-center justify-between md:order-1 md:flex md:w-auto"
              id="navbar-sticky"
            >
              <ul className="mt-0 flex w-64.5 items-center justify-between rounded-lg font-medium md:mx-5">
                {NAV_LIST.map((navItem, index) => {
                  // if navItem.newTab  then target blank
                  let target = "";
                  if (navItem.newTab) {
                    target = "_blank";
                  }

                  return (
                    <li key={`${navItem.name}-${index}`}>
                      <Link
                        href={navItem.path}
                        target={target}
                        className="mx-2 py-2 pl-3 pr-4 text-white hover:bg-gray-500 md:p-0 md:hover:bg-transparent md:hover:text-primary"
                      >
                        {navItem.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex md:order-2">
              {/* <Link
                className="hidden xl:block"
                href="https://suiraffle.xyz"
                target="_blank"
              >
                <button
                  // onClick={() => mixpanel.track("enter_app")}
                  className="h-11 px-6 rounded-xl bg-primary text-secondary text-sm font-medium hover:scale-110 active:scale-90 ease-in-out duration-200"
                >
                  Enter App
                </button>
              </Link> */}
              <div className="hidden md:flex">
                {isConnected ? <WalletConnected /> : <Disconnected />}
              </div>

              {/* <div className="xl:hidden">
                {isConnected ? <WalletConnected /> : <></>}
              </div> */}
              <button
                className="ml-2 mb-2 text-primary hover:text-[#2E79DC] md:hidden"
                onClick={() => setIsOpen(true)}
              >
                <AiOutlineMenu size={40} color="white" />
              </button>
            </div>
          </nav>
        </div>
      </header>
      <div className="max-w-360 mx-auto w-full h-37 bg-transparent"></div>
      <div
        className={
          // "shaow-xl fixed top-0 z-30 flex h-screen w-[75%] flex-col items-center p-6 backdrop-blur-3xl duration-500 ease-in-out xl:hidden " +
          "shaow-xl fixed top-0 z-30 flex h-screen w-[75%] flex-col items-center p-6 backdrop-blur bg-[rgb(16,31,61)] bg-opacity-60 duration-500 ease-in-out xl:hidden " +
          (isOpen ? "right-0" : "right-[-75%]")
        }
      >
        <div className="item-center flex w-full justify-end">
          <button
            className="mb-2 text-white hover:text-gray-500"
            onClick={() => setIsOpen(false)}
          >
            <IoMdClose size={36} />
          </button>
        </div>
        <ul className="mb-6 flex w-full flex-col">
          {NAV_LIST.map((navItem, index) => (
            <Link
              key={`${navItem.name}-${index}`}
              href={navItem.path}
              className="h-full w-full"
              target="_blank"
              // onClick={() => mixpanel.track(`click_${navItem.id}`)}
            >
              <li className="w-full">
                <div className="text-white my-2 w-full rounded px-4 py-2.5 text-2xl text-primary hover:bg-gray-300">
                  {navItem.name}
                </div>
                <div className="mx-4 border-[1px] border-dashed border-gray-500" />
              </li>
            </Link>
          ))}
        </ul>
        {/* <Link href="https://app.bucketprotocol.io/" target="_blank">
          <button
            // onClick={() => mixpanel.track("enter_app")}
            className="rounded-lg bg-primary px-8 py-2.5 text-center text-xl font-medium text-secondary"
          >
            Enter App
          </button>
        </Link> */}
        <div className="text-base md:text-base ">
          {isConnected ? <WalletConnected /> : <DisconnectedInCard />}
        </div>
      </div>
    </>
  );
};

export default Header;
