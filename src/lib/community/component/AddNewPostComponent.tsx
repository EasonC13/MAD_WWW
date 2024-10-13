import React, { useState, useEffect, useRef } from "react";
import { FaPlus } from "react-icons/fa";
import { Post } from "@prisma/client";
import axios from "axios";

interface Props {
  posts: Post[];
  setPosts: (posts: Post[]) => void;
  package_id: string;
  module_name: string;
  network: string;
  userAddress: string | undefined;
  signPersonalMessage: any;
}

export const AddNewPostComponent: React.FC<Props> = ({
  posts,
  setPosts,
  package_id,
  module_name,
  network,
  userAddress,
  signPersonalMessage,
}) => {
  const [newPostFormVisible, setNewPostFormVisible] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (newPostFormVisible) {
      textareaRef.current?.focus();
    }
  }, [newPostFormVisible]);

  const submitPost = async () => {
    if (!newPostContent) {
      alert("Post content cannot be empty!");
      return;
    }
    if (!userAddress) {
      alert("Please connect your wallet to post");
      return;
    }
    const postData = {
      author: userAddress,
      content: newPostContent,
      package_id,
      module_name,
      network,
    };
    signPersonalMessage(
      {
        message: new TextEncoder().encode(JSON.stringify(postData)),
      },
      {
        onSuccess: async ({
          bytes,
          signature,
        }: {
          bytes: string;
          signature: string;
        }) => {
          const response = await axios.post("/api/forum/post", postData);
          const newPost: Post = response.data;

          setPosts([newPost, ...posts]);
          setNewPostContent("");
          setNewPostFormVisible(false);
        },
      }
    );
  };

  const toggleNewPostForm = () => {
    setNewPostFormVisible(!newPostFormVisible);
  };

  return (
    <div>
      {!newPostFormVisible && (
        <button
          onClick={toggleNewPostForm}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 transition-all ease-in-out duration-150 flex items-center"
        >
          <FaPlus className="mr-2" /> Add New Post
        </button>
      )}
      {newPostFormVisible && (
        <div className="p-4 relative">
          <textarea
            ref={textareaRef}
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Write your post here in Markdown..."
            className="w-full p-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ease-in-out duration-150"
            rows={4}
          />
          <button
            onClick={submitPost}
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-lg hover:shadow-xl transition-all ease-in-out duration-150"
          >
            Add Your Post
          </button>
          <button
            onClick={toggleNewPostForm}
            className="ml-2 mt-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded shadow-lg hover:shadow-xl transition-all ease-in-out duration-150"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
