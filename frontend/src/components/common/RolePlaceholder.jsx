
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../features/auth/authSlice"; 

export default function RolePlaceholder({ label }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-white flex flex-col">
      <nav className="w-full px-6 py-4 flex justify-between items-center border-b border-gray-800/50">
        <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#C77DFF] to-[#A435F0]">
          Thinkz.ai
        </div>
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-gray-400 hover:text-rose-400 transition-colors"
        >
          Logout
        </button>
      </nav>

      <main className="flex-grow flex items-center justify-center">
        <p className="text-gray-100 text-sm md:text-base">
          {label} dashboard — coming soon.
        </p>
      </main>
    </div>
  );
}
