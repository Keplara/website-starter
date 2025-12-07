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


export interface Group {
  id: string;
  name: string;
  description?: string;
  members: string[]; // Array of user IDs
  policies: string[]; // Array of policy IDs
}