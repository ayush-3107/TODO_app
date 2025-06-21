import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext.jsx";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true); // Toggle between login/register
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (!isLogin && !formData.username.trim()) {
      setError("Username is required for registration");
      setLoading(false);
      return;
    }

    // Call appropriate function
    const result = isLogin
      ? await login({ email: formData.email, password: formData.password })
      : await register(formData);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setFormData({ username: "", email: "", password: "" });
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-[#1e293b] p-8 rounded-xl shadow-lg w-[90%] max-w-md"
      >
        <h1 className="text-3xl font-bold mb-6 text-center">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username field - only show for registration */}
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full p-3 rounded-lg bg-[#334155] text-white outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your username"
                disabled={loading}
              />
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg bg-[#334155] text-white outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              autoFocus={isLogin}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg bg-[#334155] text-white outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading
              ? isLogin
                ? "Logging in..."
                : "Creating account..."
              : isLogin
              ? "Login"
              : "Create Account"}
          </button>
        </form>

        {/* Toggle between login/register */}
        <div className="text-center mt-6">
          <span className="text-gray-400 text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            onClick={toggleMode}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors text-sm inline"
          >
            {isLogin ? "Sign up" : "Login"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
