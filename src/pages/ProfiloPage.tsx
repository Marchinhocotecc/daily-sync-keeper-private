import React from 'react';
import { useTranslation } from 'react-i18next';
import { LifeSyncCard } from '@/components/LifeSyncCard';
import LanguageSelector from '@/components/settings/LanguageSelector';
import ThemeToggle from '@/components/settings/ThemeToggle';
import { NotificationSettings } from '@/components/settings/NotificationSettings';

const ProfiloPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mobile-padding pt-8">
        <h1 className="text-2xl font-bold text-foreground">
          {t('profile.title')}
        </h1>

        <div className="mt-6 space-y-4">
          <LifeSyncCard>
            <h3 className="font-semibold mb-3 text-foreground">{t('profile.language')}</h3>
            <LanguageSelector />
          </LifeSyncCard>

          <LifeSyncCard>
            <h3 className="font-semibold mb-3 text-foreground">{t('profile.theme')}</h3>
            <ThemeToggle />
          </LifeSyncCard>

          <NotificationSettings />
        </div>
      </div>
    </div>
  );
};

export default ProfiloPage;