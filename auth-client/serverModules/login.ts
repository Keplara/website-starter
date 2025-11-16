export async function login(
  authorizationServerBaseURL: string,
  username: string,
  password: string
): Promise<boolean> {
  const safeUser = username.trim();
  const safePass = password.trim();

  const url = `${authorizationServerBaseURL}/login`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emailOrUsername: safeUser, password: safePass }),
    });

    // HTTP 2xx considered success
    return response.ok;
  } catch (err) {
    console.error('Login request failed:', err);
    // Rethrow or handle the error as needed.
    // For instance, you might want to throw a more specific error.
    throw new Error(`Service is down, please try again later.`);
  }
}
