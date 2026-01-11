import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export function TitlePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const QUESTIONS_CACHE_KEY = 'otoate_questions_cache';
            const QUESTIONS_CACHE_EXPIRY = 60 * 60 * 1000; // 1時間

            const RANKING_CACHE_KEY = 'otoate_ranking_cache';
            const RANKING_CACHE_EXPIRY = 3 * 60 * 60 * 1000; // 3時間

            // 1. Fetch Questions
            let qList = [];
            const cachedQuestions = localStorage.getItem(QUESTIONS_CACHE_KEY);

            if (cachedQuestions) {
                try {
                    const parsed = JSON.parse(cachedQuestions);
                    if (Date.now() - parsed.timestamp < QUESTIONS_CACHE_EXPIRY) {
                        console.log("Using cached questions (TitlePage)");
                        qList = parsed.data;
                    }
                } catch (e) {
                    console.error("Questions cache parse error", e);
                }
            }

            if (qList.length === 0) {
                try {
                    console.log("Fetching questions from Firestore (TitlePage)");
                    const querySnapshot = await getDocs(collection(db, "questions"));
                    qList = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    localStorage.setItem(QUESTIONS_CACHE_KEY, JSON.stringify({
                        data: qList,
                        timestamp: Date.now()
                    }));
                } catch (error) {
                    console.error("Error fetching questions:", error);
                }
            }
            setQuestions(qList);

            // 2. Fetch Ranking (Parallel-ish but simple here)
            // Check Ranking Cache
            const cachedRanking = localStorage.getItem(RANKING_CACHE_KEY);
            let shouldFetchRanking = true;

            if (cachedRanking) {
                try {
                    const parsed = JSON.parse(cachedRanking);
                    if (Date.now() - parsed.timestamp < RANKING_CACHE_EXPIRY) {
                        console.log("Using cached ranking (TitlePage)");
                        shouldFetchRanking = false;
                    }
                } catch (e) {
                    console.error("Ranking cache parse error", e);
                }
            }

            if (shouldFetchRanking) {
                try {
                    console.log("Fetching ranking from API (TitlePage)");
                    const response = await fetch('/api/ranking');
                    if (response.ok) {
                        const data = await response.json();
                        localStorage.setItem(RANKING_CACHE_KEY, JSON.stringify({
                            data: data,
                            timestamp: Date.now()
                        }));
                    } else {
                        console.error("Ranking API error:", response.statusText);
                    }
                } catch (error) {
                    console.error("Error fetching ranking:", error);
                }
            }

            setLoading(false);
        };

        fetchData();
    }, []);

    const handleStart = () => {
        navigate('/game', { state: { questions: questions } });
    };

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
                onClick={handleStart}
                disabled={loading}
                style={{
                    padding: '1.5rem 4rem',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    background: loading ? '#555' : 'var(--er-primary)',
                    color: loading ? '#888' : '#000',
                    border: 'none',
                    borderRadius: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: loading ? 'none' : '0 0 20px rgba(245, 158, 11, 0.4)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: loading ? 'not-allowed' : 'pointer'
                }}
                onMouseOver={(e) => {
                    if (!loading) {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 0 30px rgba(245, 158, 11, 0.6)';
                    }
                }}
                onMouseOut={(e) => {
                    if (!loading) {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(245, 158, 11, 0.4)';
                    }
                }}
            >
                {loading ? (
                    <span>LOADING...</span>
                ) : (
                    <>
                        <Play fill="black" size={28} />
                        GAME START
                    </>
                )}
            </button>

            <div style={{ marginTop: '4rem', fontSize: '0.8rem', color: '#666', lineHeight: '1.6', textAlign: 'center' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <div>スキル音声はDAK.GGのスキル紹介から引用しています。一部スキルとは関係のない音が入る可能性もあります。</div>
                    <div>스킬 사운드는 DAK.GG의 스킬 소개에서 인용하였습니다. 일부 스킬과 무관한 소리가 포함될 수 있습니다.</div>
                    <div style={{ marginTop: '0.4rem' }}>
                        引用元 / 출처: <a href="https://dak.gg/er" target="_blank" rel="noopener noreferrer" style={{ color: '#888' }}>https://dak.gg/er</a>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem', fontSize: '0.75rem', opacity: 0.8 }}>
                    <div>このWEBアプリはRoratioとAntiGravityによって製作されました</div>
                    <div>이 웹 앱은 Roratio와 AntiGravity에 의해 제작되었습니다</div>
                </div>

                <div>
                    <div>問題があった場合はTwitterからDMをしてください</div>
                    <div>문제가 발생하면 Twitter로 DM을 보내주세요</div>
                    <a href="https://x.com/Roratio2" target="_blank" rel="noopener noreferrer" style={{ color: '#1DA1F2', textDecoration: 'none', display: 'inline-block', marginTop: '0.2rem' }}>
                        @Roratio2
                    </a>
                </div>
            </div>
        </div>
    );
}
