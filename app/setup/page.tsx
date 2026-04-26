export default function SetupPage() {
  const clientId = process.env.STRAVA_CLIENT_ID;

  if (!clientId) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-2xl bg-red-50 border border-red-200 rounded-xl p-6">
          <h1 className="text-2xl font-bold text-red-800 mb-3">Chybí STRAVA_CLIENT_ID</h1>
          <p className="text-red-700">
            Otevři soubor <code className="bg-red-100 px-2 py-1 rounded">.env.local</code> v
            kořeni projektu a doplň <code>STRAVA_CLIENT_ID</code> a{" "}
            <code>STRAVA_CLIENT_SECRET</code> z{" "}
            <a
              className="underline"
              href="https://www.strava.com/settings/api"
              target="_blank"
            >
              strava.com/settings/api
            </a>
            . Pak restartuj dev server (Ctrl+C, pak <code>npm run dev</code>).
          </p>
        </div>
      </main>
    );
  }

  const redirectUri = "http://localhost:3000/api/strava/callback";
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri,
  )}&approval_prompt=force&scope=read,activity:read_all`;

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold mb-4">Propojení se Stravou</h1>
        <ol className="space-y-3 text-gray-700 mb-6 list-decimal list-inside">
          <li>Klikni na tlačítko níže.</li>
          <li>Strava se zeptá, jestli souhlasíš s přístupem ke svým aktivitám. Klikni „Authorize“.</li>
          <li>
            Po přesměrování zpět ti tato aplikace ukáže <strong>refresh token</strong>. Zkopíruj
            ho do <code className="bg-gray-100 px-1.5 py-0.5 rounded">.env.local</code> jako{" "}
            <code>STRAVA_REFRESH_TOKEN</code>.
          </li>
          <li>Restartuj dev server a otevři hlavní stránku.</li>
        </ol>
        <a
          href={authUrl}
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Propojit se Stravou
        </a>
      </div>
    </main>
  );
}
