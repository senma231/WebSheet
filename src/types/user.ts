export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  last_login?: string;
  has_two_factor?: boolean;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
}

export interface UserWithRoles extends User {
  roles: Role[];
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  font_size: number;
  default_view_mode: 'grid' | 'list';
  language: string;
  timezone: string;
  date_format: string;
  time_format: string;
}

export interface NotificationSettings {
  document_shared: boolean;
  document_commented: boolean;
  document_edited: boolean;
  mention: boolean;
  system_notifications: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface UserDevice {
  id: string;
  user_id: string;
  device_name: string;
  device_type: string;
  ip_address: string;
  last_active: string;
  is_current: boolean;
}
