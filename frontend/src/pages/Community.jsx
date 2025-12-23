import { useEffect, useState } from "react";
import API from "../api/api";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import socket from "../socket";
import { getUser } from "../utils/auth";

const Community = () => {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const user = getUser();

const communityAdmin =
  groups.find(g => g.isAnnouncement)?.admins || [];

  useEffect(() => {
  const fetchGroups = async () => {
    const res = await API.get("/groups");
    const groupsData = res.data || [];

    setGroups(groupsData);

    // 🔥 ALWAYS OPEN ANNOUNCEMENT GROUP
    const announcementGroup = groupsData.find(
      g => g.isAnnouncement
    );

    if (announcementGroup) {
      setActiveGroup(announcementGroup);
    }
  };

  fetchGroups();
}, []);

useEffect(() => {
  const handleGroupDeleted = ({ groupId }) => {
    // 1️⃣ Remove group from list
    setGroups(prev => prev.filter(g => g._id !== groupId));

    // 2️⃣ If current group deleted → go to announcement
    setActiveGroup(prev => {
      if (!prev || prev._id !== groupId) return prev;

      return (
        groups.find(g => g.isAnnouncement) || null
      );
    });
  };

  socket.on("groupDeleted", handleGroupDeleted);

  return () => {
    socket.off("groupDeleted", handleGroupDeleted);
  };
}, [groups]);

useEffect(() => {
  socket.on("joinRequested", ({ groupId, userId }) => {
    setGroups(prev =>
      prev.map(g =>
        g._id === groupId
          ? {
              ...g,
              pendingRequests: [...g.pendingRequests, {
                _id: userId
              }]
            }
          : g
      )
    );
  });

  return () => socket.off("joinRequested");
}, []);

useEffect(() => {
  socket.on("requestApproved", ({ groupId, userId }) => {
    setGroups(prev =>
      prev.map(g =>
        g._id === groupId
          ? {
              ...g,
              members: [...g.members, { _id: userId }],
              pendingRequests: g.pendingRequests.filter(
                p => p._id !== userId
              )
            }
          : g
      )
    );
  });

  return () => socket.off("requestApproved");
}, []);


useEffect(() => {
  socket.on("requestRejected", ({ groupId, userId }) => {
    setGroups(prev =>
      prev.map(g =>
        g._id === groupId
          ? {
              ...g,
              pendingRequests: g.pendingRequests.filter(
                p => p._id !== userId
              )
            }
          : g
      )
    );
  });

  return () => socket.off("requestRejected");
}, []);

useEffect(() => {
  socket.on("requestApproved", ({ userId, groupName }) => {
    if (userId === user._id) {
      setNotifications(prev => [
        {
          id: Date.now(),
          message: `Your request to join "${groupName}" was approved`,
          type: "approved"
        },
        ...prev
      ]);
    }
  });

  socket.on("requestRejected", ({ userId, groupName }) => {
    if (userId === user._id) {
      setNotifications(prev => [
        {
          id: Date.now(),
          message: `Your request to join "${groupName}" was rejected`,
          type: "rejected"
        },
        ...prev
      ]);
    }
  });

  return () => {
    socket.off("requestApproved");
    socket.off("requestRejected");
  };
}, []);


useEffect(() => {
  socket.on("groupCreated", newGroup => {
    setGroups(prev => {
      // avoid duplicates
      if (prev.some(g => g._id === newGroup._id)) return prev;
      return [...prev, newGroup];
    });
  });

  return () => socket.off("groupCreated");
}, []);




    const requestJoin = async (groupId) => {
    await API.post(`/groups/${groupId}/request`);
    alert("Request sent");
  };
  
  return (
    <div className="h-screen flex">
      <Sidebar
        groups={groups}
        setGroups={setGroups}
        activeGroup={activeGroup}
        setActiveGroup={setActiveGroup}
          notifications={notifications}
  setNotifications={setNotifications}
      />

      {activeGroup && (
        <ChatWindow group={activeGroup} setActiveGroup={setActiveGroup} setGroups={setGroups} communityAdmins={communityAdmin} />
      )}
    </div>
  );
};

export default Community;
