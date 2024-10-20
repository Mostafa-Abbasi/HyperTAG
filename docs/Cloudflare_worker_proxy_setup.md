# How to Set Up a Cloudflare Worker Proxy

This guide will walk you through setting up a Cloudflare Worker proxy for HyperTAG. This proxy helps users in regions with internet censorship or restricted access by routing requests through a Cloudflare Worker, effectively masking your IP and bypassing access blocks.

By the end of this guide, you'll be able to configure your own Worker and use it to proxy requests to different services used by the HyperTAG bot.

## Step 1: Create a Cloudflare Worker

- Log in to your [Cloudflare account](https://dash.cloudflare.com/login).
- Navigate to **Workers** from the dashboard.
- Click **Create a Worker**.
- Choose a meaningful name for your Worker, e.g., **"proxy"**, or **"bridge"**.
- You will be directed to an editor with a default Worker script.

## Step 2: Replace the Default Worker Script with Proxy Code

Replace the default script in the Worker editor with the following proxy code, which will handle incoming requests and forward them to the intended service:

```javascript
export default {
  async fetch(request) {
    const { searchParams } = new URL(request.url);

    // Extract the target URL from the query string
    let url = searchParams.get("url");
    if (!url) {
      return new Response('Missing "url" query parameter', { status: 400 });
    }

    // Append any extra query parameters from the original request
    const forwardedUrl = new URL(url);
    searchParams.forEach((value, key) => {
      if (key !== "url") {
        forwardedUrl.searchParams.append(key, value);
      }
    });

    try {
      // Handle the request body properly by reading it as a stream
      const init = {
        method: request.method,
        headers: request.headers,
        body:
          request.method !== "GET" && request.method !== "HEAD"
            ? await request.clone().arrayBuffer()
            : null, // Clone and read the body
        redirect: "follow", // Ensure redirects are followed
      };

      const response = await fetch(forwardedUrl.toString(), init);

      // Stream the response body directly for faster performance
      return new Response(response.body, {
        status: response.status,
        headers: response.headers,
      });
    } catch (err) {
      // Catch and return any errors during the fetch
      return new Response(`Error forwarding request: ${err.message}`, {
        status: 500,
      });
    }
  },
};
```

### Why This Proxy Script?

- **URL Forwarding**: The script takes a target URL (provided via the `url` query parameter) and forwards the request, allowing additional query parameters to be passed through.
- **Request Method and Body Handling**: It supports various HTTP methods (GET, POST, etc.) and forwards the request body where necessary.
- **Error Handling**: If any issues occur during the forwarding process, a clear error message is returned.

## Step 3: Deploy the Worker

Once you've replaced the default code with the proxy code, it's time to deploy:

1- Click **Save and Deploy** in the Worker editor.

2- After deployment, your Worker will be accessible via a URL following this format: `https://your-worker-name.your-account-name.workers.dev`.

- Example: If your Worker is named proxy and your Cloudflare account name is john, your URL would be: `https://proxy.john.workers.dev`.

## Step 4: Configure the Proxy in HyperTAG's `config.env`

To start using the proxy, you need to configure it in your ‍‍‍‍`config.env` file. Simply update the `PROXY_BASE_URL` to include your Worker URL and append **`?url=`** to the end of the URL. This allows the Worker to know which URL to forward requests to.

### Example:

If your Worker URL is `https://proxy.john.workers.dev`, your `config.env` configuration would look like this:

```bash
PROXY_BASE_URL=https://proxy.john.workers.dev/?url=
```

## Step 5: Enable Proxy for Specific Services

Your `config.env` file includes options to route both API requests and URL fetching through the proxy for specific services. To enable the proxy for a particular service or for general URL fetching, set the corresponding environment variable to **`true`**. This allows you to bypass access restrictions.

For example, to enable the proxy for Google Gemini API requests, you would configure the following:

```bash
ENABLE_GEMINI_PROXY=true
```

Additionally, to route URL fetching through the proxy, you can enable the URL proxy feature:

```bash
ENABLE_URL_PROXY=true
```

Below is a list of all the proxy settings you can enable for different types of requests in the `config.env`:

```bash
# Re-fetch URLs through the proxy
ENABLE_URL_PROXY=true

# Enable proxy for Telegram API
ENABLE_TELEGRAM_PROXY=true

# Enable proxy for Google Gemini API
ENABLE_GEMINI_PROXY=true

# Enable proxy for TextRazor API
ENABLE_TEXTRAZOR_PROXY=true

# Enable proxy for OpenRouter API
ENABLE_OPENROUTER_PROXY=true
```

## Additional Notes

- **Rate Limits**: Cloudflare Workers have rate limits, especially if you're on the free tier (Currently 100,000 Requests/Day). Keep this in mind if your application generates a high volume of proxy requests. Consider upgrading to a higher Cloudflare plan if needed.

- **Security**: Make sure your Worker URL isn’t publicly exposed unnecessarily. You can use Cloudflare Access to restrict access or take other security measures to prevent misuse.

- **Monitoring**: Cloudflare provides logging and analytics, which can be useful to monitor how often the Worker is being called and for diagnosing any issues.
