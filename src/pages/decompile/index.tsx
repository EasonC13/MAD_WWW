import React, { useState, ChangeEvent, FormEvent } from "react";
import { FaSearch } from "react-icons/fa";
import { useRouter } from "next/router";
import { SuiPackages } from "@/lib/SuiPackages";

const SearchBox: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [exampleSource, setExampleSource] = useState<string>("");
  const [network, setNetwork] = useState<string>("mainnet"); // Network selection state
  const router = useRouter();

  const handleSearch = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    // if (searchTerm.length !== 42) {
    //   setError("Please enter a valid Sui Package ID or TX Hash");
    //   return;
    // }
    router.push(
      `/decompile/${encodeURIComponent(searchTerm)}?network=${network}`
    );
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    if (error) setError("");
    setSearchTerm(event.target.value);
    setExampleSource("");
  };

  const handleSelectPackage = (event: ChangeEvent<HTMLSelectElement>): void => {
    const selectedPackageId = event.target.value;
    setSearchTerm(selectedPackageId);
    setExampleSource(SuiPackages[selectedPackageId]);
    if (error) setError("");
  };

  const handleNetworkChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setNetwork(event.target.value);
  };

  return (
    <main className="w-full flex items-center justify-center">
      <div className="rounded-lg p-4 bg-[rgb(16,31,61)] max-w-xl w-full mt-10 ">
        <div className="mb-5">
          {/* <img src="/images/MoveAiBot_Intro.png" alt="MoveAiBot Intro" /> */}
        </div>
        <div className="">
          <form className="flex flex-col items-center" onSubmit={handleSearch}>
            <div className="flex w-full items-center mr-2 border-2 text-black border-gray-300 bg-white rounded-lg ">
              <input
                type="text"
                placeholder="Enter Package ID"
                className="w-3/4  h-12 px-5 text-md focus:outline-none focus:border-none border-none rounded-lg"
                value={searchTerm}
                onChange={handleChange}
              />
              <select
                className="w-1/4 px-3 py-2 rounded-lg focus:outline-none text-black border-none focus:border-none"
                onChange={handleNetworkChange}
                value={network}
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
                className="flex px-3 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 focus:outline-none border-0"
              >
                <FaSearch size={20} className="mr-2" /> Decompile
              </button>

              <select
                className="ml-4 px-3 py-1 rounded-lg bg-green-500 hover:bg-green-600 focus:outline-none border-0 text-white"
                onChange={handleSelectPackage}
                value={searchTerm}
              >
                <option value="">Select Example Package</option>
                {Object.entries(SuiPackages).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* {exampleSource && (
              <p className="text-green-200 mt-4">
                Example Loaded: {exampleSource}
              </p>
            )} */}
          </form>
        </div>
      </div>
    </main>
  );
};

export default SearchBox;
