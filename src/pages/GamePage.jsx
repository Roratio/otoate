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
            try {
                const querySnapshot = await getDocs(collection(db, "questions"));
                const qList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Shuffle and pick 10
                const shuffled = shuffleArray(qList);
                setQuestions(shuffled.slice(0, 10));
            } catch (error) {
                console.error("Error fetching questions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, []);

    const calculateRanking = async (finalScore) => {
        try {
            // 1. Save Result
            await addDoc(collection(db, "results"), {
                score: finalScore,
                date: serverTimestamp()
            });

            // 2. Fetch All Results (This might be heavy in production, but okay for MVP)
            const resultsParams = await getDocs(collection(db, "results"));
            const allScores = resultsParams.docs.map(d => d.data().score);

            // 3. Calculate Rank
            const total = allScores.length;
            const betterOrEqual = allScores.filter(s => s >= finalScore).length; // Rank (1st is best)
            // Strict rank (how many represent "better" score) + 1
            // Simple percentile: How many people did you beat?
            // "Top X%" logic
            const better = allScores.filter(s => s > finalScore).length;
            const rank = better + 1;
            const percent = (rank / total) * 100;

            setRankingData({
                percent: percent.toFixed(1), // e.g. "12.5"
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
                    <h1 style={{ marginBottom: '1rem' }}>結果発表</h1>

                    <div style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--er-primary)', marginBottom: '1rem' }}>
                        {score} <span style={{ fontSize: '1.5rem', color: '#888' }}>/ 10</span>
                    </div>

                    {rankingData ? (
                        <div style={{ background: '#222', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '1.2rem', color: '#aaa', marginBottom: '0.5rem' }}>あなたのランク</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>
                                上位 <span style={{ color: '#4ade80' }}>{rankingData.percent}%</span>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                                ({rankingData.total}人中 {rankingData.rank}位)
                            </div>
                        </div>
                    ) : (
                        <div style={{ margin: '2rem 0', color: '#888' }}>集計中...</div>
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
                        結果をポストする
                    </a>

                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '2rem', background: 'transparent', border: '1px solid #444', color: '#888' }}
                    >
                        もう一度遊ぶ
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
                            {currentIndex + 1 >= 10 ? '結果を見る' : '次の問題へ'}
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
