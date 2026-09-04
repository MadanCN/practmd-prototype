"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mic, MicOff, Video, VideoOff, Phone, MessageSquare, Settings,
  CheckCircle2, Clock, Wifi, Monitor, ChevronRight, Send, X,
  ArrowLeft, Shield, Volume2,
} from "lucide-react";
import { PORTAL_APPOINTMENTS } from "@/data/patient-portal";
import { PROVIDERS } from "@/data/providers";
import { cn } from "@/lib/utils";

type TelehealthPhase = "system-check" | "waiting" | "in-call" | "ended";

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function SystemCheckPage({ onContinue }: { onContinue: () => void }) {
  const [checks, setChecks] = useState([
    { id: "camera", label: "Camera", status: "checking" as "checking" | "pass" | "fail" },
    { id: "mic", label: "Microphone", status: "checking" as "checking" | "pass" | "fail" },
    { id: "network", label: "Network Connection", status: "checking" as "checking" | "pass" | "fail" },
    { id: "browser", label: "Browser Compatibility", status: "checking" as "checking" | "pass" | "fail" },
  ]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timers = [600, 1100, 1600, 2000].map((delay, i) =>
      setTimeout(() => {
        setChecks(prev => prev.map((c, idx) => idx === i ? { ...c, status: "pass" } : c));
        if (i === 3) setDone(true);
      }, delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">System Check</h1>
          <p className="text-slate-400 mt-1">Making sure your device is ready for the session</p>
        </div>

        <div className="space-y-3">
          {checks.map(check => (
            <div key={check.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center",
                check.status === "checking" ? "bg-slate-700" : check.status === "pass" ? "bg-emerald-600" : "bg-red-600")}>
                {check.status === "checking" ? (
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                ) : check.status === "pass" ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : (
                  <X className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="text-sm font-medium text-slate-200">{check.label}</span>
              <span className={cn("ml-auto text-xs font-semibold",
                check.status === "checking" ? "text-slate-500" : check.status === "pass" ? "text-emerald-400" : "text-red-400")}>
                {check.status === "checking" ? "Checking…" : check.status === "pass" ? "Ready" : "Failed"}
              </span>
            </div>
          ))}
        </div>

        {done && (
          <button onClick={onContinue}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
            All systems ready — Join Waiting Room <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function WaitingRoomPage({ providerName, appointmentTime, onJoin }: {
  providerName: string; appointmentTime: string; onJoin: () => void;
}) {
  const [dots, setDots] = useState(1);
  const [waitSeconds, setWaitSeconds] = useState(0);

  useEffect(() => {
    const d = setInterval(() => setDots(p => (p % 3) + 1), 700);
    const w = setInterval(() => setWaitSeconds(p => p + 1), 1000);
    const join = setTimeout(onJoin, 6000); // auto-join after 6s for demo
    return () => { clearInterval(d); clearInterval(w); clearTimeout(join); };
  }, [onJoin]);

  const mins = Math.floor(waitSeconds / 60);
  const secs = waitSeconds % 60;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="relative mx-auto w-24 h-24">
          <div className="w-24 h-24 rounded-full bg-emerald-900/40 border-2 border-emerald-600 flex items-center justify-center text-2xl font-bold text-white">
            {providerName.split(" ").map(w => w[0]).join("").slice(0, 2)}
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 border-2 border-slate-950 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">You're in the waiting room</h1>
          <p className="text-slate-400 mt-2">{providerName} will let you in shortly</p>
          <p className="text-slate-500 text-sm mt-1">Appointment time: {appointmentTime}</p>
        </div>

        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span>Connection: <span className="text-emerald-400 font-medium">Excellent</span></span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>Wait time: <span className="text-white font-medium">{mins > 0 ? `${mins}m ` : ""}{secs}s</span></span>
          </div>
        </div>

        <div className="text-slate-500 text-sm">
          Waiting for provider{".".repeat(dots)}
        </div>

        <button onClick={onJoin}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors">
          Join Now
        </button>
      </div>
    </div>
  );
}

function InCallPage({ providerName, providerInitials, onEnd }: {
  providerName: string; providerInitials: string; onEnd: () => void;
}) {
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { from: "provider", text: "Hello James, can you hear me clearly?", ts: "Just now" },
  ]);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCallDuration(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const mins = Math.floor(callDuration / 60);
  const secs = callDuration % 60;

  function sendChat() {
    if (!chatMsg.trim()) return;
    setChatMessages(p => [...p, { from: "patient", text: chatMsg, ts: "Just now" }]);
    setChatMsg("");
    setTimeout(() => {
      setChatMessages(p => [...p, { from: "provider", text: "Thank you, noted.", ts: "Just now" }]);
    }, 2000);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900/80 backdrop-blur border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm text-white font-semibold">Live Session</span>
          <span className="text-xs text-slate-400">{mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}</span>
        </div>
        <span className="text-sm text-slate-300">{providerName}</span>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <Wifi className="w-3.5 h-3.5" /> Secure
        </div>
      </div>

      {/* Main call area */}
      <div className="flex-1 flex">
        {/* Video area */}
        <div className="flex-1 relative bg-slate-900 flex items-center justify-center">
          {/* Provider "video" */}
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-emerald-700 border-4 border-emerald-600 flex items-center justify-center text-3xl font-bold text-white mx-auto">
                {providerInitials}
              </div>
              <p className="text-white font-semibold mt-3">{providerName}</p>
              <p className="text-emerald-400 text-sm">Video — On</p>
            </div>
          </div>

          {/* Self preview */}
          <div className="absolute bottom-4 right-4 w-32 h-24 rounded-xl bg-slate-700 border-2 border-slate-600 flex items-center justify-center overflow-hidden">
            {videoOff ? (
              <div className="flex flex-col items-center gap-1 text-slate-400">
                <VideoOff className="w-5 h-5" />
                <span className="text-xs">Camera off</span>
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-slate-500 flex items-center justify-center text-sm font-bold text-white">JH</div>
              </div>
            )}
          </div>
        </div>

        {/* Chat panel */}
        {chatOpen && (
          <div className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <p className="text-sm font-semibold text-white">Chat</p>
              <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.from === "patient" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[80%] rounded-xl px-3 py-2 text-sm",
                    msg.from === "patient"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-700 text-slate-100")}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-slate-800 flex gap-2">
              <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChat()}
                placeholder="Type a message…"
                className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <button onClick={sendChat} className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-5 bg-slate-900/90 backdrop-blur border-t border-slate-800">
        <button onClick={() => setMuted(m => !m)}
          className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors",
            muted ? "bg-red-600 hover:bg-red-700" : "bg-slate-700 hover:bg-slate-600")}>
          {muted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
        </button>
        <button onClick={() => setVideoOff(v => !v)}
          className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors",
            videoOff ? "bg-red-600 hover:bg-red-700" : "bg-slate-700 hover:bg-slate-600")}>
          {videoOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
        </button>
        <button onClick={() => setChatOpen(c => !c)}
          className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors relative",
            chatOpen ? "bg-emerald-700" : "bg-slate-700 hover:bg-slate-600")}>
          <MessageSquare className="w-5 h-5 text-white" />
        </button>
        <button
          className="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors">
          <Volume2 className="w-5 h-5 text-white" />
        </button>
        <button onClick={onEnd}
          className="w-14 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors">
          <Phone className="w-5 h-5 text-white rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
}

function EndedPage({ providerName, duration }: { providerName: string; duration: number }) {
  const router = useRouter();
  const mins = Math.floor(duration / 60);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Session Ended</h1>
          <p className="text-slate-400 mt-1">Your {mins} minute session with {providerName} is complete.</p>
        </div>
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 text-left space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">After Your Visit</p>
          <p className="text-sm text-slate-300">· Visit summary and any notes will be available in your records within 24–48 hours.</p>
          <p className="text-sm text-slate-300">· Your prescription, if any, has been sent to your pharmacy.</p>
          <p className="text-sm text-slate-300">· Your next appointment has been scheduled — check My Visits.</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push("/patient/home")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
            Back to Home
          </button>
          <button onClick={() => router.push("/patient/messages")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-300 hover:bg-slate-800">
            <MessageSquare className="w-4 h-4" /> Message Provider
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PatientTelehealthPage() {
  const params = useParams();
  const id = params?.id as string;

  const isSystemCheck = id === "system-check";
  const [phase, setPhase] = useState<TelehealthPhase>(isSystemCheck ? "system-check" : "waiting");
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const appt = PORTAL_APPOINTMENTS.find(a => a.id === id);
  const provider = appt ? PROVIDERS.find(p => p.id === appt.providerId) : PROVIDERS[0];
  const providerName = provider?.displayName ?? "Dr. Sarah Mitchell";
  const providerInitials = provider ? `${provider.firstName[0]}${provider.lastName[0]}` : "SM";
  const apptTime = appt ? fmt12(appt.startTime) : "11:00 AM";

  useEffect(() => {
    if (phase === "in-call") {
      callTimerRef.current = setInterval(() => setCallDuration(p => p + 1), 1000);
    }
    return () => { if (callTimerRef.current) clearInterval(callTimerRef.current); };
  }, [phase]);

  if (phase === "system-check") {
    return <SystemCheckPage onContinue={() => setPhase("waiting")} />;
  }
  if (phase === "waiting") {
    return <WaitingRoomPage providerName={providerName} appointmentTime={apptTime} onJoin={() => setPhase("in-call")} />;
  }
  if (phase === "in-call") {
    return <InCallPage providerName={providerName} providerInitials={providerInitials}
      onEnd={() => { if (callTimerRef.current) clearInterval(callTimerRef.current); setPhase("ended"); }} />;
  }
  return <EndedPage providerName={providerName} duration={callDuration} />;
}
