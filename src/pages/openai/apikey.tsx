import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

const ApiKeyPage: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const storedApiKey = localStorage.getItem("openAI_ApiKey");
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(event.target.value);
  };

  const handleSave = () => {
    localStorage.setItem("openAI_ApiKey", apiKey);
    redirectToDestination();
  };

  const handleDelete = () => {
    localStorage.removeItem("openAI_ApiKey");
    setApiKey("");
    router.reload();
  };

  const redirectToDestination = () => {
    const redirectPath = router.query.redirect
      ? router.query.redirect.toString()
      : "/";

    const url = new URL(redirectPath, window.location.origin);

    Object.keys(router.query).forEach((key) => {
      if (key !== "redirect") {
        url.searchParams.set(key, router.query[key] as string);
      }
    });

    router.push(url.toString());
  };

  return (
    <main className="w-full flex items-center justify-center">
      <div className="rounded-lg p-4 bg-[rgb(16,31,61)] max-w-lg w-full mt-20">
        <h1 className="text-lg md:text-xl lg:text-2xl font-bold mb-4 text-center">
          Use an OpenAI API Key or Access Code
        </h1>
        <p className="mb-4 text-center">
          Enter Your OpenAI API Key (or Access Code)
        </p>
        <input
          type="text"
          placeholder="Enter your OpenAI API Key (sk-xxxxxx) or code"
          className="w-full border-2 text-black border-gray-300 bg-white h-12 px-5 rounded-lg text-md focus:outline-none"
          value={apiKey}
          onChange={handleChange}
        />
        <div className="flex justify-center w-full mt-4">
          <button
            onClick={handleSave}
            className="px-3 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 focus:outline-none"
          >
            Save
          </button>
          {apiKey && (
            <button
              onClick={handleDelete}
              className="ml-4 px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 focus:outline-none"
            >
              Delete
            </button>
          )}
        </div>
        <p className="mt-3">
          You can use MoveAiBot for free if you use your own API Key.
        </p>
        <p className="mt-3">
          The API Key will be stored on your local storage and sent to the
          backend when calling GPT to invoke the OpenAI gpt-4-1106-preview
          model. MoveAiBot backend and database will not store your API Key.
        </p>
        <p className="mt-3">
          The Access Code is for MoveAiBot developers and testers only.
        </p>
      </div>
    </main>
  );
};

export default ApiKeyPage;
