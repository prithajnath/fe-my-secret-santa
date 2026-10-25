import https from "https"
import fs from "fs"
import path from "path"

// Load certificates for localhost HTTPS connections
let httpsAgent: https.Agent | null = null

function getHttpsAgent(): https.Agent {
  if (!httpsAgent) {
    try {
      const certPath = path.join(process.cwd(), "cert.pem")
      const keyPath = path.join(process.cwd(), "key.pem")
      const cert = fs.readFileSync(certPath)
      const key = fs.readFileSync(keyPath)
      httpsAgent = new https.Agent({
        cert,
        key,
        rejectUnauthorized: false, // Accept self-signed certificates for localhost
      })
    } catch {
      // Fallback agent if certs not found
      httpsAgent = new https.Agent({
        rejectUnauthorized: false,
      })
    }
  }
  return httpsAgent
}

// Custom fetch for server-side calls to localhost HTTPS
export async function serverFetch(
  url: string | URL,
  init?: RequestInit
): Promise<Response> {
  const urlString = url.toString()

  // Only modify for localhost HTTPS calls
  const parsed = new URL(urlString)
  if (parsed.protocol === "https:" && parsed.hostname === "localhost") {
    // For Node.js 18+, we can use the global fetch with a custom agent
    // by setting NODE_TLS_REJECT_UNAUTHORIZED or using https.request

    // Use https.request for localhost calls
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(urlString)
      const agent = getHttpsAgent()

      const options: https.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: init?.method || "GET",
        agent,
        headers: init?.headers as Record<string, string> | undefined,
      }

      const req = https.request(options, (res) => {
        const chunks: Buffer[] = []

        res.on("data", (chunk: Buffer) => chunks.push(chunk))
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString()

          // Create a Response-like object
          const response = new Response(body, {
            status: res.statusCode || 200,
            statusText: res.statusMessage || "",
            headers: new Headers(res.headers as Record<string, string>),
          })

          resolve(response)
        })
      })

      req.on("error", reject)

      if (init?.body) {
        req.write(init.body)
      }

      req.end()
    })
  }

  // Use standard fetch for other URLs
  return fetch(url, init)
}
