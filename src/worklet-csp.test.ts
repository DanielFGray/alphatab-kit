import { expect, test } from "bun:test"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createServer } from "node:http"
import type { AddressInfo } from "node:net"
import path from "node:path"
import { chromium } from "playwright-core"
import { alphaTabAssets } from "./vite.ts"
import { CAPTURE_WORKLET_PATH } from "./click/capture-worklet.ts"

const CHROMIUM = process.env.CHROMIUM ?? "/usr/bin/chromium"
const CSP = "default-src 'self'; script-src 'self'"

/**
 * A worklet is governed by `script-src`, so the file the plugin emits loads
 * under `script-src 'self'` with no `blob:`. The control loads the same text
 * from a blob: URL under the same policy and must fail, which shows the policy
 * is enforced. Chromium gives AudioWorklet only to secure contexts; http on
 * localhost is one. A real server serves the page, because page.route does not
 * see worklet fetches. It is node:http because the test preload replaces the
 * global Response, which Bun.serve then rejects.
 */
test.skipIf(!existsSync(CHROMIUM))(
  "the built plugin's worklet loads under script-src 'self'; a blob: URL does not",
  async () => {
    const root = mkdtempSync(path.join(import.meta.dir, "..", ".vite-build-"))
    const emitted = path.join(root, "dist", CAPTURE_WORKLET_PATH)
    const server = createServer((request, response) => {
      if (request.url === CAPTURE_WORKLET_PATH) {
        response.setHeader("content-type", "text/javascript")
        response.end(readFileSync(emitted))
      } else {
        response.setHeader("content-type", "text/html")
        response.setHeader("content-security-policy", CSP)
        response.end("<!doctype html>")
      }
    })
    const browser = await chromium.launch({ executablePath: CHROMIUM })
    try {
      writeFileSync(path.join(root, "index.html"), `<script type="module" src="./main.js"></script>`)
      writeFileSync(path.join(root, "main.js"), `console.log("app")\n`)
      const { build } = await import("vite")
      await build({ root, logLevel: "silent", configFile: false, plugins: [alphaTabAssets()] })
      const worklet = readFileSync(emitted, "utf8")
      await new Promise<void>((resolve) => server.listen(0, "localhost", resolve))

      const page = await browser.newPage()
      await page.goto(`http://localhost:${(server.address() as AddressInfo).port}/`)
      const load = (mode: "file" | "blob") =>
        page.evaluate(
          async ([mode, path, source]) => {
            const context = new AudioContext()
            try {
              const url =
                mode === "file" ? path! : URL.createObjectURL(new Blob([source!], { type: "text/javascript" }))
              await context.audioWorklet.addModule(url)
              return "loaded"
            } catch (error) {
              return String(error)
            } finally {
              void context.close()
            }
          },
          [mode, CAPTURE_WORKLET_PATH, worklet] as const,
        )
      expect(await load("file")).toBe("loaded")
      expect(await load("blob")).toContain("Failed to load worklet module")
    } finally {
      await browser.close()
      server.close()
      rmSync(root, { recursive: true, force: true })
    }
  },
  120_000,
)
