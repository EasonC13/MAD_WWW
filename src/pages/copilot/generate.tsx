"use client";

import React from "react";
import Copilot from "@/components/copilot/app/copilot";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  const {
    welcomeInput,
    contractType,
  }: { welcomeInput: string; contractType: string } = router.query as any;

  return (
    <main className="absolute left-0 top-0 flex min-h-screen w-full flex-col items-center bg-black">
      <Copilot welcomeInput={welcomeInput} contractType={contractType} />
    </main>
  );
}
