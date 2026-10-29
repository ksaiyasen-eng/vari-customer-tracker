import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Customer follow-up tracker API. Every call needs the team PIN (secret CUST_PIN, else VARI_PIN).
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
// trimmed: a pasted secret often carries a trailing space or newline
const PIN = (Deno.env.get("CUST_PIN") || Deno.env.get("VARI_PIN") || "").trim();

const MAX_FAILS = 10, FAIL_WINDOW_MIN = 15, MAX_BODY = 256 * 1024;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

function same(a: string, b: string) {
  if (!a || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  let p: any;
  try { p = await req.json(); } catch { return json({ error: "bad_json" }, 400); }

  // not a wrong guess: the secret is missing, so nobody can get in yet
  if (!PIN) return json({ error: "pin_not_set" }, 503);

  // slow down PIN guessing per address
  const ip = (req.headers.get("x-forwarded-for") ?? "?").split(",")[0].trim();
  const since = new Date(Date.now() - FAIL_WINDOW_MIN * 60e3).toISOString();
  const { count } = await sb.from("cust_fails").select("id", { count: "exact", head: true }).eq("ip", ip).gte("at", since);
  if ((count ?? 0) >= MAX_FAILS) return json({ error: "locked" }, 429);
  if (!same(String(p.pin ?? "").trim(), PIN)) {
    await sb.from("cust_fails").insert({ ip });
    return json({ error: "bad_pin" }, 401);
  }

  switch (p.action) {
    case "auth":
      return json({ ok: true });
    case "data": {
      const { data, error } = await sb.from("cust_data").select("body").eq("id", "main").single();
      return error ? json({ error: error.message }, 500) : json(data.body);
    }
    case "list": {
      // rows changed after `since` (ISO time); all rows when absent
      let q = sb.from("cust_track").select("k, body, updated_at").order("updated_at").limit(10000);
      if (p.since) q = q.gt("updated_at", String(p.since));
      const { data, error } = await q;
      return error ? json({ error: error.message }, 500) : json({ rows: data, now: new Date().toISOString() });
    }
    case "save": {
      const k = String(p.k ?? "");
      if (!/^[A-Za-z0-9_-]{1,120}$/.test(k)) return json({ error: "bad_key" }, 400);
      if (!p.body || typeof p.body !== "object" || Array.isArray(p.body)) return json({ error: "bad_body" }, 400);
      if (JSON.stringify(p.body).length > MAX_BODY) return json({ error: "too_large" }, 413);
      const { error } = await sb.from("cust_track").upsert({ k, body: p.body, updated_at: new Date().toISOString() });
      return error ? json({ error: error.message }, 500) : json({ ok: true });
    }
    default:
      return json({ error: "bad_action" }, 400);
  }
});
