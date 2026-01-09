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
        // Fetch all results from Firestore via REST API
        // Note: For large collections, this needs pagination logic. 
        // For MVP, we assume it fits in one request (default limit is usually 20 or 50, so we specify pageSize)
        // Max pageSize is often 1000 or depending on document size.
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/results?key=${apiKey}&pageSize=1000`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Firestore error: ${response.statusText}`);
        }

        const data = await response.json();
        const documents = data.documents || [];

        // Aggregate scores
        // We will return a frequency map: { "10": 5, "9": 2, ... }
        const distribution = {};
        let total = 0;

        documents.forEach(doc => {
            const fields = doc.fields;
            if (fields && fields.score) {
                // Determine type of score (likely integerValue)
                const score = parseInt(fields.score.integerValue || fields.score.stringValue || "0", 10);
                if (!isNaN(score)) {
                    distribution[score] = (distribution[score] || 0) + 1;
                    total++;
                }
            }
        });

        // Cache for 60 minutes (3600 seconds)
        // Browser cache: 60 min, CDN cache: 60 min
        return new Response(JSON.stringify({ total, distribution }), {
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=3600, s-maxage=3600",
                "Access-Control-Allow-Origin": "*" // Allow CORS if needed, though usually same origin
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
