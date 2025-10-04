/**
 * Keycloak setup for NextAuth integration tests
 * This script configures Keycloak with a test realm, client, and users
 */

const KEYCLOAK_URL = 'http://localhost:8080'
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin'
const REALM_NAME = 'threads-test'
const CLIENT_ID = 'threads-app'
const CLIENT_SECRET = 'test-client-secret'

async function getAdminToken() {
  const response = await fetch(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
      grant_type: 'password',
      client_id: 'admin-cli',
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to get admin token: ${response.statusText}`)
  }

  const data = await response.json()
  return data.access_token
}

async function createRealm(token: string) {
  const response = await fetch(`${KEYCLOAK_URL}/admin/realms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      realm: REALM_NAME,
      enabled: true,
    }),
  })

  if (!response.ok && response.status !== 409) {
    throw new Error(`Failed to create realm: ${response.statusText}`)
  }
}

async function createClient(token: string) {
  const response = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      clientId: CLIENT_ID,
      secret: CLIENT_SECRET,
      enabled: true,
      redirectUris: ['http://localhost:3000/*'],
      webOrigins: ['http://localhost:3000'],
      publicClient: false,
      protocol: 'openid-connect',
      directAccessGrantsEnabled: true, // Enable Resource Owner Password Credentials flow
      serviceAccountsEnabled: false,
      standardFlowEnabled: true,
      implicitFlowEnabled: false,
    }),
  })

  if (!response.ok && response.status !== 409) {
    throw new Error(`Failed to create client: ${response.statusText}`)
  }
}

async function createTestUser(token: string, username: string, email: string, password: string) {
  // Create user
  const createResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      username,
      email,
      enabled: true,
      emailVerified: true,
      credentials: [
        {
          type: 'password',
          value: password,
          temporary: false,
        },
      ],
    }),
  })

  if (!createResponse.ok && createResponse.status !== 409) {
    throw new Error(`Failed to create user: ${createResponse.statusText}`)
  }

  // Get user ID
  const usersResponse = await fetch(
    `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users?username=${username}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const users = await usersResponse.json()
  if (users.length === 0) {
    throw new Error('User not found after creation')
  }

  const userId = users[0].id

  // Ensure password is set again and remove all required actions
  await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${userId}/reset-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      type: 'password',
      value: password,
      temporary: false,
    }),
  })

  // Execute required actions removal
  await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${userId}/execute-actions-email`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify([]),
  })

  // Update user to remove required actions
  const updateResponse = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      username,
      email,
      enabled: true,
      emailVerified: true,
      requiredActions: [],
    }),
  })

  if (!updateResponse.ok) {
    console.error('Failed to update user:', await updateResponse.text())
  }
}

export async function setupKeycloak() {
  try {
    console.log('Setting up Keycloak for tests...')

    const token = await getAdminToken()
    console.log('✓ Got admin token')

    await createRealm(token)
    console.log('✓ Created realm')

    await createClient(token)
    console.log('✓ Created client')

    await createTestUser(token, 'testuser', 'test@example.com', 'password123')
    console.log('✓ Created test user')

    console.log('Keycloak setup complete!')

    return {
      realmName: REALM_NAME,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      issuer: `${KEYCLOAK_URL}/realms/${REALM_NAME}`,
    }
  } catch (error) {
    console.error('Failed to setup Keycloak:', error)
    throw error
  }
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  setupKeycloak()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}
