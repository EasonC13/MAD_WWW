-- CreateTable
CREATE TABLE "Voter" (
    "id" SERIAL NOT NULL,
    "userAccount" TEXT NOT NULL,
    "vote" INTEGER NOT NULL,
    "postId" INTEGER NOT NULL,

    CONSTRAINT "Voter_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Voter" ADD CONSTRAINT "Voter_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
