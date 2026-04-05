import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET ?? "dev-only-change-me";

export function signToken(user) {
  const expiresIn = process.env.JWT_EXPIRES_IN ?? "24h";
  return jwt.sign(
    {
      sub: user.userId,
      role: user.role,
      developerId: user.developerId,
      publisherId: user.publisherId,
    },
    secret,
    { expiresIn }
  );
}

export function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  const token = h?.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const p = jwt.verify(token, secret);
    req.user = {
      userId: Number(p.sub ?? 0),
      role: p.role,
      developerId: p.developerId ?? null,
      publisherId: p.publisherId ?? null,
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function optionalAuth(req, _res, next) {
  const h = req.headers.authorization;
  const token = h?.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return next();
  try {
    const p = jwt.verify(token, secret);
    req.user = {
      userId: Number(p.sub ?? 0),
      role: p.role,
      developerId: p.developerId ?? null,
      publisherId: p.publisherId ?? null,
    };
  } catch {
    /* ignore */
  }
  next();
}
