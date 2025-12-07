// policyEngine.js

import { Policy } from "./api/interfaces";

function match(action: string, pattern: string) {
  const regex = new RegExp("^" + pattern.replace("*", ".*") + "$");
  return regex.test(action);
}

function allowedFields(policy: Policy, body: any) {
  if (!policy.conditions || !policy.conditions["AllowedFields"]) return null;
  return policy.conditions["AllowedFields"];
}

export function evaluatePolicies(policies: Policy[], action: string, resource: string, body: any) {
  let allowed = false;

  for (const policy of policies) {
    if (!policy.action.some(a => match(action, a))) continue;
    if (!policy.resource.some(r => match(resource, r))) continue;

    // explicit deny wins
    if (policy.effect === "Deny") return false;

    if (policy.effect === "Allow") {
      // If policy has field restrictions
      const fields = allowedFields(policy, body);

      if (fields) {
        const invalid = Object.keys(body).some(f => !fields.includes(f));
        if (invalid) return false;
      }

      allowed = true;
    }
  }

  return allowed;
}

