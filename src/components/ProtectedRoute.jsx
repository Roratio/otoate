import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';

// Allowed users
const ALLOWED_EMAILS = ["pippimarisa2@gmail.com"];

export function ProtectedRoute({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAllowed, setIsAllowed] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                if (ALLOWED_EMAILS.includes(currentUser.email)) {
                    setUser(currentUser);
                    setIsAllowed(true);
                } else {
                    // Not allowed: Sign out immediately
                    await signOut(auth);
                    alert("このアカウントにはアクセス権限がありません。\n(Access Denied for: " + currentUser.email + ")");
                    setUser(null);
                    setIsAllowed(false);
                }
            } else {
                setUser(null);
                setIsAllowed(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="container">読み込み中...</div>;
    }

    if (!user || !isAllowed) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
