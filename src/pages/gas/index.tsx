import React, { useState, ChangeEvent, FormEvent } from "react";
import { FaSearch, FaDice, FaTimes } from "react-icons/fa";
import { useRouter } from "next/router";

const SearchBox: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [network, setNetwork] = useState<string>("mainnet"); // Adding state for network selection
  const router = useRouter();

  const digests = ["7ANA7bLXiz5MTqpdXcaBcj5MjzU32jFLuRd4QMzZGSvd"];

  const handleSearch = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!/^[A-Za-z0-9]+$/.test(searchTerm)) {
      setError("Please enter a valid Sui Digest ID");
      return;
    }
    // Including network in the URL
    const additionalParam = network === "mainnet" ? "" : `?network=${network}`;
    router.push(`/gas/${encodeURIComponent(searchTerm)}${additionalParam}`);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (error) setError("");
    setSearchTerm(event.target.value);
  };

  const handleNetworkChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    setNetwork(event.target.value);
  };

  const handleLoadRandomPackage = (): void => {
    let nextIndex = 0; // Default to the first item if not found or is the last
    const currentIndex = digests.findIndex((digest) => digest === searchTerm);

    if (currentIndex >= 0 && currentIndex < digests.length - 1) {
      nextIndex = currentIndex + 1; // Move to the next digest in the array
    }

    const nextDigest = digests[nextIndex];
    setSearchTerm(nextDigest);
    if (error) setError("");
  };

  return (
    <main className="w-full flex items-center justify-center">
      <div className="rounded-lg p-4 bg-[rgb(16,31,61)] max-w-lg w-full mt-20 ">
        <div className="flex justify-center items-end mb-3">
          <div className="flex">
            <img
              // src="/images/suigpt_logo.png"
              src="/images/suigpt-head.png"
              className="w-auto h-[80px]"
            />
            <FaTimes size={24} className="self-end" />
            <img src="/images/Sui_Gas.png" className="w-auto h-[80px]" />
          </div>
        </div>
        <h1 className="text-4xl md:text-xl lg:text-2xl font-bold mb-4 text-center">
          MoveAiBot Gas Viewer
        </h1>
        <form className="flex flex-col items-center" onSubmit={handleSearch}>
          <div className="flex mb-3 w-full">
            <input
              type="text"
              placeholder="Enter Digest"
              className="flex-grow  text-black border-r-2 border-gray-100 bg-white h-12 px-5 rounded-l-lg text-md focus:outline-none"
              value={searchTerm}
              onChange={handleChange}
            />
            <select
              value={network}
              onChange={handleNetworkChange}
              className=" bg-white text-black px-5 py-2 rounded-r-lg focus:outline-none mr-3"
            >
              <option value="mainnet">Mainnet</option>
              <option value="testnet">Testnet</option>
              <option value="devnet">Devnet</option>
            </select>
          </div>
          {error && <p className="text-red-500 mt-4">{error}</p>}
          <div className="flex justify-center w-full mt-4">
            <button
              type="submit"
              className="flex px-3 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 focus:outline-none"
            >
              <FaSearch size={20} className="mr-2" /> View Gas
            </button>
            <button
              onClick={handleLoadRandomPackage}
              type="button"
              className="flex ml-4 px-3 py-1 rounded-lg bg-green-500 hover:bg-green-600 focus:outline-none"
            >
              <FaDice className="mr-2 mt-0.5" /> Load Example Digest
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default SearchBox;
