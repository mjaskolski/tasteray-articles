/**
 * TasteRay Articles Proxy Worker
 * 
 * Rewrites /articles* requests to https://landing-farm.wondelai.workers.dev/tasteray.com*
 * Rewrites /_astro/* requests to https://landing-farm.wondelai.workers.dev/_astro/*
 * and replaces origin URLs with https://tasteray.com/articles in the response.
 */

const ORIGIN_HOST = 'https://landing-farm.wondelai.workers.dev';
const ORIGIN_BASE = `${ORIGIN_HOST}/tasteray.com`;
const TARGET_BASE = 'https://tasteray.com/articles';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    let originUrl: string;
    
    // Handle /_astro/* paths (static assets)
    if (url.pathname.startsWith('/_astro/')) {
      originUrl = `${ORIGIN_HOST}${url.pathname}${url.search}`;
    }
    // Handle /articles* paths
    else if (url.pathname.startsWith('/articles')) {
      // /articles -> https://landing-farm.wondelai.workers.dev/tasteray.com
      // /articles/foo -> https://landing-farm.wondelai.workers.dev/tasteray.com/foo
      const pathAfterArticle = url.pathname.slice('/articles'.length);
      originUrl = `${ORIGIN_BASE}${pathAfterArticle}${url.search}`;
    }
    else {
      return new Response('Not Found', { status: 404 });
    }

    // Fetch from the origin
    const originRequest = new Request(originUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow',
    });

    const response = await fetch(originRequest);
    
    // Get content type to determine if we should rewrite content
    const contentType = response.headers.get('content-type') || '';
    const isTextContent = 
      contentType.includes('text/html') ||
      contentType.includes('text/css') ||
      contentType.includes('application/javascript') ||
      contentType.includes('application/json') ||
      contentType.includes('text/javascript');

    if (!isTextContent) {
      // For binary content (images, fonts, etc.), pass through as-is
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: rewriteHeaders(response.headers),
      });
    }

    // For text content, rewrite URLs
    let body = await response.text();
    
    // Replace all occurrences of the origin URL with the target URL
    body = rewriteUrls(body);

    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: rewriteHeaders(response.headers),
    });
  },
} satisfies ExportedHandler<Env>;

/**
 * Rewrite URLs in the response body
 */
function rewriteUrls(content: string): string {
  // Replace the full origin URL with the target URL
  // Handle both with and without trailing content
  content = content.replaceAll(
    'https://landing-farm.wondelai.workers.dev/tasteray.com',
    'https://tasteray.com/articles'
  );
  
  // Also handle protocol-relative URLs
  content = content.replaceAll(
    '//landing-farm.wondelai.workers.dev/tasteray.com',
    '//tasteray.com/articles'
  );

  // Rewrite /_astro/ URLs to be relative (served by this worker)
  content = content.replaceAll(
    'https://landing-farm.wondelai.workers.dev/_astro/',
    '/_astro/'
  );
  
  content = content.replaceAll(
    '//landing-farm.wondelai.workers.dev/_astro/',
    '/_astro/'
  );

  return content;
}

/**
 * Rewrite response headers, removing problematic headers
 */
function rewriteHeaders(headers: Headers): Headers {
  const newHeaders = new Headers(headers);
  
  // Remove headers that might cause issues with proxying
  newHeaders.delete('content-encoding');
  newHeaders.delete('content-length');
  newHeaders.delete('transfer-encoding');
  
  // Remove CSP headers that might block our rewritten URLs
  // Optionally keep them if you want stricter security
  // newHeaders.delete('content-security-policy');
  
  return newHeaders;
}

interface Env {
  // Add environment bindings here if needed
}

