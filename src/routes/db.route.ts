import { Router } from "express";
import { db } from "../lib/db";

const router = Router();

router.get("/db-check", async (_req, res) => {
  try {
    const result = await db.query("select now() as now");
    res.status(200).json({
      ok: true,
      time: result.rows[0]?.now,
    });
  } catch (error) {
    console.error("DB connection error:", error);
    res.status(500).json({
      ok: false,
      message: "db connection failed",
    });
  }
});

export default router;