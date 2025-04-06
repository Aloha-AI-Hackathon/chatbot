declare module '*.css';
declare module '*.scss';
declare module '*.png';
declare module '*.jpg';
declare module '*.svg';

interface User {
  id: string;
  username: string;
  email: string;
}

interface Message {
  content: string;
  isUser: boolean;
}

interface ApiResponse {
  reply: string;
  session_id: string;
}

interface Session {
  id: string;
  title?: string;
  created_at: string;
  last_message_at: string;
  messages?: Array<{
    content: string;
    is_user: boolean;
  }>;
}

interface ApiHealth {
  status: string;
  ai_service_initialized: boolean;
} 