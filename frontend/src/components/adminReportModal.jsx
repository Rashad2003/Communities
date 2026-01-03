import { useEffect, useState } from "react";
import API from "../api/api";
import socket from "../socket";

const AdminReportsModal = ({ onClose }) => {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchReports = () => {
      API.get("/reports").then(res => setReports(res.data));
    };

    fetchReports();

    socket.on("newReport", fetchReports);

    return () => socket.off("newReport", fetchReports);
  }, []);


  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[500px] p-4 rounded max-h-[80vh] overflow-y-auto">

        <h2 className="text-lg font-semibold mb-3">
          Reported Messages
        </h2>

        {reports.map(r => (
          <div key={r._id} className="border p-3 mb-2 rounded">
            <p className="text-sm mb-1">
              <b>Reason:</b> {r.reason}
            </p>
            <p className="text-sm">
              <b>Message:</b> {r.message ? r.message.content : "⚠️ Message deleted"}
            </p>
            <p className="text-sm mb-1">
              <b>ReportedUser:</b> {r.reportedUser.name}
            </p>
            <p className="text-sm mb-1">
              <b>ReportedBy:</b> {r.reportedBy.name}
            </p>
            <p className="text-sm mb-1">
              <b>Group:</b> {r.group.name}
            </p>

            <div className="flex gap-2 mt-2">
              <button onClick={async () => {
                await API.post(`/reports/${r._id}/warn`);
                setReports(prev => prev.filter(x => x._id !== r._id));
              }} className="bg-orange-500 text-white px-2 py-1 rounded">
                Warn Member
              </button>

              <button onClick={async () => {
                await API.delete(`/reports/${r._id}/user`);
                setReports(prev => prev.filter(x => x._id !== r._id));
              }} className="bg-red-600 text-white px-2 py-1 rounded">
                Remove Member
              </button>

              <button onClick={async () => {
                await API.delete(`/reports/${r._id}/message`);
                setReports(prev => prev.filter(x => x._id !== r._id));
              }} className="bg-gray-600 text-white px-2 py-1 rounded">
                Delete Message
              </button>
            </div>
          </div>
        ))}

        <div className="text-right mt-3">
          <button onClick={onClose}>Close</button>
        </div>

      </div>
    </div>
  );
};

export default AdminReportsModal;
