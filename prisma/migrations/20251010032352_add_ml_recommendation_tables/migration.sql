-- CreateTable
CREATE TABLE "user_interaction" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "interaction_type" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_recommendation" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_interaction_user_id_created_at_idx" ON "user_interaction"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "user_interaction_post_id_created_at_idx" ON "user_interaction"("post_id", "created_at");

-- CreateIndex
CREATE INDEX "user_interaction_created_at_idx" ON "user_interaction"("created_at");

-- CreateIndex
CREATE INDEX "user_recommendation_user_id_score_idx" ON "user_recommendation"("user_id", "score" DESC);

-- CreateIndex
CREATE INDEX "user_recommendation_user_id_expires_at_idx" ON "user_recommendation"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "user_recommendation_expires_at_idx" ON "user_recommendation"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_recommendation_user_id_post_id_key" ON "user_recommendation"("user_id", "post_id");

-- AddForeignKey
ALTER TABLE "user_interaction" ADD CONSTRAINT "user_interaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_interaction" ADD CONSTRAINT "user_interaction_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_recommendation" ADD CONSTRAINT "user_recommendation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_recommendation" ADD CONSTRAINT "user_recommendation_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
