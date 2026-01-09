// Polyfill process for satori/yoga-wasm-web
if (typeof process === 'undefined') {
    globalThis.process = { env: {} };
}

export async function onRequest(context) {
    // Dynamic import to ensure polyfill applies before module load
    const { default: satori } = await import('satori');
    const { initWasm, Resvg } = await import('@resvg/resvg-wasm');

    const { request } = context;
    const url = new URL(request.url);
    const score = url.searchParams.get('score') || '0';
    const rankPct = url.searchParams.get('rank') || '-';

    // Fetch a font (Required by Satori)
    // Use a specific subset (Japanese) from a CDN to avoid large file size timeouts (GitHub raw was 18MB+)
    // Satori supports WOFF.
    const fontUrl = 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.12/files/noto-sans-jp-japanese-700-normal.woff';

    const fontData = await fetch(fontUrl)
        .then(res => {
            if (!res.ok) throw new Error('Failed to load font');
            return res.arrayBuffer();
        })
        .catch(err => {
            console.error(err);
            return null;
        });

    if (!fontData) {
        // Fallback or error if font fails
        return new Response(JSON.stringify({ error: "Font load failed" }), { status: 500 });
    }

    // Define the element (JSX-like object structure since we don't have JSX transpilation here without setup)
    // We will build the object manually or use a simple helper.
    // Satori accepts React-element-like objects: { type, props: { style, children, ... } }

    const markup = {
        type: 'div',
        props: {
            style: {
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                backgroundColor: '#1a1a1a',
                color: 'white',
                fontFamily: 'Noto Sans JP',
                // Add a subtle grid or noise pattern equivalent if possible, or keep the dark gradient but cooler
                backgroundImage: 'radial-gradient(circle at center, #2a2a2a 0%, #000000 100%)',
                position: 'relative',
            },
            children: [
                // Main Content Center
                {
                    type: 'div',
                    props: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flex: 1,
                            paddingBottom: '60px', // Space for footer
                        },
                        children: [
                            // Result Label
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        fontSize: '40px',
                                        fontWeight: 'bold',
                                        color: '#cccccc',
                                        marginBottom: '10px',
                                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                    },
                                    children: '特務員行動記録 [結果診断]', // Mimicking the reference style wording
                                },
                            },
                            // Main Title / Score Area
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        display: 'flex',
                                        alignItems: 'baseline',
                                        marginBottom: '30px',
                                        textShadow: '0 4px 10px rgba(0,0,0,0.5)',
                                    },
                                    children: [
                                        {
                                            type: 'span',
                                            props: {
                                                style: { fontSize: '140px', fontWeight: '900', color: '#facc15', lineHeight: '1' },
                                                children: score
                                            }
                                        },
                                        {
                                            type: 'span',
                                            props: {
                                                style: { fontSize: '50px', fontWeight: 'bold', color: '#888888', marginLeft: '20px' },
                                                children: '/ 10 問正解'
                                            }
                                        }
                                    ]
                                },
                            },
                            // Rank Badge
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        border: '2px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '16px',
                                        padding: '10px 40px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                    },
                                    children: [
                                        {
                                            type: 'div',
                                            props: {
                                                style: { fontSize: '24px', color: '#aaaaaa', marginBottom: '5px' },
                                                children: 'RANKING / 당신의 순위',
                                            },
                                        },
                                        {
                                            type: 'div',
                                            props: {
                                                style: { fontSize: '50px', fontWeight: 'bold', color: '#4ade80', textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
                                                children: `Top ${rankPct}%`,
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                },
                // Footer Bar mimicking the reference image
                {
                    type: 'div',
                    props: {
                        style: {
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '70px',
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 40px',
                            borderTop: '1px solid #333',
                        },
                        children: [
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        fontSize: '28px',
                                        fontWeight: 'bold',
                                        color: '#ffffff',
                                    },
                                    children: 'Eternal Return スキル音当て',
                                },
                            },
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        marginLeft: 'auto',
                                        fontSize: '20px',
                                        color: '#888888',
                                    },
                                    children: 'otoate.pages.dev',
                                },
                            },
                        ],
                    },
                },
            ],
        },
    };

    // Generate SVG with Satori
    const svg = await satori(markup, {
        width: 1200,
        height: 630,
        fonts: [
            {
                name: 'Noto Sans JP',
                data: fontData,
                weight: 400,
                style: 'normal',
            },
        ],
    });

    // Convert SVG to PNG with Resvg
    // We need to initialize wasm if not already
    // In CF workers, sometimes we just new Resvg(svg).
    // Let's try minimal initialization.
    // Note: This relies on npm package handling the wasm binding correctly.

    // For cloudflare environment, we need to manually init wasm if using @resvg/resvg-wasm
    // But we don't have the .wasm file easily served. 
    // Actually, creating a pure SVG endpoint is safer and faster if Twitter supports it (Twitter DOES NOT support SVG).
    // We MUST convert to PNG.

    // If imports fail, we might need a workaround.
    try {
        await initWasm(import('@resvg/resvg-wasm/index_bg.wasm'));
    } catch (e) {
        // might be already initialized or different loading mechanism
    }

    const resvg = new Resvg(svg);
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    return new Response(pngBuffer, {
        headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=3600', // Cache image for 1 hour
        },
    });
}
