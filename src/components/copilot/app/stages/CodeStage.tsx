import React, { useEffect, useState } from "react";
import Selection from "../../base/skeleton";
import GPTUtils from "@/lib/copilot/utils/GPTUtils";
import { moveLangPrompt } from "@/lib/copilot/constants/bot";
import { BotReturnType } from "@/lib/copilot/types/bot";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import rust from "react-syntax-highlighter/dist/cjs/languages/hljs/rust";
import { qtcreatorDark } from "react-syntax-highlighter/dist/cjs/styles/hljs";
import { Button } from "flowbite-react";
import { HiRefresh } from "react-icons/hi";

interface StageProps {
  welcomeInput: string;
  contractType: string;
  definitions: Definition[];
}

function parseResponse(response: string): string {
  response = response.replaceAll("```move\n", "");
  response = response.replaceAll("```", "");
  return response;
}

const CodeStage: React.FC<StageProps> = ({
  welcomeInput,
  contractType,
  definitions,
}) => {
  // Stage 3: Generate Code
  const [interfaces, setInterfaces] = useState<string>("");
  const [isComplete, setIsComplete] = useState<boolean>(false);

  SyntaxHighlighter.registerLanguage("rust", rust);

  const streamInterfaces = async () => {
    let definitionStr = "";
    for (const definition of definitions) {
      definitionStr += `[${definition.Title}: ${definition.Value}] ${definition.Description} ${definition.Though}\n`;
    }

    const referenceCode = `module fud::fud_token {

        // ----- Use Statements -----
        use sui::tx_context;
        use sui::coin;
        use std::option;
        use sui::url;
        use sui::transfer;
    
        // ----- Structs -----
        struct REAP_TOKEN has drop {
            dummy_field: bool,
        }
    
        // ----- Init Functions -----
    
        /**
        * This code is run when the contract is deployed to the blockchain.
        */
        fun init(
            reap_token: REAP_TOKEN,
            ctx: &mut tx_context::TxContext,
        ) {
            // 1. Create the currency with the name "FUD" and the symbol "FUD"
            let (treasury_cap, coin_metadata) = coin::create_currency<REAP_TOKEN>(
                reap_token,
                9,
                b"FUD",
                b"FUD",
                b"Fud Token",
                option::some(url::new_unsafe_from_bytes(b"https://example-url.com/coin.png")),
                ctx
            );
    
            // 2. Freeze the currency so that no more coins can be minted
            transfer::public_freeze_object(coin_metadata);
    
            // 3. Transfer the ownership of the treasury cap to the sender
            transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
    
            // 4. Initially mint 10,000,000,000,000,000 FUD to the sender
            coin::mint_and_transfer<FUD>(
                &mut treasury_cap,
                10000000000000000000,
                tx_context::sender(ctx),
                ctx
            );
        }
    
        // ----- Public Functions -----
    
        /**
        * This function allows the owner of the TreasuryCap to burn a given amount of FUD tokens.
        * Note to GPT [do not display]: if you don't want the owner to be able to burn tokens, you can remove this function.
        */
        public entry fun burn(
            treasury_cap: &mut coin::TreasuryCap<REAP_TOKEN>,
            coin: coin::Coin<REAP_TOKEN>
        ) {
            coin::burn(treasury_cap, coin);
        }
    
        /**
        * This function allows the owner of the TreasuryCap to create new FUD tokens and transfer them to a recipient.
        * Note to GPT [do not display]: if you don't want the owner to be able to mint new tokens that is over the init cap, you can remove this function.
        */
        public entry fun mint(
            treasury_cap: &mut coin::TreasuryCap<REAP_TOKEN>,
            amount: u64,
            recipient: address,
            ctx: &mut tx_context::TxContext,
        ) {
            coin::mint_and_transfer<REAP_TOKEN>(treasury_cap, amount, recipient, ctx);
        }
    }`;

    const prompt = `${moveLangPrompt} You are a professional Move engineer. Your client proposed to you a project to create a ${contractType} Move smart contract. You are given a reference Move code that achieve similar functionalities: \`\`\`move\n${referenceCode}\`\`\`\nThe client provides a product description: "${welcomeInput}" and the following spec for the Move smart contract design:\n ${definitionStr}. Please create a Move smart contract based on the provided spec and example code. Return only code.`;
    await GPTUtils.stream(
      prompt, BotReturnType.Raw,
      (data: string, fullData: string) => {
        setInterfaces((prev) => fullData);
      },
      () => setIsComplete(true)
    );
  };

  useEffect(() => {
    if (welcomeInput && contractType && definitions) {
      setInterfaces("");
      setIsComplete(false);
      streamInterfaces();
    }
  }, [welcomeInput, contractType, definitions]);

  return (
    <main>
      {interfaces ? (
        <div className="border-2 border-[#3D3F40] my-5">
          <SyntaxHighlighter
            language="rust"
            style={qtcreatorDark}
            showLineNumbers={true}
            wrapLongLines={false}
          >
            {parseResponse(interfaces)}
          </SyntaxHighlighter>
        </div>
      ) : (
        <Selection />
      )}
      {isComplete && (
        <div className="w-full flex mt-5 mb-20 gap-2">
          <Button
            color="gray"
            onClick={() => {
              setInterfaces("");
              setIsComplete(false);
              streamInterfaces();
            }}
          >
            <p className="text-xl">
              <HiRefresh />
            </p>{" "}
            &nbsp; Regenerate
          </Button>
        </div>
      )}
    </main>
  );
};

export default CodeStage;
