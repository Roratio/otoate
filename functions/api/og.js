// Polyfill process for satori/yoga-wasm-web
// This MUST be before imports because satori might use it on module load
if (typeof process === 'undefined') {
    globalThis.process = { env: {} };
}

import satori from 'satori';
import { initWasm, Resvg } from '@resvg/resvg-wasm';

// Initialize WASM
// Cloudflare Pages Functions environment usually needs WASM loaded.
// However, @resvg/resvg-wasm acts a bit differently in CF Workers.
// We might need to import the wasm file or rely on the package to handle it if utilizing modules.
// For simplicity in standard node/module envs, we'll try standard import.
// If it fails on deployment, we might need a workaround for loading WASM.


export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const score = url.searchParams.get('score') || '0';
    const rankPct = url.searchParams.get('rank') || '-';

    // Fetch a font (Required by Satori)
    // We'll use a public URL for a font or a bundled one. Fetching from Google Fonts is standard.
    // Noto Sans JP for Japanese support.
    const fontData = await fetch('https://github.com/googlefonts/noto-cjk/raw/main/Sans/Variable/ttf/NotoSansCJKjp-VF.ttf')
        .then(res => res.arrayBuffer())
        .catch(() => null);

    if (!fontData) {
        // Fallback or error if font fails
        // Usually we should have a fallback font
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
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                backgroundColor: '#1a1a1a',
                color: 'white',
                fontFamily: 'Noto Sans JP',
                backgroundImage: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
            },
            children: [
                {
                    type: 'div',
                    props: {
                        style: {
                            fontSize: '60px',
                            fontWeight: 'bold',
                            marginBottom: '20px',
                            color: '#ffffff',
                        },
                        children: 'Eternal Return スキル音当て',
                    },
                },
                {
                    type: 'div',
                    props: {
                        style: {
                            fontSize: '120px',
                            fontWeight: 'bold',
                            color: '#facc15', // Yellow/Gold
                            marginBottom: '20px',
                            display: 'flex', // Needed for nested text
                        },
                        children: [
                            { type: 'span', props: { children: score } },
                            { type: 'span', props: { style: { fontSize: '60px', color: '#888', marginLeft: '20px', marginTop: '40px' }, children: '/ 10' } }
                        ]
                    },
                },
                {
                    type: 'div',
                    props: {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            backgroundColor: '#333333',
                            padding: '20px 40px',
                            borderRadius: '20px',
                            border: '2px solid #555',
                        },
                        children: [
                            {
                                type: 'div',
                                props: {
                                    style: { fontSize: '30px', color: '#aaaaaa', marginBottom: '10px' },
                                    children: 'あなたのランク / 당신의 순위',
                                },
                            },
                            {
                                type: 'div',
                                props: {
                                    style: { fontSize: '60px', fontWeight: 'bold', color: '#4ade80' },
                                    children: `上位 ${rankPct}%`,
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
