import { Router } from "express";
import { getActivity, clearActivity } from "../db/activityLog.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRoles } from "../middleware/rbac.js";

const router = Router();

const graph = {
  nodes: [
    { id: "users", label: "USER" },
    { id: "developers", label: "DEVELOPER" },
    { id: "publishers", label: "PUBLISHER" },
    { id: "games", label: "GAME" },
    { id: "purchases", label: "PURCHASE" },
    { id: "payments", label: "PAYMENT" },
    { id: "user_library", label: "USER_LIBRARY" },
    { id: "reviews", label: "REVIEW" },
    { id: "offers", label: "OFFER" },
  ],
  edges: [
    { from: "users", to: "purchases", label: "1:N" },
    { from: "games", to: "purchases", label: "1:N" },
    { from: "purchases", to: "payments", label: "1:1" },
    { from: "users", to: "user_library", label: "1:N" },
    { from: "games", to: "user_library", label: "1:N" },
    { from: "users", to: "reviews", label: "1:N" },
    { from: "games", to: "reviews", label: "1:N" },
    { from: "developers", to: "games", label: "1:N" },
    { from: "publishers", to: "games", label: "1:N" },
    { from: "games", to: "offers", label: "1:N" },
    { from: "developers", to: "users", label: "optional link" },
  ],
};

router.get("/activity", (_req, res) => {
  res.json({ entries: getActivity() });
});

router.get("/schema-graph", (_req, res) => {
  res.json(graph);
});

router.post("/clear", requireAuth, requireRoles("Admin"), (_req, res) => {
  clearActivity();
  res.json({ ok: true });
});

export default router;
