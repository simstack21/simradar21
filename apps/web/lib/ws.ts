import type { WsDelta } from "@sr24/types/interface";
import { inflate } from "pako";

const WS_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:3002";

const RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const MAX_RECONNECT_ATTEMPTS = 10;
const STALE_THRESHOLD_MS = 45_000;

export type WsMessage = WsData | WsPresence | WsStatus;

type WsPresence = {
	t: "presence";
	c: number;
};
type WsData = {
	t: "delta";
	s: number;
	c: number;
	data: WsDelta;
};
type WsStatus = {
	t: "status";
	status: boolean;
};

type Listener = (msg: WsData | WsPresence | WsStatus) => void;

interface WsClientConfig {
	autoReconnect?: boolean;
	reconnectDelay?: number;
	maxReconnectAttempts?: number;
}

class WsClient {
	private ws: WebSocket | null = null;
	private listeners: Set<Listener> = new Set();
	private reconnectAttempts = 0;
	private reconnectTimeout: NodeJS.Timeout | null = null;
	private heartbeatTimeout: NodeJS.Timeout | null = null;
	private messageBuffer: (WsData | WsPresence | WsStatus)[] = [];
	private config: Required<WsClientConfig>;
	private isConnecting = false;

	private revalidateFn: (() => Promise<void>) | null = null;
	private revalidating = false;
	private lastSeq: number | null = null;
	private lastDeltaTime = 0;

	constructor(config: WsClientConfig = {}) {
		this.config = {
			autoReconnect: config.autoReconnect ?? true,
			reconnectDelay: config.reconnectDelay ?? RECONNECT_DELAY,
			maxReconnectAttempts: config.maxReconnectAttempts ?? MAX_RECONNECT_ATTEMPTS,
		};

		this.connect();

		if (typeof document !== "undefined") {
			document.addEventListener("visibilitychange", () => {
				if (document.visibilityState !== "visible") return;

				if (!this.isConnected() && !this.isConnecting) {
					console.log("Page became visible, reconnecting WebSocket...");
					this.reconnectAttempts = 0;
					this.connect();
				} else if (this.isConnected() && Date.now() - this.lastDeltaTime > STALE_THRESHOLD_MS) {
					console.log("Tab returned after >45s without delta, refetching snapshot...");
					this.broadcastStatus(false);
					this.revalidate();
				}
			});
		}
	}

	public setRevalidateFunction(fn: () => Promise<void>): void {
		this.revalidateFn = fn;
	}

	private async revalidate(): Promise<void> {
		if (this.revalidating) return;
		this.revalidating = true;

		try {
			if (this.revalidateFn) {
				await this.revalidateFn();
			}

			this.lastSeq = null;
			this.lastDeltaTime = Date.now();
			this.broadcastStatus(true);
		} catch (err) {
			console.error("Failed to fetch snapshot:", err);
		} finally {
			this.revalidating = false;
		}
	}

	private broadcastStatus(status: boolean): void {
		this.broadcastToListeners({ t: "status", status });
	}

	private broadcastToListeners(msg: WsData | WsPresence | WsStatus): void {
		this.listeners.forEach((listener) => {
			try {
				listener(msg);
			} catch (err) {
				console.error("Error in listener:", err);
			}
		});
	}

	private connect(): void {
		if (this.isConnecting) {
			console.warn("Connection already in progress");
			return;
		}

		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			console.warn("Already connected");
			return;
		}

		try {
			this.isConnecting = true;
			this.ws = new WebSocket(WS_URL);
			this.ws.binaryType = "arraybuffer";

			this.ws.onopen = () => this.handleOpen();
			this.ws.onerror = (err) => this.handleError(err);
			this.ws.onclose = () => this.handleClose();
			this.ws.onmessage = (e) => this.handleMessage(e);
		} catch (err) {
			console.error("Failed to create WebSocket:", err);
			this.isConnecting = false;
			this.scheduleReconnect();
		}
	}

	private handleOpen(): void {
		console.log("✅ WebSocket connected");
		this.isConnecting = false;
		this.reconnectAttempts = 0;
		this.startHeartbeat();
		this.flushMessageBuffer();

		if (this.lastDeltaTime === 0) {
			// No delta ever received — wait for first incoming delta to set status true
		} else if (Date.now() - this.lastDeltaTime > STALE_THRESHOLD_MS) {
			this.revalidate();
		} else {
			this.broadcastStatus(true);
		}
	}

	private handleError(err: Event): void {
		console.error("❌ WebSocket error:", err);
		this.isConnecting = false;
	}

	private handleClose(): void {
		console.log("WebSocket disconnected");
		this.isConnecting = false;
		this.stopHeartbeat();
		this.broadcastStatus(false);
		if (this.config.autoReconnect) {
			this.scheduleReconnect();
		}
	}

	private handleMessage(event: MessageEvent) {
		try {
			const buffer = new Uint8Array(event.data);
			const decompressed = inflate(buffer, { to: "string", raw: true });
			const msg: WsData | WsPresence = JSON.parse(decompressed);

			if (msg.t === "delta") {
				if (this.revalidating) return;

				this.lastDeltaTime = Date.now();
				const prevSeq = this.lastSeq;
				this.lastSeq = msg.s;

				if (prevSeq !== null && msg.s !== (prevSeq + 1) % Number.MAX_SAFE_INTEGER) {
					console.warn(`Missed WS seq: ${prevSeq} → ${msg.s}. Refetching snapshot.`);
					this.revalidate();
					return;
				}

				this.broadcastStatus(true);
			}

			this.broadcastToListeners(msg);
			this.resetHeartbeatTimeout();
		} catch (err) {
			console.error("Failed to parse/decompress message:", err);
		}
	}

	private scheduleReconnect(): void {
		if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
			console.error(`❌ Max reconnection attempts reached (${this.config.maxReconnectAttempts}). Stopping reconnection.`);
			return;
		}

		this.reconnectAttempts++;

		const delay = Math.min(this.config.reconnectDelay * 2 ** (this.reconnectAttempts - 1), MAX_RECONNECT_DELAY);
		const jitter = delay * 0.1 * Math.random();
		const totalDelay = delay + jitter;

		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
		}

		this.reconnectTimeout = setTimeout(() => {
			this.connect();
		}, totalDelay);
	}

	private startHeartbeat(): void {
		this.resetHeartbeatTimeout();
	}

	private resetHeartbeatTimeout(): void {
		if (this.heartbeatTimeout) {
			clearTimeout(this.heartbeatTimeout);
		}

		this.heartbeatTimeout = setTimeout(() => {
			if (this.isConnected()) {
				console.warn("⚠️  No messages received in 60 seconds, reconnecting...");
				this.broadcastStatus(false);
				this.disconnect();
				this.scheduleReconnect();
			}
		}, STALE_THRESHOLD_MS);
	}

	private stopHeartbeat(): void {
		if (this.heartbeatTimeout) {
			clearTimeout(this.heartbeatTimeout);
			this.heartbeatTimeout = null;
		}
	}

	private flushMessageBuffer(): void {
		if (this.messageBuffer.length > 0) {
			this.messageBuffer = [];
		}
	}

	public isConnected(): boolean {
		return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
	}

	public addListener(listener: Listener): void {
		this.listeners.add(listener);
	}

	public removeListener(listener: Listener): void {
		this.listeners.delete(listener);
	}

	public disconnect(): void {
		this.isConnecting = false;
		this.stopHeartbeat();

		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}

		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
	}

	public reconnect(): void {
		this.reconnectAttempts = 0;
		this.disconnect();
		this.connect();
	}

	public requestLatestData(): void {
		if (!this.isConnected()) {
			console.warn("Cannot request latest data: WebSocket not connected");
			return;
		}

		try {
			this.ws?.send(JSON.stringify({ type: "request-latest" }));
		} catch (err) {
			console.error("Failed to request latest data:", err);
		}
	}
}

export const wsClient = new WsClient({
	autoReconnect: true,
	reconnectDelay: RECONNECT_DELAY,
	maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
});
