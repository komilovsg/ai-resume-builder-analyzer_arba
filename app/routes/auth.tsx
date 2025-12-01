import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

export const meta = () => {
    return [
        { title: 'ARBA | Auth' },
        { name: 'description', content: 'Log into your account' }
    ];
};

export default function Auth() {
    const { isLoading, auth } = usePuterStore();
    const location = useLocation();
    const next = location.search.split('next=')[1];
    const navigate = useNavigate();

    useEffect(() => {
        if(auth.isAuthenticated && next) {
            navigate(next);
        }
    }, [auth.isAuthenticated, next, navigate]);

    return (
        <main className="bg-[url('/images/bg-auth.svg')] bg-cover bg-center min-h-screen flex items-center justify-center p-4">
            <div className="auth-card">
                <section className="auth-content">
                    <div className="auth-header">
                        <div className="auth-icon-wrapper">
                            <svg 
                                className="auth-icon" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path 
                                    d="M12 2L2 7L12 12L22 7L12 2Z" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                />
                                <path 
                                    d="M2 17L12 22L22 17" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                />
                                <path 
                                    d="M2 12L12 17L22 12" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                        <h1 className="auth-title">
                            Welcome
                        </h1>
                        <h2 className="auth-subtitle">
                            Log in to continue your job journey
                        </h2>
                        <p className="auth-description">
                            Access your resume builder and take the next step in your career
                        </p>
                    </div>
                    <div className="auth-actions">
                        {isLoading ? (
                            <button className="auth-button auth-button--primary auth-button--loading" disabled>
                                <span className="auth-button-spinner"></span>
                                <span>Signing you in...</span>
                            </button>
                        ) : (
                            <>
                                {auth.isAuthenticated ? (
                                    <button 
                                        className="auth-button auth-button--secondary" 
                                        onClick={auth.signOut}
                                    >
                                        Log Out
                                    </button>
                                ) : (
                                    <button 
                                        className="auth-button auth-button--primary" 
                                        onClick={auth.signIn}
                                    >
                                        <span>Log In</span>
                                        <svg 
                                            className="auth-button-icon" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path 
                                                d="M5 12H19M19 12L12 5M19 12L12 19" 
                                                stroke="currentColor" 
                                                strokeWidth="2" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}