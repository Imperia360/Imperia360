const HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (res, body, status = 200) => {
  Object.entries(HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  res.status(status).json(body);
};

const norm = (s) => String(s ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim();

const price = (p) => Number(
  p?.pricing?.manualSalePrice ||
  p?.pricing?.manualRetailPrice ||
  0
);

const money = (n) => Number(n || 0).toLocaleString("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

async function getCatalog() {
  const url = process.env.CATALOG_URL ||
    "https://imperia360.github.io/Imperia360/data/products.json";
  const r = await fetch(url);
  if (!r.ok) throw new Error("No se pudo cargar el catálogo");
  const data = await r.json();
  return Array.isArray(data) ? data : [];
}

function findProducts(products, query) {
  const tokens = norm(query).split(/\s+/).filter((x) => x.length >= 2);
  return products
    .map((p) => {
      const hay = norm([
        p.name,
        p.brand?.name,
        p.identification?.sku,
        p.identification?.manufacturerReference,
        p.identification?.supplierReference,
        p.category?.name,
        p.subcategory?.name,
        p.presentation,
        p.unitOfSale,
      ].join(" "));
      const hits = tokens.filter((t) => hay.includes(t)).length;
      return { p, score: tokens.length ? hits / tokens.length : 0 };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((x) => x.p);
}

async function askGemini(textIn, products) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const rows = products.slice(0, 30).map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.identification?.sku,
    ref: p.identification?.manufacturerReference,
    price: price(p),
  }));

  const prompt = [
    "Eres el asistente de ventas de IMPERIA 360 Colombia.",
    "Solo puedes afirmar productos y precios presentes en el catálogo proporcionado.",
    "Si un producto no tiene precio, indica precio por confirmar.",
    "No inventes disponibilidad, descuentos ni tiempos de entrega.",
    "Responde en español, breve, claro y orientado a cerrar la compra.",
    "CATALOGO:",
    JSON.stringify(rows),
    "CLIENTE:",
    textIn,
  ].join("\n");

  const r = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      encodeURIComponent(key),
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
      }),
    }
  );

  if (!r.ok) return null;
  const data = await r.json();
  return data?.candidates?.[0]?.content?.parts
    ?.map((x) => x.text || "")
    .join("")
    .trim() || null;
}

async function sendWhatsApp(to, text) {
  const token = process.env.META_ACCESS_TOKEN;
  const phoneId = process.env.META_PHONE_NUMBER_ID;
  if (!token || !phoneId) return false;

  const r = await fetch(
    "https://graph.facebook.com/v23.0/" + phoneId + "/messages",
    {
      method: "POST",
      headers: {
        authorization: "Bearer " + token,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    }
  );

  return r.ok;
}

async function prepareFulfillment(body) {
  const products = await getCatalog();
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) throw new Error("El carrito está vacío");

  const supplierMap = {
    "imp-0001": {
      supplierId: "roxvan",
      supplierName: "Roxvan",
      supplierReference: "13604",
      supplierProductUrl: "https://roxvan.com/producto/chazo-plastico-con-tornillo-1-4-x-50unds-ht1238-ref13604/",
      observedCost: 2428,
      costBasis: "precio público observado para 12+ unidades; verificar nuevamente al comprar",
      stockStatus: "VERIFY_AT_ORDER_TIME"
    }
  };

  const lines = [];
  let saleTotal = 0;
  let supplierTotal = 0;
  for (const item of items) {
    const wanted = String(item.id || item.sku || item.reference || item.name || "");
    const product = products.find((p) => [p.id,p.identification?.sku,p.identification?.manufacturerReference,p.identification?.supplierReference,p.name]
      .some((v) => norm(v) === norm(wanted)));
    if (!product) throw new Error("Producto no encontrado en catálogo: " + wanted);
    const unitSale = price(product);
    if (!unitSale) throw new Error("Producto sin precio confirmado: " + product.name);
    const qty = Math.max(1, Math.min(999, Math.floor(Number(item.qty) || 1)));
    const route = supplierMap[product.id];
    if (!route) {
      lines.push({productId:product.id,name:product.name,qty,unitSale,fulfillment:"MANUAL_SUPPLIER_REVIEW",supplierCost:null,margin:null});
      saleTotal += unitSale * qty;
      continue;
    }
    const supplierCost = route.observedCost;
    const margin = (unitSale - supplierCost) * qty;
    lines.push({productId:product.id,name:product.name,qty,unitSale,supplierId:route.supplierId,supplierName:route.supplierName,supplierReference:route.supplierReference,supplierCost,margin,stockStatus:route.stockStatus,supplierProductUrl:route.supplierProductUrl});
    saleTotal += unitSale * qty;
    supplierTotal += supplierCost * qty;
  }
  return {
    ok:true,
    status:"READY_FOR_PAYMENT_THEN_FULFILLMENT",
    saleTotal,
    observedSupplierCost:supplierTotal || null,
    grossMarginBeforeShipping:(saleTotal - supplierTotal) || null,
    shipping:"CALCULATE_AFTER_DESTINATION",
    lines,
    nextStep:"After Wompi reports APPROVED, create supplier order and obtain tracking number. No stock or freight is invented."
  };
}

async function createWompiLink(body) {
  const products = await getCatalog();
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) throw new Error("El carrito está vacío");
  let total = 0;
  const lines = [];
  for (const item of items) {
    const wanted = String(item.id || item.sku || item.reference || item.name || "");
    const matches = products.filter((p) => [
      p.id,
      p.identification?.sku,
      p.identification?.manufacturerReference,
      p.identification?.supplierReference,
      p.name
    ].some((v) => norm(v) === norm(wanted)));
    const product = matches[0];
    const unit = product ? price(product) : 0;
    const qty = Math.max(1, Math.min(999, Math.floor(Number(item.qty) || 1)));
    if (!product || !unit) throw new Error("Hay productos sin precio confirmado; continúa por WhatsApp.");
    total += unit * qty;
    lines.push(product.name + " x" + qty);
  }
  const key = process.env.WOMPI_PRIVATE_KEY;
  if (!key) throw new Error("WOMPI_PRIVATE_KEY no configurada");

  const amount = Math.round(total);
  if (!Number.isFinite(amount) || amount < 100) throw new Error("Monto inválido");

  const r = await fetch("https://production.wompi.co/v1/payment_links", {
    method: "POST",
    headers: {
      authorization: "Bearer " + key,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      name: String(body.name || "Compra IMPERIA 360").slice(0, 120),
      description: String(lines.join(", ") || body.description || "Pedido IMPERIA 360").slice(0, 255),
      single_use: true,
      collect_shipping: false,
      currency: "COP",
      amount_in_cents: amount * 100,
    }),
  });

  const data = await r.json();
  if (!r.ok) {
    throw new Error(data?.error?.reason || "Wompi no pudo crear el link");
  }

  if (!data?.data?.id) {
    throw new Error("Wompi no devolvió el identificador del link");
  }

  return "https://checkout.wompi.co/l/" + data.data.id;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    Object.entries(HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(204).end();
  }

  try {
    if (req.method === "GET" && req.query?.action === "health") {
      return json(res, {
        ok: true,
        service: "IMPERIA 360 Commerce API",
        runtime: "Vercel",
      });
    }

    if (req.method === "GET" && req.query?.action === "whatsapp-verify") {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
        Object.entries(HEADERS).forEach(([k, v]) => res.setHeader(k, v));
        return res.status(200).send(challenge);
      }

      return res.status(403).send("forbidden");
    }

    if (req.method === "POST" && req.query?.action === "whatsapp-webhook") {
      const body = req.body || {};
      const msg = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      if (!msg || msg.type !== "text") {
        return json(res, { received: true });
      }

      const from = msg.from;
      const textIn = msg.text?.body || "";
      const products = await getCatalog();
      const matches = findProducts(products, textIn);
      const ai = await askGemini(
        textIn,
        matches.length ? matches : products.slice(0, 30)
      );

      const fallback = matches.length
        ? "Hola 👋 Soy el asistente de IMPERIA 360. Encontré:\n" +
          matches.slice(0, 3)
            .map((p) =>
              "- " + p.name +
              (price(p) ? " — " + money(price(p)) : " — precio por confirmar")
            )
            .join("\n") +
          "\n\nIndícame cantidad y zona de entrega para preparar tu pedido."
        : "Hola 👋 Soy el asistente de IMPERIA 360. No encontré una coincidencia exacta. Envíame nombre, referencia, SKU o una foto y lo busco.";

      await sendWhatsApp(from, ai || fallback);
      return json(res, { received: true });
    }

    if (req.method === "POST" && req.query?.action === "payment") {
      const paymentUrl = await createWompiLink(req.body || {});
      return json(res, {
        ok: true,
        provider: "wompi",
        paymentUrl,
      });
    }

    if (req.method === "POST" && req.query?.action === "prepare-fulfillment") {
      return json(res, await prepareFulfillment(req.body || {}));
    }

    return json(res, { error: "Not found" }, 404);
  } catch (error) {
    return json(res, {
      ok: false,
      error: error?.message || "Error interno",
    }, 400);
  }
}
