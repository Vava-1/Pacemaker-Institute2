import { Link } from 'react-router'
import { GraduationCap, Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Pacemaker Institute</span>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Empowering learners worldwide with world-class education across languages, technical skills, and AI.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> info@pacemakerinstitute.rw</div>
            <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> +250 788 987 631</div>
            <div className="flex items-center gap-2"><MapPin className="h-3 w-3" /> Kigali, Rwanda</div>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Platform</h4>
          <div className="space-y-2 text-sm">
            <Link to="/courses" className="block hover:text-blue-400 transition-colors">Courses</Link>
            <Link to="/exercises" className="block hover:text-blue-400 transition-colors">Exercises</Link>
            <Link to="/leaderboard" className="block hover:text-blue-400 transition-colors">Leaderboard</Link>
            <Link to="/ai-tutor" className="block hover:text-blue-400 transition-colors">PI Assistant</Link>
            <Link to="/live-classes" className="block hover:text-blue-400 transition-colors">Live Classes</Link>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Disciplines</h4>
          <div className="space-y-2 text-sm">
            <Link to="/courses?category=languages" className="block hover:text-blue-400 transition-colors">Languages</Link>
            <Link to="/courses?category=exam-prep" className="block hover:text-blue-400 transition-colors">Exam Preparation</Link>
            <Link to="/courses?category=mechanics" className="block hover:text-blue-400 transition-colors">Mechanics</Link>
            <Link to="/courses?category=bakery" className="block hover:text-blue-400 transition-colors">Bakery</Link>
            <Link to="/courses?category=salon" className="block hover:text-blue-400 transition-colors">Salon</Link>
            <Link to="/courses?category=ai-skills" className="block hover:text-blue-400 transition-colors">AI Skills</Link>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Legal</h4>
          <div className="space-y-2 text-sm">
            <Link to="/terms" className="block hover:text-blue-400 transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="block hover:text-blue-400 transition-colors">Privacy Policy</Link>
            <Link to="/cookies" className="block hover:text-blue-400 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} Pacemaker Institute. All rights reserved.
      </div>
    </footer>
  )
}
