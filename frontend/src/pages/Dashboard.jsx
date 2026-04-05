import { useState } from "react";
import {
  LayoutDashboard, Video, Calendar, BarChart2, Settings,
  LogOut, Plus, Users, Clock, Brain, TrendingUp, ChevronRight,
  Bell, ArrowUpRight
} from "lucide-react";

const sidebarLinks = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Video,           label: "Meetings",  active: false },
  { icon: Calendar,        label: "Schedule",  active: false },
  { icon: BarChart2,       label: "Analytics", active: false },
  { icon: Settings,        label: "Settings",  active: false },
];

const stats = [
  { icon: Video,       color: "#4f6ef7", label: "Total Meetings",  value: "156", delta: "+12%", deltaColor: "#22d3a0" },
  { icon: Brain,       color: "#f59e0b", label: "Avg. Attention",  value: "87%", delta: "+5%",  deltaColor: "#22d3a0" },
  { icon: Users,       color: "#22d3a0", label: "Active Users",    value: "24",  delta: "+3",   deltaColor: "#22d3a0" },
  { icon: Clock,       color: "#4f6ef7", label: "Hours Saved",     value: "48h", delta: "+8h",  deltaColor: "#22d3a0" },
];

const meetings = [
  { title: "Sprint Planning", time: "Today · 10:00 AM",    participants: 8  },
  { title: "Design Review",   time: "Today · 2:00 PM",     participants: 5  },
  { title: "Client Sync",     time: "Tomorrow · 11:00 AM", participants: 3  },
  { title: "Team Standup",    time: "Mar 29 · 9:00 AM",    participants: 12 },
];

const insights = [
  { type: "High Engagement", color: "#22d3a0", bg: "rgba(34,211,160,0.08)", border: "rgba(34,211,160,0.2)",  desc: "Team attention is 12% above average this week." },
  { type: "Attention Drop",  color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)",  desc: "Meetings after 3 PM show 20% lower focus." },
  { type: "Suggestion",      color: "#4f6ef7", bg: "rgba(79,110,247,0.08)", border: "rgba(79,110,247,0.2)",  desc: "Schedule key discussions before noon for best engagement." },
];

export default function Dashboard() {
  const [active, setActive] = useState("Dashboard");

  return (
    <div style={{
      display: "flex", height: "100vh", background: "#06070d",
      fontFamily: "'DM Sans', sans-serif", color: "#e8eaf2", overflow: "hidden",
    }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 260, flexShrink: 0,
        background: "#0a0b14",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column",
        padding: "24px 16px",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px", marginBottom: 36 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #4f6ef7, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px rgba(79,110,247,0.4)",
          }}>
            <Video size={16} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#fff" }}>
            AttendAI
          </span>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {sidebarLinks.map(({ icon: Icon, label }) => {
            const isActive = active === label;
            return (
              <button
                key={label}
                onClick={() => setActive(label)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 14px", borderRadius: 12, border: "none",
                  cursor: "pointer", textAlign: "left", width: "100%",
                  fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14,
                  transition: "all 0.15s",
                  background: isActive ? "rgba(79,110,247,0.15)" : "transparent",
                  color: isActive ? "#4f6ef7" : "#6b7280",
                  boxShadow: isActive ? "inset 0 0 0 1px rgba(79,110,247,0.2)" : "none",
                }}
              >
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Log out */}
        <button style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "11px 14px", borderRadius: 12, border: "none",
          cursor: "pointer", width: "100%",
          fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14,
          background: "transparent", color: "#6b7280",
          transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#6b7280"; e.currentTarget.style.background = "transparent"; }}
        >
          <LogOut size={18} />
          Log out
        </button>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top Bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 32px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "#06070d",
        }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24, color: "#fff", margin: 0 }}>
            Dashboard
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 50, border: "none",
              background: "linear-gradient(135deg, #4f6ef7, #7c3aed)",
              color: "#fff", fontFamily: "'Syne', sans-serif", fontWeight: 700,
              fontSize: 14, cursor: "pointer",
              boxShadow: "0 0 24px rgba(79,110,247,0.35)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 36px rgba(79,110,247,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 24px rgba(79,110,247,0.35)"; }}
            >
              <Plus size={16} /> New Meeting
            </button>
            {/* Avatar */}
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "linear-gradient(135deg, #4f6ef7, #7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 13, color: "#fff",
              cursor: "pointer", border: "2px solid rgba(79,110,247,0.4)",
            }}>
              JD
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} style={{
                  background: "#0d1021", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 16, padding: "20px 22px",
                  transition: "border-color 0.2s, transform 0.2s",
                  cursor: "default",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(79,110,247,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `${s.color}18`,
                      border: `1px solid ${s.color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={17} color={s.color} />
                    </div>
                    <span style={{
                      display: "flex", alignItems: "center", gap: 3,
                      fontSize: 12, fontWeight: 700, color: s.deltaColor,
                      fontFamily: "'Syne', sans-serif",
                    }}>
                      <TrendingUp size={11} /> {s.delta}
                    </span>
                  </div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, color: "#fff", lineHeight: 1 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>{s.label}</div>
                </div>
              );
            })}
          </div>

          {/* Bottom Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>

            {/* Upcoming Meetings */}
            <div style={{
              background: "#0d1021", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20, padding: "24px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, color: "#fff", margin: 0 }}>
                  Upcoming Meetings
                </h2>
                <button style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#4f6ef7", fontFamily: "'Syne', sans-serif",
                  fontWeight: 600, fontSize: 13,
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  View all <ArrowUpRight size={13} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {meetings.map((m, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 16px", borderRadius: 12,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    transition: "background 0.15s, border-color 0.15s",
                    cursor: "pointer",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(79,110,247,0.06)"; e.currentTarget.style.borderColor = "rgba(79,110,247,0.2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "rgba(79,110,247,0.12)",
                        border: "1px solid rgba(79,110,247,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Video size={15} color="#4f6ef7" />
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "#e8eaf2" }}>
                          {m.title}
                        </div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{m.time}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#6b7280", fontSize: 13 }}>
                      <Users size={13} />
                      {m.participants}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insights */}
            <div style={{
              background: "#0d1021", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20, padding: "24px",
              display: "flex", flexDirection: "column",
            }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, color: "#fff", margin: "0 0 20px" }}>
                AI Insights
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                {insights.map((ins, i) => (
                  <div key={i} style={{
                    padding: "14px 16px", borderRadius: 14,
                    background: ins.bg, border: `1px solid ${ins.border}`,
                    transition: "transform 0.15s",
                    cursor: "default",
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    <div style={{
                      fontFamily: "'Syne', sans-serif", fontWeight: 700,
                      fontSize: 13, color: ins.color, marginBottom: 6,
                    }}>
                      {ins.type}
                    </div>
                    <div style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.55 }}>{ins.desc}</div>
                  </div>
                ))}
              </div>

              <button style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                marginTop: 20, padding: "0",
                background: "none", border: "none", cursor: "pointer",
                color: "#4f6ef7", fontFamily: "'Syne', sans-serif",
                fontWeight: 700, fontSize: 13,
              }}>
                View Full Report <ChevronRight size={14} />
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}