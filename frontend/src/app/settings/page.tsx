export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text)' }}>Settings</h1>
      <p className="text-sm" style={{ color: 'var(--text-3)' }}>Organization, playbooks, integrations</p>
      <div className="mt-8 p-6 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>Settings coming in V1.1 — playbook editor, email config, team management.</p>
      </div>
    </div>
  )
}
