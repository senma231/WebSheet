export type DocumentType = 'WORD' | 'EXCEL' | 'PPT' | 'PDF' | 'MARKDOWN';

export interface Document {
  id: string;
  title: string;
  description?: string;
  type: DocumentType;
  owner_id: string;
  parent_folder_id?: string;
  size: number;
  version: number;
  is_template: boolean;
  is_favorite?: boolean;
  tags?: string[];
  last_accessed_at?: string;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: number;
  size: number;
  storage_path: string;
  comment?: string;
  created_by: string;
  created_at: string;
}

export interface Folder {
  id: string;
  name: string;
  parent_id?: string;
  owner_id: string;
  is_favorite?: boolean;
  document_count?: number;
  folder_count?: number;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export interface Share {
  id: string;
  document_id: string;
  created_by: string;
  access_code: string;
  permission_level: 'READ' | 'WRITE';
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
