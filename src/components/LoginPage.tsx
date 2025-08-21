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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const user = validateUser(memberId);
    if (user) {
      onLogin(user);
    } else {
      setError('会員番号が見つかりません');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">StudySpark</h1>
          <p className="text-gray-600">ログイン</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="memberId" className="block text-sm font-medium text-gray-700 mb-2">
              会員番号
            </label>
            <Input
              id="memberId"
              type="text"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              placeholder="会員番号を入力してください"
              required
            />
          </div>
          
          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}
          
          <Button type="submit" className="w-full">
            ログイン
          </Button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>テスト用会員番号:</p>
          <p>11111111 (テスト生徒１)</p>
        </div>
      </Card>
    </div>
  );
};