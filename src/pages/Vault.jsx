import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ResourceCard from "../components/ResourceCard";
import UploadModal from "../components/UploadModal";

const COURSE_CODES = [
  "All", "SEN401", "SEN301", "SEN201", "SEN101",
  "CSC401", "CSC301", "CSC201", "CSC101",
  "CIE401", "CIE301", "CIE201", "CIE101",
];

const RESOURCE_TYPES = [
  "All", "Past Exam", "Lecture Notes", "Project Documentation",
  "Lab Report", "Study Guide", "Code Snippet",
];

const LEVELS = ["All", "100", "200", "300", "400", "500"];
const SEMESTERS = ["All", "Fall", "Spring", "Summer"];

export default function Vault() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [courseCode, setCourseCode] = useState("All");
  const [resourceType, setResourceType] = useState("All");
  const [level, setLevel] = useState("All");
  const [semester, setSemester] = useState("All");
  const [sortBy, setSortBy] = useState("trustScore");
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [resources, search, courseCode, resourceType, level, semester, sortBy]);

  const fetchResources = async () => {
    setLoading(true);
    const q = query(collection(db, "resources"), orderBy("uploadedAt", "desc"));
    const snap = await getDocs(q);
    const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setResources(data);
    setLoading(false);
  };

  const applyFilters = () => {
    let result = [...resources];

    if (search) {
      result = result.filter(
        (r) =>
          r.title?.toLowerCase().includes(search.toLowerCase()) ||
          r.description?.toLowerCase().includes(search.toLowerCase()) ||
          r.courseCode?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (courseCode !== "All") result = result.filter((r) => r.courseCode === courseCode);
    if (resourceType !== "All") result = result.filter((r) => r.resourceType === resourceType);
    if (level !== "All") result = result.filter((r) => r.level === parseInt(level));
    if (semester !== "All") result = result.filter((r) => r.semester === semester);

    result.sort((a, b) => {
      if (sortBy === "trustScore") return (b.trustScore || 0) - (a.trustScore || 0);
      if (sortBy === "uploadedAt") return (b.uploadedAt?.seconds || 0) - (a.uploadedAt?.seconds || 0);
      if (sortBy === "downloadCount") return (b.downloadCount || 0) - (a.downloadCount || 0);
      return 0;
    });

    setFiltered(result);
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
            onClick={() => navigate("/dashboard")}
            className="text-gray-400 hover:text-white text-sm transition-all"
          >
            Dashboard
          </button>
          <button className="text-white text-sm font-semibold border-b-2 border-indigo-500 pb-1">
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
          <button
            onClick={handleLogout}
            className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-all"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">The Vault</h1>
          <p className="text-gray-400">Browse and discover academic resources uploaded by the AUN community</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by title, description or course code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 text-white px-5 py-4 rounded-xl border border-gray-700 focus:outline-none focus:border-indigo-500 text-sm"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          <select
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            className="bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500 text-sm"
          >
            {COURSE_CODES.map((c) => <option key={c} value={c}>{c === "All" ? "All Courses" : c}</option>)}
          </select>

          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            className="bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500 text-sm"
          >
            {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t === "All" ? "All Types" : t}</option>)}
          </select>

          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500 text-sm"
          >
            {LEVELS.map((l) => <option key={l} value={l}>{l === "All" ? "All Levels" : `${l} Level`}</option>)}
          </select>

          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500 text-sm"
          >
            {SEMESTERS.map((s) => <option key={s} value={s}>{s === "All" ? "All Semesters" : s}</option>)}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500 text-sm"
          >
            <option value="trustScore">Sort: Trust Score</option>
            <option value="uploadedAt">Sort: Newest</option>
            <option value="downloadCount">Sort: Most Downloaded</option>
          </select>
        </div>

        {/* Results count */}
        <p className="text-gray-500 text-sm mb-4">
          {filtered.length} resource{filtered.length !== 1 ? "s" : ""} found
        </p>

        {/* Resource Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-4xl">🔍</span>
            <p className="text-gray-400">No resources match your search</p>
            <p className="text-gray-600 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((r) => (
              <ResourceCard key={r.id} resource={r} onRefresh={fetchResources} />
            ))}
          </div>
        )}
      </main>

      {showUpload && (
        <UploadModal onClose={() => { setShowUpload(false); fetchResources(); }} />
      )}
    </div>
  );
}
