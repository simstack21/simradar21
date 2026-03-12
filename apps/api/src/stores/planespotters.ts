import type { PlaneSpottersPhotos, StaticAircraftImg } from "@sr24/types/db";
import axios from "axios";

const TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry {
	imgs: StaticAircraftImg[];
	expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export async function getCachedImgs(reg: string): Promise<StaticAircraftImg[]> {
	const entry = cache.get(reg);

	if (!entry || Date.now() > entry.expiresAt) {
		cache.delete(reg);
		const imgs = await fetchPhotos(reg);
		setCachedImgs(reg, imgs);
		return imgs;
	}

	return entry.imgs;
}

export function setCachedImgs(reg: string, imgs: StaticAircraftImg[]): void {
	cache.set(reg, { imgs, expiresAt: Date.now() + TTL_MS });
}

async function fetchPhotos(reg: string): Promise<StaticAircraftImg[]> {
	const photos = await axios.get<PlaneSpottersPhotos>(`https://api.planespotters.net/pub/photos/reg/${reg}`).then((res) => res.data.photos);
	if (!photos || photos.length === 0) return [];

	const imgs: StaticAircraftImg[] = [];

	for (const photo of photos) {
		const thumbnail = photo.thumbnail_large || photo.thumbnail;
		if (!thumbnail) continue;

		imgs.push({
			id: photo.id,
			imgUrl: thumbnail.src,
			width: thumbnail.size.width,
			height: thumbnail.size.height,
			photographer: photo.photographer,
			link: photo.link,
		});
	}
	return imgs;
}
