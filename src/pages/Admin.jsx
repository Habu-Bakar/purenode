import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection, query, where, getDocs,
  doc, updateDoc, deleteDoc, getDoc
} from "firebase/firestore";

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [flaggedResources, setFlaggedResources] = useState([]);
  const [flags, setFlags] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("flagged");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) navigate("/");
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    const userSnap = await getDoc(doc(db, "users", user.uid));
    if (userSnap.exists()) {
      const role = userSnap.data().role;
      if (role === "admin" || role === "moderator") {
        setIsAdmin(true);
        fetchFlaggedResources();
        fetchFlags();
        fetchUsers();
      } else {
        navigate("/dashboard");
      }
    }
  };

  const fetchFlaggedResources = async () => {
    setLoading(true);
    const q = query(
      collection(db, "resources"),
      where("verificationStatus", "==", "flagged")
    );
    const snap = await getDocs(q);
    setFlaggedResources(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const fetchFlags = async () => {
    const q = query(
      collection(db, "flags"),
      where("status", "==", "pending")
    );
    const snap = await getDocs(q);
    setFlags(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, "users"));
    setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const handleVerify = async (resourceId) => {
    await updateDoc(doc(db, "resources", resourceId), {
      verificationStatus: "verified",
      flagCount: 0,
    });
    fetchFlaggedResources();
  };

  const handleRemove = async (resourceId) => {
    if (window.confirm("Are you sure you want to remove this resource?")) {
      await deleteDoc(doc(db, "resources", resourceId));
      fetchFlaggedResources();
    }
  };

  const handleDismissFlag = async (resourceId, flagId) => {
    await updateDoc(doc(db, "resources", resourceId), {
      verificationStatus: "pending",
      flagCount: 0,
    });
    await updateDoc(doc(db, "flags", flagId), { status: "dismissed" });
    fetchFlaggedResources();
    fetchFlags();
  };

  const handleRoleChange = async (userId, newRole) => {
    await updateDoc(doc(db, "users", userId), { role: newRole });
    fetchUsers();
  };

  if (!isAdmin) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

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
          <button onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-white text-sm">Dashboard</button>
          <button onClick={() => navigate("/vault")} className="text-gray-400 hover:text-white text-sm">Vault</button>
          <button className="text-white text-sm font-semibold border-b-2 border-indigo-500 pb-1">Admin</button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-indigo-900 text-indigo-300 px-2 py-1 rounded-lg font-semibold">ADMIN</span>
          <img src={user?.photoURL} alt="profile" className="w-8 h-8 rounded-full" />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Admin Panel</h1>
          <p className="text-gray-400">Manage flagged content, users, and system settings</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Flagged Resources</p>
            <p className="text-3xl font-bold text-red-400">{flaggedResources.length}</p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Pending Reports</p>
            <p className="text-3xl font-bold text-yellow-400">{flags.length}</p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Total Users</p>
            <p className="text-3xl font-bold text-indigo-400">{users.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-800">
          {["flagged", "reports", "users"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold capitalize transition-all ${
                activeTab === tab
                  ? "text-white border-b-2 border-indigo-500"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab === "flagged" ? "Flagged Resources" :
               tab === "reports" ? "Pending Reports" : "User Management"}
            </button>
          ))}
        </div>

        {/* Flagged Resources Tab */}
        {activeTab === "flagged" && (
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : flaggedResources.length === 0 ? (
              <div className="text-center py-20">
                <span className="text-4xl">✅</span>
                <p className="text-gray-400 mt-3">No flagged resources — all clear!</p>
              </div>
            ) : (
              flaggedResources.map((r) => (
                <div key={r.id} className="bg-gray-900 rounded-2xl border border-red-900 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded-lg">⚑ Flagged</span>
                        <span className="text-xs bg-indigo-950 text-indigo-300 px-2 py-1 rounded-lg">{r.courseCode}</span>
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-lg">{r.resourceType}</span>
                      </div>
                      <h3 className="text-white font-semibold text-lg mb-1">{r.title}</h3>
                      <p className="text-gray-500 text-sm">
                        Uploaded by {r.uploaderName} · {r.flagCount || 0} flag(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <button
                        onClick={() => navigate(`/resource/${r.id}`)}
                        className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg transition-all"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleVerify(r.id)}
                        className="bg-green-700 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
                      >
                        ✓ Verify
                      </button>
                      <button
                        onClick={() => handleRemove(r.id)}
                        className="bg-red-700 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="flex flex-col gap-4">
            {flags.length === 0 ? (
              <div className="text-center py-20">
                <span className="text-4xl">✅</span>
                <p className="text-gray-400 mt-3">No pending reports!</p>
              </div>
            ) : (
              flags.map((f) => (
                <div key={f.id} className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold mb-1">Report: {f.reason}</p>
                      <p className="text-gray-500 text-sm">Resource ID: {f.resourceId}</p>
                    </div>
                    <button
                      onClick={() => handleDismissFlag(f.resourceId, f.id)}
                      className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg transition-all"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="flex flex-col gap-4">
            {users.map((u) => (
              <div key={u.id} className="bg-gray-900 rounded-2xl border border-gray-800 p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={u.photoURL} alt={u.displayName} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="text-white font-semibold">{u.displayName}</p>
                    <p className="text-gray-500 text-sm">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${
                    u.role === "admin" ? "bg-indigo-900 text-indigo-300" :
                    u.role === "moderator" ? "bg-green-900 text-green-300" :
                    "bg-gray-800 text-gray-400"
                  }`}>
                    {u.role}
                  </span>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none"
                  >
                    <option value="student">Student</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}