import { Injectable } from '@angular/core';
import { UserService } from './user.service';

// Simple wildcard matcher: converts "foo:*" to /^foo:.*$/i
function matchPattern(pattern: string, value: string): boolean {
  const normalizedPattern = (pattern || '*').toLowerCase();
  const normalizedValue = (value || '').toLowerCase();
  if (normalizedPattern === '*') return true;
  const regex = new RegExp('^' + normalizedPattern.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*') + '$');
  return regex.test(normalizedValue);
}

@Injectable({ providedIn: 'root' })
export class PermissionService {
  constructor(private userService: UserService) { }

  /**
   * Returns true if the user is allowed to perform `action` on `resource`.
   * Deny rules ALWAYS win over allow rules.
   */
  can(action: string, resource: string = '*'): boolean {
    const { actions, deniedActions, allowStatements, denyStatements } = this.userService.getPermissionData();
    const act = (action || '').toLowerCase();
    const res = (resource || '*').toLowerCase();

    // 1) Explicit deny statements win
    const statementDenied = denyStatements.some((s) => matchPattern(s.action, act) && matchPattern(s.resource || '*', res));
    const actionDenied = deniedActions.some((p) => matchPattern(p, act));
    if (statementDenied || actionDenied) return false;

    // 2) Allow statements or actions
    const statementAllowed = allowStatements.some((s) => matchPattern(s.action, act) && matchPattern(s.resource || '*', res));
    const actionAllowed = actions.some((p) => matchPattern(p, act));

    return statementAllowed || actionAllowed;
  }
}
