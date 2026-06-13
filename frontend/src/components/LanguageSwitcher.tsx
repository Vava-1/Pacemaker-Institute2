import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe } from 'lucide-react'

const languages = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'sw', label: 'Kiswahili', flag: '🇹🇿' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'rw', label: 'Kinyarwanda', flag: '🇷🇼' },
]

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const [currentLang, setCurrentLang] = useState(() => i18n.language?.split('-')[0] ?? 'en')

  useEffect(() => {
    const update = (lng: string) => setCurrentLang(lng.split('-')[0])
    i18n.on('languageChanged', update)
    return () => { i18n.off('languageChanged', update) }
  }, [i18n])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 md:h-8 w-7 md:w-8 text-slate-500" title={t('nav.language')}>
          <Globe className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={currentLang === lang.code ? 'bg-blue-50 text-blue-700 font-medium' : ''}
          >
            <span className="mr-2 text-sm">{lang.flag}</span>
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}