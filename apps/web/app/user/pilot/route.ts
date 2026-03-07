import type { NextRequest } from "next/server";
import { forward } from "@/lib/api";

export const PATCH = (req: NextRequest) => forward(req, "/pilot");
