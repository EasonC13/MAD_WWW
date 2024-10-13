import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient } from "@mysten/sui.js/client";
import { getUserCoins } from "./getUserCoins";

export async function moveCallMergeAndSplitCoin({
  address,
  suiClient,
  inputCoinType,
  txb,
  amount_to_input,
}: {
  address: string;
  suiClient: SuiClient;
  inputCoinType: string;
  txb: TransactionBlock;
  amount_to_input: number;
}) {
  let coinInput = undefined;
  let otherCoinsForInputType = undefined;
  const userCoins = await getUserCoins({
    address,
    suiClient,
  });
  if (inputCoinType === "0x2::sui::SUI") {
    coinInput = txb.splitCoins(txb.gas, [txb.pure(amount_to_input, "u64")]);
    otherCoinsForInputType = txb.gas;
  } else {
    const targetCoins = userCoins.filter(
      (coin) => coin.coinType == inputCoinType
    );
    let total_balance = 0;
    const [mainCoin, ...otherCoins] = targetCoins.map((coin) => {
      total_balance += parseInt(coin.balance);
      return txb.objectRef({
        objectId: coin.coinObjectId,
        digest: coin.digest,
        version: coin.version,
      });
    });
    if (total_balance < amount_to_input) {
      const context = {
        total_balance: Math.ceil(total_balance / 10 ** 9),
        amount_to_input: Math.ceil(amount_to_input / 10 ** 9),
        lack: Math.ceil((amount_to_input - total_balance) / 10 ** 9),
      };
      throw new Error(
        `Insufficient balance. This action need ${context.amount_to_input} Bucket USD.\n You need ${context.lack} more Bucket USD to continue.`
      );
    }
    if (mainCoin && otherCoins.length > 0) {
      txb.mergeCoins(mainCoin, otherCoins);
    } else if (!mainCoin) {
      throw new Error(
        `No coin found for type ${inputCoinType} at ${address}'s wallet`
      );
    }
    coinInput = txb.splitCoins(mainCoin, [txb.pure(amount_to_input, "u64")]);
  }
  return {
    coinInput,
  };
}
