import { useEffect, useState } from "react";
import API from "../api/api";
import { getUser } from "../utils/auth";
import { TfiAnnouncement } from "react-icons/tfi";
import { FaUserGroup } from "react-icons/fa6";
import { MdGroupAdd } from "react-icons/md";
import { BsThreeDotsVertical } from "react-icons/bs";
import socket from "../socket.js";
import AdminReportsModal from "./adminReportModal.jsx";

const Sidebar = ({ groups, setGroups, activeGroup, setActiveGroup, notifications, setNotifications }) => {
  const user = getUser();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showMemberMenu, setShowMemberMenu] = useState(false);
const [showNotifications, setShowNotifications] = useState(false);
const [showReportsModal, setShowReportsModal] = useState(false);


useEffect(() => {
  if (!user?._id) return;

  if (socket.connected) {
    socket.emit("joinUser", user._id);
    console.log("👤 joinUser emitted:", user._id);
  } else {
    socket.on("connect", () => {
      socket.emit("joinUser", user._id);
      console.log("👤 joinUser emitted after connect:", user._id);
    });
  }
}, [user]);

useEffect(() => {
  const stored = JSON.parse(localStorage.getItem("notifications")) || [];

  const now = Date.now();
  const valid = stored.filter(
    n => now - n.createdAt < 24 * 60 * 60 * 1000
  );

  setNotifications(valid);
  localStorage.setItem("notifications", JSON.stringify(valid));
}, []);

useEffect(() => {
  const interval = setInterval(() => {
    setNotifications(prev => {
      const now = Date.now();
      const valid = prev.filter(
        n => now - n.createdAt < 24 * 60 * 60 * 1000
      );
      localStorage.setItem("notifications", JSON.stringify(valid));
      return valid;
    });
  }, 60 * 1000); // every 1 minute

  return () => clearInterval(interval);
}, []);

useEffect(() => {
  socket.on("kickedNotification", data => {
    console.log("🔔 RECEIVED:", data);
    const newNotification = {
      id: Date.now(),
      message: data.message,
      createdAt: Date.now()
    };

    setNotifications(prev => {
      console.log("📦 ADDING TO STATE");
      const updated = [newNotification, ...prev];
      localStorage.setItem("notifications", JSON.stringify(updated));
      return updated;
    });
  });

  return () => socket.off("kickedNotification");
}, []);

  /* ---------- HELPERS (IMPORTANT) ---------- */
  const isCommunityAdmin = groups.some(
    g =>
      g.isAnnouncement &&
      g.admins.some(admin => admin._id === user._id)
  );

  const isMember = group =>
    group.members.some(m => m._id === user._id);

  const isPending = group =>
    group.pendingRequests.some(p => String(p._id) === String(user._id));

  /* ---------- ORDER GROUPS ---------- */
  const orderedGroups = [
    ...groups.filter(g => g.isAnnouncement),
    ...groups.filter(g => !g.isAnnouncement)
  ];

  useEffect(() => {
  socket.on("newReport", () => {
    console.log("🚩 New report received");
  });

  return () => socket.off("newReport");
}, []);


  return (
    <div className="w-100 md:w-96 bg-white border-r h-full flex flex-col">

      {/* HEADER */}
      <div className="bg-primary text-white p-4 flex justify-between items-center">
        <span className="text-lg font-semibold">LMS Community</span>

        {!isCommunityAdmin && (
  <div className="relative">
    <button onClick={() => setShowMemberMenu(p => !p)}>
      <BsThreeDotsVertical />
    </button>

    {showMemberMenu && (
      <div className="absolute right-0 mt-2 bg-white text-black border rounded shadow w-48 z-50">
        <button
          onClick={() => {
            setShowNotifications(true);
            setShowMemberMenu(false);
          }}
          className="w-full text-left px-4 py-2 hover:bg-gray-100"
        >
          🔔 Notifications - {notifications.length}
        </button>
      </div>
    )}
  </div>
)}

{showNotifications && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white w-96 max-h-[80vh] rounded-lg p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold mb-3 text-black">
        Notifications
      </h2>
      <button
  onClick={() => setNotifications([])}
  className="text-sm text-red-500"
>
  Clear All
</button>

      </div>

      {notifications.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No notifications
        </p>
      ) : (
        notifications.map(n => (
          <div
            key={n.id}
            className={`mb-2 p-3 rounded text-sm ${
              n.type === "approved"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {n.message}
          </div>
        ))
      )}

      <div className="text-right mt-4">
        <button
          onClick={() => setShowNotifications(false)}
          className="text-gray-600"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

        {isCommunityAdmin && (
          <div className="relative">
            <button onClick={() => setShowAdminMenu(p => !p)}>
              <BsThreeDotsVertical />
            </button>

            {showAdminMenu && (
              <div className="absolute right-0 mt-2 bg-white text-black border rounded shadow w-48 z-50">
                <button
                  onClick={() => {
                    setShowRequestsModal(true);
                    setShowAdminMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  👥 Requests to Join
                </button>
                <button
                  onClick={() => {
                    setShowReportsModal(true);
                    setShowAdminMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  🚩 Reports

                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* GROUP LIST */}
      <div className="overflow-y-auto flex-1 bg-primary text-white">
        {orderedGroups.map(group => {
          const canAccess =
            group.isAnnouncement ||
            isCommunityAdmin ||
            isMember(group);

          return (
            <div key={group._id}>

              {/* GROUP ROW */}
              <div
                onClick={() => {
                  if (canAccess) setActiveGroup(group);
                }}
                className={`p-4 flex flex-col
                  ${canAccess ? "cursor-pointer" : "cursor-not-allowed opacity-70"}
                  ${activeGroup?._id === group._id ? "bg-gray-200 text-black" : "hover:bg-gray-100 hover:text-black"}
                `}
              >
                <div className="flex gap-3 items-center text-lg font-semibold">
                  {group.isAnnouncement ? (
                    <TfiAnnouncement className="border rounded-full w-10 h-10 p-1.5" />
                  ) : (
                    <FaUserGroup />
                  )}
                  {group.name}
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">Tap to open chat</p>
                   {/* JOIN BUTTON */}
                {!group.isAnnouncement &&
                  !isCommunityAdmin &&
                  !isMember(group) &&
                  !isPending(group) && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedGroup(group);
                        setShowJoinModal(true);
                      }}
                      className="text-sm text-red-400 mt-1 border px-2 py-1 rounded hover:bg-blue-100"
                    >
                      Join
                    </button>
                  )}

                {/* PENDING */}
                {!group.isAnnouncement &&
                  !isCommunityAdmin &&
                  isPending(group) && (
                    <span className="text-sm text-orange-400 mt-1 border px-2 py-1 rounded hover:bg-blue-100">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {/* CREATE GROUP */}
              {group.isAnnouncement && isCommunityAdmin && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full text-left px-4 py-3 flex gap-3 items-center hover:bg-gray-100 hover:text-black"
                >
                  <MdGroupAdd className="border rounded-full w-10 h-10 p-1" />
                  New Group
                </button>
              )}
            </div>
          );
        })}
      </div>
      {showCreateModal && ( <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"> <div className="bg-white w-80 p-5 rounded-lg"> <h2 className="text-lg font-semibold mb-4">Create New Group</h2> <input type="text" placeholder="Group name" className="w-full border p-2 rounded mb-4" value={groupName} onChange={e => setGroupName(e.target.value)} /> <div className="flex justify-end gap-2"> <button onClick={() => { setShowCreateModal(false); setGroupName(""); }} className="px-4 py-2 text-gray-600" > Cancel </button> <button onClick={async () => { if (!groupName.trim()) return; const res = await API.post("/groups", { name: groupName }); setActiveGroup(res.data); setGroupName(""); setShowCreateModal(false); }} className="px-4 py-2 bg-secondary text-white rounded" > Create </button> </div> </div> </div> )}

      {/* JOIN MODAL */}
      {showJoinModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-80 p-5 rounded-lg">
            <h3 className="mb-4">
              Do you want to join{" "}
              <b>{selectedGroup.name}</b>?
            </h3>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowJoinModal(false)}>
                Cancel
              </button>

              <button
                onClick={async () => {
                  await API.post(
                    `/groups/${selectedGroup._id}/request`
                  );
                  setShowJoinModal(false);
                }}
                className="bg-secondary text-white px-3 py-1 rounded"
              >
                Request to Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN REQUESTS MODAL */}
      {showRequestsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-96 max-h-[80vh] rounded-lg p-4 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-3 text-center">
              Join Requests
            </h2>

            {groups
              .filter(g => g.pendingRequests.length > 0)
              .map(group => (
                <div key={group._id} className="mb-4">

                  {group.pendingRequests.map(user => (
                    <div
                      key={user._id}
                      className="flex justify-between flex-col items-center mb-2 border p-2 rounded text-center"
                    >
                      <span className="mb-2">
                        <b>{user.name}</b> wants to join{" "}
                        <b>💬 {group.name}</b> Group
                      </span>

                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            await API.post(
                              `/groups/${group._id}/approve`,
                              { userId: user._id }
                            );
                            setShowRequestsModal(false);
                          }}
                          className="bg-green-600 text-white px-3 py-1 rounded"
                        >
                          Approve
                        </button>

                        <button
                          onClick={async () => {
                            await API.post(
                              `/groups/${group._id}/reject`,
                              { userId: user._id }
                            );
                            setShowRequestsModal(false);
                          }}
                          className="bg-red-600 text-white px-3 py-1 rounded"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

            <div className="text-right mt-4">
              <button
                onClick={() => setShowRequestsModal(false)}
                className="text-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportsModal && (
        <AdminReportsModal onClose={() => setShowReportsModal(false)} />
      )}
    </div>
  );
};

export default Sidebar;
