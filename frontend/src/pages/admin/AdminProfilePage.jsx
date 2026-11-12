
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

export default function AdminProfilePage() {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Profile Overview</h1>
        <Link
          to="/admin/profile/edit"
          className="px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium hover:bg-cyan-500/20 transition-colors"
        >
          Edit Profile
        </Link>
      </div>

      <div className="bg-[#112435] border border-gray-800 rounded-2xl p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-full bg-cyan-500/20 border-2 border-teal-600 flex items-center justify-center text-5xl font-light text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              {(user?.name || 'A').charAt(0).toUpperCase()}
            </div>
            <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-medium tracking-wide">
              System Online
            </span>
          </div>

          <div className="flex-1 w-full space-y-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Full Name</p>
              <p className="text-lg font-medium text-white">{user?.name || 'Admin User'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-1">Email Address</p>
              <p className="text-lg text-white">{user?.email || 'admin@system.local'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800/60">
              <div>
                <p className="text-sm text-gray-400 mb-1">Role Level</p>
                <p className="text-white capitalize">{user?.role || 'Administrator'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Account Status</p>
                <p className="text-white">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}