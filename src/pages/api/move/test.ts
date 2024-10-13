// pages/api/move/test.ts

/**
 * @swagger
 * /api/move/test:
 *   post:
 *     summary: Upload a Move project, run tests, and clean up after the test.
 *     tags:
 *       - Move
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   network:
 *                     type: string
 *                     enum: [mainnet, testnet, devent]
 *                     default: mainnet
 *                   files:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           enum: [file, directory]
 *                         name:
 *                           type: string
 *                         content:
 *                           type: string
 *             example:
 *               project:
 *                 name: "example_project"
 *                 network: "mainnet"
 *                 files:
 *                   - type: "file"
 *                     name: "Move.toml"
 *                     content: "[package]\nname = \"example\"\nedition = \"2024.beta\"\n\n[dependencies]\nSui = { git = \"https://github.com/MystenLabs/sui.git\", subdir = \"crates/sui-framework/packages/sui-framework\", rev = \"framework/testnet\" }\n\n[addresses]\nexample = \"0x0\"\n\n[dev-dependencies]\n\n[dev-addresses]\n"
 *                   - type: "directory"
 *                     name: "sources"
 *                     files:
 *                       - type: "file"
 *                         name: "example.move"
 *                         content: "module example::example {\n\n}"
 *                   - type: "directory"
 *                     name: "tests"
 *                     files:
 *                       - type: "file"
 *                         name: "example_tests.move"
 *                         content: "#[test_only]\nmodule example::example_tests {\n    use example::example;\n\n    const ENotImplemented: u64 = 0;\n\n    #[test]\n    fun test_example() {\n        // pass\n    }\n\n    #[test, expected_failure(abort_code = ::example::example_tests::ENotImplemented)]\n    fun test_example_fail() {\n        abort ENotImplemented\n    }\n}"
 *     responses:
 *       200:
 *         description: Test successful and project cleaned up.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Test successful and project cleaned up for example_project on network mainnet"
 *                 stdout:
 *                   type: string
 *                   example: "Test output log"
 *                 stderr:
 *                   type: string
 *                   example: "Test error log"
 *       500:
 *         description: Test failed or cleanup error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Test failed"
 *                 stdout:
 *                   type: string
 *                   example: "Test output log"
 *                 stderr:
 *                   type: string
 *                   example: "Test error log"
 */

import { NextApiRequest, NextApiResponse } from "next";

export const maxDuration = 60 * 60;

type GasServerResponse = {
  success: boolean;
  message: string;
  stdout?: string;
  stderr?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const gasServerUrls: string[] = process.env.NEXT_PUBLIC_GAS_SERVER_URLs
    ? JSON.parse(process.env.NEXT_PUBLIC_GAS_SERVER_URLs)
    : [];

  if (gasServerUrls.length === 0) {
    return res.status(500).json({ message: "No gas server URLs configured." });
  }

  // Function to forward request to a gas server
  async function forwardRequest(url: string): Promise<GasServerResponse> {
    try {
      const response = await fetch(`${url}/move/test`, {
        method: req.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      const data: GasServerResponse = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to process request");
      }

      return data;
    } catch (error) {
      throw new Error(
        `Error forwarding to ${url}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Attempt to forward the request to the servers, one by one
  const gasServerLength = gasServerUrls.length;
  for (let i = 0; i < gasServerLength; i++) {
    const randomIndex = Math.floor(Math.random() * gasServerUrls.length);
    const url = gasServerUrls.splice(randomIndex, 1)[0]; // Randomly pick a server and remove it from the list
    console.log({ url });
    try {
      const data = await forwardRequest(url);
      return res.status(200).json(data); // Successfully forwarded request
    } catch (error) {
      console.error(error);
    }
  }

  // If all attempts fail, return a 502 error
  return res
    .status(502)
    .json({ message: "Failed to forward request to all servers." });
}
