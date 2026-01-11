export async function onRequest(context) {
    const { env } = context;
    const projectId = env.VITE_FIREBASE_PROJECT_ID;
    const apiKey = env.VITE_FIREBASE_API_KEY;

    if (!projectId || !apiKey) {
        return new Response("Missing config", { status: 500 });
    }

    try {
        const results = {};

        // 1. Test v1 runAggregationQuery
        const urlAgg = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runAggregationQuery?key=${apiKey}`;
        const bodyAgg = {
            structuredQuery: {
                from: [{ collectionId: "results" }],
                aggregations: [{ alias: "count", count: {} }]
            }
        };

        // 2. Test v1beta1 runAggregationQuery
        const urlAggBeta = `https://firestore.googleapis.com/v1beta1/projects/${projectId}/databases/(default)/documents:runAggregationQuery?key=${apiKey}`;

        // 3. Test v1 runQuery (Baseline)
        const urlQuery = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;
        const bodyQuery = {
            structuredQuery: {
                from: [{ collectionId: "results" }],
                limit: 1
            }
        };

        // Execute 1 (v1)
        try {
            const res1 = await fetch(urlAgg, { method: 'POST', body: JSON.stringify(bodyAgg), headers: { 'Content-Type': 'application/json' } });
            results.v1_agg_status = res1.status;
            results.v1_agg_data = await res1.json();
        } catch (e) { results.v1_agg_error = e.message; }

        // Execute 2 (v1beta1)
        try {
            const res2 = await fetch(urlAggBeta, { method: 'POST', body: JSON.stringify(bodyAgg), headers: { 'Content-Type': 'application/json' } });
            results.v1beta1_agg_status = res2.status;
            results.v1beta1_agg_data = await res2.json();
        } catch (e) { results.v1beta1_agg_error = e.message; }

        // Execute 3 (runQuery)
        try {
            const res3 = await fetch(urlQuery, { method: 'POST', body: JSON.stringify(bodyQuery), headers: { 'Content-Type': 'application/json' } });
            results.query_status = res3.status;
            // Limit output
            results.query_sample = (await res3.json())[0];
        } catch (e) { results.query_error = e.message; }


        return new Response(JSON.stringify(results, null, 2), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(error.message, { status: 500 });
    }
}
