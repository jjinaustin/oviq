import { supabase } from './supabase'

export async function signUp(email: string, password: string, fullName: string, companyName: string) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, company_name: companyName } }
  })
  if (authError) throw authError

  if (authData.user) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: authData.user.id,
        email,
        full_name: fullName,
        company_name: companyName,
      })
    })
  }
  return authData
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
