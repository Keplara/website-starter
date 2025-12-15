
export interface PendingUser {
  emailAddress: string;
  username: string;
  password: string;
  createdOn: string; // ISO string
  authorities?: string[];
}
export interface Policy {
  id: string;
  name: string;
  description?: string;
  effect: 'Allow' | 'Deny';
  action: string[];
  resource: string[];
  conditions?: {
    [condition: string]: any;
  };
}


