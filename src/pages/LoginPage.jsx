import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleGoogleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            // Login successful, redirect to admin
            navigate('/admin');
        } catch (err) {
            console.error("Login failed", err);
            setError('ログインに失敗しました: ' + err.message);
        }
    };

    return (
        <div className="container">
            <h1>管理者ログイン</h1>
            <div className="card">
                <p style={{ marginBottom: '2rem' }}>管理画面にアクセスするにはログインが必要です。</p>

                {error && (
                    <div style={{ padding: '1rem', background: '#ef4444', color: 'black', borderRadius: '4px', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                <button
                    onClick={handleGoogleLogin}
                    style={{
                        background: 'white',
                        color: 'black',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        margin: '0 auto',
                        fontWeight: 'bold'
                    }}
                >
                    {/* Simple G icon */}
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4285F4' }}>G</span>
                    Googleでログイン
                </button>
            </div>
        </div>
    );
}
