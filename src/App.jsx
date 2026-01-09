import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { GamePage } from './pages/GamePage';
import { AdminPage } from './pages/AdminPage';
import { TitlePage } from './pages/TitlePage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header style={{ marginBottom: '2rem' }}>
          <nav style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/">TOP</Link>
            <Link to="/admin">管理画面</Link>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<TitlePage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
