import { useState, useEffect, useRef, useContext } from "react";
import {
  FaWindowClose,
  FaExpand,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { syntaxHighlightHandeler } from "../syntaxHighlightHandeler";
import { ChatRoomEventContext } from "./ChatRoomEventProvider";
import { AddNewPostComponent } from "./component/AddNewPostComponent";
import { Post } from "@prisma/client";
import axios from "axios";
import {
  useCurrentWallet,
  useSignPersonalMessage,
  useSignAndExecuteTransactionBlock,
} from "@mysten/dapp-kit";

export const Forum = ({
  package_id,
  module_name,
  network,
}: {
  package_id: string;
  module_name: string;
  network: string;
}) => {
  const { currentWallet, connectionStatus } = useCurrentWallet();
  const {
    mutate: signAndExecuteTransactionBlock,
    mutateAsync: signAndExecuteTransactionBlockAsync,
    isPending,
  } = useSignAndExecuteTransactionBlock();

  const { mutate: signPersonalMessage, mutateAsync: signPersonalMessageAsync } =
    useSignPersonalMessage();

  const userAddress = currentWallet?.accounts[0].address;
  const isConnected = connectionStatus === "connected";

  const [posts, setPosts] = useState<Post[]>([]);
  useEffect(() => {
    const sortedPosts = [...posts].sort((a, b) => b.votes - a.votes);
    const isOrderChanged = sortedPosts.some(
      (post, index) => post.id !== posts[index]?.id
    );

    if (isOrderChanged) {
      setPosts(sortedPosts);
    }
  }, [posts]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const queryParams = new URLSearchParams({
          package_id,
          module_name,
          network,
        }).toString();
        const response = await axios.get(`/api/forum/post?${queryParams}`);
        setPosts(response.data);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      }
    };
    fetchPosts();
  }, [package_id, module_name, network]);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [expandedPosts, setExpandedPosts] = useState<{
    [key: number]: boolean;
  }>({});
  const togglePostExpand = (postId: number) => {
    setExpandedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const tabKey = useRef<string>(Math.random().toString(36).substring(2, 15));
  const { emitOpen, subscribe } = useContext(ChatRoomEventContext);
  const openChatRoom = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      emitOpen(tabKey.current);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const unsubscribe = subscribe((id: string) => {
      if (id !== tabKey.current) {
        setIsOpen(false);
      }
    });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      unsubscribe();
    };
  }, [subscribe]);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const chatRoomStyle = `bg-white text-black px-4 py-2 rounded-lg shadow-lg flex flex-col transition-all duration-300 ${
    isExpanded
      ? "w-[99vw] lg:w-[75vw] h-[80vh]"
      : "w-[60vw] lg:w-[40vw] h-[70vh]"
  }`;

  const handleVote = async (postId: number, voteChange: number) => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    const message = {
      postId,
      voteChange,
      userAccount: userAddress,
    };
    signPersonalMessage(
      {
        message: new TextEncoder().encode(JSON.stringify(message)),
      },
      {
        onSuccess: async ({ bytes, signature }) => {
          const response = await axios.patch("/api/forum/post", message);
          if (response.status === 200) {
            setPosts((currentPosts) =>
              currentPosts.map((post) => {
                if (post.id === postId) {
                  return response.data.post;
                }
                return post;
              })
            );
          } else if (response.status === 208) {
            alert("You have voted already");
          }
        },
      }
    );
  };

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
              Discussion Forum
            </button>
            <button onClick={() => setIsOpen(false)} className="text-sm">
              <FaWindowClose />
            </button>
          </div>
          <AddNewPostComponent
            posts={posts}
            setPosts={setPosts}
            package_id={package_id}
            module_name={module_name}
            network={network}
            userAddress={userAddress}
            signPersonalMessage={signPersonalMessage}
          ></AddNewPostComponent>
          <div className="flex-1 bg-gray-100 p-2 rounded overflow-auto">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white p-4 rounded-lg shadow mb-4"
              >
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <div className="flex flex-row items-center mr-4">
                      <button
                        onClick={() => handleVote(post.id, 1)}
                        className="text-green-500"
                      >
                        <FaArrowUp />
                      </button>
                      <span className="text-gray-700 mx-2">{post.votes}</span>
                      <button
                        onClick={() => handleVote(post.id, -1)}
                        className="text-red-500"
                      >
                        <FaArrowDown />
                      </button>
                    </div>
                  </div>
                  <h5 className="text-sm font-semibold text-gray-500">
                    Posted By: {formatAddress(post.author)}
                    <span className="">
                      {" "}
                      At{" "}
                      {new Date(post.timestamp).toLocaleString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </h5>
                </div>
                <div className="mt-2">
                  <div className="text-gray-800 react-markdown">
                    <ReactMarkdown components={syntaxHighlightHandeler}>
                      {post.content.length > 100 && !expandedPosts[post.id]
                        ? `${post.content.substring(0, 100)}... `
                        : post.content}
                    </ReactMarkdown>
                    {post.content.length > 100 && (
                      <button
                        onClick={() => togglePostExpand(post.id)}
                        className="text-blue-500"
                      >
                        {expandedPosts[post.id] ? "show less" : "show more"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2"></div>
        </div>
      )}
      {!isOpen && (
        <button
          className="bg-white hover:bg-gray-100 text-black font-bold py-2 flex px-4 rounded-full pl-2"
          onClick={openChatRoom}
        >
          <img src="/favicon.ico" className="h-5 w-5 mr-2" alt="Chat Icon" />
          Discussion Forum
        </button>
      )}
    </div>
  );
};

const formatAddress = (address: string) => {
  if (address.length > 10) {
    return `${address.substring(0, 5)}...${address.substring(
      address.length - 4
    )}`;
  }
  return address;
};
