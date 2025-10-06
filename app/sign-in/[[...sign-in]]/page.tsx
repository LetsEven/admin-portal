import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Portal - Xquisito
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa a tu portal de administración
          </p>
        </div>
        <SignIn />
      </div>
    </div>
  )
}