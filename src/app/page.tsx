import { redirect } from 'next/navigation'

// Middleware handles the redirect logic — this is just a fallback
export default function RootPage() {
  redirect('/login')
}
