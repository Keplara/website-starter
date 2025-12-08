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


