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
                    エターナルリターン<br />スキル音当てゲーム
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
        </div>
    );
}
