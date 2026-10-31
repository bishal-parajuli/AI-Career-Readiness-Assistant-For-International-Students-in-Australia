
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function ResetPasswordScreen() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = new URLSearchParams(location.search).get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleResetPassword = async () => {
    setError("");
    setSuccess("");

    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      setError("This password reset link is invalid.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8000/api/reset-password.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to reset password.");
        return;
      }

      setSuccess("Your password has been reset successfully.");
      setPassword("");
      setConfirmPassword("");

      // Remove the used reset token from the browser URL.
      navigate("/reset-password", { replace: true });
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-[#e2e8f0] rounded-2xl shadow-sm p-7">
        <div className="text-center mb-6">
          <div className="text-[#4f46e5] font-bold text-xl mb-2">
            AI Career Readiness Assistant
          </div>

          <h1 className="text-lg font-semibold text-[#0f172a]">
            Reset your password
          </h1>

          <p className="text-xs text-[#64748b] mt-2">
            Enter and confirm your new password.
          </p>
        </div>

        {!success && (
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium block mb-1.5">
                New password
              </span>

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                maxLength={1024}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium block mb-1.5">
                Confirm new password
              </span>

              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                maxLength={1024}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
              />
            </label>

            <label className="flex items-center gap-2 text-xs text-[#64748b]">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              Show passwords
            </label>

            {error && (
              <p role="alert" className="text-xs text-red-600">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleResetPassword}
              disabled={loading || !token}
              className="w-full bg-[#4f46e5] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#4338ca] disabled:opacity-60"
            >
              {loading ? "Resetting..." : "Reset password"}
            </button>

            {!token && (
              <p role="alert" className="text-xs text-red-600">
                Missing password reset token. Request a new reset link.
              </p>
            )}
          </div>
        )}

        {success && (
          <div role="status" className="text-center">
            <p className="text-sm text-green-700 mb-4">
              {success}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate("/login", { replace: true })}
          className="block mx-auto mt-5 text-xs text-[#4f46e5] font-medium hover:underline"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
}
