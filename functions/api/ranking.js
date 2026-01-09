export async function onRequest(context) {
    const { env } = context;
    const projectId = env.VITE_FIREBASE_PROJECT_ID;
    const apiKey = env.VITE_FIREBASE_API_KEY;

    if (!projectId || !apiKey) {
        return new Response(JSON.stringify({ error: "Missing configuration" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }

    try {
        // High-frequency read optimization:
        // Instead of fetching all documents (N reads), we run parallel Aggregation Queries (count) for each score 0-10.
        // This results in constant cost (11 reads) regardless of user base size (e.g. 10k users).

        const scores = Array.from({ length: 11 }, (_, i) => i); // [0, 1, ..., 10]
        // Correct URL for root collection query: parent is ".../documents"
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runAggregationQuery?key=${apiKey}`;

        // Create 11 parallel fetching promises
        const countPromises = scores.map(async (score) => {
            const body = {
                structuredQuery: {
                    from: [{ collectionId: "results" }],
                    where: {
                        fieldFilter: {
                            field: { fieldPath: "score" },
                            op: "EQUAL",
                            value: { integerValue: score }
                        }
                    }
                },
                aggregations: [{ alias: "count", count: {} }]
            };

            try {
                const res = await fetch(url, {
                    method: 'POST',
                    body: JSON.stringify(body),
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!res.ok) {
                    console.error(`Aggregation failed for score ${score}: ${res.status} ${res.statusText}`);
                    return 0;
                }

                // API returns strictly a JSON array (stream of results).
                // Example: [ { "result": { "aggregateFields": { "count": { "integerValue": "42" } } }, "readTime": "..." } ]
                const data = await res.json();

                // Extract count safely
                const countVal = data[0]?.result?.aggregateFields?.count?.integerValue;
                return countVal ? parseInt(countVal, 10) : 0;

            } catch (err) {
                console.error(`Fetch error for score ${score}:`, err);
                return 0;
            }
        });

        // Wait for all 11 fetches to complete
        const counts = await Promise.all(countPromises);

        // Construct distribution and total
        const distribution = {};
        let total = 0;

        counts.forEach((count, index) => {
            if (count > 0) {
                distribution[index] = count;
                total += count;
            }
        });

        // Add Cache-Control header (1 hour) to further reduce calls from client
        return new Response(JSON.stringify({ total, distribution }), {
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=3600, s-maxage=3600",
                "Access-Control-Allow-Origin": "*"
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
