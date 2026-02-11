CREATE TABLE "session_quiz_steps" (
  "id" SERIAL NOT NULL,
  "session_id" INTEGER NOT NULL,
  "step_order" INTEGER NOT NULL,
  "node_id" VARCHAR(64) NOT NULL,
  "question" TEXT NOT NULL,
  "answer_yes" BOOLEAN NOT NULL,
  "next_node_id" VARCHAR(64),
  "tree_version" VARCHAR(64) NOT NULL DEFAULT 'decision-tree-v1',
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "session_quiz_steps_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "session_quiz_steps"
ADD CONSTRAINT "session_quiz_steps_session_id_fkey"
FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "uq_session_quiz_steps_order" ON "session_quiz_steps"("session_id", "step_order");
CREATE INDEX "idx_session_quiz_steps_session" ON "session_quiz_steps"("session_id");
