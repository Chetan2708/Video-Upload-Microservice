import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register, error, clearError } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isRegister) {
                await register(email, password, name);
            } else {
                await login(email, password);
            }
        } catch {
            // error is set in context
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsRegister(!isRegister);
        clearError();
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
                <p>{isRegister ? 'Sign up to start managing your video projects' : 'Sign in to your video dashboard'}</p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <input
                            id="register-name"
                            className="input"
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    )}
                    <input
                        id="auth-email"
                        className="input"
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                    <input
                        id="auth-password"
                        className="input"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                    <button id="auth-submit" className="btn btn-primary" type="submit" disabled={loading}>
                        {loading ? '...' : isRegister ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-switch">
                    {isRegister ? 'Already have an account? ' : "Don't have an account? "}
                    <button onClick={toggleMode}>
                        {isRegister ? 'Sign In' : 'Sign Up'}
                    </button>
                </div>
            </div>
        </div>
    );
};
