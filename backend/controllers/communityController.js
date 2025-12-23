import communityModel from "../models/communityModel.js";
import groupModel from "../models/groupModel.js";

export const createCommunity = async (req, res) => {

  // Auto create Announcement group
  const community = await groupModel.create({
    name: "Announcements",
    isAnnouncement: true,
    admins: [req.user.id],
    members: [req.user.id]
  });

  res.json(community);
}

export const getCommunity = async (req, res) => {
    const community = await communityModel.findOne();
  if (!community) return res.status(404).json({ message: "No community" });

  const isMember = community.members
    .map(id => id.toString())
    .includes(req.user.id);

  if (!isMember) {
    return res.status(403).json({ message: "Join community first" });
  }

  res.json(community);
}