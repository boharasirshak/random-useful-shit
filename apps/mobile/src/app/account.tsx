import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { api, syncBlocked } from '@/shared/api';
import { useAccount } from '@/shared/account/store';
import { useGoogleIdToken } from '@/shared/google';
import { signedIn, signedOut, syncNow, type Session } from '@/shared/sync/engine';
import { Button } from '@/ui/Button';
import { confirm, notify } from '@/ui/confirm';
import { Row } from '@/ui/Row';
import { Screen } from '@/ui/Screen';
import { Section } from '@/ui/Section';
import { space, type, useColors } from '@/ui/theme';

const ago = (t: number | null) => {
  if (!t) return 'Not yet';
  const m = Math.round((Date.now() - t) / 60_000);
  return m < 1 ? 'Just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};

// Account and sync for every tool. The app works fully offline; this decides whether it also keeps a copy on your server.
export default function AccountScreen() {
  const c = useColors();
  const { user, sync, lastSync, syncing, error } = useAccount();
  const set = useAccount(s => s.set);
  const google = useGoogleIdToken();
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    try {
      const idToken = await google.getIdToken();
      await signedIn(await api<Session>('/auth/google', { body: { id_token: idToken } }));
    } catch (e) {
      if ((e as Error).message !== 'Sign-in cancelled') notify('Couldn’t sign in', (e as Error).message);
    }
    setBusy(false);
  };
  const signOut = async () => {
    if (!(await confirm('Sign out?', 'Sync stops. Everything stays on this device.', 'Sign Out'))) return;
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    await signedOut();
  };
  const remove = async () => {
    if (!(await confirm('Delete your account?', 'This deletes your account and everything synced to the server. This device keeps its own copy.', 'Delete'))) return;
    try {
      await api('/auth/me', { method: 'DELETE' });
      await signedOut();
    } catch (e) { notify('Couldn’t delete it', (e as Error).message); }
  };
  const toggle = (on: boolean) => {
    set({ sync: on });
    if (on) syncNow();
  };

  if (syncBlocked)
    return (
      <Screen title="Account" back="Apps">
        <Section footer="Everything works offline and stays on this device.">
          <Row title="Sync is off" subtitle={syncBlocked} />
        </Section>
      </Screen>
    );

  const status = syncing ? 'Syncing…' : error ?? ago(lastSync);
  return (
    <Screen title="Account" back="Apps">
      <Section header="Sync" footer="Everything is saved on this device first and works offline. With sync on, your calorie logs, weigh-ins, profile, and Unrot likes, saves and taste go to your server whenever you’re online, so another device can pick them up.">
        <Row title="Sync my data" right={<Switch value={sync} onValueChange={toggle} />} />
        {sync && <Row title="Last synced" value={status} valueColor={error && !syncing ? c.orange : undefined} />}
        {sync && <Row title="Sync now" tint onPress={syncing ? undefined : () => { syncNow(); }} />}
      </Section>
      <Section header="Account" footer={user?.anonymous || !user ? 'Without signing in, this device has its own private account. Sign in to use the same data on all your devices.' : undefined}>
        {user && !user.anonymous ? (
          <>
            <Row title={user.name ?? 'Signed in'} subtitle={user.email ?? undefined} />
            <Row title="Sign out" tint onPress={signOut} />
          </>
        ) : (
          <View style={{ padding: space.lg, gap: space.sm }}>
            <Text style={[type.body, { color: c.label }]}>{user ? 'Not signed in (private to this device)' : 'Not signed in'}</Text>
            <Button title="Sign in with Google" onPress={signIn} disabled={!google.configured || !google.ready} busy={busy} />
            {!google.configured && <Text style={[type.footnote, { color: c.secondary }]}>Add Google client IDs to .env to sign in (see the README).</Text>}
          </View>
        )}
      </Section>
      {user && (
        <Section>
          <Row title="Delete account and server data" tint valueColor={c.red} onPress={remove} />
        </Section>
      )}
    </Screen>
  );
}
