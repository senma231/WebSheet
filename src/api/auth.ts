import axios from 'axios'
import type { User } from '@/types/user'

const API_URL = import.meta.env.VITE_API_BASE_URL

interface LoginResponse {
  code: number;
  data: {
    token: string;
    expires_in: number;
    user: User;
  };
}

interface RefreshResponse {
  code: number;
  data: {
    token: string;
    expires_in: number;
  };
}

interface LogoutResponse {
  code: number;
  message: string;
}

/**
 * 用户登录
 * @param username 用户名
 * @param password 密码
 * @returns 登录响应
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await axios.post<LoginResponse>(`${API_URL}/auth/login`, {
    username,
    password
  })
  return response.data
}

/**
 * 用户登出
 * @returns 登出响应
 */
export async function logout(): Promise<LogoutResponse> {
  const response = await axios.post<LogoutResponse>(`${API_URL}/auth/logout`)
  return response.data
}

/**
 * 刷新令牌
 * @param token 当前令牌
 * @returns 刷新响应
 */
export async function refreshToken(token: string): Promise<RefreshResponse> {
  const response = await axios.post<RefreshResponse>(
    `${API_URL}/auth/refresh`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )
  return response.data
}

/**
 * 使用两步验证码登录
 * @param username 用户名
 * @param password 密码
 * @param code 两步验证码
 * @returns 登录响应
 */
export async function loginWithTwoFactor(
  username: string,
  password: string,
  code: string
): Promise<LoginResponse> {
  const response = await axios.post<LoginResponse>(`${API_URL}/auth/login/two-factor`, {
    username,
    password,
    code
  })
  return response.data
}

/**
 * 使用恢复码登录
 * @param username 用户名
 * @param password 密码
 * @param recovery_code 恢复码
 * @returns 登录响应
 */
export async function loginWithRecoveryCode(
  username: string,
  password: string,
  recovery_code: string
): Promise<LoginResponse> {
  const response = await axios.post<LoginResponse>(`${API_URL}/auth/login/recovery`, {
    username,
    password,
    recovery_code
  })
  return response.data
}
