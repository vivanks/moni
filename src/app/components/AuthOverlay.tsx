"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { changePassword } from "../../lib/actions/auth";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";

interface AuthOverlayProps {
  user: { id: string; name: string; mustChangePassword: boolean } | null;
}

export default function AuthOverlay({ user }: AuthOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.mustChangePassword) {
      setIsOpen(true);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const res = await changePassword(user!.id, newPassword);
    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => setIsOpen(false), 2000);
    } else {
      setError(res.error || "Internal Error");
    }
  };

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => !user?.mustChangePassword && setIsOpen(false)} 
      title="Security Required"
      size="sm"
    >
      <div className="py-4 space-y-6">
        <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-100 rounded-2xl">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Lock className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-orange-900 leading-tight">First-Time Setup Required</p>
            <p className="text-xs text-orange-700">Invited users must change their default password (12345678) before continuing.</p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-slate-900">Password Updated!</p>
              <p className="text-sm text-slate-500">Securing your family portfolio...</p>
            </div>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">New Password</label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono"
                    placeholder="Min. 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Confirm Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono"
                  placeholder="Repeat your password"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-center">
                  <p className="text-xs font-bold text-red-600 uppercase tracking-wider">{error}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 border border-slate-800 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
              Update & Continue
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}
