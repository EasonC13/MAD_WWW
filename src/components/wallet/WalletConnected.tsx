import {
  ConvertAddress,
  ConvertAddressSuiNS,
} from "@/components/wallet/ConvertAddress";
import { URLS } from "@/constants/urls";
import {
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
  Typography,
} from "@material-tailwind/react";
import { useCurrentWallet, useDisconnectWallet } from "@mysten/dapp-kit";
import { motion } from "framer-motion";
import { getLiquidlinkReferralUrl } from "liquidlink";
import { useEffect, useState } from "react";
import { AiOutlineCopy } from "react-icons/ai";
import { SlMagnifier } from "react-icons/sl";
import { toast } from "react-toastify";

const Connected = () => {
  const { currentWallet, connectionStatus } = useCurrentWallet();
  const { mutate: disconnectWallet } = useDisconnectWallet();

  const isConnected = connectionStatus === "connected";

  const [showConnectModal, setShowConnectModal] = useState(false);

  const [address, setAddress] = useState(
    currentWallet?.accounts[0].address || ""
  );

  const hex_address = currentWallet?.accounts[0].address || "";

  useEffect(() => {
    let run = async () => {
      let address = await ConvertAddressSuiNS(
        currentWallet?.accounts[0].address || ""
      );
      setAddress(address);
    };
    run();
  }, [currentWallet]);

  const handleDisconnect = async () => {
    disconnectWallet();
  };
  const handleCopyText = async () => {
    await navigator.clipboard
      .writeText(hex_address)
      .then(() => toast.success("Copied to clipboard!"));
  };
  const handleCreateReferralLink = async () => {
    const referralUrl = getLiquidlinkReferralUrl({ referrer: hex_address });
    await navigator.clipboard
      .writeText(referralUrl)
      .then(() => toast.success("Referral link copied to clipboard!"));
  };

  return (
    <Menu placement="bottom" offset={16}>
      <MenuHandler>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="h-[45px] w-[130px] md:w-[150px] rounded-xl bg-[#2e79dc] font-semibold text-white"
        >
          {ConvertAddress(address)}
        </motion.button>
      </MenuHandler>
      <MenuList className="z-100 py-2 px-3 text-black">
        <MenuItem
          className="flex items-center justify-center  gap-2 py-3 hover:bg-[#2e79dc] hover:text-white"
          onClick={handleCopyText}
        >
          <AiOutlineCopy strokeWidth={2} className="h-4 w-4" />
          <Typography variant="small" className="sm:text-sm">
            Copy Address
          </Typography>
        </MenuItem>
        <MenuItem
          className="flex items-center justify-center gap-2 py-3 hover:bg-[#2e79dc] hover:text-white"
          onClick={handleCreateReferralLink}
        >
          <AiOutlineCopy strokeWidth={2} className="h-4 w-4" />
          <Typography variant="small" className="sm:text-sm">
            Create Referral Link
          </Typography>
        </MenuItem>
        <MenuItem
          className="flex items-center justify-center gap-2 py-3 hover:bg-[#2e79dc] hover:text-white"
          onClick={() => window.open(`${URLS.suivision}${hex_address}`)}
        >
          <SlMagnifier strokeWidth={2} className="h-4 w-4" />
          <Typography variant="small" className="text-sm">
            Sui Explorer
          </Typography>
        </MenuItem>
        <div className="my-1 border-t border-t-gray" />
        <MenuItem
          className="flex items-center justify-center gap-2 py-3 hover:bg-[#2e79dc] hover:text-white"
          onClick={handleDisconnect}
        >
          <Typography variant="small" className="text-sm">
            Disconnect
          </Typography>
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default Connected;
