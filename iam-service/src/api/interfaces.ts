export interface Role {
  roleId: string;
  name: string;
  description?: string;
  // Roles are backed by policies with actions; store policy IDs
  policies?: string[];
  // Optional max session duration for assumed role tokens
  maxSessionDuration?: number;
}

export interface User {
  userId: string;
  username: string;
  email: string;
  password: string;
  roles: string[];
  groupIds: string[];
  // Add more fields as needed (e.g., status, createdAt, etc.)
}
export interface Policy {
  id: string;
  name: string;
  description?: string;
  effect: 'Allow' | 'Deny';
  action: string[];
  principal?: string[] | string;
  resource: string[];
  conditions?: {
    [condition: string]: any;
  };
}


export interface Group {
  id: string;
  name: string;
  description?: string;
  members: string[]; // Array of user IDs
  policies: string[]; // Array of policy IDs
}