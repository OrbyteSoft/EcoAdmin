import { useState } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profileForm, setProfileForm] = useState({ name: user?.name || "", email: user?.email || "" });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      await api(`/users/${user?.id}`, { method: "PATCH", body: JSON.stringify(profileForm) });
      toast.success("Profile updated");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setSaving(true);
    try {
      await api(`/users/${user?.id}/password`, {
        method: "PATCH",
        body: JSON.stringify({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword }),
      });
      toast.success("Password changed");
      setPasswordForm({ oldPassword: "", newPassword: "", confirm: "" });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{user?.role}</Badge>
                <span className="text-sm text-muted-foreground">Member since —</span>
              </div>
              <div className="grid gap-2"><Label>Name</Label><Input value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Email</Label><Input value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} /></div>
              <Button onClick={handleProfileSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2"><Label>Current Password</Label><Input type="password" value={passwordForm.oldPassword} onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} /></div>
              <div className="grid gap-2"><Label>New Password</Label><Input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Confirm New Password</Label><Input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} /></div>
              <Button onClick={handlePasswordChange} disabled={saving}>{saving ? "Changing…" : "Change Password"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">Toggle between light and dark theme</p>
                  </div>
                </div>
                <Switch checked={theme === "dark"} onCheckedChange={v => setTheme(v ? "dark" : "light")} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
