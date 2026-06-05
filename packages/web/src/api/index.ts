import { Hono } from "hono";
import { cors } from "hono/cors";
import { fetchCatalog } from "./yml-catalog";
import nodemailer from "nodemailer";

const app = new Hono().basePath("api");
app.use("/*", cors());
const NP_URL = "https://api.novaposhta.ua/v2.0/json/";

app.get("/products", async (c) => {
  try {
    const products = await fetchCatalog();
    const sportSlug = c.req.query("sportSlug");
    const category = c.req.query("category");
    const isChildren = c.req.query("isChildren");
    const brand = c.req.query("brand");
    const productType = c.req.query("productType");
    let result = products;
    if (sportSlug) {
      const slugs = sportSlug.split(',').map((s: string) => s.trim());
      result = result.filter((p) => slugs.includes(p.sportSlug));
    }
    if (category) result = result.filter((p) => p.categorySlug === category);
    if (isChildren === "true") result = result.filter((p) => p.isChildren);
    if (isChildren === "false") result = result.filter((p) => !p.isChildren);
    if (brand) result = result.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
    if (productType) {
      const types = productType.split(',').map((t: string) => t.trim());
      result = result.filter((p) => types.includes(p.productType));
    }
    return c.json(result, 200);
  } catch (e) {
    console.error("Catalog fetch error:", e);
    return c.json({ error: "Failed to load catalog" }, 500);
  }
});

// Cross-sell / accessories pool — bags, trainers, belts (no sport filter)
// ?limit=N   default 12
// ?types=bags,belts,trainers  comma-separated type filter (default: bags,belts,trainers)
app.get("/products/cross-sell", async (c) => {
  try {
    const products = await fetchCatalog();
    const rawTypes = c.req.query("types") ?? "bags,belts,trainers";
    const allowedTypes = new Set(rawTypes.split(',').map((t: string) => t.trim()));
    const TYPE_PRIORITY: Record<string, number> = { bags: 0, belts: 1, trainers: 2 };
    const crossSell = products
      .filter((p) => allowedTypes.has(p.productType))
      .sort((a, b) => {
        const pa = TYPE_PRIORITY[a.productType] ?? 99;
        const pb = TYPE_PRIORITY[b.productType] ?? 99;
        return pa !== pb ? pa - pb : 0;
      });
    const limit = parseInt(c.req.query("limit") ?? "12", 10);
    return c.json(crossSell.slice(0, limit), 200);
  } catch (e) {
    console.error("Cross-sell fetch error:", e);
    return c.json({ error: "Failed to load cross-sell" }, 500);
  }
});

app.get("/products/:id", async (c) => {
  try {
    const products = await fetchCatalog();
    const id = c.req.param("id");
    const product = products.find((p) => p.id === id || p.slug === id);
    if (!product) return c.json({ error: "Not found" }, 404);
    return c.json(product, 200);
  } catch (e) {
    return c.json({ error: "Failed to load catalog" }, 500);
  }
});

app.get("/np/cities", async (c) => {
  const q = c.req.query("q") || "";
  if (q.length < 2) return c.json([], 200);
  const apiKey = process.env.NOVA_POSHTA_API_KEY || "8ccac961fb4d5c4ea733b1bdc2a0f273";
  const res = await fetch(NP_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey, modelName: "Address", calledMethod: "getCities", methodProperties: { FindByString: q, Limit: 10 } }) });
  const json = (await res.json()) as any;
  if (!json.success) return c.json([], 200);
  const cities = json.data.map((city: any) => ({ ref: city.Ref, name: city.Description, area: city.AreaDescription, type: city.SettlementTypeDescription }));
  return c.json(cities, 200);
});

app.get("/np/warehouses", async (c) => {
  const cityRef = c.req.query("cityRef") || "";
  const q = c.req.query("q") || "";
  if (!cityRef) return c.json([], 200);
  const apiKey = process.env.NOVA_POSHTA_API_KEY || "8ccac961fb4d5c4ea733b1bdc2a0f273";
  const res = await fetch(NP_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey, modelName: "AddressGeneral", calledMethod: "getWarehouses", methodProperties: { CityRef: cityRef, FindByString: q, Limit: 20, Language: "UA" } }) });
  const json = (await res.json()) as any;
  if (!json.success) return c.json([], 200);
  const warehouses = json.data.map((w: any) => ({ ref: w.Ref, name: w.Description, number: w.Number, type: w.CategoryOfWarehouse }));
  return c.json(warehouses, 200);
});

// ─── POST /api/orders ─────────────────────────────────────────────────────────
// Receives OrderSnapshot from checkout, fires emails (best-effort).
app.post("/orders", async (c) => {
  let body: any;
  try { body = await c.req.json(); } catch { return c.json({ ok: false, error: "invalid json" }, 400); }

  const {
    orderId, name, phone, email, deliveryText, paymentText,
    total, items, tgMsg: _tgMsg, comment,
  } = body as {
    orderId: string; name: string; phone: string; email: string;
    deliveryText: string; paymentText: string; total: number;
    items: { name: string; size: string; qty: number; price: number }[];
    tgMsg: string; comment?: string;
  };

  const storeEmail = process.env.STORE_ORDER_EMAIL ?? "orders@giwear.com.ua";
  const now = new Date().toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" });

  // ── Build item rows for HTML ──────────────────────────────────────────────
  const itemRows = (items ?? []).map(i =>
    `<tr>
      <td style="padding:6px 8px;border-bottom:1px solid #2a2a2a;color:#e0e0e0">${i.name}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #2a2a2a;color:#a0a0a0;white-space:nowrap">${i.size}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #2a2a2a;color:#a0a0a0;text-align:center">${i.qty}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #2a2a2a;color:#e0e0e0;text-align:right;white-space:nowrap">${(i.price * i.qty).toLocaleString("uk-UA")} грн</td>
    </tr>`
  ).join("");

  // ── HTML template factory ─────────────────────────────────────────────────
  const makeHtml = (forStore: boolean) => `<!DOCTYPE html>
<html lang="uk">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Замовлення ${orderId}</title></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:32px 0">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#161616;border:1px solid #252525;border-radius:12px;overflow:hidden">

  <!-- Header -->
  <tr><td style="background:#E8232A;padding:18px 24px 14px">
    <img src="https://giwear.com.ua/logo/giwear-logo-email.png" alt="GIWEAR" width="140" height="33" style="display:block;height:33px;width:auto;margin-bottom:10px" />
    <h1 style="margin:0;font-size:20px;font-weight:900;color:#fff;letter-spacing:-0.3px">
      ${forStore ? '🛒 Нове замовлення' : 'Дякуємо за замовлення!'}
    </h1>
  </td></tr>

  <!-- Order ID + date -->
  <tr><td style="padding:16px 24px 0">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size:12px;color:#666">Номер замовлення</td>
        <td align="right" style="font-size:12px;font-weight:700;color:#E8232A;letter-spacing:1px">${orderId}</td>
      </tr>
      ${forStore ? `<tr><td style="font-size:12px;color:#666;padding-top:4px">Дата/час</td><td align="right" style="font-size:12px;color:#a0a0a0;padding-top:4px">${now}</td></tr>` : ''}
    </table>
  </td></tr>

  <!-- Divider -->
  <tr><td style="padding:12px 24px"><hr style="border:none;border-top:1px solid #252525;margin:0"></td></tr>

  <!-- Customer -->
  <tr><td style="padding:0 24px 12px">
    <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#666;letter-spacing:1px;text-transform:uppercase">Клієнт</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">
      <tr><td style="color:#666;padding-bottom:4px">Ім'я</td><td align="right" style="color:#e0e0e0;padding-bottom:4px">${name}</td></tr>
      <tr><td style="color:#666;padding-bottom:4px">Телефон</td><td align="right" style="color:#e0e0e0;padding-bottom:4px">
        ${forStore ? `<a href="tel:${phone}" style="color:#e0e0e0;text-decoration:none">${phone}</a>` : phone}
      </td></tr>
      ${email ? `<tr><td style="color:#666;padding-bottom:4px">Email</td><td align="right" style="padding-bottom:4px">
        ${forStore ? `<a href="mailto:${email}" style="color:#e0e0e0;text-decoration:none">${email}</a>` : `<span style="color:#e0e0e0">${email}</span>`}
      </td></tr>` : ''}
    </table>
  </td></tr>

  <!-- Divider -->
  <tr><td style="padding:0 24px 12px"><hr style="border:none;border-top:1px solid #252525;margin:0"></td></tr>

  <!-- Delivery & payment -->
  <tr><td style="padding:0 24px 12px">
    <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#666;letter-spacing:1px;text-transform:uppercase">Доставка та оплата</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">
      <tr>
        <td colspan="2" style="padding-bottom:8px">
          <span style="color:#666;display:block;margin-bottom:3px">Доставка</span>
          <span style="color:#e0e0e0;line-height:1.5">${deliveryText}</span>
        </td>
      </tr>
      <tr><td style="color:#666;padding-top:2px">Оплата</td><td align="right" style="color:#e0e0e0;padding-top:2px">${paymentText}</td></tr>
    </table>
  </td></tr>

  <!-- Divider -->
  <tr><td style="padding:0 24px 12px"><hr style="border:none;border-top:1px solid #252525;margin:0"></td></tr>

  <!-- Items -->
  <tr><td style="padding:0 24px 12px">
    <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#666;letter-spacing:1px;text-transform:uppercase">Товари</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">
      <thead>
        <tr style="background:#1e1e1e">
          <th style="padding:6px 8px;text-align:left;color:#666;font-weight:500">Назва</th>
          <th style="padding:6px 8px;text-align:left;color:#666;font-weight:500">Розмір</th>
          <th style="padding:6px 8px;text-align:center;color:#666;font-weight:500">К-ть</th>
          <th style="padding:6px 8px;text-align:right;color:#666;font-weight:500">Сума</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
  </td></tr>

  <!-- Total -->
  <tr><td style="padding:0 24px 16px">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size:14px;font-weight:700;color:#fff">Разом</td>
        <td align="right" style="font-size:18px;font-weight:900;color:#E8232A">${total.toLocaleString("uk-UA")} грн</td>
      </tr>
    </table>
  </td></tr>

  ${comment ? `
  <!-- Comment -->
  <tr><td style="padding:0 24px 16px">
    <hr style="border:none;border-top:1px solid #252525;margin:0 0 12px">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#666;letter-spacing:1px;text-transform:uppercase">Коментар</p>
    <p style="margin:0;font-size:13px;color:#a0a0a0">${comment}</p>
  </td></tr>` : ''}

  <!-- Footer -->
  <tr><td style="background:#111;padding:16px 24px;text-align:center;border-top:1px solid #222">
    <p style="margin:0;font-size:13px;color:#888;line-height:1.5">
      ${forStore
        ? `Замовлення отримано із сайту <a href="https://giwear.com.ua" style="color:#c0c0c0;text-decoration:none">giwear.com.ua</a>`
        : `Менеджер GIWEAR зв'яжеться з вами для підтвердження. Будь ласка, перевірте телефон.`
      }
    </p>
    <p style="margin:8px 0 0">
      <a href="https://giwear.com.ua" style="font-size:12px;color:#666;text-decoration:none;letter-spacing:0.5px">giwear.com.ua</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  // ── Send emails via SMTP (nodemailer) ────────────────────────────────────
  const sendEmails = async () => {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // Fallback to send-email CLI if SMTP not configured
    if (!smtpUser || !smtpPass) {
      console.warn("[orders] SMTP_USER/SMTP_PASS not set — falling back to send-email CLI");
      const storeHtml = makeHtml(true);
      const customerHtml = makeHtml(false);
      try {
        const p = Bun.spawn(["send-email", "--to", storeEmail, "--subject", `[GIWEAR] Замовлення ${orderId} · ${name}`, "--html", storeHtml], { env: { ...process.env }, stderr: "pipe" });
        await p.exited;
      } catch (e) { console.error("[orders] fallback store email failed:", e); }
      if (email) {
        try {
          const p = Bun.spawn(["send-email", "--to", email, "--subject", `Ваше замовлення ${orderId} · GIWEAR`, "--html", customerHtml], { env: { ...process.env }, stderr: "pipe" });
          await p.exited;
        } catch (e) { console.error("[orders] fallback customer email failed:", e); }
      }
      return;
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const fromField = `"GIWEAR" <${smtpUser}>`;
    const replyTo  = storeEmail;

    const storeHtml    = makeHtml(true);
    const customerHtml = makeHtml(false);

    // Always send to store
    try {
      await transporter.sendMail({
        from:    fromField,
        to:      storeEmail,
        replyTo,
        subject: `[GIWEAR] Замовлення ${orderId} · ${name}`,
        html:    storeHtml,
      });
      console.log(`[orders] store email sent → ${storeEmail}`);
    } catch (err) {
      console.error("[orders] store email failed:", err);
    }

    // Send to customer only if email provided
    if (email) {
      try {
        await transporter.sendMail({
          from:    fromField,
          to:      email,
          replyTo,
          subject: `Ваше замовлення ${orderId} · GIWEAR`,
          html:    customerHtml,
        });
        console.log(`[orders] customer email sent → ${email}`);
      } catch (err) {
        console.error("[orders] customer email failed:", err);
      }
    }
  };

  // Fire and forget — don't block the HTTP response
  sendEmails();

  console.log(`[orders] ${orderId} received — emails dispatched (store: ${storeEmail}, customer: ${email || "none"})`);
  return c.json({ ok: true, orderId }, 200);
});

export type AppType = typeof app;
export default app;
