import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

const COURSE_CODES = [
  "SEN401", "SEN301", "SEN201", "SEN101",
  "CSC401", "CSC301", "CSC201", "CSC101",
  "CIE401", "CIE301", "CIE201", "CIE101",
];

const RESOURCE_TYPES = [
  "Past Exam",
  "Lecture Notes",
  "Project Documentation",
  "Lab Report",
  "Study Guide",
  "Code Snippet",
];

const CLOUDINARY_CLOUD_NAME = "dgtozzf6t";
const CLOUDINARY_UPLOAD_PRESET = "purenode_uploads";

export default function UploadModal({ onClose }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [level, setLevel] = useState("");
  const [semester, setSemester] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!title || !courseCode || !level || !semester || !academicYear || !resourceType || !file) {
      setError("Please fill in all fields and select a file.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("File size must be under 50MB.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("resource_type", "raw");

      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`
      );

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setProgress(pct);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          const fileURL = response.secure_url;

          await addDoc(collection(db, "resources"), {
            title,
            description,
            uploaderUid: user.uid,
            uploaderName: user.displayName,
            courseCode,
            level: parseInt(level),
            semester,
            academicYear,
            resourceType,
            fileURL,
            fileType: file.name.split(".").pop(),
            fileSize: Math.round(file.size / 1024),
            uploadedAt: serverTimestamp(),
            upvotes: 0,
            downvotes: 0,
            downloadCount: 0,
            trustScore: 0,
            verificationStatus: "pending",
          });

          setUploading(false);
          onClose();
        } else {
          setError("Upload failed. Please try again.");
          setUploading(false);
        }
      };

      xhr.onerror = () => {
        setError("Upload failed. Please try again.");
        setUploading(false);
      };

      xhr.send(formData);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-lg border border-gray-800 shadow-2xl">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-bold">Upload Resource</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Resource title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-indigo-500"
          />

          <textarea
            placeholder="Short description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-indigo-500 resize-none"
          />

          <div className="grid grid-cols-2 gap-4">
            <select
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Course Code</option>
              {COURSE_CODES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Level</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="300">300</option>
              <option value="400">400</option>
              <option value="500">500</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Semester</option>
              <option value="Fall">Fall</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
            </select>

            <input
              type="text"
              placeholder="Academic Year e.g. 2024-2025"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            className="bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Resource Type</option>
            {RESOURCE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.pptx,.txt,.py,.js,.java,.cpp"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
              id="fileInput"
            />
            <label htmlFor="fileInput" className="cursor-pointer">
              <div className="text-gray-400 text-sm">
                {file ? (
                  <span className="text-indigo-400 font-medium">{file.name}</span>
                ) : (
                  <>
                    <span className="text-indigo-400 font-medium">Click to select a file</span>
                    <p className="text-xs mt-1">PDF, DOCX, PPTX, TXT, or code files — max 50MB</p>
                  </>
                )}
              </div>
            </label>
          </div>

          {uploading && (
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all"
          >
            {uploading ? `Uploading... ${progress}%` : "Upload Resource"}
          </button>
        </div>
      </div>
    </div>
  );
}