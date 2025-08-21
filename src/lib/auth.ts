export interface User {
  id: string;
  name: string;
}

export type UserRole = 'student' | 'parent' | 'teacher';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  role: UserRole | null;
}

// ユーザーデータベース（15名のユーザー）
export const USERS: Record<string, User> = {
  '68442921': { id: '68442921', name: '齋藤大洋' },
  '68905181': { id: '68905181', name: '齋藤利嵩' },
  '67022243': { id: '67022243', name: '笹島実弥子' },
  '68923295': { id: '68923295', name: '杉山翔哉' },
  '68923309': { id: '68923309', name: '杉山愛翔' },
  '77777777': { id: '77777777', name: '德田創大' },
  '68883679': { id: '68883679', name: '深作巴' },
  '68895933': { id: '68895933', name: '福地美鈴' },
  '68805713': { id: '68805713', name: '松下颯真' },
  '11111111': { id: '11111111', name: 'テスト生徒１' },
  '22222222': { id: '22222222', name: 'テスト生徒２' },
  '33333333': { id: '33333333', name: 'テスト生徒３' },
  '44444444': { id: '44444444', name: 'テスト生徒４' },
  '55555555': { id: '55555555', name: 'テスト生徒５' },
  '66666666': { id: '66666666', name: 'テスト生徒６' },
};

export const validateUser = (memberId: string): User | null => {
  return USERS[memberId] || null;
};