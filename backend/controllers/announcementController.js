const Announcement = require("../models/Announcement");
const { ROLES, ROLE_HIERARCHY, ANNOUNCEMENT_CREATORS } = require("../constants/roles");

const respond = (res, status, message, data = null) =>
  res.status(status).json({ success: status < 400, message, data, error: status >= 400 ? message : null });

const allowedTargetsFor = (role) => ROLE_HIERARCHY[role] ?? [];

const validateTargetRoles = (creatorRole, targetRoles) => {
  const allowed = allowedTargetsFor(creatorRole);
  return targetRoles.every((r) => allowed.includes(r));
};

// GET /api/v1/announcements
// Returns only announcements targeted at the user's role, not deleted, not expired
exports.getAll = async (req, res) => {
  try {
    const { role, _id: userId } = req.user;
    const page   = Math.max(1, parseInt(req.query.page  || "1"));
    const limit  = Math.min(50, parseInt(req.query.limit || "12"));
    const search = req.query.search || "";
    const skip   = (page - 1) * limit;

    const filter = {
      isDeleted:   false,
      targetRoles: role,
      publishedAt: { $lte: new Date() },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    };

    if (search) {
      filter.$and = [
        { $or: [
          { title:   { $regex: search, $options: "i" } },
          { message: { $regex: search, $options: "i" } },
        ]},
      ];
    }

    const [total, docs] = await Promise.all([
      Announcement.countDocuments(filter),
      Announcement.find(filter)
        .populate("createdBy", "firstName lastName role")
        .sort({ pinned: -1, publishedAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    const data = docs.map(a => ({
      _id:            a._id,
      id:             a._id,
      title:          a.title,
      message:        a.message,
      category:       a.category,
      targetRoles:    a.targetRoles,
      target_roles:   a.targetRoles,
      is_pinned:      a.pinned,
      pinned:         a.pinned,
      publishedAt:    a.publishedAt,
      published_at:   a.publishedAt,
      expiresAt:      a.expiresAt,
      expires_at:     a.expiresAt,
      createdAt:      a.createdAt,
      created_at:     a.createdAt,
      created_by_name: a.createdBy ? `${a.createdBy.firstName} ${a.createdBy.lastName}`.trim() : "Unknown",
      created_by_role: a.createdBy?.role || "",
      is_read:        a.readBy?.some(id => id.toString() === userId.toString()) ?? false,
    }));

    respond(res, 200, "Announcements fetched", {
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) { respond(res, 500, err.message); }
};

// GET /api/v1/announcements/allowed-targets
exports.getAllowedTargets = (req, res) => {
  const targets = allowedTargetsFor(req.user.role);
  respond(res, 200, "Allowed targets", targets);
};

// POST /api/v1/announcements
exports.create = async (req, res) => {
  try {
    const { role: creatorRole, _id: creatorId } = req.user;
    const { title, message, target_roles, targetRoles, category, is_pinned, pinned, expires_at, expiresAt, published_at } = req.body;

    const roles = target_roles || targetRoles || [];
    if (!title?.trim())    return respond(res, 400, "Title is required");
    if (!message?.trim())  return respond(res, 400, "Message is required");
    if (roles.length === 0) return respond(res, 400, "At least one target role is required");

    if (allowedTargetsFor(creatorRole).length === 0)
      return respond(res, 403, "Employees cannot create announcements");

    if (!validateTargetRoles(creatorRole, roles))
      return respond(res, 403, `You can only target: ${allowedTargetsFor(creatorRole).join(", ")}`);

    const doc = await Announcement.create({
      title:       title.trim(),
      message:     message.trim(),
      category:    category || "General",
      targetRoles: roles,
      pinned:      is_pinned ?? pinned ?? false,
      publishedAt: published_at ? new Date(published_at) : new Date(),
      expiresAt:   expires_at || expiresAt || null,
      createdBy:   creatorId,
    });

    await doc.populate("createdBy", "firstName lastName role");
    respond(res, 201, "Announcement created", doc);
  } catch (err) { respond(res, 500, err.message); }
};

// PATCH /api/v1/announcements/:id
exports.update = async (req, res) => {
  try {
    const { role: editorRole, _id: editorId } = req.user;
    const doc = await Announcement.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return respond(res, 404, "Not found");

    if (doc.createdBy.toString() !== editorId.toString() && editorRole !== ROLES.SUPER_ADMIN)
      return respond(res, 403, "Not authorised to edit this announcement");

    const { title, message, target_roles, targetRoles, category, is_pinned, pinned, expires_at, expiresAt } = req.body;
    const roles = target_roles || targetRoles;

    if (roles && !validateTargetRoles(editorRole, roles))
      return respond(res, 403, `Invalid target roles for your permission level`);

    if (title)    doc.title    = title.trim();
    if (message)  doc.message  = message.trim();
    if (category) doc.category = category;
    if (roles)    doc.targetRoles = roles;
    if (is_pinned !== undefined) doc.pinned = is_pinned;
    if (pinned    !== undefined) doc.pinned = pinned;
    if (expires_at !== undefined) doc.expiresAt = expires_at || null;
    if (expiresAt  !== undefined) doc.expiresAt = expiresAt  || null;

    await doc.save();
    respond(res, 200, "Updated", doc);
  } catch (err) { respond(res, 500, err.message); }
};

// DELETE /api/v1/announcements/:id  (soft delete)
exports.remove = async (req, res) => {
  try {
    const { role, _id: userId } = req.user;
    const doc = await Announcement.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return respond(res, 404, "Not found");

    if (doc.createdBy.toString() !== userId.toString() && role !== ROLES.SUPER_ADMIN)
      return respond(res, 403, "Not authorised to delete this announcement");

    doc.isDeleted = true;
    doc.deletedBy = userId;
    doc.deletedAt = new Date();
    await doc.save();
    respond(res, 200, "Deleted");
  } catch (err) { respond(res, 500, err.message); }
};

// POST /api/v1/announcements/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const { _id: userId } = req.user;
    await Announcement.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readBy: userId } }
    );
    respond(res, 200, "Marked as read");
  } catch (err) { respond(res, 500, err.message); }
};
