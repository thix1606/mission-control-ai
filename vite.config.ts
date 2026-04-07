import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'node:child_process'

const commitHash = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim(); }
  catch { return 'dev'; }
})();

export default defineConfig({
  define: {
    __APP_COMMIT__: JSON.stringify(commitHash),
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'openclaw-dynamic-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith('/openclaw-proxy')) {
            return next()
          }

          const target = req.headers['x-openclaw-target'] as string | undefined
          if (!target) {
            res.writeHead(400, { 'Content-Type': 'text/plain' })
            res.end('Missing X-Openclaw-Target header')
            return
          }

          const subPath = req.url.slice('/openclaw-proxy'.length) || '/'
          const { default: https } = await import('node:https')
          const { default: http } = await import('node:http')
          const { gunzip, brotliDecompress, inflate } = await import('node:zlib')

          let targetUrl: URL
          try {
            targetUrl = new URL(subPath, target)
          } catch {
            res.writeHead(400, { 'Content-Type': 'text/plain' })
            res.end('Invalid target URL')
            return
          }

          const isHttps = targetUrl.protocol === 'https:'

          const forwardHeaders: Record<string, string | string[] | undefined> = {}
          for (const [key, value] of Object.entries(req.headers)) {
            if (key !== 'x-openclaw-target') {
              forwardHeaders[key] = value as string
            }
          }
          forwardHeaders['host'] = targetUrl.host

          const options = {
            hostname: targetUrl.hostname,
            port: targetUrl.port || (isHttps ? 443 : 80),
            path: targetUrl.pathname + targetUrl.search,
            method: req.method,
            headers: forwardHeaders,
            agent: isHttps ? new https.Agent({ rejectUnauthorized: false }) : undefined,
          }

          const lib = isHttps ? https : http
          const proxyReq = lib.request(options, (proxyRes) => {
            const encoding = proxyRes.headers['content-encoding']
            const chunks: Buffer[] = []

            proxyRes.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
            proxyRes.on('end', () => {
              const buffer = Buffer.concat(chunks)

              const responseHeaders = { ...proxyRes.headers }
              delete responseHeaders['content-encoding']
              delete responseHeaders['transfer-encoding']

              const send = (data: Buffer) => {
                responseHeaders['content-length'] = String(data.length)
                res.writeHead(proxyRes.statusCode ?? 200, responseHeaders)
                res.end(data)
              }

              if (encoding === 'gzip') {
                gunzip(buffer, (err, decoded) => {
                  if (err) { res.writeHead(502); res.end('Gzip error') }
                  else send(decoded)
                })
              } else if (encoding === 'br') {
                brotliDecompress(buffer, (err, decoded) => {
                  if (err) { res.writeHead(502); res.end('Brotli error') }
                  else send(decoded)
                })
              } else if (encoding === 'deflate') {
                inflate(buffer, (err, decoded) => {
                  if (err) { res.writeHead(502); res.end('Deflate error') }
                  else send(decoded)
                })
              } else {
                send(buffer)
              }
            })
          })

          proxyReq.on('error', (err) => {
            if (!res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'text/plain' })
            }
            res.end(`Proxy error: ${err.message}`)
          })

          req.pipe(proxyReq)
        })
      },
    },
  ],
})
