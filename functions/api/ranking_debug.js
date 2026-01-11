export async function onRequest(context) {
    const { env } = context;
    const projectId = env.VITE_FIREBASE_PROJECT_ID;
    const apiKey = env.VITE_FIREBASE_API_KEY;

    if (!projectId || !apiKey) {
        return new Response("Missing config", { status: 500 });
    }

    try {
        const results = {};

        // 1. Test standard runAggregationQuery
        const urlAgg = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runAggregationQuery?key=${apiKey}`;
        const bodyAgg = {
            structuredQuery: {
                from: [{ collectionId: "results" }],
                aggregations: [{ alias: "count", count: {} }] // simplified
            }
        };

        // 2. Test runQuery (Standard Query) - to check if :runQuery works
        const urlQuery = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;
        const bodyQuery = {
            structuredQuery: {
                from: [{ collectionId: "results" }],
                limit: 1
            }
        };

        // 3. Test encoded colon
        const urlEncoded = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents%3ArunAggregationQuery?key=${apiKey}`;

        // Execute 1
        try {
            const res1 = await fetch(urlAgg, { method: 'POST', body: JSON.stringify(bodyAgg), headers: { 'Content-Type': 'application/json' } });
            results.agg_status = res1.status;
            results.agg_data = await res1.json();
        } catch (e) { results.agg_error = e.message; }

        // Execute 2
        try {
            const res2 = await fetch(urlQuery, { method: 'POST', body: JSON.stringify(bodyQuery), headers: { 'Content-Type': 'application/json' } });
            results.query_status = res2.status;
            results.query_data = await res2.json();
        } catch (e) { results.query_error = e.message; }

        // Execute 3
        try {
            const res3 = await fetch(urlEncoded, { method: 'POST', body: JSON.stringify(bodyAgg), headers: { 'Content-Type': 'application/json' } });
            results.encoded_status = res3.status;
            results.encoded_data = await res3.json();
        } catch (e) { results.encoded_error = e.message; }


        return new Response(JSON.stringify(results, null, 2), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(error.message, { status: 500 });
    }
}
