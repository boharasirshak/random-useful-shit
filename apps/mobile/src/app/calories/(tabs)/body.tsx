import { BackupSection } from '@/tools/calories/features/body/BackupSection';
import { BurnSection } from '@/tools/calories/features/body/BurnSection';
import { ProfileSections } from '@/tools/calories/features/body/ProfileSections';
import { Screen } from '@/ui/Screen';

// Body: profile and activity → daily burn. Also home to backup.
export default function BodyScreen() {
  return (
    <Screen title="Body" back="Apps">
      <ProfileSections />
      <BurnSection />
      <BackupSection />
    </Screen>
  );
}
