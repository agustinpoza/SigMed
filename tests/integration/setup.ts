import { afterAll, inject } from "vitest";
import { neonConfig } from "@neondatabase/serverless";
import WebSocket from "ws";

const url = inject("sigmedDatabaseUrl");
if (new URL(url).hostname !== "127.0.0.1") throw new Error("Las pruebas requieren la base local propia.");
process.env.DATABASE_URL = url;
neonConfig.webSocketConstructor = WebSocket;
neonConfig.wsProxy = () => `127.0.0.1:${inject("sigmedProxyPort")}`;
neonConfig.useSecureWebSocket = false;
neonConfig.pipelineConnect = false;
neonConfig.pipelineTLS = false;

afterAll(async () => {
  const { prisma } = await import("@/lib/db");
  await prisma.$disconnect();
});
