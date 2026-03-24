import type { Request, Response, NextFunction } from "express";
import { config } from "../config.js";

/**
 * Simple API key authentication middleware.
 * Checks for X-API-Key header matching ADMIN_API_KEY.
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== config.ADMIN_API_KEY) {
    res.status(401).json({ error: "Unauthorized — invalid or missing API key" });
    return;
  }

  next();
}
