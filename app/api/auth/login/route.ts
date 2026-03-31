import { signIn } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const formData = await request.json()

    await signIn('credentials', {
      email: formData.email,
      password: formData.password,
      redirect: false,
    })

    return Response.json({ success: true }, { status: 200 })
  } catch (_error) {
    return Response.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
  }
}
