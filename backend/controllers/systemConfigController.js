const SystemConfig = require("../models/SystemConfig");

const respond = (res, status, message, data = null) =>
  res.status(status).json({ success: status < 400, message, data, error: status >= 400 ? message : null });

const DEFAULTS = {
  company:   { name: "NetPair InfoTech", email: "admin@netpair.com", phone: "", address: "", website: "https://netpair.com" },
  workHours: { start: "09:00", end: "18:00", lateThreshold: "09:30", workDays: ["Mon","Tue","Wed","Thu","Fri"] },
  leaveConfig: { annual: 12, sick: 8, casual: 6, carryForward: true },
  smtp:      { host: "smtp.gmail.com", port: "587", user: "", secure: true },
};

exports.getAll = async (req, res) => {
  try {
    const docs = await SystemConfig.find({});
    const config = { ...DEFAULTS };
    docs.forEach(d => { config[d.key] = d.value; });
    respond(res, 200, "Config fetched", config);
  } catch (err) { respond(res, 500, err.message); }
};

exports.update = async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) return respond(res, 400, "key and value are required");
    const doc = await SystemConfig.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true }
    );
    respond(res, 200, "Config saved", doc);
  } catch (err) { respond(res, 500, err.message); }
};
