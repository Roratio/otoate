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
        // Optimization: Run parallel Aggregation Queries.
        // To be robust against data types (Number vs String score), we run 2 queries per score:
        // 1. Where score == 10 (int)
        // 2. Where score == "10" (string)
        // Then sum them up.

        const scores = Array.from({ length: 11 }, (_, i) => i); // [0, 1, ..., 10]

        // Correct URL for root collection query
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runAggregationQuery?key=${apiKey}`;

        // Create fetching promises (11 * 2 = 22 requests)
        // Use Promise.all to run them in parallel.
        const promises = [];

        scores.forEach(score => {
            // Integer Filter
            // IMPORTANT: Firestore REST API requires integerValue to be a STRING (int64)
            promises.push(fetchCount(url, score, 'integerValue', String(score)));
            // String Filter
            promises.push(fetchCount(url, score, 'stringValue', String(score)));
        });

        const results = await Promise.all(promises);

        // Aggregate results
        const distribution = {};
        let total = 0;

        // results array corresponds to: [score0_int, score0_str, score1_int, score1_str, ...]
        scores.forEach((score, i) => {
            const intCount = results[i * 2] || 0;
            const strCount = results[i * 2 + 1] || 0;
            const sum = intCount + strCount;

            if (sum > 0) {
                distribution[score] = sum;
                total += sum;
            }
        });

        // Cache for 60 minutes
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

// Helper to fetch count for a specific value/type
async function fetchCount(url, score, typeKey, value) {
    const body = {
        structuredAggregationQuery: {
            structuredQuery: {
                from: [{ collectionId: "results" }],
                where: {
                    fieldFilter: {
                        field: { fieldPath: "score" },
                        op: "EQUAL",
                        value: { [typeKey]: value }
                    }
                }
            },
            aggregations: [{ alias: "count", count: {} }]
        }
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) {
            // console.error(`Aggregation failed for ${score} (${typeKey}): ${res.status}`);
            return 0;
        }

        const data = await res.json();
        const countVal = data[0]?.result?.aggregateFields?.count?.integerValue;
        return countVal ? parseInt(countVal, 10) : 0;
    } catch (err) {
        console.error(`Fetch error for ${score} (${typeKey}):`, err);
        return 0;
    }
}
