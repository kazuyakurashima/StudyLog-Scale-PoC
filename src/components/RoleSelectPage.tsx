import React from 'react';
import { User, UserRole } from '../lib/auth';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface RoleSelectPageProps {
  user: User;
  onRoleSelect: (role: UserRole) => void;
}

export const RoleSelectPage: React.FC<RoleSelectPageProps> = ({ user, onRoleSelect }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {user.name}さんのページです
          </h1>
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <p>会員番号: {user.id}</p>
            <p>氏名: {user.name}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <Button
            onClick={() => onRoleSelect('student')}
            className="w-full h-16 text-lg font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-1">📚</span>
              <span>{user.name}さんはこちら</span>
            </div>
          </Button>
          
          <Button
            onClick={() => onRoleSelect('parent')}
            className="w-full h-16 text-lg font-semibold bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-1">👨‍👩‍👧‍👦</span>
              <span>保護者の方はこちら</span>
            </div>
          </Button>
          
          <Button
            onClick={() => onRoleSelect('teacher')}
            className="w-full h-16 text-lg font-semibold bg-purple-500 hover:bg-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-1">👨‍🏫</span>
              <span>指導者はこちら</span>
            </div>
          </Button>
        </div>
      </Card>
    </div>
  );
};