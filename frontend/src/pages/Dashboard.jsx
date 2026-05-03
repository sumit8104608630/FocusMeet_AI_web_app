import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import {
  LayoutDashboard, Video, Calendar, BarChart2, Settings,
  LogOut, Plus, Users, Clock, Brain, TrendingUp, ChevronRight,
  Bell, ArrowUpRight, Menu, X, ChevronDown
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
  const { user, loading, logout, activeMeeting } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState("Dashboard");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMeetDropdown, setShowMeetDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [meetingCode, setMeetingCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMeetDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
    
    // Auto-rejoin active meeting from Redis
    if (!loading && user && activeMeeting) {
      navigate(`/meeting/${activeMeeting}`);
    }
  }, [user, loading, navigate, activeMeeting]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleNewMeeting = () => {
    // Generate a shorter, readable code (8 chars)
    const code = uuidv4().split('-')[0].toUpperCase();
    setGeneratedCode(code);
  };

  const handleJoinMeeting = (e) => {
    e.preventDefault();
    if (meetingCode.trim()) {
      navigate(`/meeting/${meetingCode.trim().toUpperCase()}`);
    }
  };

  const startMeeting = () => {
    if (generatedCode) {
      navigate(`/meeting/${generatedCode}`);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        height: "100vh", background: "#06070d", display: "flex", 
        alignItems: "center", justifyContent: "center" 
      }}>
        <div style={{ color: "#4f6ef7", fontFamily: "'Figtree', sans-serif" }}>Loading Dashboard...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{
      display: "flex", 
      flexDirection: isMobile ? "column" : "row",
      height: "100vh", background: "#06070d",
      fontFamily: "'Nunito', sans-serif", color: "#e8eaf2", overflow: "hidden",
    }}>

      {/* ── Sidebar ── */}
      {!isMobile && (
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
            <span style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 800, fontSize: 18, color: "#fff" }}>
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
                    fontFamily: "'Figtree', sans-serif", fontWeight: 600, fontSize: 14,
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
          <button 
            onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "11px 14px", borderRadius: 12, border: "none",
              cursor: "pointer", width: "100%",
              fontFamily: "'Figtree', sans-serif", fontWeight: 600, fontSize: 14,
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
      )}

      {/* ── Main Content ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top Bar */}
        <div style={{
          display: "flex", 
          flexDirection: "row",
          alignItems: "center", 
          justifyContent: "space-between",
          padding: isMobile ? "12px 16px" : "20px 32px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "#06070d",
          position: "sticky", top: 0, zIndex: 10
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <button 
                onClick={() => setShowMobileMenu(true)}
                style={{
                  background: "none", border: "none", color: "#fff",
                  cursor: "pointer", padding: 4, display: "flex", alignItems: "center"
                }}
              >
                <Menu size={24} />
              </button>
            )}
            {!isMobile && (
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "linear-gradient(135deg, #4f6ef7, #7c3aed)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Video size={14} color="#fff" />
              </div>
            )}
            <h1 style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 800, fontSize: isMobile ? 18 : 24, color: "#fff", margin: 0 }}>
              {active}
            </h1>
          </div>
          
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: isMobile ? 8 : 12,
            position: "relative"
          }} ref={dropdownRef}>
            <button 
              onClick={() => setShowMeetDropdown(!showMeetDropdown)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: isMobile ? "8px 14px" : "10px 20px", borderRadius: 50, border: "none",
                background: "linear-gradient(135deg, #4f6ef7, #7c3aed)",
                color: "#fff", fontFamily: "'Figtree', sans-serif", fontWeight: 700,
                fontSize: isMobile ? 12 : 14, cursor: "pointer",
                boxShadow: "0 0 24px rgba(79,110,247,0.35)",
              }}
            >
              <Video size={14} /> {isMobile ? "Meet" : "New Meeting"} <ChevronDown size={14} style={{ transform: showMeetDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {showMeetDropdown && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                width: 180, background: "#0d1021", border: "1px solid rgba(79,110,247,0.3)",
                borderRadius: 12, overflow: "hidden", zIndex: 100,
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                animation: "dropdownFade 0.2s ease both"
              }}>
                <button 
                  onClick={() => { handleNewMeeting(); setShowMeetDropdown(false); }}
                  style={{
                    width: "100%", padding: "12px 16px", background: "none", border: "none",
                    color: "#fff", textAlign: "left", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 10,
                    fontSize: 14, fontFamily: "'Figtree', sans-serif", fontWeight: 600,
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(79,110,247,0.1)"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  <Plus size={16} /> New Meeting
                </button>
                <button 
                  onClick={() => { setShowJoinModal(true); setShowMeetDropdown(false); }}
                  style={{
                    width: "100%", padding: "12px 16px", background: "none", border: "none",
                    color: "#fff", textAlign: "left", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 10,
                    fontSize: 14, fontFamily: "'Figtree', sans-serif", fontWeight: 600,
                    transition: "background 0.2s",
                    borderTop: "1px solid rgba(255,255,255,0.05)"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(79,110,247,0.1)"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  <Users size={16} /> Join Meeting
                </button>
              </div>
            )}
            
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "linear-gradient(135deg, #4f6ef7, #7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Figtree', sans-serif", fontWeight: 800, fontSize: 11, color: "#fff",
              cursor: "pointer", border: "2px solid rgba(79,110,247,0.4)",
            }}>
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??'}
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobile && showMobileMenu && (
          <div 
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
              animation: "fadeIn 0.2s ease both"
            }}
            onClick={() => setShowMobileMenu(false)}
          >
            <aside 
              style={{
                width: 280, height: "100%", background: "#0a0b14",
                padding: "24px 16px", display: "flex", flexDirection: "column",
                animation: "slideInLeft 0.3s ease both"
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "linear-gradient(135deg, #4f6ef7, #7c3aed)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <Video size={14} color="#fff" />
                  </div>
                  <span style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 800, fontSize: 18, color: "#fff" }}>
                    AttendAI
                  </span>
                </div>
                <button 
                  onClick={() => setShowMobileMenu(false)}
                  style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer" }}
                >
                  <X size={24} />
                </button>
              </div>

              <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                {sidebarLinks.map(({ icon: Icon, label }) => {
                  const isActive = active === label;
                  return (
                    <button
                      key={label}
                      onClick={() => { setActive(label); setShowMobileMenu(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px", borderRadius: 12, border: "none",
                        cursor: "pointer", textAlign: "left", width: "100%",
                        fontFamily: "'Figtree', sans-serif", fontWeight: 600, fontSize: 15,
                        background: isActive ? "rgba(79,110,247,0.15)" : "transparent",
                        color: isActive ? "#4f6ef7" : "#6b7280",
                      }}
                    >
                      <Icon size={20} />
                      {label}
                    </button>
                  );
                })}
              </nav>

              <button 
                onClick={handleLogout}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", borderRadius: 12, border: "none",
                  cursor: "pointer", width: "100%",
                  fontFamily: "'Figtree', sans-serif", fontWeight: 600, fontSize: 15,
                  background: "transparent", color: "#6b7280",
                }}
              >
                <LogOut size={20} />
                Log out
              </button>
            </aside>
            <style>{`
              @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
              @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
              @keyframes dropdownFade { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
          </div>
        )}

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px" : "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Stat Cards */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", 
            gap: isMobile ? 12 : 16 
          }}>
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
                      fontFamily: "'Figtree', sans-serif",
                    }}>
                      <TrendingUp size={11} /> {s.delta}
                    </span>
                  </div>
                  <div style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 800, fontSize: 28, color: "#fff", lineHeight: 1 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>{s.label}</div>
                </div>
              );
            })}
          </div>

          {/* Bottom Row */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: isMobile ? "1fr" : "1fr 380px", 
            gap: 20 
          }}>

            {/* Upcoming Meetings */}
            <div style={{
              background: "#0d1021", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20, padding: "24px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 800, fontSize: 17, color: "#fff", margin: 0 }}>
                  Upcoming Meetings
                </h2>
                <button style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#4f6ef7", fontFamily: "'Figtree', sans-serif",
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
                        <div style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 700, fontSize: 14, color: "#e8eaf2" }}>
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
              <h2 style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 800, fontSize: 17, color: "#fff", margin: "0 0 20px" }}>
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
                      fontFamily: "'Figtree', sans-serif", fontWeight: 700,
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
                color: "#4f6ef7", fontFamily: "'Figtree', sans-serif",
                fontWeight: 700, fontSize: 13,
              }}>
                View Full Report <ChevronRight size={14} />
              </button>
            </div>

          </div>
        </div>
      </main>

      {/* ── Join Meeting Modal ── */}
      {showJoinModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24
        }} onClick={() => setShowJoinModal(false)}>
          <div style={{
            width: "100%", maxWidth: 400, background: "#0d1021",
            borderRadius: 24, padding: 32, border: "1px solid rgba(79,110,247,0.2)",
            boxShadow: "0 40px 100px rgba(0,0,0,0.6)"
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 800, fontSize: 22, color: "#fff", marginBottom: 8 }}>
              Join Meeting
            </h2>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
              Enter the meeting code shared by the host to join.
            </p>
            <form onSubmit={handleJoinMeeting}>
              <input 
                type="text" 
                placeholder="Enter Meeting Code (e.g. AB12CD34)" 
                value={meetingCode}
                onChange={e => setMeetingCode(e.target.value.toUpperCase())}
                autoFocus
                style={{
                  width: "100%", padding: "14px 18px", borderRadius: 12,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff", fontSize: 15, fontFamily: "'Nunito', sans-serif",
                  outline: "none", marginBottom: 20, transition: "border-color 0.2s"
                }}
                onFocus={e => e.target.style.borderColor = "#4f6ef7"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
              <button 
                type="submit"
                style={{
                  width: "100%", padding: 14, borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #4f6ef7, #7c3aed)",
                  color: "#fff", fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Figtree', sans-serif"
                }}
              >
                Join Now
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── New Meeting Code Display Modal ── */}
      {generatedCode && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24
        }} onClick={() => setGeneratedCode("")}>
          <div style={{
            width: "100%", maxWidth: 400, background: "#0d1021",
            borderRadius: 24, padding: 32, border: "1px solid rgba(79,110,247,0.2)",
            boxShadow: "0 40px 100px rgba(0,0,0,0.6)", textAlign: "center"
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 800, fontSize: 22, color: "#fff", marginBottom: 8 }}>
              Meeting Ready
            </h2>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
              Share this code with others you want to invite.
            </p>
            <div style={{
              background: "rgba(79,110,247,0.1)", border: "2px dashed rgba(79,110,247,0.4)",
              borderRadius: 16, padding: isMobile ? "12px 8px" : "16px", marginBottom: 24,
              fontSize: "clamp(18px, 5vw, 24px)", fontWeight: 800, color: "#4f6ef7", 
              letterSpacing: isMobile ? 1 : 2,
              fontFamily: "'Figtree', sans-serif", position: "relative",
              wordBreak: "break-all", overflowWrap: "anywhere"
            }}>
              {generatedCode}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode);
                  alert("Code copied!");
                }}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 600,
                  cursor: "pointer", fontFamily: "'Figtree', sans-serif", fontSize: 13
                }}
              >
                Copy Code
              </button>
              <button 
                onClick={startMeeting}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #4f6ef7, #7c3aed)",
                  color: "#fff", fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Figtree', sans-serif", fontSize: 13
                }}
              >
                Start Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
