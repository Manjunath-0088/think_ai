/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';

export default function AdminEditProfilePage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    
    setTimeout(() => {
      setIsSaving(false);
      navigate('/admin/profile');
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          to="/admin/profile" 
          className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-semibold text-white">Edit Profile</h1>
      </div>

      <div className="bg-[#112435] border border-gray-800 rounded-2xl p-8 shadow-lg">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-800/60">
            <div className="w-20 h-20 rounded-full bg-cyan-500/20 border border-teal-600 flex items-center justify-center text-2xl font-light text-cyan-400">
              {(formData.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white">Profile Picture</p>
              <p className="text-xs text-gray-400 mt-1">Avatars are generated automatically from your name.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-[#0D1220] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-[#0D1220] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                required
              />
            </div>
            
            <div className="pt-4">
              <p className="text-xs text-gray-500">
                Note: Changing your role requires Super Admin privileges and cannot be done from this screen.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-800/60">
            <Link
              to="/admin/profile"
              className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}