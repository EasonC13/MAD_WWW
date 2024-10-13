import ConnectWithMysten from "@/components/wallet/ConnectWithMysten";

import { useState } from "react";
import { toast } from "react-toastify";

const DisconnectedInCard = () => {
  const [showConnectModal, setShowConnectModal] = useState(false);

  return (
    <>
      {/* <div className="mb-2 mx-2 w-full">
        <ZkLoginWithGoogle />
      </div> */}
      <div className="mx-2 w-full">
        <ConnectWithMysten></ConnectWithMysten>
      </div>
    </>
  );
};

export default DisconnectedInCard;
