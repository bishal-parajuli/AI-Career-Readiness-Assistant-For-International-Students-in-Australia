import React, { useState } from "react";

export type NavItem = "dashboard" | "resume" | "interview" | "job-matching" | "progress" | "responsible-ai";

/* SVG nav icons — inline so no dependency needed */
function IconDashboard({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function IconResume({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h4M7 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8l-5-4H7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 4v4h4" />
    </svg>
  );
}
function IconInterview({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.817L3 20l1.167-3.5A7.742 7.742 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
function IconProgress({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconLogout({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
    </svg>
  );
}
function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function IconClose({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
function IconBriefcase({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="7" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v.01M2 12h20" />
    </svg>
  );
}

const NAV_ITEMS: { id: NavItem; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dashboard",      label: "Dashboard",                Icon: IconDashboard },
  { id: "resume",         label: "Resume Feedback",          Icon: IconResume },
  { id: "interview",      label: "Interview Preparation",    Icon: IconInterview },
  { id: "job-matching",   label: "Job Matching",             Icon: IconBriefcase },
  { id: "progress",       label: "My Progress",              Icon: IconProgress },
  { id: "responsible-ai", label: "Responsible AI & Privacy", Icon: IconShield },
];
function SidebarContents({ active, onNav, userId, userName, userEmail, onLogout, onUpdateUser, onClose }: {
  active: NavItem;
  userId: number;
  onNav: (n: NavItem) => void;
  userName: string;
  userEmail: string;
  onLogout: () => void;
  onUpdateUser: (name: string, email: string) => void;
  onClose?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /* Profile edit state */
  const [editName, setEditName] = useState(userName);
  const [editEmail, setEditEmail] = useState(userEmail);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  /* Password change state */
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  const closeMenu = () => setMenuOpen(false);
  const handleLogoutClick = () => { closeMenu(); setShowConfirm(true); };
  const handleConfirmLogout = () => { setShowConfirm(false); onLogout(); };

  const openProfile = () => {
    setEditName(userName); setEditEmail(userEmail);
    setProfileSaved(false); setProfileError("");
    closeMenu(); setShowProfile(true);
  };
  const saveProfile = async () => {
  setProfileError("");
  setProfileSaved(false);

  if (!editName.trim()) {
    setProfileError("Name cannot be empty.");
    return;
  }

  if (!editEmail.trim() || !editEmail.includes("@")) {
    setProfileError("Please enter a valid email address.");
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:8000/api/update-profile.php",
      {
        method: "POST",
  credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          preferred_name: editName.trim(),
          email: editEmail.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setProfileError(data.message || "Unable to update profile.");
      return;
    }

    onUpdateUser(
      data.user.preferred_name,
      data.user.email
    );

    setEditName(data.user.preferred_name);
    setEditEmail(data.user.email);
    setProfileSaved(true);

  } catch (error) {
    console.error("Profile update failed:", error);
    setProfileError("Unable to update profile. Please try again.");
  }
};

  const openPassword = () => {
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setPwSaved(false); setPwError("");
    setShowCurrent(false); setShowNew(false);
    closeMenu(); setShowPassword(true);
  };
  const savePassword = async () => {
  setPwError("");
  setPwSaved(false);

  if (!currentPw) {
    setPwError("Please enter your current password.");
    return;
  }

  if (newPw.length < 8) {
    setPwError("New password must be at least 8 characters.");
    return;
  }

  if (newPw !== confirmPw) {
    setPwError("New passwords do not match.");
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:8000/api/change-password.php",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          current_password: currentPw,
          new_password: newPw,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setPwError(data.message || "Unable to change password.");
      return;
    }

    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setPwSaved(true);
  } catch (error) {
    console.error("Password change failed:", error);
    setPwError("Unable to change password. Please try again.");
  }
};

  const handleNav = (id: NavItem) => {
    onNav(id);
    onClose?.();
  };

  return (
    <>
      {/* Logo / brand */}
      <div className="px-5 py-5 border-b border-[#f1f5f9] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-[#4f46e5] flex items-center justify-center text-white text-xs font-bold tracking-wide flex-shrink-0">AI</div>
          <div>
            <p className="text-sm font-bold text-[#0f172a] leading-snug">Career Readiness</p>
            <p className="text-[11px] text-[#94a3b8] leading-none mt-0.5">AI Assistant</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-4 pb-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => handleNav(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors group
                ${isActive
                  ? "bg-[#eef2ff] text-[#4f46e5]"
                  : "text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]"
                }`}
            >
              <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? "text-[#4f46e5]" : "text-[#94a3b8] group-hover:text-[#64748b]"}`} />
              <span className={`text-[13px] font-medium leading-none ${isActive ? "text-[#4f46e5]" : ""}`}>{label}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#4f46e5] flex-shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="px-3 pb-4 pt-2 border-t border-[#f1f5f9] flex-shrink-0 relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left ${menuOpen ? "bg-[#eef2ff]" : "hover:bg-[#f8fafc]"}`}
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          {/* Avatar */}
          <div className="size-8 rounded-full bg-[#eef2ff] border-2 border-[#c7d2fe] text-[#4f46e5] flex items-center justify-center text-sm font-bold flex-shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[#0f172a] truncate leading-snug">{userName}</p>
            <p className="text-[11px] text-[#94a3b8] leading-none mt-0.5">International student</p>
          </div>
          <svg
            className={`w-4 h-4 text-[#94a3b8] flex-shrink-0 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown — opens upward */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={closeMenu} />
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-[#e2e8f0] rounded-2xl shadow-xl overflow-hidden z-50">
              {/* Account header */}
              <div className="px-4 py-3 border-b border-[#f1f5f9] bg-[#f8fafc]">
                <p className="text-xs font-semibold text-[#0f172a]">{userName}</p>
                <p className="text-[11px] text-[#94a3b8] mt-0.5">{userEmail}</p>
              </div>

              <div className="py-1.5">
                <button
                  onClick={openProfile}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a] transition-colors text-left"
                >
                  <IconUser className="w-4 h-4 flex-shrink-0" />
                  Profile
                </button>
                <button
                  onClick={openPassword}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a] transition-colors text-left"
                >
                  <IconSettings className="w-4 h-4 flex-shrink-0" />
                  Change Password
                </button>
              </div>

              <div className="border-t border-[#f1f5f9]" />

              <div className="py-1.5">
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#64748b] hover:bg-red-50 hover:text-red-600 transition-colors text-left"
                >
                  <IconLogout className="w-4 h-4 flex-shrink-0" />
                  Log out
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Profile modal */}
      {showProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => setShowProfile(false)} />
          <div className="relative bg-white rounded-2xl border border-[#e2e8f0] shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-[#eef2ff] border-2 border-[#c7d2fe] text-[#4f46e5] flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {editName.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#0f172a]">Edit Profile</h2>
                  <p className="text-[11px] text-[#94a3b8]">International student</p>
                </div>
              </div>
              <button onClick={() => setShowProfile(false)} className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#0f172a] hover:bg-[#f8fafc] transition-colors">
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mb-5">
              <label className="block">
                <span className="text-xs font-medium text-[#0f172a] block mb-1.5">Full name</span>
                <input
                  value={editName}
                  onChange={(e) => { setEditName(e.target.value); setProfileSaved(false); setProfileError(""); }}
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
                  placeholder="Your name"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-[#0f172a] block mb-1.5">Email address</span>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => { setEditEmail(e.target.value); setProfileSaved(false); setProfileError(""); }}
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
                  placeholder="your@email.com"
                />
              </label>
            </div>

            {profileError && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg mb-4">
                <span className="text-red-500 text-xs flex-shrink-0 mt-0.5">✕</span>
                <p className="text-xs text-red-700">{profileError}</p>
              </div>
            )}
            {profileSaved && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg mb-4">
                <span className="text-emerald-600 text-xs flex-shrink-0 mt-0.5">✓</span>
                <p className="text-xs text-emerald-800">Profile updated successfully.</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowProfile(false)} className="flex-1 border border-[#e2e8f0] text-[#0f172a] font-medium py-2.5 rounded-xl hover:bg-[#f8fafc] transition-colors text-sm">
                {profileSaved ? "Close" : "Cancel"}
              </button>
              {!profileSaved && (
                <button onClick={saveProfile} className="flex-1 bg-[#4f46e5] text-white font-medium py-2.5 rounded-xl hover:bg-[#4338ca] transition-colors text-sm">
                  Save changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Change Password modal */}
      {showPassword && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => setShowPassword(false)} />
          <div className="relative bg-white rounded-2xl border border-[#e2e8f0] shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#0f172a]">Change Password</h2>
              <button onClick={() => setShowPassword(false)} className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#0f172a] hover:bg-[#f8fafc] transition-colors">
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mb-5">
              <label className="block">
                <span className="text-xs font-medium text-[#0f172a] block mb-1.5">Current password</span>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPw}
                    onChange={(e) => { setCurrentPw(e.target.value); setPwSaved(false); setPwError(""); }}
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent pr-10"
                    placeholder="Enter current password"
                  />
                  <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] text-xs">
                    {showCurrent ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-[#0f172a] block mb-1.5">New password</span>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => { setNewPw(e.target.value); setPwSaved(false); setPwError(""); }}
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent pr-10"
                    placeholder="Minimum 8 characters"
                  />
                  <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] text-xs">
                    {showNew ? "Hide" : "Show"}
                  </button>
                </div>
                {newPw.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${newPw.length >= i * 2 + 4 ? (newPw.length >= 12 ? "bg-emerald-400" : "bg-amber-400") : "bg-[#e2e8f0]"}`} />
                    ))}
                    <span className="text-[10px] text-[#94a3b8] ml-1">{newPw.length < 8 ? "Weak" : newPw.length < 10 ? "Fair" : newPw.length < 12 ? "Good" : "Strong"}</span>
                  </div>
                )}
              </label>
              <label className="block">
                <span className="text-xs font-medium text-[#0f172a] block mb-1.5">Confirm new password</span>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => { setConfirmPw(e.target.value); setPwSaved(false); setPwError(""); }}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent ${confirmPw && confirmPw !== newPw ? "border-red-300" : confirmPw && confirmPw === newPw ? "border-emerald-400" : "border-[#e2e8f0]"}`}
                  placeholder="Re-enter new password"
                />
                {confirmPw && confirmPw !== newPw && <p className="text-[10px] text-red-500 mt-1">Passwords do not match</p>}
                {confirmPw && confirmPw === newPw && <p className="text-[10px] text-emerald-600 mt-1">✓ Passwords match</p>}
              </label>
            </div>

            {pwError && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg mb-4">
                <span className="text-red-500 text-xs flex-shrink-0 mt-0.5">✕</span>
                <p className="text-xs text-red-700">{pwError}</p>
              </div>
            )}
            {pwSaved && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg mb-4">
                <span className="text-emerald-600 text-xs flex-shrink-0 mt-0.5">✓</span>
                <p className="text-xs text-emerald-800">Password changed successfully.</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowPassword(false)} className="flex-1 border border-[#e2e8f0] text-[#0f172a] font-medium py-2.5 rounded-xl hover:bg-[#f8fafc] transition-colors text-sm">
                {pwSaved ? "Close" : "Cancel"}
              </button>
              {!pwSaved && (
                <button onClick={savePassword} className="flex-1 bg-[#4f46e5] text-white font-medium py-2.5 rounded-xl hover:bg-[#4338ca] transition-colors text-sm">
                  Update password
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-2xl border border-[#e2e8f0] shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-full bg-[#f1f5f9] flex items-center justify-center flex-shrink-0">
                <IconLogout className="w-5 h-5 text-[#64748b]" />
              </div>
              <h2 className="text-base font-semibold text-[#0f172a]">Log out?</h2>
            </div>
            <p className="text-sm text-[#64748b] leading-relaxed mb-6">
              Are you sure you want to log out of your account? Your progress will be saved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 border border-[#e2e8f0] text-[#0f172a] font-medium py-2.5 rounded-xl hover:bg-[#f8fafc] transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 bg-[#0f172a] text-white font-medium py-2.5 rounded-xl hover:bg-[#1e293b] transition-colors text-sm flex items-center justify-center gap-2"
              >
                <IconLogout className="w-4 h-4" />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function Sidebar({ active, onNav, userId, userName, userEmail, onLogout, onUpdateUser }: {
  active: NavItem;
  userId: number;
  onNav: (n: NavItem) => void;
  userName: string;
  userEmail: string;
  onLogout: () => void;
  onUpdateUser: (name: string, email: string) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Desktop sidebar — fixed left, full height ── */}
      <aside className="hidden md:flex w-[248px] flex-shrink-0 flex-col fixed inset-y-0 left-0 border-r border-[#e2e8f0] bg-white z-30">
<SidebarContents active={active} onNav={onNav} userId={userId} userName={userName} userEmail={userEmail} onLogout={onLogout} onUpdateUser={onUpdateUser} />
      </aside>

      {/* ── Desktop spacer so main content doesn't sit under the fixed sidebar ── */}
      <div className="hidden md:block w-[248px] flex-shrink-0" />

      {/* ── Mobile: top bar with hamburger ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#e2e8f0] flex items-center px-4 h-14">
        <div className="flex items-center gap-2.5 flex-1">
          <div className="size-7 rounded-lg bg-[#4f46e5] flex items-center justify-center text-white text-[10px] font-bold">AI</div>
          <p className="text-sm font-bold text-[#0f172a]">Career Readiness</p>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc] transition-colors"
          aria-label="Open navigation"
        >
          <IconMenu className="w-5 h-5" />
        </button>
      </div>

      {/* ── Mobile: top-bar spacer ── */}
      <div className="md:hidden h-14 flex-shrink-0 w-full" />

      {/* ── Mobile: slide-in drawer ── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white flex flex-col shadow-2xl md:hidden">
            {/* Close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#94a3b8] hover:text-[#0f172a] hover:bg-[#f8fafc] transition-colors"
              aria-label="Close navigation"
            >
              <IconClose className="w-4 h-4" />
            </button>
            <SidebarContents
              active={active}
              onNav={onNav}
              userId={userId!}
              userName={userName}
              userEmail={userEmail}
              onLogout={onLogout}
              onUpdateUser={onUpdateUser}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </>
      )}
    </>
  );
}

