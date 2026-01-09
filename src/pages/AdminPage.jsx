import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { signOut } from 'firebase/auth';

export function AdminPage() {
    const [formData, setFormData] = useState({
        driveLink: '',
        character: '',
        skillKey: 'Q',
        skillName: '',
        skin: 'Default'
    });
    const [previewSrc, setPreviewSrc] = useState('');
    const [status, setStatus] = useState(''); // Status message

    // New State for List & Editing
    const [questions, setQuestions] = useState([]);
    const [editingId, setEditingId] = useState(null);

    // Fetch questions on mount
    const fetchQuestions = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "questions"));
            const qList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setQuestions(qList);
        } catch (error) {
            console.error("Error fetching questions:", error);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    const handleLogout = () => {
        signOut(auth);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'driveLink') {
            setPreviewSrc(value);
        }
    };


    const handleEdit = (question) => {
        setFormData({
            driveLink: question.driveLink,
            character: question.character,
            skillKey: question.skillKey,
            skillName: question.skillName || '',
            skin: question.skin || 'Default'
        });
        setPreviewSrc(question.driveLink);
        setEditingId(question.id);
        setStatus('編集モード: ' + question.character + ' (' + question.skillKey + ')');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setFormData({
            driveLink: '',
            character: '',
            skillKey: 'Q',
            skillName: '',
            skin: 'Default'
        });
        setPreviewSrc('');
        setEditingId(null);
        setStatus('');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('本当に削除しますか？')) return;
        try {
            await deleteDoc(doc(db, "questions", id));
            setStatus('削除しました');
            fetchQuestions(); // Refresh list
            setTimeout(() => setStatus(''), 3000);
        } catch (error) {
            console.error("Error deleting:", error);
            setStatus('削除エラー');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setStatus('保存中...');

            if (editingId) {
                // UPDATE
                await updateDoc(doc(db, "questions", editingId), {
                    ...formData,
                    updatedAt: new Date()
                });
                setStatus('更新しました！');
                setEditingId(null);
            } else {
                // CREATE
                await addDoc(collection(db, "questions"), {
                    ...formData,
                    createdAt: new Date()
                });
                setStatus('追加しました！');
            }

            // Refresh list
            fetchQuestions();

            // Reset Form (unless error)
            setFormData({
                driveLink: '',
                character: '',
                skillKey: 'Q',
                skillName: '',
                skin: 'Default'
            });
            setPreviewSrc('');

            // Clear success message after 3s
            setTimeout(() => setStatus(''), 3000);

        } catch (error) {
            console.error("Error saving document: ", error);
            setStatus('保存エラー: ' + error.message);
        }
    };

    return (
        <div className="container">
            <div style={{ width: '100%', maxWidth: '500px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>管理パネル</h1>
                <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>ログアウト</button>
            </div>
            <div className="card" style={{ width: '100%', maxWidth: '500px', textAlign: 'left' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--er-text-muted)' }}>
                            Googleドライブ共有リンク
                        </label>
                        <input
                            type="text"
                            name="driveLink"
                            value={formData.driveLink}
                            onChange={handleChange}
                            placeholder="https://drive.google.com/..."
                            required
                            style={{ width: '100%', padding: '0.8rem', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
                        />
                        {previewSrc && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#4ade80' }}>
                                リンクを認識しました！以下でテスト再生できます。
                            </div>
                        )}
                    </div>

                    {previewSrc && (
                        <div style={{ borderRadius: '8px', overflow: 'hidden', marginTop: '1rem', background: '#000' }}>
                            {/* Auto-detect YouTube or File */}
                            {(previewSrc.includes('youtube.com') || previewSrc.includes('youtu.be')) ? (
                                <iframe
                                    width="100%"
                                    height="300"
                                    src={`https://www.youtube.com/embed/${previewSrc.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)?.[2]}`}
                                    title="YouTube preview"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <video
                                    controls
                                    src={previewSrc}
                                    style={{ width: '100%', height: '54px' }}
                                    onError={(e) => setStatus('再生エラー: リンクが正しいか確認してください')}
                                />
                            )}
                            <div style={{ padding: '0.5rem', fontSize: '0.8rem', color: '#888' }}>
                                ※ YouTubeリンク、または直接ファイルリンク(mp3/mp4)に対応しています
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--er-text-muted)' }}>
                                キャラクター名
                            </label>
                            <input
                                type="text"
                                name="character"
                                value={formData.character}
                                onChange={handleChange}
                                placeholder="例: ジャッキー"
                                required
                                style={{ width: '100%', padding: '0.8rem', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--er-text-muted)' }}>
                                スキルキー
                            </label>
                            <select
                                name="skillKey"
                                value={formData.skillKey}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.8rem', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
                            >
                                {['Q', 'W', 'E', 'R'].map(k => (
                                    <option key={k} value={k}>{k}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--er-text-muted)' }}>
                            スキル名（任意）
                        </label>
                        <input
                            type="text"
                            name="skillName"
                            value={formData.skillName}
                            onChange={handleChange}
                            placeholder="例: アドレナリン分泌"
                            style={{ width: '100%', padding: '0.8rem', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
                        />
                    </div>

                    {status && (
                        <div style={{ padding: '1rem', borderRadius: '4px', background: status.includes('エラー') ? '#ef4444' : '#4ade80', color: '#000', fontWeight: 'bold' }}>
                            {status}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" style={{ flex: 1, background: 'var(--er-primary)', color: 'black', fontWeight: 'bold' }}>
                            {editingId ? '更新する' : '問題を追加'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={handleCancelEdit} style={{ background: '#444', color: 'white' }}>
                                キャンセル
                            </button>
                        )}
                    </div>
                </form>
            </div >

            {/* Question List */}
            <div style={{ width: '100%', maxWidth: '800px', marginTop: '2rem' }}>
                <h2 style={{ borderBottom: '1px solid #444', paddingBottom: '0.5rem' }}>登録済み問題一覧 ({questions.length})</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                    {questions.map(q => (
                        <div key={q.id} style={{ background: '#1e1e24', padding: '1rem', borderRadius: '8px', border: '1px solid #333', textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--er-primary)', fontWeight: 'bold' }}>{q.character}</span>
                                <span style={{ background: '#333', padding: '2px 8px', borderRadius: '4px' }}>{q.skillKey}</span>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#999', marginBottom: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {q.skillName || '(スキル名なし)'}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleEdit(q)}
                                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem', background: '#3b82f6' }}
                                >
                                    編集
                                </button>
                                <button
                                    onClick={() => handleDelete(q.id)}
                                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem', background: '#ef4444' }}
                                >
                                    削除
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
}
