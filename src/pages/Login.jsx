import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 p-10 rounded-2xl shadow-2xl flex flex-col items-center gap-6 w-full max-w-md">
        
        {/* Logo / Title */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center">
            <span className="text-white text-3xl font-bold">P</span>
          </div>
          <h1 className="text-white text-3xl font-bold tracking-tight">PureNode</h1>
          <p className="text-gray-400 text-sm text-center">
            The academic resource vault for AUN students
          </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gray-700" />

        {/* Login Button */}
        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-md"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="w-5 h-5"
          />
          Continue with Google
        </button>

        <p className="text-gray-500 text-xs text-center">
          Only AUN students and staff can access PureNode
        </p>
      </div>
    </div>
  );
}
