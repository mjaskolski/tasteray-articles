# TasteRay Articles Proxy Worker

A Cloudflare Worker that proxies `/articles*` requests to the landing farm and rewrites URLs in responses.

## How it works

1. Intercepts requests to `/articles*` paths
2. Proxies them to `https://landing-farm.wondelai.workers.dev/tasteray.com*`
3. Rewrites all occurrences of the origin URL in the response to `https://tasteray.com/articles`

### URL Mapping Examples

| Incoming Request | Proxied To |
|------------------|------------|
| `/articles` | `https://landing-farm.wondelai.workers.dev/tasteray.com` |
| `/articles/` | `https://landing-farm.wondelai.workers.dev/tasteray.com/` |
| `/articles/some-page` | `https://landing-farm.wondelai.workers.dev/tasteray.com/some-page` |

## Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
```

The worker will be available at `http://localhost:8787`.

## Deployment

```bash
# Deploy to Cloudflare
npm run deploy
```

## Configuration

To route traffic from your domain, uncomment and configure the `routes` section in `wrangler.toml`:

```toml
routes = [
  { pattern = "tasteray.com/articles*", zone_name = "tasteray.com" }
]
```

This will route all `tasteray.com/article*` requests through this worker.

