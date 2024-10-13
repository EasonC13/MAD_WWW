import { useRouter } from "next/router";
import React, { useState, useRef, useEffect, RefObject } from "react";
import RingAnimation from "@/components/animation/RingAnimation";
import hljs from "highlight.js/lib/core";
import rust from "highlight.js/lib/languages/rust";
import "highlight.js/styles/nord.css";
import {
  useCurrentWallet,
  useSignAndExecuteTransactionBlock,
  useSignPersonalMessage,
  useSuiClient,
} from "@mysten/dapp-kit";
import axios from "axios";
import { processGeneratedCode } from "@/lib/processGeneratedCode";
import { ModulesMap } from "@/lib/types";
import { logDecompileProcess } from "@/lib/logDecompileProcess";
import { locker_smart_contract } from "../../lib/utils/locker_smart_contract";
import { Chatroom } from "../../lib/community/Chatroom";
import { Forum } from "../../lib/community/Forum";
import { splitCodeLinesByHighlightRange } from "@/lib/splitCodeLinesByHighlightRange";
import { ModuleSelector } from "../../components/decompile/ModuleSelector";
import { LanguageSelector } from "../../components/decompile/LanguageSelector";
import { LeftBottomButtonWrapper } from "@/lib/LeftBottomButtonWrapper";
import { ChatRoomEventProvider } from "@/lib/community/ChatRoomEventProvider";
import { replace_use_modules as replace_mapping_key_to_value } from "../../lib/process_output_code";
import { update_display_output_code } from "@/lib/update_display_output_code";
import { Mutex } from "async-mutex";
import { MdCheck, MdContentCopy } from "react-icons/md";
import { ProcessProgress } from "@/lib/processProgress";
import { GetMoreBuckPopUp } from "../../components/popup/GetMoreBuckPopUp";
import { LiquidLinkDappClient, LiquidLinkTransferClient } from "liquidlink";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { calculateSHA256 } from "@/lib/encrypt_utils";
import { KioskClient, Network } from "@mysten/kiosk";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { ToUint8Array } from "@/lib/utils/stringToUint8Array";
import { source, revela, suigpt } from "@/lib/interview/sample_code";

hljs.registerLanguage("rust", rust);
interface LineRefs {
  [key: number]: RefObject<HTMLButtonElement>;
}

const Move_Disassembled_Default_Code =
  "// Loading... (This may take a few second)";
const MoveAiBot_Default_Code =
  "Click the button below to decompile the code by MoveAiBot.";
const Interface_Default_Code =
  "Click the button below to generate the interface code by MoveAiBot.";
const Revela_Default_Code =
  "Click the button below to generate the revela decompiler's output.";
const Source_Code_Default_Code =
  "Click the button below to fetch the source code.";
const Default_Fetching = "// Fetching the API... Please wait...";

const PackageIdPage: React.FC = () => {
  const [apiCalling, setApiCalling] = useState(false);
  const [shiftPressed, setShiftPressed] = useState(false);
  const [highlightStart, setHighlightStart] = useState<number | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const [highlightedText, setHighlightedText] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showGetMoreBuckPopUp, setShowGetMoreBuckPopUp] = useState(false);
  const [getMoreBuckPopUpMessage, setGetMoreBuckPopUpMessage] = useState("");
  const [currentCode, setCurrentCode] = useState("");

  const { currentWallet, connectionStatus } = useCurrentWallet();
  const {
    mutate: signAndExecuteTransactionBlock,
    mutateAsync: signAndExecuteTransactionBlockAsync,
    isPending,
  } = useSignAndExecuteTransactionBlock();
  const {
    mutate: signPersonalMessage,
    mutateAsync: signPersonalMessageAsync,
    isPending: isSignPersonalMessagePending,
  } = useSignPersonalMessage();
  const userAddress = currentWallet?.accounts[0].address;

  const [ownWantedNfts, setOwnWantedNfts] = useState<any[]>([]);

  useEffect(() => {
    const getOwnNfts = async () => {
      if (!userAddress) return;
      console.log("getOwnedObjects");
      setApiCalling(false);
      const client = new SuiClient({ url: getFullnodeUrl("mainnet") });
      const kioskClient = new KioskClient({
        client,
        network: Network.MAINNET,
      });

      const wantedNfts = [];
      const { kioskOwnerCaps, kioskIds } = await kioskClient.getOwnedKiosks({
        address: userAddress,
      });

      const allowedStartTypes = [
        "0xee496a0cc04d06a345982ba6697c90c619020de9e274408c7819f787ff66e1a1::suifrens::SuiFren",
      ];
      for (const kioskId of kioskIds) {
        const kiosk = await kioskClient.getKiosk({ id: kioskIds[0] });
        const nfts = kiosk.items.filter((nft) => {
          for (const allowedStartType of allowedStartTypes) {
            if (nft.type.startsWith(allowedStartType)) {
              return true;
            }
          }
        });
        wantedNfts.push(
          ...nfts.map((nft) => {
            return {
              kioskId: nft.kioskId,
              objectid: nft.objectId,
            };
          })
        );
      }

      const wantedNftResult = await client.getOwnedObjects({
        owner: userAddress,
        filter: {
          MatchAny: [
            {
              Package:
                "0xee496a0cc04d06a345982ba6697c90c619020de9e274408c7819f787ff66e1a1",
            },
          ],
        },
      });
      const wantedNftData = wantedNftResult.data;
      for (const wantedNftData_ of wantedNftData) {
        if (!wantedNftData_.data) continue;
        wantedNfts.push({
          kioskId: "",
          objectid: wantedNftData_.data.objectId,
        });
      }

      if (wantedNfts.length != 0) {
      }
      setOwnWantedNfts(wantedNfts);
      return;
    };
    getOwnNfts();
  }, [userAddress]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        setShiftPressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        setShiftPressed(false);
        setHighlightStart(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
  const lineButtonClicked = (lineNumber: number) => {
    if (highlightStart === lineNumber) {
      setHighlightStart(null);
      const { h, ...restOfQuery } = router.query;
      router.push(
        {
          pathname: router.pathname,
          query: { ...restOfQuery },
        },
        undefined,
        { shallow: true }
      );
      return;
    }
    if (shiftPressed && highlightStart !== null) {
      const start = Math.min(highlightStart, lineNumber);
      const end = Math.max(highlightStart, lineNumber);
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, h: `${start}-${end}` },
        },
        undefined,
        { shallow: true }
      );
    } else {
      setHighlightStart(lineNumber);
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, h: `${lineNumber}-${lineNumber}` },
        },
        undefined,
        { shallow: true }
      );
    }
  };

  const [apiKey, setApiKey] = useState<string | null>(null);

  const router = useRouter();
  const {
    package_id,
    module: queryModule,
    language: queryLanguage,
    h,
  } = router.query;

  const lineRefs: React.MutableRefObject<LineRefs> = useRef({});
  const codeContainerRef = useRef<HTMLDivElement>(null);
  const [scrollToHighlight, setScrollToHighlight] = useState(false);
  useEffect(() => {
    if (scrollToHighlight && highlightStart) {
      const lineRef = lineRefs.current[highlightStart];
      if (lineRef && lineRef.current) {
        lineRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [scrollToHighlight]);
  const [codeLanguage, setCodeLanguage] = useState("move_bytecode");
  const [ready, setReady] = useState(false);

  const [inited, setInited] = useState(false);
  const [dispalyDecompileButton, setDisplayDecompileButton] = useState(false);
  const [modules, setModules] = useState<ModulesMap>({});
  const [processTasks, setProcessTasks] = useState<any>({});

  const [selectedModule, setSelectedModule] = useState<string>(
    (queryModule as string) || ""
  );
  const [isDecompiledMap, setIsDecompiledMap] = useState<any>({});
  const [scrollPositions, setScrollPositions] = useState<any>({});
  const [showTaskDescription, setShowTaskDescription] = useState(false);
  const suiClient = useSuiClient();

  useEffect(() => {
    const storedApiKey = localStorage.getItem("openAI_ApiKey");
    setApiKey(storedApiKey);
  }, []);

  useEffect(() => {
    const storedScrollPositions = localStorage.getItem("scrollPositions");
    if (storedScrollPositions) {
      setScrollPositions(JSON.parse(storedScrollPositions));
    }
  }, []);

  useEffect(() => {
    if (queryLanguage) {
      setCodeLanguage(queryLanguage as string);
    }
  }, [queryLanguage]);

  useEffect(() => {
    if (lineRefs.current && selectedModule && codeLanguage) {
      const key = `${selectedModule}-${codeLanguage}`;
      const scrollPosition = scrollPositions[key];
      if (scrollPosition !== undefined && codeContainerRef.current) {
        codeContainerRef.current.scrollTop = scrollPosition;
      }
    }
  }, [selectedModule, codeLanguage, scrollPositions]);

  useEffect(() => {
    const handleScroll = () => {
      if (selectedModule && codeLanguage && codeContainerRef.current) {
        const key = `${selectedModule}-${codeLanguage}`;
        const scrollPosition = codeContainerRef.current.scrollTop;
        setScrollPositions((prev: any) => {
          const newPositions = { ...prev, [key]: scrollPosition };
          localStorage.setItem("scrollPositions", JSON.stringify(newPositions));
          return newPositions;
        });
      }
    };

    if (codeContainerRef.current) {
      codeContainerRef.current.addEventListener("scroll", handleScroll);
      return () => {
        codeContainerRef.current?.removeEventListener("scroll", handleScroll);
      };
    }
  }, [selectedModule, codeLanguage]);

  useEffect(() => {
    const run = async () => {
      const result = await axios.get(
        "/interview_examples/0x4b57e7c0949d25f52c63768fca13e0ff270b5326eb554f0f84c16f6ff5993e32.json"
      );
      setCurrentCode(result.data[codeLanguage]);
      // if (codeLanguage == "source_code") {
      //   setCurrentCode("source_code");
      // } else if (codeLanguage == "gpt4o") {
      //   setCurrentCode("gpt4o");
      // } else if (codeLanguage == "gpt4-1106") {
      //   setCurrentCode("1106");
      // } else if (codeLanguage == "revela") {
      //   setCurrentCode("revela");
      // }
    };
    run();
  }, [codeLanguage]);

  useEffect(() => {
    let run = async () => {
      if (!inited && package_id) {
        setInited(true);
        let pkg: any = await suiClient.getObject({
          id: package_id as string,
          options: { showBcs: true },
        });
        const moduleMap: ModulesMap = {};
        Object.keys(pkg.data.bcs.moduleMap).forEach((moduleName) => {
          moduleMap[moduleName] = {
            move_bytecode: pkg.data.bcs.moduleMap[moduleName],
            move_disassembled: Move_Disassembled_Default_Code,
            suigpt_decompiled: MoveAiBot_Default_Code,
            interface: Interface_Default_Code,
            revela: Revela_Default_Code,
            source_code: Source_Code_Default_Code,
          };
        });
        setModules(moduleMap);

        if (!selectedModule && Object.keys(pkg.data.bcs.moduleMap).length > 0) {
          setSelectedModule(
            (queryModule as string) || Object.keys(pkg.data.bcs.moduleMap)[0]
          );
        }
        setReady(true);
        await fetchDisassembled(moduleMap);
      }
    };
    run();
  }, [package_id, suiClient]);

  const updateUrlParams = (newModule?: string, newLanguage?: string) => {
    const query = {
      ...router.query,
      module: newModule || selectedModule,
      language: newLanguage || codeLanguage,
    };
    router.push({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    });
  };

  const redirectToApiKeyPage = () => {
    const currentQueryParams = new URLSearchParams(
      router.query as any
    ).toString();
    const redirectUrl = `/openai/apikey?redirect=/decompile/${package_id}${
      currentQueryParams ? `?${currentQueryParams}` : ""
    }#code`;
    router.push(redirectUrl);
  };

  const generateInterface = async (selectedModule: string) => {
    if (
      modules[selectedModule].interface != Interface_Default_Code &&
      modules[selectedModule].interface != Default_Fetching &&
      !modules[selectedModule].suigpt_decompiled.startsWith(
        "Error in decompilation:"
      )
    ) {
      return;
    }
    modules[selectedModule].interface = Default_Fetching;
    setModules({ ...modules });
    setIsDecompiledMap({ ...isDecompiledMap, selectedModule: true });

    setTimeout(async () => {
      await logDecompileProcess(
        package_id as string,
        selectedModule,
        "",
        "start"
      );
    }, 0);

    try {
      const response = await axios.post("/api/move/generate_interface", {
        move_base64: modules[selectedModule].move_bytecode,
        openai_api_key: apiKey,
      });
      const { data } = response;

      if (!data) {
        modules[
          selectedModule
        ].interface = `Failed to decompile the code.\nPlease try again later.\nOr check your OpenAI API Key is valid.`;
      }

      const first_line = data["decompiled_by_algorithm"]["first_line"];
      const use_statements = data["interfaceUseStatements"].join("\n");
      const packageReplacementMap = data["packageReplacementMap"];
      const structs = data["decompiled_by_algorithm"]["struct"].join("\n\n");
      const structs_processed = replace_mapping_key_to_value(
        structs,
        packageReplacementMap
      );
      const resultDict: { [key: string]: string } = {};
      const dictForResultStart: { [key: string]: string } = {};
      const resultDictKeys: string[] = [];
      const chunkStarts: { [key: string]: string } = {};

      let decompiled_code_prefix = `${first_line}\n`;

      if (use_statements) {
        decompiled_code_prefix += `\n    // ----- Use Statements -----\n\n${use_statements}\n`;
      }

      if (structs_processed) {
        decompiled_code_prefix += `\n    // ----- Structs -----\n\n${structs_processed}\n`;
      }

      const decompiled_code_postfix = "\n}";

      const updateOutputCode = () => {
        update_display_output_code(
          resultDict,
          chunkStarts,
          resultDictKeys,
          decompiled_code_prefix,
          decompiled_code_postfix,
          modules,
          selectedModule,
          setModules,
          "interface"
        );
      };
      updateOutputCode();

      ["public"].forEach((section) => {
        const code_chunks = data["contract_interface"][section];
        code_chunks.forEach((chunk: string, index: number) => {
          const key = `${section}:${index}`;
          let processed_code = processGeneratedCode(
            data["contract_interface"][section][index]
          );
          chunkStarts[key] =
            data["contract_header_that_need_further_processing"][section][
              index
            ];
          processed_code = replace_mapping_key_to_value(
            processed_code,
            packageReplacementMap
          );
          resultDictKeys.push(key);
          resultDict[key] = processed_code;
          updateOutputCode();
        });
      });
    } catch (error) {
      console.error("Error in decompilation:", error);
      modules[
        selectedModule
      ].interface = `Error in decompilation:\n${error}.\n\nPlease try again later.\nOr check your OpenAI API Key is valid.`;
    } finally {
      setIsDecompiledMap(false);
    }
  };

  const fetchSourceCode = async (selectedModule: string) => {
    if (
      modules[selectedModule].source_code != Source_Code_Default_Code &&
      modules[selectedModule].source_code != Default_Fetching
    ) {
      return;
    }

    modules[selectedModule].source_code = Default_Fetching;
    setModules({ ...modules });

    try {
      const response = await axios.post("/api/move/source_code", {
        package_id: package_id,
      });

      const { data } = response;

      if (!data) {
        modules[
          selectedModule
        ].source_code = `Failed to fetch the source code.\nPlease try again later.`;
      } else {
        modules[selectedModule].source_code = data.source_code;
      }
      setModules({ ...modules });
    } catch (error) {
      console.error("Error fetching source code:", error);
      modules[
        selectedModule
      ].source_code = `Error fetching source code:\n${error}.\n\nPlease try again later.`;
    }
  };

  const generateRevela = async (selectedModule: string) => {
    console.log(modules[selectedModule]);
    if (
      modules[selectedModule].revela != "" &&
      modules[selectedModule].revela != Default_Fetching &&
      modules[selectedModule].revela != Revela_Default_Code
    ) {
      return;
    }
    modules[selectedModule].revela = Default_Fetching;
    setModules({ ...modules });
    setIsDecompiledMap({ ...isDecompiledMap, selectedModule: true });

    try {
      const response = await axios.post("/api/move/revela", {
        move_base64: modules[selectedModule].move_bytecode,
      });

      const { data } = response;

      if (!data) {
        modules[
          selectedModule
        ].revela = `Failed to decompile the code.\nPlease try again later.`;
      }

      modules[selectedModule].revela = data.decompiled_code;
      setModules({ ...modules });
    } catch (error) {
      console.error("Error in decompilation:", error);
      modules[
        selectedModule
      ].revela = `Error in decompilation:\n${error}.\n\nPlease try again later.`;
    } finally {
      setIsDecompiledMap(false);
    }
  };

  const handleRedecompileButtonClick = async () => {
    modules[selectedModule].suigpt_decompiled = MoveAiBot_Default_Code;
    handleDecompileButtonClick();
  };

  const handleDecompileButtonClick = async () => {
    setApiCalling(true);
    if (!userAddress) {
      const connectWalletButton = document.getElementById(
        "connect-wallet-button"
      );
      if (connectWalletButton) {
        connectWalletButton.click();
      }
      return;
    }
    if (ownWantedNfts.length != 0) {
      let signatureResult;
      try {
        const message = ownWantedNfts[0];
        signatureResult = await signPersonalMessageAsync({
          message: ToUint8Array(message),
        });
      } catch (e) {}
      if (signatureResult) {
        await generateDeCompiled({
          selectedModule,
          signature: JSON.stringify(signatureResult),
        });
        setApiCalling(false);
        return;
      }
    }
    if (apiKey && !apiKey.startsWith("sk-")) {
      await generateDeCompiled({ selectedModule });
      setApiCalling(false);
      return;
    }
    if (apiKey && apiKey.startsWith("sk-")) {
      await generateDeCompiled({ selectedModule });
      setApiCalling(false);
      return;
    } else {
      let tx_digest = "";
      try {
        const liquidLinkTransferClient = new LiquidLinkTransferClient({
          network: "mainnet",
        });
        const userCoins = await liquidLinkTransferClient.getUserCoins({
          address: userAddress,
        });

        const txb = new TransactionBlock();

        const count_function_amount = await axios.post(
          "/api/move/count_function_amount",
          {
            move_base64: modules[selectedModule].move_bytecode,
          }
        );
        const { function_count } = count_function_amount.data;
        const amount_to_input = Math.round(function_count * 0.3 * 10 ** 9);
        liquidLinkTransferClient.MoveCallMakeTransfer({
          txb,
          userCoins,
          coinType: process.env.NEXT_PUBLIC_BUCKET_USD_COIN_TYPE as string,
          amount: amount_to_input,
          receiver: process.env.NEXT_PUBLIC_SUIGPT_SUI_ADDRESS as string,
          note: "MoveAiBot: Decompile",
        });

        const liquidLinkDappClient = new LiquidLinkDappClient({
          dapp_index: 0,
        });

        liquidLinkDappClient.MoveCallCreateUpdateRequest({
          txb,
        });

        const { digest } = await signAndExecuteTransactionBlockAsync({
          transactionBlock: txb,
          options: {
            showEffects: true,
            showEvents: true,
            showObjectChanges: true,
          },
        });
        let tx_digest = digest;
        setApiCalling(false);
        await generateDeCompiled({ selectedModule, digest });
      } catch (e: any) {
        if (e.message.includes("Insufficient balance")) {
          setGetMoreBuckPopUpMessage(
            e.message.replace("Insufficient balance. ", "")
          );
          setShowGetMoreBuckPopUp(true);
        } else {
          let context = JSON.stringify({
            tx_digest: tx_digest || undefined,
            user: userAddress || undefined,
          });
          console.log(e.message, e);
          axios
            .post("/api/error/log", {
              message: e.message,
              context,
            })
            .then((response) => {});
        }
      } finally {
        setApiCalling(false);
      }
    }
  };

  const generateDeCompiled = async ({
    selectedModule,
    digest = "",
    signature = "",
  }: {
    selectedModule: string;
    digest?: string;
    signature?: string;
  }) => {
    const network = "mainnet";

    if (
      modules[selectedModule].suigpt_decompiled != MoveAiBot_Default_Code &&
      modules[selectedModule].suigpt_decompiled != Default_Fetching &&
      !modules[selectedModule].suigpt_decompiled.startsWith(
        "Error in decompilation:"
      )
    ) {
      return;
    }
    modules[selectedModule].suigpt_decompiled = Default_Fetching;
    setModules({ ...modules });
    setIsDecompiledMap({ ...isDecompiledMap, selectedModule: true });

    setTimeout(async () => {
      await logDecompileProcess(
        package_id as string,
        selectedModule,
        modules[selectedModule].move_bytecode,
        "start"
      );
    }, 0);

    try {
      const response = await axios.post("/api/move/create_prompt_input", {
        move_base64: modules[selectedModule].move_bytecode,
        openai_api_key: apiKey,
        digest,
        signature,
        user: userAddress || "",
      });
      const { data } = response;

      if (!data) {
        modules[
          selectedModule
        ].suigpt_decompiled = `Failed to decompile the code.\nPlease try again later.\nOr check your OpenAI API Key is valid.`;
      }
      const dataReplacementMap = data["dataReplacementMap"];

      const first_line = data["decompiled_by_algorithm"]["first_line"];
      const use_statements = data["useStatements"].join("\n");
      const packageReplacementMap = data["packageReplacementMap"];
      const structs = data["decompiled_by_algorithm"]["struct"].join("\n\n");
      const structs_processed = replace_mapping_key_to_value(
        structs,
        packageReplacementMap
      );
      const resultDict: { [key: string]: string } = {};
      const dictForResultStart: { [key: string]: string } = {};
      const resultDictKeys: string[] = [];
      const chunkStarts: { [key: string]: string } = {};

      let decompiled_code_prefix = `${first_line}\n`;

      if (use_statements) {
        decompiled_code_prefix += `\n    // ----- Use Statements -----\n\n${use_statements}\n`;
      }

      if (structs_processed) {
        decompiled_code_prefix += `\n    // ----- Structs -----\n\n${structs_processed}\n`;
      }

      const decompiled_code_postfix = "\n}";

      const updateOutputCode = () => {
        update_display_output_code(
          resultDict,
          chunkStarts,
          resultDictKeys,
          decompiled_code_prefix,
          decompiled_code_postfix,
          modules,
          selectedModule,
          setModules
        );
      };
      updateOutputCode();
      const mutex = new Mutex();
      const processed_code_chunks = async (key: string, chunk: string) => {
        dictForResultStart[key] = chunk;
        const response = await fetch("/api/move/decompile_chunk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chunk_move_base64: chunk,
            openai_api_key: apiKey,
          }),
        });
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        const data = response.body;
        if (!data) {
          return;
        }
        const reader = data.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let all_text = "";
        let token = 0;
        while (!done) {
          token += 1;
          const data = await reader.read();
          const { value, done: doneReading } = data;
          done = doneReading;
          const textChunk = decoder.decode(value);

          all_text += textChunk;
          let processed_code = processGeneratedCode(all_text);
          processed_code = replace_mapping_key_to_value(
            processed_code,
            packageReplacementMap
          );
          processed_code = replace_mapping_key_to_value(
            processed_code,
            dataReplacementMap
          );
          const mutex_release = await mutex.acquire();
          resultDict[key] = processed_code;
          mutex_release();
          updateOutputCode();
        }
        const mutex_release = await mutex.acquire();
        processTasks[key] = true;
        setProcessTasks({ ...processTasks });
        mutex_release();
      };

      const promises: any[] = [];

      ["init", "internal", "public"].forEach((section) => {
        const code_chunks = data["byte_need_further_processing"][section];

        code_chunks.forEach((chunk: string, index: number) => {
          const key = `${section}:${index}`;
          resultDict[key] = "";
          chunkStarts[key] =
            data["contract_header_that_need_further_processing"][section][
              index
            ];
          resultDictKeys.push(key);
          const promise = processed_code_chunks(key, chunk);
          processTasks[key] = false;
          promises.push(promise);
        });
      });
      setProcessTasks({ ...processTasks });
      await Promise.all(promises);
      setTimeout(async () => {
        await logDecompileProcess(
          package_id as string,
          selectedModule,
          modules[selectedModule].move_bytecode,
          "complete",
          modules[selectedModule]["suigpt_decompiled"]
        );
      }, 0);

      setTimeout(async () => {
        axios.post("/api/move/cache", {
          bytecode: modules[selectedModule].move_bytecode,
          decompiledCode: modules[selectedModule]["suigpt_decompiled"],
          encryptedBytecodeHash: data.encryptedBytecodeHash,
          network: network || "mainnet",
          moduleName: selectedModule,
          packageId: package_id as string,
        });
      }, 0);

      data.encryptedBytecodeHash;
      modules[selectedModule].move_bytecode;
    } catch (error) {
      console.error("Error in decompilation:", error);
      modules[
        selectedModule
      ].suigpt_decompiled = `Error in decompilation:\n${error}.\n\nPlease try again later.\nOr check your OpenAI API Key is valid.`;
      throw error;
    } finally {
      setIsDecompiledMap(false);
    }
  };

  const fetchDisassembled = async (moduleMap: ModulesMap) => {
    const promises = Object.keys(moduleMap).map(async (moduleName) => {
      try {
        const response = await axios.post("/api/move/disassemble", {
          move_base64: moduleMap[moduleName].move_bytecode,
        });

        moduleMap[moduleName].move_disassembled =
          response.data.move_disassembled;
      } catch (error) {
        console.error("Error fetching disassembled code:", error);
      }
    });

    await Promise.all(promises);

    setModules({ ...moduleMap });
  };

  const getButtonStyle = (language: string) => {
    return `flex-1 ${
      codeLanguage === language ? "bg-blue-500" : "bg-gray-700"
    } hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg`;
  };

  const getModuleButtonStyle = (moduleName: string) => {
    return `${
      selectedModule === moduleName ? "bg-blue-500" : "bg-gray-700"
    } hover:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg`;
  };

  if (!ready) {
    return <div>Loading...</div>;
  }

  const displayCode = () => {
    let code = currentCode;

    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (selection) {
        const selectedText = selection.toString();
        setSelectedText(selectedText);
      }
    };
    const copyToClipboard = () => {
      const codeToCopy = code;
      navigator.clipboard.writeText(codeToCopy).then(
        () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        },
        (err) => {
          setCopied(false);
          console.error("Error copying text: ", err);
        }
      );
    };
    if (!code) {
      return;
    }
    let { codeBefore, codeHighlight, codeAfter, start, end } =
      splitCodeLinesByHighlightRange(code, h as string);
    if (codeHighlight != highlightedText) {
      setHighlightedText(codeHighlight);
    }
    const totalLines = code.split("\n").length;
    const lineNumbers = [];
    for (let i = 1; i <= totalLines; i++) {
      if (!lineRefs.current[i]) {
        lineRefs.current[i] = React.createRef();
      }
      lineNumbers.push(
        <button
          key={i}
          ref={lineRefs.current[i]}
          onClick={() => lineButtonClicked(i)}
          className="text-gray-400 hover:bg-gray-700 rounded mr-3"
          style={{ display: "block", textAlign: "left", width: "100%" }}
        >
          {i}
        </button>
      );
    }

    if (!codeHighlight || codeLanguage === "move_disassembled") {
      return (
        <div className="w-[400px] md:w-[600px] lg:w-[800px] xl:w-[1000px] 2xl:w-[1350px] relative">
          <div className="absolute top-0 right-0 m-4 mt-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 text-white font-bold py-2 px-4 rounded"
            >
              {copied ? <MdCheck size="20" /> : <MdContentCopy size="20" />}
              Copy
            </button>
          </div>
          <div
            ref={codeContainerRef}
            className="flex overflow-auto max-h-[70vh] bg-gray-800 py-4 pl-2 pr-4 rounded-lg"
          >
            <pre className="text-gray-400 select-none">{lineNumbers}</pre>
            <div onMouseUp={handleMouseUp}>
              <pre className="text-white">
                <code
                  dangerouslySetInnerHTML={{
                    __html: hljs.highlight(code, {
                      language: "rust",
                    }).value,
                  }}
                ></code>
              </pre>
            </div>
          </div>
        </div>
      );
    }
    if (!scrollToHighlight) {
      setHighlightStart(start || null);
      setScrollToHighlight(true);
    }
    return (
      <div className="w-[400px] md:w-[600px] lg:w-[800px] xl:w-[1000px] 2xl:w-[1350px] relative">
        <div className="absolute top-0 right-0 m-4">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            <MdContentCopy size="20" />
            Copy
          </button>
        </div>
        <div
          ref={codeContainerRef}
          className="flex overflow-auto max-h-[70vh] bg-gray-800 p-4 rounded-lg whitespace-pre-wrap"
        >
          <pre className="text-gray-400 select-none">{lineNumbers}</pre>
          <div onMouseUp={handleMouseUp}>
            <div className="text-white">
              <pre>
                <code
                  dangerouslySetInnerHTML={{
                    __html: hljs.highlight(codeBefore, {
                      language: "rust",
                    }).value,
                  }}
                ></code>
              </pre>
            </div>
            <div className="text-yellow-500 bg-yellow-950">
              <pre>
                <code
                  dangerouslySetInnerHTML={{
                    __html: hljs.highlight(codeHighlight, {
                      language: "rust",
                    }).value,
                  }}
                ></code>
              </pre>
            </div>
            <div className="text-white">
              <pre>
                <code
                  dangerouslySetInnerHTML={{
                    __html: hljs.highlight(codeAfter, {
                      language: "rust",
                    }).value,
                  }}
                ></code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col space-y-4 my-5">
      <div className="px-16 py-2 mx-16 text-xl">
        <p>
          This contract is part of a On-Chain Campaign developed by Alice, allow
          community projects to participate in a vote competition using a
          specific Coin.
          <br></br>
          <br></br>
          Other users can also use the same coin to vote for and support these
          projects. At the end of the competition, those at the top of the
          leaderboard will receive rewards that Alice has deposited. When Alice
          deposit additional reward, the end time will be postpone for a certain
          interval to create more hypes.
          <br></br>
          <br></br>
          Alice claimed that the stake-to-vote contract is decentralized and
          secure. The creator or the package publisher have no right to change
          any rule or steal any funds. As a user, you're interested in
          inspecting this contract to understand its functionality and ensure
          that it operates as intended. Below is the code you got for the
          contract.
          <br></br>
          <br></br>
          {showTaskDescription && (
            <span>
              Within the time interval. For every bug, security concern, bad
              practice, or vulnerability you correctly identify, you will earn
              an additional 1 USD, on top of the standard 15 USD reward, after
              the interview. Each function will have at most 1 bug to catch.
            </span>
          )}
        </p>
      </div>
      <div className="flex justify-center gap-4">
        {/* <ModuleSelector
          modules={modules}
          handleSelectModule={handleSelectModule}
          getModuleButtonStyle={getModuleButtonStyle}
        ></ModuleSelector> */}

        <div>
          {/* <LanguageSelector
            codeLanguage={codeLanguage}
            handleSelectLanguage={handleSelectLanguage}
            package_id={package_id as string}
          ></LanguageSelector> */}

          {displayCode()}
          {false &&
          !apiCalling &&
          modules[selectedModule].suigpt_decompiled != Default_Fetching ? (
            <>
              {codeLanguage == "interface" &&
                !isDecompiledMap[selectedModule] &&
                modules[selectedModule].interface == Interface_Default_Code && (
                  <div className="flex items-center justify-center mt-3">
                    <button
                      className="bg-blue-500 text-white py-2 px-4 rounded"
                      onClick={async () => {
                        await generateInterface(selectedModule);
                      }}
                    >
                      Click Here to Generate Interface by MoveAiBot
                    </button>
                  </div>
                )}
              {codeLanguage == "revela" &&
                !isDecompiledMap[selectedModule] &&
                modules[selectedModule].revela == Revela_Default_Code && (
                  <div className="flex items-center justify-center mt-3">
                    <button
                      className="bg-blue-500 text-white py-2 px-4 rounded"
                      onClick={async () => {
                        await generateRevela(selectedModule);
                      }}
                    >
                      Click Here to Generate Revela by MoveAiBot
                    </button>
                  </div>
                )}

              {codeLanguage == "suigpt_decompiled" &&
                !isDecompiledMap[selectedModule] &&
                modules[selectedModule].suigpt_decompiled ==
                  MoveAiBot_Default_Code && (
                  <div className="flex items-center justify-center mt-3">
                    <button
                      className="bg-blue-500 text-white py-2 px-4 rounded"
                      onClick={handleDecompileButtonClick}
                    >
                      Click Here to Decompile by Move AI Decompiler
                    </button>
                  </div>
                )}
              {codeLanguage == "suigpt_decompiled" &&
                !isDecompiledMap[selectedModule] &&
                modules[selectedModule].suigpt_decompiled !=
                  MoveAiBot_Default_Code && (
                  <div className="flex items-center justify-center mt-3">
                    <button
                      className="bg-blue-500 text-white py-2 px-4 rounded"
                      onClick={handleRedecompileButtonClick}
                    >
                      Click Here to overwrite cache and Decompile again
                    </button>
                  </div>
                )}
              {codeLanguage == "suigpt_decompiled" &&
                modules[selectedModule].suigpt_decompiled.startsWith(
                  "Error in decompilation:"
                ) && (
                  <div className="flex items-center justify-center mt-3">
                    <button
                      className="bg-blue-500 text-white py-2 px-4 rounded"
                      onClick={handleDecompileButtonClick}
                    >
                      Click Here to Decompile by Move AI Decompiler
                    </button>
                  </div>
                )}
              {codeLanguage == "source_code" &&
                !isDecompiledMap[selectedModule] &&
                modules[selectedModule].source_code ==
                  Source_Code_Default_Code && (
                  <div className="flex items-center justify-center mt-3">
                    <div className="flex items-center justify-center mt-3">
                      <button
                        className="bg-blue-500 text-white py-2 px-4 rounded"
                        onClick={async () => {
                          await fetchSourceCode(selectedModule);
                        }}
                      >
                        Click Here to Fetch Source Code
                      </button>
                    </div>
                  </div>
                )}
              {ProcessProgress({ processTasks })}
            </>
          ) : (
            <div className="flex items-center justify-center mt-3">
              {/* <RingAnimation /> */}
            </div>
          )}
          {!showTaskDescription && (
            <div className="flex items-center justify-center mt-3">
              <div className="flex items-center justify-center mt-3">
                <button
                  className="text-white py-2 px-4 rounded"
                  onClick={() => setShowTaskDescription(true)}
                >
                  Start task 2
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {package_id !=
        "0x8ec24188ca1d4fb80dc8254a6a142256c8a76ec1cd0251c5a128979919d75509" && (
        <LeftBottomButtonWrapper>
          <ChatRoomEventProvider>
            <Forum
              package_id={package_id as string}
              module_name={selectedModule}
              network="sui:mainnet"
            ></Forum>
            <Chatroom
              selectedText={selectedText}
              highlightedText={highlightedText}
              fullText={modules[selectedModule][codeLanguage]}
              apiKey={apiKey || ""}
              userAddress={userAddress || ""}
              setGetMoreBuckPopUpMessage={setGetMoreBuckPopUpMessage}
              setShowGetMoreBuckPopUp={setShowGetMoreBuckPopUp}
            ></Chatroom>
          </ChatRoomEventProvider>
        </LeftBottomButtonWrapper>
      )}
      <GetMoreBuckPopUp
        showGetMoreBuckPopUp={showGetMoreBuckPopUp}
        setShowGetMoreBuckPopUp={setShowGetMoreBuckPopUp}
        getMoreBuckPopUpMessage={getMoreBuckPopUpMessage}
      ></GetMoreBuckPopUp>
    </div>
  );
};

export default PackageIdPage;
