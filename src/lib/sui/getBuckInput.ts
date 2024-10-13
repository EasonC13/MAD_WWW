import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { moveCallMergeAndSplitCoin } from "./moveCallSplitAndGetCoinInput";

export async function getBuckInput({
  address,
  amount_to_input,
  txb,
  suiClient,
}: {
  address: string;
  amount_to_input: number;
  txb: TransactionBlock;
  suiClient?: SuiClient;
}): Promise<{ coinInput: any }> {
  if (!suiClient) {
    suiClient = new SuiClient({ url: getFullnodeUrl("mainnet") });
  }
  const inputCoinType =
    "0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK";

  return await moveCallMergeAndSplitCoin({
    address,
    suiClient,
    inputCoinType,
    txb,
    amount_to_input,
  });
}
