import { Settings as SettingsIcon, User, Bell, Shield, Monitor } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1 font-mono">System configuration — operator preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { icon: User, label: "Account", desc: "Manage your profile and credentials", badge: "Teacher" },
          { icon: Bell, label: "Notifications", desc: "Configure alerts and reminders", badge: "Active" },
          { icon: Shield, label: "Security", desc: "Session and access controls", badge: "Secure" },
          { icon: Monitor, label: "Appearance", desc: "Theme and display settings", badge: "Dark Mode" },
        ].map(({ icon: Icon, label, desc, badge }) => (
          <div key={label} data-testid={`settings-card-${label.toLowerCase()}`} className="rounded-lg border border-border bg-card p-5 flex items-start gap-4 cursor-pointer hover:border-primary/40 transition-colors">
            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">{label}</p>
                <span className="text-xs font-mono bg-secondary text-muted-foreground px-2 py-0.5 rounded">{badge}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm tracking-wide">System Info</h2>
        </div>
        <div className="space-y-2 font-mono text-xs text-muted-foreground">
          <div className="flex justify-between"><span>Platform</span><span className="text-foreground">Veritas v1.0</span></div>
          <div className="flex justify-between"><span>Build</span><span className="text-foreground">2026.07.06</span></div>
          <div className="flex justify-between"><span>Status</span><span className="text-primary">OPERATIONAL</span></div>
        </div>
      </div>
    </div>
  );
}
