/**
 * Helper functions for Keycloak authentication in tests
 */

const KEYCLOAK_URL = 'http://localhost:8080'
const REALM_NAME = 'threads-test'
const CLIENT_ID = 'threads-app'
const CLIENT_SECRET = 'test-client-secret'

interface TokenResponse {
  access_token: string
  refresh_token: string
  id_token: string
  token_type: string
  expires_in: number
}

/**
 * Get access token from Keycloak using Resource Owner Password Credentials flow
 */
export async function getKeycloakToken(username: string, password: string): Promise<TokenResponse> {
  const response = await fetch(
    `${KEYCLOAK_URL}/realms/${REALM_NAME}/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        username,
        password,
        scope: 'openid profile email',
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get Keycloak token: ${error}`)
  }

  return response.json()
}

/**
 * Create a NextAuth session by simulating OAuth callback
 */
export async function createKeycloakSession(username: string, password: string) {
  const tokenResponse = await getKeycloakToken(username, password)
  return tokenResponse
}
