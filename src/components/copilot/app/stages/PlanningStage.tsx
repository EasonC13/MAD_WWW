import React, { useEffect, useState } from "react";
import Selection from "../../base/skeleton";
import EditableTable from "../../base/editableTable";
import GPTUtils from "@/lib/copilot/utils/GPTUtils";
import { moveLangPrompt } from "@/lib/copilot/constants/bot";
import { BotReturnType } from "@/lib/copilot/types/bot";
import { IncompleteJson } from "gjp-4-gpt";
import { Button } from "flowbite-react";

// Icons
import { HiRefresh } from "react-icons/hi";
import { VscDebugContinue } from "react-icons/vsc";

interface StageProps {
  welcomeInput: string;
  contractType: string;
  definitions: Definition[];
  setDefinitions: (definitions: Definition[]) => void;
  onNextStage: () => void;
}

const tableHeaders = ["Title", "Value", "Description"];

const contractType2Definitions: any = {
  Token: [
    "Name",
    "Symbol",
    "Purpose",
    "Total Supply",
    "Coin Image URL, default to [https://example.com/coin.png]",
    "Decimals, should set to 9 if not specified. Example Usage: If [coin value = 7002] and [decimals = 3], it should be displayed as [7.002].",
    "Should Burn? (optional)",
    "Should Owner Mint More or Capped? (optional, usually no)",
  ],
  NFT: [""],
};

const PlanningStage: React.FC<StageProps> = ({
  welcomeInput,
  contractType,
  definitions,
  setDefinitions,
  onNextStage,
}) => {
  /**
   * State variables
   */
  const [rawDefinitions, setRawDefinitions] = useState<string>("");
  const [reaction, setReaction] = useState<string>("");
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [isNext, setIsNext] = useState<boolean>(false);

  /**
   * Helper functions for GPT
   */
  const streamReaction = async () => {
    const prompt = `${moveLangPrompt} You are a professional Move engineer. Your client proposed to you a project to create a ${contractType} Move smart contract. The client provides a product description: "${welcomeInput}". Imagine you are in a conversation with the client and you want to react to this request with confidence that you will get the job done. In one sentence, what would you say to the client? After your introduction sentence, say: "I have created a table to illustrate the properties of your SUI smart contract design. Please feel free to edit it as needed.".`;
    await GPTUtils.stream(
      prompt, BotReturnType.Raw,
      (data: string, fullData: string) => {
        fullData = fullData.replaceAll(`"`, "");
        setReaction((prev) => fullData);
      }
    );
  };

  const streamRawDefinitions = async () => {
    const definition: string[] = contractType2Definitions[contractType];
    const prompt = `${moveLangPrompt} You are a professional Move engineer. Your client provides a product description of a ${contractType} Move smart contract: "${welcomeInput}". Your task is to list out all the design properties/definitions of the given ${contractType} in a list of definitions. Some reference definition types are: [${definition.join(
      ", "
    )}], where ? means optional.`;

    await GPTUtils.stream(
      prompt, BotReturnType.ContractDefinition,
      (data: string, fullData: string) => {
        setRawDefinitions((prev) => fullData);
      },
      () => setIsComplete(true)
    );
  };

  const generate = async () => {
    // Reset to initial state
    setIsComplete(false);
    setDefinitions([]);
    setReaction("");
    // Generate the reaction and definitions
    await streamReaction();
    streamRawDefinitions();
  };

  /**
   * Lifecycle hooks
   */
  useEffect(() => {
    if (welcomeInput && contractType) {
      generate();
    }
  }, [welcomeInput, contractType]);

  useEffect(() => {
    try {
      const stripRawDefinitions = GPTUtils.parseCodeResponse(rawDefinitions);
      const parsedDefinitions: any =
        IncompleteJson.parse<Definition[]>(stripRawDefinitions);
      const definitions = JSON.parse(JSON.stringify(parsedDefinitions ?? []));
      setDefinitions(definitions);
    } catch (err) {
      console.error("Error parsing definitions:", err);
    }
  }, [rawDefinitions]);

  /**
   * Main component render
   */
  return (
    <main>
      {reaction ? (
        <p className="mt-2 text-lg text-white">{reaction}</p>
      ) : (
        <Selection />
      )}
      {definitions.length > 0 && (
        <EditableTable
          headers={tableHeaders}
          initialData={definitions as any}
        />
      )}
      {isComplete && !isNext && (
        <div className="w-full flex mt-5 mb-20 gap-2">
          <Button color="gray" onClick={generate}>
            <p className="text-xl">
              <HiRefresh />
            </p>{" "}
            &nbsp; Regenerate
          </Button>
          <Button
            color="gray"
            onClick={() => {
              setIsNext(true);
              onNextStage();
            }}
          >
            <p className="text-xl">
              <VscDebugContinue />
            </p>{" "}
            &nbsp; Looks Great! Continue
          </Button>
        </div>
      )}
    </main>
  );
};

export default PlanningStage;
