export async function login(
  authorizationServerBaseURL: string,
  username: string,
  password: string
): Promise<string | null> {
  const safeUser = username.trim();
  const safePass = password.trim();

  const params = new URLSearchParams({
    emailOrUsername: safeUser,
    password: safePass,
  });
  const url = `${authorizationServerBaseURL}/login?${params.toString()}`;

  console.log(`[Auth-Client] Attempting to POST to: ${url}`); // Added for debugging

  try {
    const response = await fetch(url, {
      method: 'POST',
    });

    if (response.ok) {
      const cookie = response.headers.get('Set-Cookie');
      console.log('[Auth-Client] Login successful, captured cookie:', cookie);
      return cookie;
    }
    return null;
  } catch (err) {
    console.error('Login request failed:', err);
    return null;
  }
}
