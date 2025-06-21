const blockMap = new Map(); // key: ip+mac, value: { count, blockedUntil }

const MAX_ATTEMPTS = 10;
const BLOCK_TIME = 30 * 60 * 1000; // 30 minutes

module.exports = (req, res, next) => {
  const ip = req.ip;
  const mac = req.headers['x-mac'] || 'unknown';
  const key = ip + mac;
  const now = Date.now();

  let entry = blockMap.get(key) || { count: 0, blockedUntil: 0 };

  // Check if currently blocked
  if (now < entry.blockedUntil) {
    return res.status(403).json({ success: false, message: "You are temporarily blocked. Try again later." });
  }

  // Count this attempt
  entry.count++;

  // If too many attempts, block
  if (entry.count > MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_TIME;
    entry.count = 0; // reset count after blocking
    blockMap.set(key, entry);
    return res.status(403).json({ success: false, message: "Too many requests. You are blocked for 30 minutes." });
  }

  blockMap.set(key, entry);
  next();
};
