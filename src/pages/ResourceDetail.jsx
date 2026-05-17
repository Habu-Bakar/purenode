import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  doc, getDoc, updateDoc, increment,
  collection, addDoc, query, orderBy,
  getDocs, serverTimestamp
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function ResourceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [voting, setVoting] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [showFlagMenu, setShowFlagMenu] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) navigate("/");
    fetchResource();
    fetchComments();
    checkUserVote();
  }, [id]);

  const fetchResource = async () => {
    const snap = await getDoc(doc(db, "resources", id));
    if (snap.exists()) setResource({ id: snap.id, ...snap.data() });
    setLoading(false);
  };

  const fetchComments = async () => {
    const q = query(
      collection(db, "resources", id, "comments"),
      orderBy("postedAt", "desc")
    );
    const snap = await getDocs(q);
    setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const checkUserVote = async () => {
    const voteSnap = await getDoc(doc(db, "resources", id, "votes", user.uid));
    if (voteSnap.exists()) setUserVote(voteSnap.data().voteType);
  };

  const computeTrustScore = (upvotes, downvotes, downloadCount, verificationStatus) => {
    const netVotes = (upvotes || 0) - (downvotes || 0);
    const downloads = downloadCount || 0;
    const verifyBonus = verificationStatus === "verified" ? 10 : verificationStatus === "flagged" ? -5 : 0;
    return (netVotes * 0.5) + (downloads * 0.3) + (verifyBonus * 0.2);
  };

  const handleVote = async (voteType) => {
    if (voting || userVote) return;
    setVoting(true);
    try {
      const resourceRef = doc(db, "resources", id);
      const voteRef = doc(db, "resources", id, "votes", user.uid);

      if (voteType === "up") {
        await updateDoc(resourceRef, { upvotes: increment(1) });
      } else {
        await updateDoc(resourceRef, { downvotes: increment(1) });
      }

      await updateDoc(voteRef, { voteType }).catch(async () => {
        const { setDoc } = await import("firebase/firestore");
        await setDoc(voteRef, { voteType, userId: user.uid });
      });

      const updated = await getDoc(resourceRef);
      const data = updated.data();
      const newScore = computeTrustScore(
        data.upvotes, data.downvotes,
        data.downloadCount, data.verificationStatus
      );
      await updateDoc(resourceRef, { trustScore: newScore });

      setUserVote(voteType);
      fetchResource();
    } catch (err) {
      console.error(err);
    }
    setVoting(false);
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await addDoc(collection(db, "resources", id, "comments"), {
        content: comment,
        authorUid: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        postedAt: serverTimestamp(),
      });
      setComment("");
      fetchComments();
    } catch (err) {
      console.error(err);
    }
    setPosting(false);
  };

  const handleFlag = async () => {
    if (!flagReason) return;
    setFlagging(true);
    try {
      await addDoc(collection(db, "flags"), {
        resourceId: id,
        reporterUid: user.uid,
        reason: flagReason,
        reportedAt: serverTimestamp(),
        status: "pending",
      });
      await updateDoc(doc(db, "resources", id), {
        flagCount: increment(1),
        verificationStatus: "flagged",
      });
      setShowFlagMenu(false);
      setFlagReason("");
      fetchResource();
    } catch (err) {
      console.error(err);
    }
    setFlagging(false);
  };

  const handleDownload = async () => {
    await updateDoc(doc(db, "resources", id), {
      downloadCount: increment(1),
    });
    const updated = await getDoc(doc(db, "resources", id));
    const data = updated.data();
    const newScore = computeTrustScore(
      data.upvotes, data.downvotes,
      data.downloadCount, data.verificationStatus
    );
    await updateDoc(doc(db, "resources", id), { trustScore: newScore });
    window.open(resource.fileURL, "_blank");
    fetchResource();
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!resource) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
      Resource not found.
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
        </div>
        <img src={user?.photoURL} alt="profile" className="w-8 h-8 rounded-full" />
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">

        {/* Back button */}
        <button
          onClick={() => navigate("/vault")}
          className="text-gray-400 hover:text-white text-sm mb-6 flex items-center gap-2"
        >
          ← Back to Vault
        </button>

        {/* Resource Header */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs bg-indigo-950 text-indigo-300 px-2 py-1 rounded-lg">{resource.courseCode}</span>
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-lg">{resource.resourceType}</span>
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-lg">{resource.level} Level</span>
                <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                  resource.verificationStatus === "verified" ? "bg-green-900 text-green-300" :
                  resource.verificationStatus === "flagged" ? "bg-red-900 text-red-300" :
                  "bg-gray-800 text-gray-400"
                }`}>
                  {resource.verificationStatus === "verified" ? "✓ Verified" :
                   resource.verificationStatus === "flagged" ? "⚑ Flagged" : "⏳ Pending"}
                </span>
              </div>
              <h1 className="text-2xl font-bold mb-2">{resource.title}</h1>
              {resource.description && (
                <p className="text-gray-400 text-sm mb-4">{resource.description}</p>
              )}
              <p className="text-gray-500 text-xs">
                Uploaded by <span className="text-gray-300">{resource.uploaderName}</span> · {resource.semester} {resource.academicYear} · {resource.fileSize} KB
              </p>
            </div>
          </div>

          {/* Trust Score Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Trust Score</span>
              <span className="text-xs text-indigo-400 font-bold">{(resource.trustScore || 0).toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((resource.trustScore || 0) * 10, 100)}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Upvote */}
            <button
              onClick={() => handleVote("up")}
              disabled={voting || userVote !== null}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                userVote === "up"
                  ? "bg-green-700 text-white"
                  : "bg-gray-800 hover:bg-green-900 text-gray-300 hover:text-green-300"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              ⬆ {resource.upvotes || 0}
            </button>

            {/* Downvote */}
            <button
              onClick={() => handleVote("down")}
              disabled={voting || userVote !== null}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                userVote === "down"
                  ? "bg-red-700 text-white"
                  : "bg-gray-800 hover:bg-red-900 text-gray-300 hover:text-red-300"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              ⬇ {resource.downvotes || 0}
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-6 py-2 rounded-lg transition-all"
            >
              ⬇ Download · {resource.downloadCount || 0}
            </button>

            {/* Flag */}
            <div className="relative ml-auto">
              <button
                onClick={() => setShowFlagMenu(!showFlagMenu)}
                className="bg-gray-800 hover:bg-red-900 text-gray-400 hover:text-red-300 text-sm px-4 py-2 rounded-lg transition-all"
              >
                ⚑ Flag
              </button>
              {showFlagMenu && (
                <div className="absolute right-0 top-10 bg-gray-800 border border-gray-700 rounded-xl p-4 z-10 w-64 shadow-xl">
                  <p className="text-sm font-semibold mb-3">Report this resource</p>
                  <select
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    className="w-full bg-gray-700 text-white text-sm px-3 py-2 rounded-lg mb-3 border border-gray-600"
                  >
                    <option value="">Select reason</option>
                    <option value="Inaccurate Content">Inaccurate Content</option>
                    <option value="Plagiarised Material">Plagiarised Material</option>
                    <option value="Inappropriate Content">Inappropriate Content</option>
                  </select>
                  <button
                    onClick={handleFlag}
                    disabled={flagging || !flagReason}
                    className="w-full bg-red-700 hover:bg-red-600 disabled:bg-gray-700 text-white text-sm font-semibold py-2 rounded-lg transition-all"
                  >
                    {flagging ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8">
          <h2 className="text-lg font-semibold mb-6">
            Comments <span className="text-gray-500 text-sm font-normal">({comments.length})</span>
          </h2>

          {/* Add Comment */}
          <div className="flex gap-3 mb-8">
            <img src={user?.photoURL} alt="you" className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
            <div className="flex-1">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment or academic note..."
                rows={3}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-indigo-500 resize-none text-sm"
              />
              <button
                onClick={handleComment}
                disabled={posting || !comment.trim()}
                className="mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all"
              >
                {posting ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </div>

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No comments yet — be the first!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <img src={c.authorPhoto} alt={c.authorName} className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 bg-gray-800 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">{c.authorName}</span>
                      <span className="text-xs text-gray-500">
                        {c.postedAt?.toDate?.()?.toLocaleDateString() || "Just now"}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
