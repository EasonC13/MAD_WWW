import {
  useState,
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useContext,
} from "react";
import { FaWindowClose, FaExpand } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { handleChatroomSendMessage } from "../handleChatroomSendMessage";
import { QuickReplyButton } from "../QuickReplyButton";
import { syntaxHighlightHandeler } from "../syntaxHighlightHandeler";
import { ChatRoomEventContext } from "./ChatRoomEventProvider";
import {
  useSignAndExecuteTransactionBlock,
  useSuiClient,
} from "@mysten/dapp-kit";
import { createTransactionBlockToSendBuck } from "@/lib/sui/createTransactionBlockToSendBuck";
import axios from "axios";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { LiquidLinkDappClient, LiquidLinkTransferClient } from "liquidlink";

export interface Message {
  text: string;
  id: number;
  sender: "user" | "assistant";
}
export const Chatroom = ({
  selectedText,
  highlightedText,
  fullText,
  apiKey,
  userAddress,
  setGetMoreBuckPopUpMessage,
  setShowGetMoreBuckPopUp,
}: {
  selectedText: string;
  highlightedText: string;
  fullText: string;
  apiKey: string;
  userAddress: string;
  setGetMoreBuckPopUpMessage: any;
  setShowGetMoreBuckPopUp: any;
}) => {
  const [apiCalling, setApiCalling] = useState(false);
  const suiClient = useSuiClient();
  const {
    mutate: signAndExecuteTransactionBlock,
    mutateAsync: signAndExecuteTransactionBlockAsync,
    isPending,
  } = useSignAndExecuteTransactionBlock();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [botSending, setBotSending] = useState<boolean>(false);
  const [showNotificationDot, setShowNotificationDot] = useState<boolean>(true);
  const [previousSelectedText, setPreviousSelectedText] =
    useState<string>(selectedText);
  const [previousHighlightedText, setPreviousHighlightedText] =
    useState<string>(highlightedText);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const tabKey = useRef<string>(Math.random().toString(36).substring(2, 15));
  const { emitOpen, subscribe } = useContext(ChatRoomEventContext);
  const openChatRoom = () => {
    console.log(tabKey.current);
    setIsOpen(true);
    emitOpen(tabKey.current);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const unsubscribe = subscribe((id: string) => {
      console.log("subscribe", { id });
      if (id !== tabKey.current) {
        setIsOpen(false);
      }
    });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      unsubscribe();
    };
  }, [subscribe]);

  useEffect(() => {
    if (isOpen) {
      setShowNotificationDot(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const isScrolledToBottom = () => {
      const { current } = lastMessageRef;
      if (!current) return false;

      const scrollContainer = current.parentNode as HTMLElement;

      const scrolledToBottom =
        scrollContainer.scrollHeight - scrollContainer.scrollTop <=
        scrollContainer.clientHeight + 100;

      return scrolledToBottom;
    };

    if (lastMessageRef.current && isScrolledToBottom()) {
      lastMessageRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [messages]);

  const quickReplies: JSX.Element[] = [];
  if (highlightedText.length > 0) {
    quickReplies.push(
      <QuickReplyButton
        key="highlight"
        onClick={() => handleQuickReply("Explain Highlighted Code")}
        text="Explain Highlighted Code"
        bgColor="bg-yellow-500 hover:bg-yellow-700 "
        textColor="text-white"
      />
    );
    if (!showNotificationDot && highlightedText !== previousHighlightedText) {
      setShowNotificationDot(true);
      setPreviousHighlightedText(highlightedText);
    }
  }
  if (selectedText.length > 0) {
    quickReplies.push(
      <QuickReplyButton
        key="select"
        onClick={() => handleQuickReply("Explain Selected Code")}
        text="Explain Selected Code"
        bgColor="bg-blue-500 hover:bg-blue-700 "
        textColor="text-white"
      />
    );
    if (!showNotificationDot && selectedText !== previousSelectedText) {
      setShowNotificationDot(true);
      setPreviousSelectedText(selectedText);
    }
  }
  if (quickReplies.length < 2) {
    quickReplies.unshift(
      <QuickReplyButton
        key="summary"
        onClick={() => handleQuickReply("Summary the smart contract")}
        text="Summary the smart contract"
        bgColor="bg-green-500 hover:bg-green-700 "
        textColor="text-white"
      />
    );
  }

  const payAndSendMessage = async (message: string) => {
    if (botSending) return;
    let tx_digest = "";
    setBotSending(true);
    if (!userAddress) {
      const connectWalletButton = document.getElementById(
        "connect-wallet-button"
      );
      if (connectWalletButton) {
        connectWalletButton.click();
      }
      setBotSending(false);
      return;
    }

    if (apiKey && !apiKey.startsWith("sk-")) {
      await sendMessage(message, "", apiKey, userAddress);
      setBotSending(false);
      return;
    }
    if (apiKey) {
      await sendMessage(message, "", apiKey, userAddress);
      setBotSending(false);
      return;
    }

    try {
      // let amount_to_input = 5 * 10 ** 9;
      let amount_to_input = 0;
      if (apiKey) {
        // amount_to_input = 0.1 * 10 ** 9;
      } else {
        amount_to_input = 1 * 10 ** 9;
      }
      const txb = new TransactionBlock();

      const liquidLinkTransferClient = new LiquidLinkTransferClient({
        network: "mainnet",
      });
      const userCoins = await liquidLinkTransferClient.getUserCoins({
        address: userAddress,
      });

      liquidLinkTransferClient.MoveCallMakeTransfer({
        txb,
        userCoins,
        coinType: process.env.NEXT_PUBLIC_BUCKET_USD_COIN_TYPE as string,
        amount: amount_to_input,
        receiver: process.env.NEXT_PUBLIC_SUIGPT_SUI_ADDRESS as string,
        note: "MoveAiBot: Chat",
      });

      const liquidLinkDappClient = new LiquidLinkDappClient({
        dapp_index: 0,
      });

      liquidLinkDappClient.MoveCallCreateUpdateRequest({
        txb,
      });
      console.log(txb.blockData);
      const { digest } = await signAndExecuteTransactionBlockAsync({
        transactionBlock: txb,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });
      let tx_digest = digest;
      await suiClient.waitForTransactionBlock({ digest });
      await sendMessage(message, tx_digest, apiKey, userAddress);
    } catch (e: any) {
      if (e.message.includes("Insufficient balance")) {
        setGetMoreBuckPopUpMessage(
          e.message.replace("Insufficient balance. ", "")
        );
        setShowGetMoreBuckPopUp(true);
      } else {
        console.log(e);
        let context = JSON.stringify({
          tx_digest: tx_digest || undefined,
          user: userAddress || undefined,
        });
        axios
          .post("/api/error/log", {
            message: e.message,
            context,
          })
          .then((response) => {});
        // throw e;
      }
    } finally {
      setBotSending(false);
    }
  };

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (botSending) return;
    if (!message.trim()) return;
    payAndSendMessage(message);
  };

  const sendMessage = handleChatroomSendMessage(
    setMessages,
    messages,
    lastMessageRef,
    setBotSending,
    setMessage,
    highlightedText,
    fullText,
    selectedText
  );

  const handleQuickReply = (text: string) => {
    payAndSendMessage(text);
  };

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const chatRoomStyle = `bg-white text-black px-4 py-2 rounded-lg shadow-lg flex flex-col transition-all duration-300 ${
    isExpanded
      ? "w-[99vw] lg:w-[75vw] h-[80vh]"
      : "w-[60vw] lg:w-[40vw] h-[70vh]"
  }`;

  return (
    <div className="flex items-end justify-end mt-1">
      {isOpen && (
        <div className={chatRoomStyle}>
          <div className="flex justify-between items-center mb-2">
            <button onClick={toggleExpand} className="text-sm mr-2">
              <FaExpand />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-lg font-semibold flex-1 flex"
            >
              <img
                src="/favicon.ico"
                className="h-6 w-6 mr-2"
                alt="Chat Icon"
              />{" "}
              Move AI Bot
            </button>
            <button onClick={() => setIsOpen(false)} className="text-sm">
              <FaWindowClose />
            </button>
          </div>
          <div className="flex-1 bg-gray-100 p-2 rounded overflow-auto">
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`react-markdown my-2 p-2 rounded-lg ${
                  msg.sender === "user"
                    ? "bg-gray-600 text-white ml-auto"
                    : "bg-gray-300 text-black mr-auto"
                }`}
                style={{
                  maxWidth: "90%",
                  float: msg.sender === "user" ? "right" : "left",
                  clear: "both",
                }}
              >
                <ReactMarkdown components={syntaxHighlightHandeler}>
                  {msg.text}
                </ReactMarkdown>
              </div>
            ))}
            <div
              ref={lastMessageRef}
              style={{
                float: "left",
                clear: "both",
              }}
            ></div>
          </div>
          <div className="mt-2">
            <form onSubmit={handleSendMessage} className="flex flex-col">
              {!botSending && quickReplies.length > 0 && (
                <div className="flex justify-around mb-2">{quickReplies}</div>
              )}
              <input
                type="text"
                className="w-full p-2 border rounded mb-2"
                placeholder="Type your message..."
                value={message}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setMessage(e.target.value)
                }
              />
            </form>
          </div>
        </div>
      )}
      {!isOpen && (
        <button
          className="bg-white hover:bg-gray-100 text-black font-bold py-2 flex px-4 rounded-full pl-2"
          onClick={openChatRoom}
        >
          <img src="/favicon.ico" className="h-5 w-5 mr-2" alt="Chat Icon" />
          Chat with Move AI Bot
          {showNotificationDot && (
            <span
              className="absolute bottom-8 left-0 h-[1.5em] w-[1.5em] rounded-full bg-red-600 flex justify-center items-center text-xs"
              style={{ lineHeight: "1em" }}
            >
              {/* {quickReplies.length} */}!
            </span>
          )}
        </button>
      )}
    </div>
  );
};
