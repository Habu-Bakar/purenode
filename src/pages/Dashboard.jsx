import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import UploadModal from "../components/UploadModal";

export default function Dashboard() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [showUpload, setShowUpload] = useState(false);
  const [resources, setResources] = useState([]);
  const [totalResources, setTotalResources] = useState(0);
  const [userUploads, setUserUploads] = useState(0);

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    const q = query(
      collection(db, "resources"),
      orderBy("uploadedAt", "desc"),
      limit(5)
    );
    const snap = await getDocs(q);
    const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setResources(data);
    setTotalResources(snap.size);
    const userDocs = data.filter((r) => r.uploaderUid === user?.uid);
    setUserUploads(userDocs.length);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
            <span className="text-white font-bold text-lg">PureNode</span>
          </div>
          <button
            onClick={() => navigate("/vault")}
            className="text-gray-400 hover:text-white text-sm transition-all"
          >
            Vault
          </button>
          {(role === "admin" || role === "moderator") && (
          <button
            onClick={() => navigate("/admin")}
            className="text-gray-400 hover:text-white text-sm transition-all"
          >
          Admin
          </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowUpload(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
          >
            + Upload Resource
          </button>
          <img src={user?.photoURL} alt="profile" className="w-8 h-8 rounded-full" />
          <span className="text-gray-300 text-sm">{user?.displayName}</span>
          <button
            onClick={handleLogout}
            className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-all"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.displayName?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-400 mb-10">Your academic resource vault is ready.</p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Total Resources</p>
            <p className="text-3xl font-bold text-indigo-400">{totalResources}</p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Your Uploads</p>
            <p className="text-3xl font-bold text-indigo-400">{userUploads}</p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Saved Resources</p>
            <p className="text-3xl font-bold text-indigo-400">0</p>
          </div>
        </div>

        {/* Recent Resources */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Resources</h2>
          {resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📂</span>
              </div>
              <p className="text-gray-400 text-sm">No resources yet</p>
              <p className="text-gray-600 text-xs">Be the first to upload a resource!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {resources.map((r) => (
                <div key={r.id} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{r.title}</p>
                    <p className="text-gray-400 text-sm">{r.courseCode} · {r.resourceType} · {r.semester} {r.academicYear}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-indigo-900 text-indigo-300 px-2 py-1 rounded-lg">{r.fileType?.toUpperCase()}</span>
                    <span className="text-xs text-gray-500">{r.fileSize} KB</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal onClose={() => { setShowUpload(false); fetchResources(); }} />
      )}
    </div>
  );
}