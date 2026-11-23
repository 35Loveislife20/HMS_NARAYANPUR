// Brevo HTTP API transport: Render free plan पर SMTP ports बंद हैं, इसलिए HTTPS (443) से mail भेजता है।
// BREVO_API_KEY सेट न हो तो nodemailer पहले की तरह काम करता है।
const nodemailer = require("nodemailer");
const addressparser = require("nodemailer/lib/addressparser");
const fs = require("fs");
const path = require("path");

const API = "https://api.brevo.com/v3";

function toList(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.flatMap(toList);
  if (typeof v === "string") {
    return addressparser(v)
      .flatMap((a) => (a.group ? a.group : [a]))
      .filter((a) => a.address)
      .map((a) => ({ email: a.address, ...(a.name ? { name: a.name } : {}) }));
  }
  if (v.address) return [{ email: v.address, ...(v.name ? { name: v.name } : {}) }];
  return [];
}

async function mapAttachments(list) {
  const out = [];
  for (const a of list || []) {
    const name = a.filename || (a.path ? path.basename(a.path) : "attachment");
    let buf;
    if (a.content != null) {
      buf = Buffer.isBuffer(a.content)
        ? a.content
        : Buffer.from(String(a.content), a.encoding || "utf8");
    } else if (a.path) {
      buf = await fs.promises.readFile(a.path);
    } else {
      continue; // stream वाले attachments अभी supported नहीं
    }
    out.push({ name, content: buf.toString("base64") });
  }
  return out;
}

async function sendViaBrevo(mail) {
  const d = mail.data;
  let sender = toList(d.from)[0] || toList(process.env.EMAIL_FROM)[0] || { email: process.env.EMAIL_USER };
  if (process.env.BREVO_SENDER_EMAIL) sender = { ...sender, email: process.env.BREVO_SENDER_EMAIL };

  const to = toList(d.to);
  const body = { sender, to, subject: d.subject || "(no subject)" };
  if (d.html) body.htmlContent = String(d.html);
  if (d.text) body.textContent = String(d.text);
  if (!body.htmlContent && !body.textContent) body.textContent = " ";
  const cc = toList(d.cc);
  const bcc = toList(d.bcc);
  const reply = toList(d.replyTo)[0];
  if (cc.length) body.cc = cc;
  if (bcc.length) body.bcc = bcc;
  if (reply) body.replyTo = reply;
  const att = await mapAttachments(d.attachments);
  if (att.length) body.attachment = att;

  const res = await fetch(`${API}/smtp/email`, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Brevo API ${res.status}: ${text}`);
  let json = {};
  try { json = JSON.parse(text); } catch (_) {}
  return {
    messageId: json.messageId,
    accepted: to.map((t) => t.email),
    rejected: [],
    response: "Brevo API OK",
  };
}

const brevoTransport = {
  name: "brevo-http",
  version: "1.0.0",
  send(mail, cb) {
    sendViaBrevo(mail).then((info) => cb(null, info), (err) => cb(err));
  },
  verify(cb) {
    fetch(`${API}/account`, {
      headers: { "api-key": process.env.BREVO_API_KEY, accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    }).then(
      (r) => (r.ok ? cb(null, true) : cb(new Error(`Brevo API verify failed: ${r.status}`))),
      (e) => cb(e)
    );
  },
};

const original = nodemailer.createTransport.bind(nodemailer);
nodemailer.createTransport = function (...args) {
  if (!process.env.BREVO_API_KEY) return original(...args);
  return original(brevoTransport);
};