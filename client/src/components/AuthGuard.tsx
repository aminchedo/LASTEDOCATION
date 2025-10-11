import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Loader2, AlertTriangle } from 'lucide-react';t';

interface AuthGuardProps {
    children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('authToken');

            if (!token) {
                setIsAuthenticated(false);
                setLoading(false);
                return;
            }

            try {
                // Verify token with backend
                const response = await fetch('/api/auth/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token }),
                });

                const data = await response.json();

                if (data.success) {
                    setIsAuthenticated(true);
                } else {
                    // Token is invalid, remove it
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('user');
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Auth verification error:', error);
                // Network error, assume token is still valid for now
                setIsAuthenticated(true);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    useEffect(() => {
        if (isAuthenticated === false && location.pathname !== '/login') {
            navigate('/login', { replace: true });
        }
    }, [isAuthenticated, navigate, location.pathname]);

    // Show loading while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Card className="p-8">
                    <CardContent className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                        <p className="text-gray-600 dark:text-gray-400">در حال بررسی احراز هویت...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show error if authentication failed
    if (isAuthenticated === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Card className="p-8 max-w-md">
                    <CardContent className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            دسترسی غیرمجاز
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            برای دسترسی به این صفحه باید وارد شوید
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            ورود به سیستم
                        </button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Render children if authenticated
    return <>{children}</>;
}
