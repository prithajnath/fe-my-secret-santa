import { NextRequest, NextResponse } from "next/server"
import { serverFetch } from "@/lib/server-fetch"

const API_BASE = process.env.API_BASE_URL || "https://localhost:9100"

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params)
}

const FORWARDED_REQUEST_HEADERS = ["authorization", "content-type", "accept"]

async function proxyRequest(request: NextRequest, params: { path: string[] }) {
  const path = params.path.join("/")
  const url = `${API_BASE}/${path}${request.nextUrl.search}`

  // Allowlist: the backend uses Bearer auth and needs nothing else from the browser. In particular
  // our own session cookies must not be sent upstream.
  const headers: Record<string, string> = {
    // Pinned to encodings Node's fetch decodes; browsers offer zstd, which Cloudflare honours but Node can't decode
    "accept-encoding": "gzip, br",
  }
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers[name] = value
  }

  try {
    let body: string | undefined
    if (request.method !== "GET" && request.method !== "HEAD") {
      body = await request.text()
    }

    const response = await serverFetch(url, {
      method: request.method,
      headers,
      body,
    })

    const responseBody = await response.text()

    const responseHeaders = new Headers()
    response.headers.forEach((value, key) => {
      // The body has already been decoded, so encoding and length headers no longer describe it.
      // Upstream cookies would land on our domain, where only our own session cookies belong.
      if (!["content-encoding", "transfer-encoding", "content-length", "set-cookie"].includes(key.toLowerCase())) {
        responseHeaders.set(key, value)
      }
    })

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error("Proxy error:", error)
    return NextResponse.json(
      { error: "Failed to proxy request", details: String(error) },
      { status: 502 }
    )
  }
}
