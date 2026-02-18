import type { NextRequest } from "next/server";
import { forward } from "@/lib/api";

export const GET = (req: NextRequest) => forward(req, "/data");
