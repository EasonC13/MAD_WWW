-- CreateTable
CREATE TABLE "DecompiledCode" (
    "id" SERIAL NOT NULL,
    "package_id" TEXT NOT NULL,
    "module_name" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecompiledCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DecompiledCode_package_id_module_name_network_idx" ON "DecompiledCode"("package_id", "module_name", "network");
