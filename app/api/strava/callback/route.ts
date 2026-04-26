import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return new NextResponse(`Strava vrátila chybu: ${error}`, { status: 400 });
  }

  if (!code) {
    return new NextResponse("Chybí parametr 'code' v URL.", { status: 400 });
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new NextResponse(
      "Server nemá nastavené STRAVA_CLIENT_ID nebo STRAVA_CLIENT_SECRET v .env.local",
      { status: 500 },
    );
  }

  const tokenRes = await fetch("https://www.strava.com/api/v3/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return new NextResponse(
      `Výměna code za token selhala: ${tokenRes.status} ${await tokenRes.text()}`,
      { status: 500 },
    );
  }

  const data = await tokenRes.json();

  const html = `<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8" />
<title>Refresh token získán</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 720px; margin: 60px auto; padding: 0 20px; color: #111; }
  h1 { color: #16a34a; }
  pre { background: #f3f4f6; padding: 16px; border-radius: 8px; word-break: break-all; white-space: pre-wrap; }
  code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
  .step { background: #fffbeb; border: 1px solid #fde68a; padding: 16px; border-radius: 8px; margin-top: 24px; }
</style>
</head>
<body>
  <h1>Hotovo, jsi propojen!</h1>
  <p>Tvůj <strong>refresh token</strong> (ten je trvalý — neexpiruje):</p>
  <pre>${data.refresh_token}</pre>

  <div class="step">
    <h2>Co teď</h2>
    <ol>
      <li>Otevři soubor <code>.env.local</code> v projektu.</li>
      <li>Vlož token jako <code>STRAVA_REFRESH_TOKEN=...</code> (zkopíruj hodnotu výš).</li>
      <li>V terminálu zastav dev server (Ctrl+C) a spusť znovu <code>npm run dev</code>.</li>
      <li>Otevři <a href="/">hlavní stránku</a> — uvidíš svoje aktivity.</li>
    </ol>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
