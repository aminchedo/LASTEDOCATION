import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Lock,
    User,
    Eye,
    EyeOff,
    LogIn,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoginResponse {
    success: boolean;
    token?: string;
    user?: {
        id: string;
        username: string;
        role: string;
        name: string;
    };
    error?: string;
    message?: string;
}

export default function LoginPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear errors when user starts typing
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data: LoginResponse = await response.json();

            if (data.success && data.token && data.user) {
                // Store token and user info
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                setSuccess('ورود موفقیت‌آمیز! در حال انتقال...');

                // Redirect to home page after a short delay
                setTimeout(() => {
                    navigate('/');
                }, 1500);
            } else {
                setError(data.message || data.error || 'خطا در ورود');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('خطا در اتصال به سرور');
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = async (username: string, password: string) => {
        setFormData({ username, password });
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data: LoginResponse = await response.json();

            if (data.success && data.token && data.user) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                setSuccess('ورود موفقیت‌آمیز! در حال انتقال...');

                setTimeout(() => {
                    navigate('/');
                }, 1500);
            } else {
                setError(data.message || data.error || 'خطا در ورود');
            }
        } catch (err) {
            console.error('Demo login error:', err);
            setError('خطا در اتصال به سرور');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        ورود به سیستم
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        برای دسترسی به پنل مدیریت وارد شوید
                    </p>
                </div>

                {/* Login Form */}
                <Card className="shadow-xl">
                    <CardHeader className="text-center pb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            اطلاعات ورود
                        </h2>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Username */}
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    نام کاربری
                                </Label>
                                <div className="relative">
                                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        id="username"
                                        name="username"
                                        type="text"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        placeholder="نام کاربری خود را وارد کنید"
                                        className="pr-10"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    رمز عبور
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="رمز عبور خود را وارد کنید"
                                        className="pr-10 pl-10"
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        disabled={loading}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Success Alert */}
                            {success && (
                                <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertDescription>{success}</AlertDescription>
                                </Alert>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading || !formData.username || !formData.password}
                                icon={loading ? undefined : <LogIn className="w-4 h-4" />}
                            >
                                {loading ? 'در حال ورود...' : 'ورود'}
                            </Button>
                        </form>

                        {/* Demo Accounts */}
                        <div className="border-t pt-6">
                            <div className="text-center mb-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    حساب‌های نمونه برای تست:
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => handleDemoLogin('admin', 'admin123')}
                                    disabled={loading}
                                >
                                    <User className="w-4 h-4 ml-2" />
                                    مدیر سیستم (admin/admin123)
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => handleDemoLogin('user', 'user123')}
                                    disabled={loading}
                                >
                                    <User className="w-4 h-4 ml-2" />
                                    کاربر عادی (user/user123)
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
                    <p>نسخه 1.0.0 - سیستم مدیریت مدل‌های هوش مصنوعی</p>
                </div>
            </div>
        </div>
    );
}
