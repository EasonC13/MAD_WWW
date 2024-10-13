import { CoinStruct, SuiClient } from "@mysten/sui.js/client";

export async function getUserCoins({
  address,
  suiClient,
}: {
  address: string;
  suiClient: SuiClient;
}): Promise<CoinStruct[]> {
  let userCoins: CoinStruct[] = [];
  let nextCursor: string | null | undefined;
  let res;
  do {
    res = await suiClient.getAllCoins({
      owner: address,
      cursor: nextCursor,
    });
    userCoins = userCoins.concat(res.data);
    nextCursor = res.nextCursor;
  } while (res.hasNextPage);
  return userCoins;
}
