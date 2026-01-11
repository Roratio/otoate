export async function onRequest(context) {
    const { env } = context;
    const projectId = env.VITE_FIREBASE_PROJECT_ID;
    const apiKey = env.VITE_FIREBASE_API_KEY;

    if (!projectId || !apiKey) {
        return new Response("Missing config", { status: 500 });
    }

    try {
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runAggregationQuery?key=${apiKey}`;

        // Test query for score == 1 (which we know exists)
        const body = {
            structuredQuery: {
                from: [{ collectionId: "results" }],
                where: {
                    fieldFilter: {
                        field: { fieldPath: "score" },
                        op: "EQUAL",
                        value: { integerValue: "1" }
                    }
                }
            },
            aggregations: [{ alias: "count", count: {} }]
        };

        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        return new Response(JSON.stringify({
            status: response.status,
            statusText: response.statusText,
            data: data
        }, null, 2), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(error.message, { status: 500 });
    }
}
