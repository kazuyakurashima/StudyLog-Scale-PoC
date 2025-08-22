import React, { useState } from 'react';
import { User, validateUser } from '../lib/auth';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [memberId, setMemberId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // リアルなローディング体験のための短い待機
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const user = validateUser(memberId);
    if (user) {
      onLogin(user);
    } else {
      setError('会員番号が見つかりません');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-float animate-morph"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-3xl animate-float animation-delay-300 animate-morph"></div>
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-gradient-to-br from-indigo-400/10 to-cyan-400/10 rounded-full blur-2xl animate-float animation-delay-500 animate-morph"></div>
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-cyan-400/15 to-blue-400/15 rounded-full blur-xl animate-particle"></div>
        <div className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-gradient-to-br from-purple-400/15 to-pink-400/15 rounded-full blur-xl animate-particle animation-delay-200"></div>
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        <Card className="glass-morphism shadow-3xl hover-glow transition-all-smooth p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-glow-lg transform rotate-3 hover:rotate-0 transition-transform-smooth magnetic-hover animate-pulse-glow">
                <span className="text-2xl text-white font-bold animate-bounce-in">✨</span>
              </div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 text-shimmer">
                StudyLog
              </h1>
              <p className="text-slate-500 text-lg font-medium animate-fade-in-delay animation-delay-200">学習の旅を始めよう</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6 relative">
            <div className="relative">
              <label htmlFor="memberId" className="block text-sm font-semibold text-slate-700 mb-3">
                🎫 会員番号
              </label>
              <div className="relative">
                <Input
                  id="memberId"
                  type="text"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  placeholder="会員番号を入力してください"
                  className="w-full pl-4 pr-12 py-4 text-lg border-2 border-slate-200 rounded-2xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                  required
                  disabled={isLoading}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-slate-400">🎫</span>
                  )}
                </div>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-center font-medium animate-shake">
                <span className="inline-block mr-2">⚠️</span>
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={isLoading || !memberId.trim()}
              className={`w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                isLoading ? 'cursor-wait' : ''
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>ログイン中...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>✨</span>
                  <span>ログイン</span>
                  <span>→</span>
                </div>
              )}
            </Button>
          </form>
          
          {/* Info */}
          <div className="mt-6 p-4 bg-slate-50/50 backdrop-blur-sm rounded-2xl border border-slate-200">
            <p className="text-center text-sm text-slate-600">
              💡 こちらに会員番号を入力してログインしてください
            </p>
          </div>
        </Card>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-slate-400 text-sm font-medium">🎓 東進育英舎　日立校</p>
      </div>
    </div>
  );
};