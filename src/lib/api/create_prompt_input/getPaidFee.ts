import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";

export async function getPaidFee({
  digest,
  coinType,
  within_interval,
}: {
  digest: string;
  coinType?: string;
  within_interval?: number;
}): Promise<{ fee: number; coinType: string; sender: string }> {
  if (!coinType) {
    // coinType = "0x2::sui::SUI";
    coinType =
      "0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK";
  }
  if (!within_interval) {
    within_interval = 60;
  }

  try {
    let suiClient = new SuiClient({ url: getFullnodeUrl("mainnet") });
    let block = await suiClient.waitForTransactionBlock({
      digest,
      options: {
        showBalanceChanges: true,
      },
    });
    const isTimeOut =
      new Date().getTime() -
        parseInt(block.timestampMs || new Date().getTime().toString()) >
      within_interval * 1000;
    if (isTimeOut) {
      throw new Error("Transaction is timeout");
    }

    const filter_results = block.balanceChanges?.filter((change: any) => {
      return (
        change.owner.AddressOwner == process.env.NEXT_PUBLIC_SUIGPT_SUI_ADDRESS
      );
    });
    const sender_filter_results =
      block.balanceChanges?.filter((change: any) => {
        return (
          change.coinType == coinType &&
          change.owner.AddressOwner !=
            process.env.NEXT_PUBLIC_SUIGPT_SUI_ADDRESS
        );
      }) || [];
    if (!filter_results || filter_results.length == 0) {
      throw new Error("No balance change found");
    } else {
      const suigpt_balance_change = filter_results[0];
      const isValidCoinType = [coinType].includes(
        suigpt_balance_change.coinType
      );
      if (isValidCoinType) {
        return {
          fee: parseInt(suigpt_balance_change.amount),
          coinType: suigpt_balance_change.coinType,
          sender:
            (sender_filter_results.length &&
              (sender_filter_results[0].owner as any).AddressOwner) ||
            "",
        };
      }
    }
  } catch (e) {
    console.log("Error: ", e);
    throw new Error("Failed to get paid fee");
  }
  throw new Error("Failed to get paid fee");
}
