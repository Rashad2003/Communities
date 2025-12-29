import { useState } from "react";
import API from "../api/api";

const ReportModal = ({ message, onClose }) => {
  const [reason, setReason] = useState("abuse");

  const submitReport = async () => {
    await API.post("/reports", {
      messageId: message._id,
      reason
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 text-black">
      <div className="bg-white w-80 p-4 rounded">
        <h2 className="text-lg font-semibold mb-3">
          Report Message
        </h2>

        <select
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="w-full border p-2 rounded mb-3"
        >
          <option value="abuse">Abuse</option>
          <option value="spam">Spam</option>
          <option value="inappropriate">Inappropriate</option>
          <option value="harassment">Harassment</option>
          <option value="other">Other</option>
        </select>

        <div className="flex justify-between gap-2">
          <button className="bg-gray-300 px-3 py-1 rounded" onClick={onClose}>Cancel</button>
          <button
            onClick={submitReport}
            className="bg-red-600 text-white px-3 py-1 rounded"
          >
            Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
