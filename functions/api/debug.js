export async function onRequest(context) {
    const { env } = context;
    const projectId = env.VITE_FIREBASE_PROJECT_ID;
    const apiKey = env.VITE_FIREBASE_API_KEY;

    if (!projectId || !apiKey) {
        return new Response("Missing config", { status: 500 });
    }

    try {
        // Fetch first 5 docs from results to inspect structure
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/results?key=${apiKey}&pageSize=5`;

        const response = await fetch(url);
        const data = await response.json();

        return new Response(JSON.stringify(data, null, 2), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(error.message, { status: 500 });
    }
}
