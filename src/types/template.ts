import type { DocumentType } from './document'

export interface Template {
  id: string;
  title: string;
  description?: string;
  type: DocumentType;
  category_id?: string;
  thumbnail_url?: string;
  storage_path: string;
  size: number;
  owner_id: string;
  is_public: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  category?: TemplateCategory;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
  template_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateRequest {
  title: string;
  description?: string;
  type: DocumentType;
  category_id?: string;
  file: File;
  thumbnail?: File;
  is_public?: boolean;
}

export interface UpdateTemplateRequest {
  title?: string;
  description?: string;
  category_id?: string;
  thumbnail?: File;
  is_public?: boolean;
}

export interface CreateTemplateCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateTemplateCategoryRequest {
  name?: string;
  description?: string;
}
