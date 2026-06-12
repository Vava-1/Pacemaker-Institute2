import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { GraduationCap, Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="bg-[#0f172a] text-slate-400 pt-10 md:pt-16 pb-6 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Pacemaker Institute</span>
          </div>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">
            {t('footer.tagline')}
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Mail className="h-3 w-3 text-blue-400" /> info@pacemakerinstitute.rw</div>
            <div className="flex items-center gap-2"><Phone className="h-3 w-3 text-blue-400" /> +250 786 053 720</div>
            <a href="https://maps.google.com/?q=Centenary+House+8+KN+4+Ave+Kigali+Rwanda" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-400 transition-colors"><MapPin className="h-3 w-3 text-blue-400" /> Centenary House, 8 KN 4 Ave, Kigali (3rd Floor)</a>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{t('footer.platform')}</h4>
          <div className="space-y-3 text-sm">
            <Link to="/courses" className="block hover:text-blue-400 transition-colors">{t('footer.courses')}</Link>
            <Link to="/exercises" className="block hover:text-blue-400 transition-colors">{t('footer.exercises')}</Link>
            <Link to="/leaderboard" className="block hover:text-blue-400 transition-colors">{t('footer.leaderboard')}</Link>
            <Link to="/ai-tutor" className="block hover:text-blue-400 transition-colors">{t('footer.piAssistant')}</Link>
            <Link to="/live-classes" className="block hover:text-blue-400 transition-colors">{t('footer.liveClasses')}</Link>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{t('footer.disciplines')}</h4>
          <div className="space-y-3 text-sm">
            <Link to="/courses?category=languages" className="block hover:text-blue-400 transition-colors">{t('categories.languages')}</Link>
            <Link to="/courses?category=exam-prep" className="block hover:text-blue-400 transition-colors">{t('footer.examPreparation')}</Link>
            <Link to="/courses?category=mechanics" className="block hover:text-blue-400 transition-colors">{t('footer.mechanics')}</Link>
            <Link to="/courses?category=bakery" className="block hover:text-blue-400 transition-colors">{t('footer.bakery')}</Link>
            <Link to="/courses?category=salon" className="block hover:text-blue-400 transition-colors">{t('footer.salon')}</Link>
            <Link to="/courses?category=ai-skills" className="block hover:text-blue-400 transition-colors">{t('footer.aiSkills')}</Link>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{t('footer.legal')}</h4>
          <div className="space-y-3 text-sm">
            <Link to="/terms" className="block hover:text-blue-400 transition-colors">{t('footer.termsOfService')}</Link>
            <Link to="/privacy" className="block hover:text-blue-400 transition-colors">{t('footer.privacyPolicy')}</Link>
            <Link to="/cookies" className="block hover:text-blue-400 transition-colors">{t('footer.cookiePolicy')}</Link>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 md:mt-10 pt-4 md:pt-6 border-t border-slate-800 text-center text-xs md:text-sm text-slate-500">
        &copy; {new Date().getFullYear()} Pacemaker Institute. {t('footer.allRightsReserved')}
      </div>
    </footer>
  )
}
