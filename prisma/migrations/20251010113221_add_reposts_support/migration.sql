-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "original_post_id" TEXT;

-- CreateIndex
CREATE INDEX "posts_original_post_id_idx" ON "posts"("original_post_id");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_original_post_id_fkey" FOREIGN KEY ("original_post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
