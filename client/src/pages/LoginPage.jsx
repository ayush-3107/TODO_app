export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
      <div className="w-full max-w-sm p-8 bg-[#1e293b] rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold text-center text-white mb-4">Login</h2>

        <form className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-1" htmlFor="Username">Username</label>
            <input
              id="username"
              type="text"
              className="w-full px-4 py-2 rounded-md bg-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-1" htmlFor="password">Password</label>
            <div className="relative">
              <input
                id="password"
                type="password"
                className="w-full px-4 py-2 rounded-md bg-[#334155] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 cursor-pointer">
                👁️
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-md text-white font-medium bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            Login
          </button>
        </form>

        <p className="mt-4 text-center text-gray-400 text-sm">
          Don&apos;t have an account?{' '}
          <a href="/register" className="text-blue-400 hover:underline">Register</a>
        </p>
      </div>
    </div>
  )
}
