// pages/api/forum/post.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const { package_id, module_name, network } = req.query;
      const query: any = {};
      if (package_id) query.package_id = package_id;
      if (module_name) query.module_name = module_name;
      if (network) query.network = network;
      const posts = await prisma.post.findMany({ where: query });
      return res.status(200).json(posts);
    } catch (error) {
      throw error;
    }
  }
  if (req.method === "POST") {
    const { author, content, package_id, module_name, network } = req.body;

    try {
      const newPost = await prisma.post.create({
        data: {
          author,
          content,
          package_id,
          module_name,
          network,
        },
      });
      return res.status(200).json(newPost);
    } catch (error) {
      console.log({ error });
      return res.status(500).json({ error: "Unable to create post" });
    }
  }
  if (req.method === "PATCH") {
    const { postId, voteChange, userAccount } = req.body;

    if (![1, -1].includes(voteChange)) {
      return res.status(400).json({ error: "Invalid vote change" });
    }

    try {
      const existingVote = await prisma.voter.findFirst({
        where: {
          postId: postId,
          userAccount: userAccount,
        },
      });
      let voteIncrement = 0;
      if (existingVote) {
        // 如果用户想要改变投票
        if (existingVote.vote !== voteChange) {
          // 先撤销之前的投票，再应用新的投票
          voteIncrement = 2 * voteChange;
          await prisma.voter.update({
            where: { id: existingVote.id },
            data: { vote: voteChange },
          });
        }
      } else {
        voteIncrement = voteChange;
        await prisma.voter.create({
          data: {
            userAccount: userAccount,
            vote: voteChange,
            postId: postId,
          },
        });
      }

      if (voteIncrement !== 0) {
        const post = await prisma.post.update({
          where: { id: postId },
          data: {
            votes: { increment: voteIncrement },
          },
        });
        return res.status(200).json({ post });
      } else {
        return res.status(208).json({ message: "No vote change" });
      }
    } catch (error) {
      console.log({ error });
      return res.status(500).json({ error: "Unable to update post vote" });
    }
  } else {
    res.setHeader("Allow", ["POST", "GET", "PATCH"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
