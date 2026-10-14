import { randomUUID } from "node:crypto";
import { execFile, spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { createConnection, createServer, type AddressInfo } from "node:net";
import path from "node:path";
import pg from "pg";
import { WebSocketServer } from "ws";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  interface ProvidedContext {
    sigmedDatabaseUrl: string;
    sigmedProxyPort: number;
  }
}

export default async function setup(project: TestProject) {
  // Nunca usa DATABASE_URL/.env, puertos de un servicio existente ni datos del seed.
  const root = path.resolve("node_modules/.cache/sigmed-integration");
  await mkdir(root, { recursive: true });
  const directory = await mkdtemp(path.join(root, "cluster-"));
  const assertOwnedDirectory = async () => {
    const resolved = await realpath(directory);
    const resolvedRoot = await realpath(root);
    if (!resolved.startsWith(resolvedRoot + path.sep) || !path.basename(resolved).startsWith("cluster-")) {
      throw new Error("El directorio de prueba queda fuera de la caché prevista.");
    }
  };
  await assertOwnedDirectory();
  const probe = createServer();
  probe.listen(0, "127.0.0.1");
  await once(probe, "listening");
  const port = (probe.address() as AddressInfo).port;
  await new Promise<void>((resolve) => probe.close(() => resolve()));

  // Se usan solo los binarios: el exit-hook del wrapper fuerza salida 0 aun si Vitest falla.
  const resolver = createRequire(createRequire(import.meta.url).resolve("embedded-postgres"));
  const binaryName = `@embedded-postgres/${process.platform === "win32" ? "windows" : process.platform}-${process.arch}`;
  const binaries = await import(pathToFileURL(resolver.resolve(binaryName)).href) as { initdb: string; postgres: string; pg_ctl: string };
  const run = promisify(execFile);
  const environment = { ...process.env, LC_MESSAGES: "C" };
  const password = randomUUID();
  const passwordFile = path.join(root, `password-${randomUUID()}.txt`);
  await writeFile(passwordFile, password, { mode: 0o600 });
  let postgres: ChildProcess | undefined;
  let proxy: WebSocketServer | undefined;
  let started = false;
  const dispose = async () => {
    if (proxy) {
      for (const client of proxy.clients) client.terminate();
      await new Promise<void>((resolve) => proxy!.close(() => resolve()));
    }
    if (started && postgres?.exitCode === null) {
      await run(binaries.pg_ctl, ["-D", directory, "stop", "-m", "fast", "-w"], { windowsHide: true, env: environment, timeout: 15_000 });
    }
    // Verificar la ruta absoluta antes de eliminar solo el cluster creado por esta ejecución.
    await assertOwnedDirectory();
    await rm(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    await rm(passwordFile, { force: true });
  };
  try {
    await run(binaries.initdb, ["-D", directory, "--username=postgres", "--auth=password", `--pwfile=${passwordFile}`, "--encoding=UTF8", "--locale=C"], { windowsHide: true, env: environment, timeout: 30_000 });
    postgres = spawn(binaries.postgres, ["-D", directory, "-p", String(port), "-h", "127.0.0.1"], { windowsHide: true, env: environment, stdio: ["ignore", "ignore", "pipe"] });
    started = true;
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("PostgreSQL no inició dentro del plazo de prueba.")), 20_000);
      postgres!.stderr!.on("data", (chunk) => {
        if (chunk.toString().includes("database system is ready to accept connections")) { clearTimeout(timeout); resolve(); }
      });
      postgres!.once("error", (error) => { clearTimeout(timeout); reject(error); });
      postgres!.once("exit", () => { clearTimeout(timeout); reject(new Error("PostgreSQL terminó antes de iniciar.")); });
    });
    const client = new pg.Client({ host: "127.0.0.1", port, user: "postgres", password, database: "postgres" });
    await client.connect();
    try {
      const migrations = (await readdir("prisma/migrations", { withFileTypes: true }))
        .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
      // Los DROP de las migraciones se ejecutan únicamente en el cluster recién creado.
      for (const migration of migrations) {
        await client.query(await readFile(path.join("prisma/migrations", migration, "migration.sql"), "utf8"));
      }
      const version = await client.query<{ version: string }>("SELECT version()");
      console.log(`Base aislada: ${version.rows[0].version.split(",")[0]}; ${migrations.length} migraciones aplicadas.`);
    } finally { await client.end(); }

    // Mantiene el adaptador Neon real: solo reemplaza su transporte por WS→TCP local.
    proxy = new WebSocketServer({ host: "127.0.0.1", port: 0 });
    proxy.on("connection", (websocket) => {
      const socket = createConnection({ host: "127.0.0.1", port });
      websocket.on("message", (data) => { if (Buffer.isBuffer(data)) socket.write(data); });
      socket.on("data", (data) => { if (websocket.readyState === 1) websocket.send(data); });
      socket.on("error", () => websocket.terminate());
      socket.on("close", () => websocket.close());
      websocket.on("error", () => socket.destroy());
      websocket.on("close", () => socket.destroy());
    });
    await once(proxy, "listening");
    project.provide("sigmedProxyPort", (proxy.address() as AddressInfo).port);
    project.provide("sigmedDatabaseUrl", `postgresql://postgres:${password}@127.0.0.1:${port}/postgres?sslmode=disable`);
    return dispose;
  } catch (error) { await dispose(); throw error; }
}
