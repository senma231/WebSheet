export type PermissionLevel = 'READ' | 'WRITE' | 'ADMIN';

export interface DocumentPermission {
  id: string;
  document_id: string;
  user_id: string;
  permission_level: PermissionLevel;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    email: string;
    avatar_url?: string;
    full_name?: string;
  };
}

export interface FolderPermission {
  id: string;
  folder_id: string;
  user_id: string;
  permission_level: PermissionLevel;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    email: string;
    avatar_url?: string;
    full_name?: string;
  };
}

export interface PermissionOption {
  label: string;
  value: PermissionLevel;
  description: string;
}

export const PERMISSION_OPTIONS: PermissionOption[] = [
  {
    label: '只读',
    value: 'READ',
    description: '可以查看文档，但不能编辑'
  },
  {
    label: '可编辑',
    value: 'WRITE',
    description: '可以查看和编辑文档，但不能管理权限'
  },
  {
    label: '管理员',
    value: 'ADMIN',
    description: '可以查看、编辑文档，并管理文档权限'
  }
];

export function getPermissionLabel(level: PermissionLevel): string {
  const option = PERMISSION_OPTIONS.find(opt => opt.value === level);
  return option ? option.label : '未知权限';
}

export function getPermissionDescription(level: PermissionLevel): string {
  const option = PERMISSION_OPTIONS.find(opt => opt.value === level);
  return option ? option.description : '未知权限';
}

export function getPermissionTagType(level: PermissionLevel): string {
  switch (level) {
    case 'READ':
      return 'info';
    case 'WRITE':
      return 'success';
    case 'ADMIN':
      return 'warning';
    default:
      return 'info';
  }
}
