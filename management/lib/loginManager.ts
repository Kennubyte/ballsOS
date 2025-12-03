"use server"
import { cookies } from 'next/headers'
import * as jose from 'jose'


async function getToken() {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')?.value || null
  return token
}

export async function getLogin() {
  const token = await getToken()

  if (!token) {
    return false
  }

  const publicKeyResponse = await fetch('http://127.0.0.1:55555/publickey')
  const publicKeyPem = await publicKeyResponse.text()

  const publicKey = await jose.importSPKI(publicKeyPem, 'RS256')
  
  try {
    const { payload } = await jose.jwtVerify(token, publicKey, {
      algorithms: ['RS256'],
    })
  } catch (error) {
    return false
  }

  return true
}

export async function login(username: string, password: string) {
  const response = await fetch('http://127.0.0.1:55555/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ username, password }).toString(),
  })

  if (!response.ok) {
    throw new Error('Login failed')
  }
  
  const data = await response.json()
  const token = data.Token
  const cookieStore = await cookies()
  cookieStore.set('jwt_token', token, { httpOnly: true, path: '/' })
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('jwt_token')
}