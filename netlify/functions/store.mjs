const errorJson = (status, message) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ error: message }),
});

const parseBlobContext = () => {
  const raw = process.env.NETLIFY_BLOBS_CONTEXT;
  if (!raw) throw new Error("NETLIFY_BLOBS_CONTEXT is not set");
  let decoded;
  try {
    decoded = Buffer.from(raw, "base64").toString("utf8");
  } catch (err) {
    throw new Error("Failed to decode NETLIFY_BLOBS_CONTEXT");
  }
  try {
    return JSON.parse(decoded);
  } catch (err) {
    throw new Error("NETLIFY_BLOBS_CONTEXT is not valid JSON");
  }
};

const makeBlobUrl = ({ edgeURL, siteID }) => {
  if (!edgeURL || !siteID)
    throw new Error("Missing edgeURL or siteID in blob context");
  return new URL(`${siteID}/site:dashboard/state`, edgeURL).toString();
};

const fetchBlob = async (url, token, options = {}) => {
  const headers = { Authorization: `Bearer ${token}` };
  if (options.headers) Object.assign(headers, options.headers);
  return fetch(url, { ...options, headers });
};

export const config = { path: "/.netlify/functions/store" };

export const handler = async (event) => {
  try {
    const ctx = parseBlobContext();
    const url = makeBlobUrl(ctx);
    const method = event.httpMethod || event.method || "GET";

    if (method === "GET") {
      const res = await fetchBlob(url, ctx.token, { method: "GET" });
      if (res.status === 404) {
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        };
      }
      if (!res.ok) {
        const text = await res.text();
        return errorJson(502, `Blob fetch failed: ${res.status} ${text}`);
      }
      const body = await res.text();
      if (!body) {
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        };
      }
      try {
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: body,
        };
      } catch (err) {
        return errorJson(502, "Saved blob is not valid JSON");
      }
    }

    if (method === "PUT" || method === "POST") {
      if (!event.body) {
        return errorJson(400, "Request body is required");
      }
      let payload;
      try {
        payload = JSON.parse(event.body);
      } catch (err) {
        return errorJson(400, "Request body must be valid JSON");
      }
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return errorJson(400, "Body must be a JSON object");
      }

      const res = await fetchBlob(url, ctx.token, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        return errorJson(502, `Blob save failed: ${res.status} ${text}`);
      }
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: true }),
      };
    }

    return errorJson(405, `Unsupported method: ${method}`);
  } catch (error) {
    return errorJson(500, error.message || "Internal server error");
  }
};
