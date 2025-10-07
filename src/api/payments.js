// src/api/payments.js
import { resolveFunctionsUrl } from "../config/env";

export async function createPaymentIntent({
  plan = "premium",
  uid = "anon",
} = {}) {
  const url = resolveFunctionsUrl("/createPaymentIntent");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, uid }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json(); // { clientSecret }
}
