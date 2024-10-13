import React from "react";
import Popup from "./Popup";

// Define an interface for the component props
interface GetMoreBuckPopUpProps {
  showGetMoreBuckPopUp: boolean;
  setShowGetMoreBuckPopUp: (show: boolean) => void;
  getMoreBuckPopUpMessage: string;
}

function BucketButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="hover:bg-custom-blue hover:bg-opacity-50 h-10 justify-center whitespace-nowrap rounded-[1000px] border border-solid border-[color:var(--main-500,color(display-p3_0.6838_0.9241_1))] bg-[color(display-p3_0.1368_0.1848_0.2)] px-6 text-center text-base text-main-500 xl:h-12 xl:text-lg"
    >
      {children}
    </button>
  );
}

export const GetMoreBuckPopUp: React.FC<GetMoreBuckPopUpProps> = ({
  showGetMoreBuckPopUp,
  setShowGetMoreBuckPopUp,
  getMoreBuckPopUpMessage,
}) => {
  let messageLines = getMoreBuckPopUpMessage.split("\n").map((line, index) => (
    <p key={index} className="">
      {line}
    </p>
  ));
  if (messageLines.length === 2) {
    // Add a line break between the two lines, so put it in the middle
    messageLines[1] = <p>Or you need to own an Sui Frens to continue</p>;
    messageLines.push(
      <p>A owned SuiFrens can be used to redeem 3 decompile or chat per day</p>
    );
  }
  return (
    <Popup isOpen={showGetMoreBuckPopUp} onOpenChange={setShowGetMoreBuckPopUp}>
      <div className="p-0.5 relative flex flex-col items-center justify-start p-0 w-full rounded bg-stroke-decoration">
        <div className="bg-[rgb(16,31,61)] w-full">
          <div className="p-4">
            <div className="text-white">
              <img
                src="/images/suigpt_logo.png"
                // src="/images/suiFren.png"
                alt="MoveAiBot Logo"
                width={150}
                height={100}
              />
              <p className="text-2xl mb-4">
                {messageLines || "You Need BUCK to continue."}
              </p>
              <div className="flex flex-col space-y-2">
                <BucketButton
                  onClick={() => {
                    window.open("https://app.bucketprotocol.io/", "_blank");
                  }}
                >
                  Get some Bucket USD from Bucket Protocol
                </BucketButton>
                <BucketButton
                  onClick={() => {
                    window.open("https://suifrens.com/", "_blank");
                  }}
                >
                  Get your new Sui Frens
                </BucketButton>
                <button
                  onClick={() => {
                    setShowGetMoreBuckPopUp(false);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0">
            <img
              src="/images/bucket_usd_3d.png"
              alt="3D Buck"
              width={200}
              height={100}
            />
          </div>
          <div className="absolute top-5 " style={{ right: "8rem" }}>
            <img
              // src="/images/suigpt_logo.png"
              src="/images/suiFren.png"
              alt="Move AI Logo"
              className="transform scale-x-[-1]"
              width={150}
              height={100}
            />
          </div>
        </div>
      </div>
    </Popup>
  );
};

export default GetMoreBuckPopUp;
