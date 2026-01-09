import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';

export function TitlePage() {
    const navigate = useNavigate();

    return (
        <div className="container" style={{ minHeight: '80vh', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    background: 'linear-gradient(45deg, var(--er-primary), var(--er-accent))',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    marginBottom: '0.5rem',
                    lineHeight: '1.2'
                }}>
                    エターナルリターン<br />スキル音当てゲーム <span style={{ fontSize: '0.5em', verticalAlign: 'middle', border: '1px solid var(--er-primary)', padding: '2px 8px', borderRadius: '12px', color: 'var(--er-primary)' }}>Open Beta</span>
                </h1>
                <h2 style={{
                    fontSize: '1.2rem',
                    color: 'var(--er-text-muted)',
                    fontWeight: 'normal',
                    letterSpacing: '1px'
                }}>
                    이터널 리턴 스킬 음대 게임
                </h2>
            </div>

            <button
                onClick={() => navigate('/game')}
                style={{
                    padding: '1.5rem 4rem',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    background: 'var(--er-primary)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(245, 158, 11, 0.6)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(245, 158, 11, 0.4)';
                }}
            >
                <Play fill="black" size={28} />
                GAME START
            </button>

            <div style={{ marginTop: '4rem', fontSize: '0.8rem', color: '#666', lineHeight: '1.6', textAlign: 'center' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <div>問題があった場合はTwitterからDMをしてください</div>
                    <div>문제가 발생하면 Twitter로 DM을 보내주세요</div>
                    <a href="https://x.com/Roratio2" target="_blank" rel="noopener noreferrer" style={{ color: '#1DA1F2', textDecoration: 'none', display: 'inline-block', marginTop: '0.2rem' }}>
                        @Roratio2
                    </a>
                </div>

                <div>スキル音声はDAK.GGのスキル紹介から引用しています。一部スキルとは関係のない音が入る可能性もあります。</div>
                <div>스킬 사운드는 DAK.GG의 스킬 소개에서 인용하였습니다. 일부 스킬과 무관한 소리가 포함될 수 있습니다.</div>
                <div style={{ marginTop: '0.4rem' }}>
                    引用元 / 출처: <a href="https://dak.gg/er" target="_blank" rel="noopener noreferrer" style={{ color: '#888' }}>https://dak.gg/er</a>
                </div>

                <div style={{ marginTop: '2rem', fontSize: '0.75rem', opacity: 0.8 }}>
                    このWEBアプリはRoratioとAntiGravityによって製作されました
                </div>
            </div>
        </div>
    );
}
