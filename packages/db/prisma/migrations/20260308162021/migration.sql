-- CreateEnum
CREATE TYPE "PilotLiveStatus" AS ENUM ('pre', 'live', 'off');

-- CreateTable
CREATE TABLE "Pilot" (
    "id" CHAR(16) NOT NULL,
    "cid" TEXT NOT NULL,
    "callsign" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "altitude_agl" INTEGER NOT NULL,
    "altitude_ms" INTEGER NOT NULL,
    "groundspeed" INTEGER NOT NULL,
    "vertical_speed" INTEGER NOT NULL,
    "heading" INTEGER NOT NULL,
    "aircraft" TEXT NOT NULL,
    "transponder" CHAR(4) NOT NULL,
    "frequency" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "server" TEXT NOT NULL,
    "pilot_rating" TEXT NOT NULL,
    "military_rating" TEXT NOT NULL,
    "qnh_i_hg" DOUBLE PRECISION NOT NULL,
    "qnh_mb" DOUBLE PRECISION NOT NULL,
    "flight_plan" JSONB,
    "times" JSONB,
    "overrides" JSONB,
    "logon_time" TIMESTAMP(3) NOT NULL,
    "last_update" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "live" "PilotLiveStatus" NOT NULL DEFAULT 'off',
    "sched_off_block" TIMESTAMP(3),
    "sched_on_block" TIMESTAMP(3),
    "dep_icao" TEXT,
    "arr_icao" TEXT,
    "ac_reg" TEXT,

    CONSTRAINT "Pilot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trackpoint" (
    "id" CHAR(16) NOT NULL,
    "points" BYTEA NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trackpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "hasNavigraph" BOOLEAN NOT NULL DEFAULT false,
    "navigraphToken" JSONB,
    "navigraphSubscription" JSONB,
    "settings" JSONB,
    "filters" JSONB,
    "bookmarks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pilots_live_last_idx" ON "Pilot"("live", "last_update");

-- CreateIndex
CREATE INDEX "pilots_callsign_sched_idx" ON "Pilot"("callsign", "sched_off_block", "id");

-- CreateIndex
CREATE INDEX "pilots_acreg_sched_idx" ON "Pilot"("ac_reg", "sched_off_block", "id");

-- CreateIndex
CREATE INDEX "pilots_dep_idx" ON "Pilot"("dep_icao", "sched_off_block", "id");

-- CreateIndex
CREATE INDEX "pilots_arr_idx" ON "Pilot"("arr_icao", "sched_on_block", "id");

-- AddForeignKey
ALTER TABLE "Trackpoint" ADD CONSTRAINT "Trackpoint_id_fkey" FOREIGN KEY ("id") REFERENCES "Pilot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
