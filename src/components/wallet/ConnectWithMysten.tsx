import { ConnectModal } from "@mysten/dapp-kit";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "react-toastify";

const ConnectWithMysten = ({ buttonClass = "" }) => {
  const [showConnectModal, setShowConnectModal] = useState(false);

  const handleConnectError = (error: any) => {
    if (error) {
      toast.error("Cancelled");
    }
  };

  return (
    <>
      <ConnectModal
        // open={showConnectModal}
        trigger={
          <motion.button
            whileHover={{ scale: 1.1 }}
            id="connect-wallet-button"
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={
              buttonClass ||
              "h-[45px] w-[130px] md:w-[150px] rounded-xl bg-[#2e79dc] font-semibold text-white"
            }
          >
            Connect Wallet
          </motion.button>
        }
        // onOpenChange={(open) => setShowConnectModal(open)}
        // onConnectError={handleConnectError}
      ></ConnectModal>
    </>
  );
};

export default ConnectWithMysten;
