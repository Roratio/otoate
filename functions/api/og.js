
import './polyfill.js';
import satori, { init } from 'satori';
import initYoga from 'yoga-wasm-web';
import { svg2png, initialize } from 'svg2png-wasm';

// Import WASM modules statically
// Cloudflare treats these as WebAssembly.Module
import yogaWasm from './yoga.wasm';
import svg2pngWasm from './svg2png_wasm_bg.wasm';

// Initialize flag
let initialized = false;

async function initLibs() {
    if (initialized) return;

    // Initialize Yoga
    const yoga = await initYoga(yogaWasm);
    init(yoga);

    // Initialize svg2png
    await initialize(svg2pngWasm);

    initialized = true;
}

export async function onRequest(context) {
    try {
        await initLibs();

        const { request } = context;
        const url = new URL(request.url);
        const score = url.searchParams.get('score') || '0';
        const rankPct = url.searchParams.get('rank') || '-';

        // Fetch font
        const fontUrl = 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.12/files/noto-sans-jp-japanese-700-normal.woff';
        const fontDataPromise = fetch(fontUrl)
            .then(res => {
                if (!res.ok) throw new Error(`Failed to load font: ${res.status}`);
                return res.arrayBuffer();
            });

        // Markup
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
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            marginBottom: '10px',
                                        },
                                        children: [
                                            {
                                                type: 'div',
                                                props: {
                                                    style: {
                                                        fontSize: '32px',
                                                        fontWeight: 'bold',
                                                        color: '#cccccc',
                                                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                                    },
                                                    children: 'エターナルリターン',
                                                },
                                            },
                                            {
                                                type: 'div',
                                                props: {
                                                    style: {
                                                        fontSize: '32px',
                                                        fontWeight: 'bold',
                                                        color: '#cccccc',
                                                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                                    },
                                                    children: 'スキル音当てゲーム',
                                                },
                                            },
                                            {
                                                type: 'div',
                                                props: {
                                                    style: {
                                                        fontSize: '24px',
                                                        fontWeight: 'bold',
                                                        color: '#aaaaaa',
                                                        marginTop: '4px',
                                                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                                    },
                                                    children: '이터널 리턴 스킬 음대 게임',
                                                },
                                            },
                                        ],
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
                    // Footer Bar
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

        const fontData = await fontDataPromise;

        // Generate SVG
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

        // Render to PNG using svg2png-wasm
        // Note: svg2png implementation in wasm version might differ slightly in arguments
        // article calls: svg2png(svg, { scale })
        const pngBuffer = await svg2png(svg, {
            scale: 1, // Default scale
            // additional options if needed
        });

        return new Response(pngBuffer, {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (err) {
        return new Response(JSON.stringify({
            error: "OGP Generation Failed",
            message: err.message,
            stack: err.stack
        }, null, 2), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}
