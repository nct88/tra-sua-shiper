"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { apiGet, apiSend } from "@/lib/client";

type CallState = "idle" | "calling" | "ringing" | "connected";
type Signal = { type: string; payload: any; fromId: string };

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function CallPanel({
  orderId,
}: {
  orderId: string;
}) {
  const [state, setState] = useState<CallState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [err, setErr] = useState("");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const offerRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const stateRef = useRef<CallState>("idle");

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const post = useCallback(
    (type: string, payload?: any) =>
      apiSend(`/api/orders/${orderId}/call`, "POST", { type, payload }).catch(
        () => {}
      ),
    [orderId]
  );

  const cleanup = useCallback(() => {
    pcRef.current?.getSenders().forEach((s) => s.track?.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localRef.current?.getTracks().forEach((t) => t.stop());
    localRef.current = null;
    offerRef.current = null;
    pendingIce.current = [];
    setMuted(false);
    setSeconds(0);
    setState("idle");
  }, []);

  const buildPeer = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localRef.current = stream;
    const pc = new RTCPeerConnection(ICE_SERVERS);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pc.onicecandidate = (e) => {
      if (e.candidate) post("ice", e.candidate.toJSON());
    };
    pc.ontrack = (e) => {
      if (audioRef.current) {
        audioRef.current.srcObject = e.streams[0];
        audioRef.current.play().catch(() => {});
      }
    };
    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if (st === "connected") setState("connected");
      if (st === "failed" || st === "disconnected" || st === "closed") {
        if (stateRef.current !== "idle") cleanup();
      }
    };
    pcRef.current = pc;
    return pc;
  }, [post, cleanup]);

  const flushIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    for (const c of pendingIce.current) {
      try {
        await pc.addIceCandidate(c);
      } catch {}
    }
    pendingIce.current = [];
  }, []);

  // Bắt đầu gọi
  async function startCall() {
    setErr("");
    try {
      const pc = await buildPeer();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await post("offer", offer);
      setState("calling");
    } catch (e: any) {
      setErr("Không truy cập được micro: " + e.message);
      cleanup();
    }
  }

  // Nghe máy
  async function accept() {
    setErr("");
    if (!offerRef.current) return;
    try {
      const pc = await buildPeer();
      await pc.setRemoteDescription(offerRef.current);
      await flushIce();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await post("answer", answer);
      setState("connected");
    } catch (e: any) {
      setErr("Không thể kết nối: " + e.message);
      cleanup();
    }
  }

  function reject() {
    post("reject");
    cleanup();
  }

  function hangup() {
    post("hangup");
    cleanup();
  }

  function toggleMute() {
    const track = localRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMuted(!track.enabled);
    }
  }

  // Xử lý tín hiệu đến
  const handleSignal = useCallback(
    async (sig: Signal) => {
      const pc = pcRef.current;
      switch (sig.type) {
        case "offer":
          if (stateRef.current === "idle") {
            offerRef.current = sig.payload;
            setState("ringing");
          }
          break;
        case "answer":
          if (pc && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(sig.payload);
            await flushIce();
            setState("connected");
          }
          break;
        case "ice":
          if (pc && pc.remoteDescription) {
            try {
              await pc.addIceCandidate(sig.payload);
            } catch {}
          } else {
            pendingIce.current.push(sig.payload);
          }
          break;
        case "hangup":
        case "reject":
          if (stateRef.current !== "idle") cleanup();
          break;
      }
    },
    [flushIce, cleanup]
  );

  // Poll tín hiệu liên tục để nhận cuộc gọi đến
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const sigs = await apiGet<Signal[]>(`/api/orders/${orderId}/call`);
        if (!alive) return;
        for (const s of sigs) await handleSignal(s);
      } catch {}
    };
    const t = setInterval(poll, 1500);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [orderId, handleSignal]);

  // Đồng hồ cuộc gọi
  useEffect(() => {
    if (state !== "connected") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  // Dọn dẹp khi rời trang
  useEffect(() => () => cleanup(), [cleanup]);

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60
  ).padStart(2, "0")}`;

  return (
    <div className="flex flex-col">
      <audio ref={audioRef} autoPlay />
      {err && <p className="mb-2 text-xs text-red-500">{err}</p>}

      {state === "idle" && (
        <button
          onClick={startCall}
          className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 font-medium text-white hover:bg-green-700"
        >
          📞 Gọi
        </button>
      )}

      {state === "calling" && (
        <div className="space-y-1.5">
          <span className="block animate-pulse text-center text-sm text-boba-700">
            📞 Đang gọi…
          </span>
          <button onClick={hangup} className="min-h-[44px] w-full rounded-lg bg-red-500 px-3 text-sm font-medium text-white">
            Huỷ
          </button>
        </div>
      )}

      {state === "ringing" && (
        <div className="space-y-1.5">
          <span className="block animate-pulse text-center text-sm font-medium text-green-700">
            📲 Cuộc gọi đến…
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={accept} className="min-h-[44px] rounded-lg bg-green-600 px-2 text-sm font-medium text-white">
              Nghe
            </button>
            <button onClick={reject} className="min-h-[44px] rounded-lg bg-red-500 px-2 text-sm font-medium text-white">
              Từ chối
            </button>
          </div>
        </div>
      )}

      {state === "connected" && (
        <div className="space-y-1.5">
          <span className="block text-center text-sm text-green-700">🟢 {mmss}</span>
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={toggleMute} className="min-h-[44px] rounded-lg border border-boba-300 px-2 text-sm text-boba-700">
              {muted ? "🔇" : "🎙"}
            </button>
            <button onClick={hangup} className="min-h-[44px] rounded-lg bg-red-500 px-2 text-sm font-medium text-white">
              Kết thúc
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
