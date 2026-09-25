-- Teléfonos que pidieron que les avisemos cuando alguien pide algo.
CREATE TABLE "PushSub" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "who" TEXT,
    "quiere" TEXT NOT NULL DEFAULT 'todo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastOkAt" TIMESTAMP(3),

    CONSTRAINT "PushSub_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PushSub_endpoint_key" ON "PushSub"("endpoint");
