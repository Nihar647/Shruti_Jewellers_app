"use client";

import { useState, useEffect } from "react";
import { User, Camera, Save, Loader2, CheckCircle2 } from "lucide-react";
import { insforge } from "@/lib/insforge";

export default function ProfilePage() {
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function getProfile() {
      try {
        const { data, error } = await insforge.database
          .from("profiles")
          .select("*")
          .single();

        if (data) {
          setFullName(data.full_name || "");
          setAvatarUrl(data.avatar_url);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    }
    getProfile();
  }, []);

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await insforge.storage
        .from("user-profiles")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = insforge.storage
        .from("user-profiles")
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
    } catch (error) {
      alert("Error uploading image!");
      console.error(error);
    } finally {
      setUploading(false);
    }
  }

  async function updateProfile() {
    try {
      setSaving(true);
      const { error } = await insforge.database
        .from("profiles")
        .upsert({
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      alert("Error updating profile!");
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#c9a84c]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-3xl font-serif text-gradient font-bold mb-1">Profile Settings</h2>
        <p className="text-muted">Manage your business profile and identity</p>
      </div>

      <div className="glass-panel p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full border-2 border-card-border overflow-hidden bg-card flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-muted" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-[#c9a84c] p-2 rounded-full cursor-pointer hover:bg-[#b3923c] transition-colors shadow-lg">
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-black" />
              ) : (
                <Camera className="w-5 h-5 text-black" />
              )}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
              />
            </label>
          </div>
          <p className="mt-4 text-xs text-muted">Click the camera to upload a new profile picture</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-muted mb-2">Display Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-card border border-card-border focus:border-[#c9a84c] rounded-lg py-2.5 px-4 text-foreground placeholder-gray-600 outline-none transition-colors"
              placeholder="Your Full Name or Business Name"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={updateProfile}
              disabled={saving}
              className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold transition-all ${
                success
                  ? "bg-green-500/20 text-green-400 border border-green-500/50"
                  : "bg-[#c9a84c] hover:bg-[#b3923c] text-black"
              }`}
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : success ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saving ? "Saving..." : success ? "Saved Successfully" : "Update Profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
