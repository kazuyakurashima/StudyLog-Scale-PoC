import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../lib/auth';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { supabase } from '../lib/supabase';

interface RoleSelectPageProps {
  user: User;
  onRoleSelect: (role: UserRole) => void;
}

interface RoleOption {
  role: UserRole;
  title: string;
  description: string;
  icon: string;
  gradient: string;
  hoverGradient: string;
  features: string[];
}

const roleOptions: RoleOption[] = [
  {
    role: 'student',
    title: '生徒モード',
    description: '学習記録をつけて成長しよう',
    icon: '📚',
    gradient: 'from-blue-500 via-cyan-500 to-teal-500',
    hoverGradient: 'from-blue-600 via-cyan-600 to-teal-600',
    features: ['学習記録の作成', '進捗確認', '振り返り機能']
  },
  {
    role: 'parent',
    title: '保護者モード',
    description: 'お子さんの成長を見守り応援',
    icon: '👨‍👩‍👧‍👦',
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    hoverGradient: 'from-pink-600 via-rose-600 to-red-600',
    features: ['進捗モニタリング', '応援メッセージ', 'フィードバック']
  },
  {
    role: 'teacher',
    title: '指導者モード',
    description: '生徒の学習をサポートし指導',
    icon: '👨‍🏫',
    gradient: 'from-purple-500 via-violet-500 to-indigo-500',
    hoverGradient: 'from-purple-600 via-violet-600 to-indigo-600',
    features: ['学習状況把握', '指導アドバイス', '成長サポート']
  }
];

export const RoleSelectPage: React.FC<RoleSelectPageProps> = ({ user, onRoleSelect }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean | null>(null);

  // 初回ユーザーかどうかをチェック
  useEffect(() => {
    const checkFirstTimeUser = async () => {
      try {
        const { data, error } = await supabase
          .from('study_records')
          .select('id')
          .eq('student_id', user.id)
          .limit(1);
        
        if (error) {
          console.error('学習記録確認エラー:', error);
          setIsFirstTimeUser(true); // エラー時は初回として扱う
          return;
        }
        
        setIsFirstTimeUser(!data || data.length === 0);
      } catch (error) {
        console.error('初回ユーザー確認エラー:', error);
        setIsFirstTimeUser(true);
      }
    };

    checkFirstTimeUser();
  }, [user.id]);

  const handleRoleSelect = async (role: UserRole) => {
    setSelectedRole(role);
    setIsTransitioning(true);
    
    // スムーズなトランジションのための待機
    await new Promise(resolve => setTimeout(resolve, 1000));
    onRoleSelect(role);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-br from-indigo-400/10 to-cyan-400/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Loading Overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl font-bold text-purple-600">✨ {roleOptions.find(r => r.role === selectedRole)?.title}へようこそ！</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
              <span className="text-3xl text-white font-bold">{user.name[0]}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
              {isFirstTimeUser === null ? '...' : isFirstTimeUser ? 'はじめまして！' : 'おかえりなさい！'}
            </h1>
            <p className="text-2xl font-bold text-slate-700 mb-2">{user.name}さん</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-slate-200 rounded-full shadow-lg">
              <span className="text-sm font-medium text-slate-600">ID:</span>
              <span className="text-sm font-bold text-slate-800">{user.id}</span>
            </div>
          </div>
          <p className="text-xl text-slate-600 font-medium">
            {isFirstTimeUser === null ? '' : isFirstTimeUser ? 'StudyLogへようこそ！どのモードで使用しますか？' : 'どのモードで使用しますか？'}
          </p>
        </div>
        
        {/* Role Selection Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {roleOptions.map((option, index) => (
            <div 
              key={option.role}
              className={`transform transition-all duration-500 ${
                index === 0 ? 'md:translate-y-0' : 
                index === 1 ? 'md:-translate-y-4' : 
                'md:translate-y-0'
              }`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <Card className="h-full backdrop-blur-xl bg-white/70 border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 group hover:scale-105 cursor-pointer"
                    onClick={() => handleRoleSelect(option.role)}>
                <div className="p-6 text-center h-full flex flex-col">
                  {/* Icon */}
                  <div className="mb-6">
                    <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${option.gradient} rounded-3xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110`}>
                      <span className="text-3xl">{option.icon}</span>
                    </div>
                  </div>
                  
                  {/* Title & Description */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-slate-800 mb-3">
                      {option.title}
                    </h3>
                    <p className="text-slate-600 font-medium mb-6 leading-relaxed">
                      {option.description}
                    </p>
                    
                    {/* Features */}
                    <div className="space-y-2 mb-6">
                      {option.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-2 text-sm text-slate-600">
                          <div className={`w-2 h-2 bg-gradient-to-r ${option.gradient} rounded-full`}></div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <Button
                    onClick={() => handleRoleSelect(option.role)}
                    disabled={isTransitioning}
                    className={`w-full h-12 font-bold bg-gradient-to-r ${option.gradient} hover:bg-gradient-to-r hover:${option.hoverGradient} text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>✨</span>
                      <span>選択する</span>
                      <span>→</span>
                    </div>
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>
        
        {/* Quick Access for Student */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-full">
            <span className="text-blue-600 font-medium">🚀 生徒さんはこちらがおすすめ！</span>
            <button
              onClick={() => handleRoleSelect('student')}
              disabled={isTransitioning}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
            >
              {user.name}さんモード
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-slate-400 text-sm font-medium">🎓 あなたにぴったりのモードで学習しよう</p>
      </div>
    </div>
  );
};