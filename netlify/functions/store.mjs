import { getStore } from "@netlify/blobs";

export default async (req) => {
  try {
    // Netlify samo wykryje ten import i automatycznie podepnie uprawnienia!
    const store = getStore("dashboard-state");

    if (req.method === "GET") {
      // Zwracamy stan do przeglądarki (lub pusty obiekt, jeśli to pierwszy start)
      const data = await store.get("user-data", { type: "json" });
      return new Response(JSON.stringify(data || {}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (req.method === "PUT" || req.method === "POST") {
      // Zapisujemy nowy stan z przeglądarki do chmury
      const body = await req.json();
      await store.setJSON("user-data", body);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Niedozwolona metoda" }), {
      status: 405,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};

export const config = {
  path: "/.netlify/functions/store",
};
