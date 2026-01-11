export async function onRequest(context) {
    const { env } = context;
    const projectId = env.VITE_FIREBASE_PROJECT_ID;
    const apiKey = env.VITE_FIREBASE_API_KEY;

    if (!projectId || !apiKey) {
        return new Response("Missing config", { status: 500 });
    }

    try {
        const results = {};

        // 1. Test runAggregationQuery with structuredAggregationQuery wrapper
        const urlAgg = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runAggregationQuery?key=${apiKey}`;
        const bodyAgg = {
            structuredAggregationQuery: {
                structuredQuery: {
                    from: [{ collectionId: "results" }],
                    limit: 1 // Just to be safe with costs in debug
                },
                aggregations: [{ alias: "count", count: {} }]
            }
        };

        // 2. Test v1 runQuery (Baseline)
        const urlQuery = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;
        const bodyQuery = {
            structuredQuery: {
                from: [{ collectionId: "results" }],
                limit: 1
            }
        };

        // Execute 1 (v1 Agg)
        try {
            const res1 = await fetch(urlAgg, { method: 'POST', body: JSON.stringify(bodyAgg), headers: { 'Content-Type': 'application/json' } });
            results.agg_status = res1.status;
            results.agg_data = await res1.json();
        } catch (e) { results.agg_error = e.message; }

        // Execute 2 (runQuery)
        try {
            const res2 = await fetch(urlQuery, { method: 'POST', body: JSON.stringify(bodyQuery), headers: { 'Content-Type': 'application/json' } });
            results.query_status = res2.status;
            // Limit output
            const queryJson = await res2.json();
            results.query_sample = queryJson[0];
        } catch (e) { results.query_error = e.message; }


        return new Response(JSON.stringify(results, null, 2), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(error.message, { status: 500 });
    }
}
