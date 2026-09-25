export interface User {
  id: string;
  username: string;
  email: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface Message {
  id: string;
  conversationId?: string;
  groupId?: string;
  sender: User;
  content: string;
  createdAt: string;
  updatedAt?: string;
  edited?: boolean;
  deleted?: boolean;
  reactions?: MessageReaction[];
  /** Ids of users who have read the message (sender included). */
  readBy?: string[];
}

export interface MessageReaction {
  userId: string;
  emoji: string;
}

export interface Conversation {
  id: string;
  isGroup: false;
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
  updatedAt: string;
}

export interface Group {
  id: string;
  isGroup: true;
  name: string;
  members: User[];
  createdBy: string;
  createdAt?: string;
  lastMessage?: Message;
  unreadCount?: number;
  updatedAt: string;
}

export type ChatThread = Conversation | Group;

export interface AuthResponse {
  token: string;
  user: User;
}

export interface TypingUpdate {
  conversationId?: string;
  groupId?: string;
  userId: string;
  isTyping: boolean;
}

export interface PresenceUpdate {
  userId: string;
  isOnline: boolean;
  lastSeen: string | null;
}
