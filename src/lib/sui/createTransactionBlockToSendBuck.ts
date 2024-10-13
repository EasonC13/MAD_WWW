import { TransactionBlock } from "@mysten/sui.js/transactions";
import { getBuckInput } from "./getBuckInput";

export async function createTransactionBlockToSendBuck({
  address,
  amount_to_input,
}: any): Promise<{ transactionBlock: TransactionBlock }> {
  const SUIGPT_SUI_ADDRESS =
    "0xad8b888e6adc10211766d766ba556ec2b1d3d6645d217540b1f579919bb8111e";
  const txb = new TransactionBlock();

  const { coinInput } = await getBuckInput({ address, amount_to_input, txb });
  txb.transferObjects([coinInput], SUIGPT_SUI_ADDRESS);
  return { transactionBlock: txb };
}
