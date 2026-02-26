import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Hardcoded for testing - move back to env vars after testing works
const vapidPublicKey = "BKjs7vbZSfDggDRPTXmba_JQpdvyYB-ZLmKPLqPtaVgDD9TNwTj3Ackk2v1bWqZYazpASO_JSw1hE3ntDHtOlqE";
const vapidPrivateKey = "JrHdYT1gDhmBELZ7FZSEWnUC5g3PXvZFZAejYBXdj-I";

// Helper: Convert URL-safe base64 to standard base64 with correct padding
function base64UrlToBase64(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // Add correct padding based on string length
  const padding = (4 - (base64.length % 4)) % 4;
  return base64 + '='.repeat(padding);
}

// Helper: Decode URL-safe base64 to Uint8Array
function base64UrlDecode(base64url: string): Uint8Array {
  const base64 = base64UrlToBase64(base64url);
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

// Web Push helper: create JWT for VAPID auth
async function createVapidJwt(endpoint: string): Promise<string> {
  const audience = new URL(endpoint).origin;
  const header = { alg: "ES256", typ: "JWT" };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: "mailto:admin@nexus.kol.tel",
  };

  const enc = new TextEncoder();
  const b64url = (buf: ArrayBuffer) =>
    btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const headerB64 = b64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = b64url(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  // Import VAPID keys using JWK format (more reliable than PKCS8)
  const publicKeyBytes = base64UrlDecode(vapidPublicKey);
  // Public key format: 0x04 + X (32 bytes) + Y (32 bytes)
  const x = publicKeyBytes.slice(1, 33);
  const y = publicKeyBytes.slice(33, 65);
  const d = base64UrlDecode(vapidPrivateKey);

  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: btoa(String.fromCharCode(...x)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
    y: btoa(String.fromCharCode(...y)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
    d: btoa(String.fromCharCode(...d)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
  };

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    enc.encode(signingInput)
  );

  // Convert DER signature to raw r||s format
  const sigBytes = new Uint8Array(signature);
  const rawSig = derToRaw(sigBytes);

  return `${signingInput}.${b64url(rawSig.buffer)}`;
}

// Convert DER encoded ECDSA signature to raw r||s (64 bytes)
function derToRaw(der: Uint8Array): Uint8Array {
  // If it's already 64 bytes, it's raw format
  if (der.length === 64) return der;

  // Parse DER: 0x30 <len> 0x02 <rlen> <r> 0x02 <slen> <s>
  let offset = 2; // skip 0x30 and length
  if (der[0] !== 0x30) return der; // not DER, assume raw

  // Read r
  offset++; // skip 0x02
  const rLen = der[offset++];
  const r = der.slice(offset, offset + rLen);
  offset += rLen;

  // Read s
  offset++; // skip 0x02
  const sLen = der[offset++];
  const s = der.slice(offset, offset + sLen);

  // Pad/trim to 32 bytes each
  const raw = new Uint8Array(64);
  raw.set(r.length > 32 ? r.slice(r.length - 32) : r, 32 - Math.min(r.length, 32));
  raw.set(s.length > 32 ? s.slice(s.length - 32) : s, 64 - Math.min(s.length, 32));
  return raw;
}

// Send Web Push notification
async function sendPush(
  subscription: { endpoint: string; keys_p256dh: string; keys_auth: string },
  payload: string
): Promise<{ ok: boolean; status: number }> {
  // For Web Push, we need encrypted payload using subscription keys
  // Using the simpler approach: send via fetch with VAPID authorization
  const jwt = await createVapidJwt(subscription.endpoint);

  // Encode payload using Web Push encryption
  const { encrypted, salt, serverPublicKey } = await encryptPayload(
    payload,
    subscription.keys_p256dh,
    subscription.keys_auth
  );

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
    },
    body: encrypted,
  });

  return { ok: response.ok, status: response.status };
}

// Web Push payload encryption (RFC 8291)
async function encryptPayload(
  payload: string,
  p256dhB64: string,
  authB64: string
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  const enc = new TextEncoder();

  // Decode subscriber keys (URL-safe base64)
  const p256dh = base64UrlDecode(p256dhB64);
  const auth = base64UrlDecode(authB64);

  // Generate ephemeral ECDH key pair
  const serverKeys = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  // Import subscriber public key
  const subscriberKey = await crypto.subtle.importKey(
    "raw",
    p256dh,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // ECDH shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: subscriberKey },
    serverKeys.privateKey,
    256
  );

  // Export server public key
  const serverPubRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", serverKeys.publicKey)
  );

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF-based key derivation (RFC 8291)
  const authInfo = enc.encode("Content-Encoding: auth\0");
  const prkInfo = new Uint8Array([
    ...enc.encode("WebPush: info\0"),
    ...p256dh,
    ...serverPubRaw,
  ]);

  // Import auth as HKDF key
  const authKey = await crypto.subtle.importKey("raw", auth, "HKDF", false, [
    "deriveBits",
  ]);

  // PRK = HKDF-Extract(auth, shared_secret)
  const ikm = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: auth, info: prkInfo },
    await crypto.subtle.importKey("raw", new Uint8Array(sharedSecret), "HKDF", false, ["deriveBits"]),
    256
  );

  const ikmKey = await crypto.subtle.importKey("raw", new Uint8Array(ikm), "HKDF", false, [
    "deriveBits",
  ]);

  // CEK = HKDF-Expand(PRK, "Content-Encoding: aes128gcm\0", 16)
  const cekInfo = enc.encode("Content-Encoding: aes128gcm\0");
  const cekBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: cekInfo },
    ikmKey,
    128
  );

  // Nonce = HKDF-Expand(PRK, "Content-Encoding: nonce\0", 12)
  const nonceInfo = enc.encode("Content-Encoding: nonce\0");
  const nonceBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: nonceInfo },
    ikmKey,
    96
  );

  // Encrypt with AES-128-GCM
  const contentKey = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(cekBits),
    "AES-GCM",
    false,
    ["encrypt"]
  );

  // Add padding (RFC 8188): 0x02 delimiter + payload
  const padded = new Uint8Array([...enc.encode(payload), 2]);

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: new Uint8Array(nonceBits), tagLength: 128 },
      contentKey,
      padded
    )
  );

  // Build aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65) + ciphertext
  const rs = 4096;
  const rsBytes = new Uint8Array(4);
  new DataView(rsBytes.buffer).setUint32(0, rs);

  const header = new Uint8Array([
    ...salt,
    ...rsBytes,
    serverPubRaw.length,
    ...serverPubRaw,
  ]);

  const encrypted = new Uint8Array(header.length + ciphertext.length);
  encrypted.set(header);
  encrypted.set(ciphertext, header.length);

  return { encrypted, salt, serverPublicKey: serverPubRaw };
}

// ==================== MAIN HANDLER ====================
Deno.serve(async (_req) => {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Fetch today's scheduled meetings
    const { data: meetings, error: meetingsError } = await supabase
      .from("meetings")
      .select("id, company, date, start_time, end_time, subject, service_type, status")
      .eq("date", todayStr)
      .eq("status", "scheduled");

    if (meetingsError) throw new Error(meetingsError.message);
    if (!meetings || meetings.length === 0) {
      return Response.json({ message: "No meetings today" });
    }

    // Find meetings needing reminders
    interface MeetingReminder {
      meeting: typeof meetings[0];
      reminderType: string;
      minutesUntil: number;
      urgent: boolean;
    }
    const reminders: MeetingReminder[] = [];

    // IST offset (UTC+5:30) - adjust if your timezone differs
    const tzOffsetMs = 5.5 * 60 * 60 * 1000;

    for (const meeting of meetings) {
      if (!meeting.start_time) continue;

      const meetingLocal = new Date(`${todayStr}T${meeting.start_time}`);
      const meetingUtc = new Date(meetingLocal.getTime() - tzOffsetMs);
      const diffMin = (meetingUtc.getTime() - now.getTime()) / 60000;

      if (diffMin > 12 && diffMin <= 17) {
        reminders.push({ meeting, reminderType: "15min", minutesUntil: Math.round(diffMin), urgent: false });
      }
      if (diffMin > 2 && diffMin <= 7) {
        reminders.push({ meeting, reminderType: "5min", minutesUntil: Math.round(diffMin), urgent: true });
      }
      if (diffMin >= -2 && diffMin <= 2) {
        reminders.push({ meeting, reminderType: "now", minutesUntil: 0, urgent: true });
      }
    }

    if (reminders.length === 0) {
      return Response.json({ message: "No reminders needed right now" });
    }

    // Check which reminders were already sent
    const { data: alreadySent } = await supabase
      .from("notification_log")
      .select("meeting_id, reminder_type")
      .in("meeting_id", reminders.map((r) => r.meeting.id));

    const sentSet = new Set(
      (alreadySent || []).map((s) => `${s.meeting_id}_${s.reminder_type}`)
    );

    const newReminders = reminders.filter(
      (r) => !sentSet.has(`${r.meeting.id}_${r.reminderType}`)
    );

    if (newReminders.length === 0) {
      return Response.json({ message: "All reminders already sent" });
    }

    // Fetch push subscriptions
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (!subscriptions || subscriptions.length === 0) {
      return Response.json({ message: "No push subscriptions" });
    }

    // Send notifications
    let sentCount = 0;
    const errors: string[] = [];

    for (const reminder of newReminders) {
      const { meeting, reminderType, minutesUntil, urgent } = reminder;

      let title: string, body: string;
      if (minutesUntil <= 0) {
        title = "Meeting Starting Now!";
        body = `Meeting with ${meeting.company} is starting now!`;
      } else if (minutesUntil <= 5) {
        title = `Meeting in ${minutesUntil} min`;
        body = `Meeting with ${meeting.company} starts in ${minutesUntil} minutes!`;
      } else {
        title = "Upcoming Meeting";
        body = `Meeting with ${meeting.company} in ${minutesUntil} minutes`;
      }

      if (meeting.subject) body += ` - ${meeting.subject}`;

      const payload = JSON.stringify({
        title,
        body,
        tag: `meeting_${meeting.id}_${reminderType}`,
        meetingId: meeting.id,
        urgent,
      });

      // Log BEFORE sending to prevent duplicates if function crashes mid-way
      await supabase.from("notification_log").upsert(
        { meeting_id: meeting.id, reminder_type: reminderType },
        { onConflict: "meeting_id,reminder_type" }
      );

      for (const sub of subscriptions) {
        try {
          const result = await sendPush(sub, payload);
          if (result.ok) {
            sentCount++;
          } else if (result.status === 410) {
            // Subscription expired, remove it
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          }
        } catch (err) {
          errors.push(String(err));
        }
      }
    }

    return Response.json({
      sent: sentCount,
      reminders: newReminders.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
});
