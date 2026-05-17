import { useState } from "react";
import { db } from "../firebase";
import { doc, updateDoc, increment } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const TYPE_COLORS = {
  "Past Exam": "bg-red-900 text-red-300",
  "Lecture Notes": "bg-blue-900 text-blue-300",
  "Project Documentation": "bg-green-900 text-green-300",
  "Lab Report": "bg-yellow-900 text-yellow-300",
  "Study Guide": "bg-purple-900 text-purple-300",
  "Code Snippet": "bg-pink-900 text-pink-300",
};

export default function ResourceCard({ resource, onRefresh }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      await updateDoc(doc(db, "resources", resource.id), {
        downloadCount: increment(1),
      });
      window.open(resource.fileURL, "_blank");
      onRefresh();
    } catch (err) {
      console.error(err);
    }
    setDownloading(false);
  };

  const typeColor = TYPE_COLORS[resource.resourceType] || "bg-gray-800 text-gray-300";

  return (
    <div
      onClick={() => navigate(`/resource/${resource.id}`)}
      className="bg-gray-900 rounded-2xl border border-gray-800 p-5 flex flex-col gap-4 hover:border-indigo-700 transition-all duration-200 cursor-pointer"
    >
      {/* Top: type badge + file type */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${typeColor}`}>
          {resource.resourceType}
        </span>
        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-lg uppercase">
          {resource.fileType}
        </span>
      </div>

      {/* Title & description */}
      <div>
        <h3 className="text-white font-semibold text-base leading-tight mb-1">
          {resource.title}
        </h3>
        {resource.description && (
          <p className="text-gray-500 text-xs line-clamp-2">{resource.description}</p>
        )}
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs bg-indigo-950 text-indigo-300 px-2 py-1 rounded-lg">
          {resource.courseCode}
        </span>
        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-lg">
          {resource.level} Level
        </span>
        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-lg">
          {resource.semester} {resource.academicYear}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>⬆️ {resource.upvotes || 0}</span>
        <span>⬇️ {resource.downloadCount || 0} downloads</span>
        <span className="ml-auto">{resource.fileSize} KB</span>
      </div>

      {/* Trust Score */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-800 rounded-full h-1.5">
          <div
            className="bg-indigo-500 h-1.5 rounded-full"
            style={{ width: `${Math.min((resource.trustScore || 0) * 10, 100)}%` }}
          />
        </div>
        <span className="text-xs text-indigo-400 font-semibold">
          {(resource.trustScore || 0).toFixed(1)} TS
        </span>
      </div>

      {/* Uploader */}
      <p className="text-xs text-gray-600">
        Uploaded by <span className="text-gray-400">{resource.uploaderName}</span>
      </p>

      {/* Verification badge + Download */}
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
          resource.verificationStatus === "verified"
            ? "bg-green-900 text-green-300"
            : resource.verificationStatus === "flagged"
            ? "bg-red-900 text-red-300"
            : "bg-gray-800 text-gray-400"
        }`}>
          {resource.verificationStatus === "verified" ? "✓ Verified" :
           resource.verificationStatus === "flagged" ? "⚑ Flagged" : "⏳ Pending"}
        </span>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all"
        >
          {downloading ? "Opening..." : "Download"}
        </button>
      </div>
    </div>
  );
}