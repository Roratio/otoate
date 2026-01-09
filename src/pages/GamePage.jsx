import React, { useState, useEffect } from 'react';
import { AudioPlayer } from '../components/AudioPlayer';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Share2 } from 'lucide-react';

export function GamePage() {
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [guess, setGuess] = useState('');
    const [feedback, setFeedback] = useState(null); // 'correct' | 'incorrect' | null
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [gameFinished, setGameFinished] = useState(false);
    const [rankingData, setRankingData] = useState(null); // { percent: number, total: number, rank: number }

    // Fisher-Yates Shuffle
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    useEffect(() => {
        const fetchQuestions = async () => {
            const CACHE_KEY = 'otoate_questions_cache';
            const CACHE_EXPIRY = 60 * 60 * 1000; // 1時間

            // キャッシュの確認
            const cached = localStorage.getItem(CACHE_KEY);
            let qList = [];

            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    const now = Date.now();
                    if (now - parsed.timestamp < CACHE_EXPIRY) {
                        console.log("Using cached questions");
                        qList = parsed.data;
                    }
                } catch (e) {
                    console.error("Cache parse error", e);
                }
            }

            // キャッシュがない、または期限切れの場合は取得
            if (qList.length === 0) {
                try {
                    console.log("Fetching questions from Firestore");
                    const querySnapshot = await getDocs(collection(db, "questions"));
                    qList = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    // キャッシュに保存
                    localStorage.setItem(CACHE_KEY, JSON.stringify({
                        data: qList,
                        timestamp: Date.now()
                    }));
                } catch (error) {
                    console.error("Error fetching questions:", error);
                }
            }

            // シャッフルして10問選択
            if (qList.length > 0) {
                const shuffled = shuffleArray([...qList]); // コピーを作成してシャッフル
                setQuestions(shuffled.slice(0, 10));
            }
            setLoading(false);
        };

        fetchQuestions();
    }, []);

    const calculateRanking = async (finalScore) => {
        try {
            // 1. Save Result (Write is cheap and necessary)
            await addDoc(collection(db, "results"), {
                score: finalScore,
                date: serverTimestamp()
            });

            // 2. Fetch Aggregated Ranking from Cloudflare Functions API
            // This reduces Firestore reads significantly by caching the result on the server
            const response = await fetch('/api/ranking');
            if (!response.ok) {
                console.error("Ranking API error:", response.statusText);
                // Fallback or just show nothing if API fails?
                return;
            }

            const { total, distribution } = await response.json();

            // 3. Calculate Rank locally based on distribution
            // distribution = { "10": 5, "9": 3, ... }
            let better = 0;
            for (const sStr in distribution) {
                const s = parseInt(sStr, 10);
                if (s > finalScore) {
                    better += distribution[sStr];
                }
            }

            const rank = better + 1;
            const percent = (rank / total) * 100;

            setRankingData({
                percent: percent.toFixed(1),
                rank: rank,
                total: total
            });

        } catch (error) {
            console.error("Error calculating rank:", error);
        }
    };

    const currentQuestion = questions[currentIndex];

    const handleGuess = (key) => {
        if (!currentQuestion) return;
        if (feedback) return; // Prevent double guess

        if (key === currentQuestion.skillKey) {
            setFeedback('correct');
            setScore(s => s + 1);
        } else {
            setFeedback('incorrect');
        }
    };

    const handleNext = () => {
        setGuess('');
        setFeedback(null);

        if (currentIndex + 1 >= questions.length) {
            // End of Game
            setGameFinished(true);
            calculateRanking(score + (feedback === 'correct' ? 1 : 0)); // Add current point if correct? No, score updates immediately on guess
            // Wait, score updates on click. But handleNext is called AFTER feedback.
            // So 'score' state is already updated.
            calculateRanking(score);
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const getShareUrl = () => {
        const text = `【Eternal Return スキル音当て】\nスコア: ${score}/10\n上位 ${rankingData ? rankingData.percent : '-'}%\n\nあなたも挑戦しよう！`;
        const url = window.location.origin; // Or your deployed URL
        const hashtags = "ERスキル音当て,エターナルリターン";
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(hashtags)}`;
    };

    if (loading) return <div className="container">データを読み込み中...</div>;

    if (questions.length === 0) return (
        <div className="container">
            <div className="card">
                <h2>問題がありません</h2>
                <p><a href="/admin" style={{ color: 'var(--er-primary)' }}>管理画面</a>から問題を追加してください。</p>
            </div>
        </div>
    );

    // RESULT SCREEN
    if (gameFinished) {
        return (
            <div className="container">
                <div className="card" style={{ maxWidth: '600px', width: '100%', padding: '3rem 2rem' }}>
                    <h1 style={{ marginBottom: '1rem' }}>結果発表 / 결과 발표</h1>

                    <div style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--er-primary)', marginBottom: '1rem' }}>
                        {score} <span style={{ fontSize: '1.5rem', color: '#888' }}>/ 10</span>
                    </div>

                    {rankingData ? (
                        <div style={{ background: '#222', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '1.2rem', color: '#aaa', marginBottom: '0.5rem' }}>あなたのランク / 당신의 순위</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>
                                上位 / 상위 <span style={{ color: '#4ade80' }}>{rankingData.percent}%</span>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                                ({rankingData.total}人中 {rankingData.rank}位 / {rankingData.total}명 중 {rankingData.rank}위)
                            </div>
                        </div>
                    ) : (
                        <div style={{ margin: '2rem 0', color: '#888' }}>集計中... / 집계 중...</div>
                    )}

                    <a
                        href={getShareUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            background: '#1DA1F2', // Twitter Blue
                            color: 'white',
                            textDecoration: 'none',
                            padding: '1rem 2rem',
                            borderRadius: '50px',
                            fontWeight: 'bold',
                            fontSize: '1.2rem',
                            transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <Share2 size={24} />
                        結果をポストする / 결과 공유하기
                    </a>

                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '2rem', background: 'transparent', border: '1px solid #444', color: '#888' }}
                    >
                        もう一度遊ぶ / 다시 하기
                    </button>
                </div>
            </div>
        );
    }

    // GAME SCREEN
    return (
        <div className="container">
            <h1 style={{ color: 'var(--er-primary)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '2rem' }}>
                スキル音当てクイズ
            </h1>

            <div className="card" style={{ width: '100%', maxWidth: '600px' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ fontSize: '1.2rem', color: 'var(--er-text-muted)', marginBottom: '1rem' }}>
                        第 {currentIndex + 1} / {questions.length} 問
                    </div>

                    {/* Audio Player */}
                    <div key={currentQuestion.id}>
                        <AudioPlayer src={currentQuestion.driveLink} autoPlay={true} />
                    </div>
                </div>

                {/* Game Interface */}
                {!feedback ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {['Q', 'W', 'E', 'R'].map(key => (
                            <button
                                key={key}
                                onClick={() => handleGuess(key)}
                                style={{
                                    padding: '2rem',
                                    fontSize: '2rem',
                                    fontWeight: 'bold',
                                    background: '#222',
                                    border: '1px solid #444',
                                    borderRadius: '12px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.background = '#333'}
                                onMouseOut={(e) => e.target.style.background = '#222'}
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div style={{ animation: 'fadeIn 0.5s' }}>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            color: feedback === 'correct' ? '#4ade80' : '#ef4444',
                            marginBottom: '1rem'
                        }}>
                            {feedback === 'correct' ? '正解！ / 정답!' : '不正解... / 오답...'}
                        </div>

                        <div style={{ marginBottom: '2rem', color: 'var(--er-text-muted)' }}>
                            正解は: <span style={{ color: 'white' }}>{currentQuestion.character} ({currentQuestion.skillKey})</span>
                            {currentQuestion.skillName && <div style={{ fontSize: '0.9em', marginTop: '0.5rem', color: '#ccc' }}>スキル名: {currentQuestion.skillName}</div>}
                        </div>

                        <button onClick={handleNext} style={{ width: '100%', background: 'var(--er-primary)', color: 'black', fontWeight: 'bold' }}>
                            {currentIndex + 1 >= 10 ? '結果を見る / 결과 보기' : '次の問題へ / 다음 문제'}
                        </button>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '2rem', fontSize: '1.5rem' }}>
                スコア: <span style={{ color: 'var(--er-primary)' }}>{score}</span>
            </div>
        </div>
    );
}
