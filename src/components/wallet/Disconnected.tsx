import ConnectWithMysten from "@/components/wallet/ConnectWithMysten";

import { useState } from "react";
import { toast } from "react-toastify";

const Disconnected = () => {
  const [showConnectModal, setShowConnectModal] = useState(false);

  return (
    <>
      <div>
        <ConnectWithMysten />
      </div>
    </>
  );
};

export default Disconnected;
