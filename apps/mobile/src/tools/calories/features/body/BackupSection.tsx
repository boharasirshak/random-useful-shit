import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { downloadBackup, uploadBackup } from '@/tools/calories/backup/drive';
import { useGoogleDriveToken } from '@/tools/calories/backup/google';
import { fromBackup, toBackup } from '@/tools/calories/lib/backup';
import { appData, useApp } from '@/tools/calories/store/app';
import { confirm, notify } from '@/ui/confirm';
import { Row } from '@/ui/Row';
import { Section } from '@/ui/Section';
import { useColors } from '@/ui/theme';

// Back up / restore the Calorie Tracker to the user's Google Drive (hidden app folder). Lives on the Account screen.
export function BackupSection() {
  const c = useColors();
  const google = useGoogleDriveToken();
  const lastBackup = useApp(s => s.lastBackup);
  const [busy, setBusy] = useState<'up' | 'down' | null>(null);

  async function run(kind: 'up' | 'down') {
    setBusy(kind);
    try {
      const token = await google.getToken();
      if (kind === 'up') {
        const file = toBackup(appData(useApp.getState()));
        await uploadBackup(token, JSON.stringify(file));
        useApp.getState().markBackedUp(file.savedAt);
        notify('Backed up', 'Your data is saved to Google Drive.');
        return;
      }
      const json = await downloadBackup(token);
      if (!json) return notify('No backup found', 'Back up from a device first.');
      const file = fromBackup(json);
      const ok = await confirm('Restore backup?', `This replaces everything on this device with the backup from ${new Date(file.savedAt).toLocaleString()}.`, 'Restore');
      if (ok) useApp.getState().restore(file.data);
    } catch (e) {
      if (!String(e).includes('cancelled')) notify('Backup failed', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  const footer = !google.configured ? 'Not set up in this build yet.'
    : lastBackup ? `Last backup ${new Date(lastBackup).toLocaleString()}` : undefined;
  const disabled = !google.configured || !google.ready || busy != null;

  return (
    <Section header="Calorie Tracker backup" footer={footer}>
      <Row title="Back Up to Google Drive" tint={!disabled} onPress={disabled ? undefined : () => run('up')}
        right={busy === 'up' ? <ActivityIndicator color={c.secondary} /> : undefined} />
      <Row title="Restore from Google Drive" tint={!disabled} onPress={disabled ? undefined : () => run('down')}
        right={busy === 'down' ? <ActivityIndicator color={c.secondary} /> : undefined} />
    </Section>
  );
}
