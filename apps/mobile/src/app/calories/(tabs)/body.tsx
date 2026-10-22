import { BackupSection } from '@/tools/calories/features/body/BackupSection';
import { BurnSection } from '@/tools/calories/features/body/BurnSection';
import { ActivitySection, ProfileSections } from '@/tools/calories/features/body/ProfileSections';
import { StepWeekSection } from '@/tools/calories/features/body/StepWeekSection';
import { HelpButton } from '@/tools/calories/features/faq/HelpButton';
import { Screen } from '@/ui/Screen';

// Body: who you are and how much you move → daily burn. Also home to backup.
export default function BodyScreen() {
  return (
    <Screen title="Body" back="Apps" accessory={<HelpButton />}>
      <ProfileSections />
      <StepWeekSection />
      <ActivitySection />
      <BurnSection />
      <BackupSection />
    </Screen>
  );
}
