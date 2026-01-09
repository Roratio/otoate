
export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const score = url.searchParams.get('score') || '0';
    const rankPct = url.searchParams.get('rank') || '-';

    // Construct the OGP Image URL
    // It should point to our own API
    const baseUrl = url.origin;
    const ogImageUrl = `${baseUrl}/api/og?score=${score}&rank=${rankPct}`;

    const title = `スコア: ${score}/10 | Eternal Return スキル音当て`;
    const description = `Eternal Return スキル音当てクイズ！あなたは全10問中${score}問正解しました！(上位${rankPct}%)`;

    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- Twitter Card data -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${ogImageUrl}">

    <!-- Open Graph data -->
    <meta property="og:title" content="${title}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url.href}" />
    <meta property="og:image" content="${ogImageUrl}" />
    <meta property="og:description" content="${description}" />

    <!-- Redirect to main page -->
    <script>
        // Redirect to the main game page after a short delay or immediately
        // We preserve parameters if needed, or mostly just let them play
        // Maybe we want to highlight "Hey you are viewing a result"?
        // For now, just go to home to play.
        window.location.href = '/';
    </script>
</head>
<body style="background: #111; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
    <div>
        <h1>Eternal Return スキル音当て</h1>
        <p>Redirecting to game...</p>
        <p><a href="/" style="color: #4ade80;">Click here if not redirected</a></p>
    </div>
</body>
</html>
    `;

    return new Response(html, {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
        },
    });
}
