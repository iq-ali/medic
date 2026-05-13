import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Shield, Brain, Baby, GraduationCap, Stethoscope, BookOpen,
  ChevronRight, ArrowRight, Menu, X, Sparkles, HandHeart, Star,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import type { LucideIcon } from 'lucide-react'

// ── Static data ───────────────────────────────────────────────────────────────

const SPONSORS = [
  { name: 'TechBridge Foundation', abbr: 'TB', color: '#3b82f6' },
  { name: 'EduCare Partners',      abbr: 'EC', color: '#10b981' },
  { name: 'HealthFirst Trust',     abbr: 'HF', color: '#ef4444' },
  { name: 'KidSupport Network',    abbr: 'KS', color: '#f59e0b' },
  { name: 'ScholarPath Fund',      abbr: 'SP', color: '#8b5cf6' },
  { name: 'CaringHands NGO',       abbr: 'CH', color: '#ec4899' },
  { name: 'BrightMinds Trust',     abbr: 'BM', color: '#14b8a6' },
  { name: 'LearnMore Foundation',  abbr: 'LM', color: '#6366f1' },
]

interface RoleCard { icon: LucideIcon; title: string; gradient: string; points: string[] }
const ROLES: RoleCard[] = [
  { icon: Shield,      title: 'Admin',     gradient: 'from-violet-500 to-indigo-600',  points: ['Manage all user accounts', 'Approve or decline signups', 'Full platform oversight', 'Configure system settings'] },
  { icon: Stethoscope, title: 'Doctor',    gradient: 'from-blue-500 to-cyan-600',      points: ['View student medical records', 'Schedule & manage appointments', 'Submit new medical reports', 'Coordinate with teaching staff'] },
  { icon: Brain,       title: 'Therapist', gradient: 'from-purple-500 to-violet-600',  points: ['Track therapy sessions', 'Access student profiles', 'Schedule therapy appointments', 'Collaborate with educators'] },
  { icon: BookOpen,    title: 'Teacher',   gradient: 'from-emerald-500 to-teal-600',   points: ['View students in your class', 'Access relevant support info', 'Stay updated on appointments', 'Liaise with medical staff'] },
  { icon: Baby,        title: 'Parent',    gradient: 'from-amber-500 to-orange-600',   points: ["Monitor your child's profile", 'View upcoming appointments', 'Stay informed on care plans', 'Communicate with the team'] },
  { icon: GraduationCap, title: 'Student', gradient: 'from-rose-500 to-pink-600',     points: ['View your appointments', 'Access your profile details', 'See upcoming sessions', 'Stay connected to your care'] },
]

const STEPS = [
  { n: '01', title: 'Create your account',  body: 'Sign up with your name, email, and role. It takes under two minutes.' },
  { n: '02', title: 'Get approved',          body: 'An administrator reviews and approves your account to keep the platform secure.' },
  { n: '03', title: 'Start working',         body: 'Log in and access the tools built for your role — students, records, appointments, and more.' },
]

const AMOUNTS = [100, 500, 1_000, 2_500]

// ── Donate modal ──────────────────────────────────────────────────────────────

function DonateModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<number>(500)
  const [custom, setCustom] = useState('')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#4f46e5,#0891b2)' }}>
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-white/20 flex items-center justify-center">
              <Heart className="size-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Support EduPal</h2>
              <p className="text-xs text-white/70">Help us reach more schools</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-600 leading-relaxed">
            Your donation helps maintain this platform and extend disability support to more
            schools and families across the country.
          </p>

          {/* Amount buttons */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Select amount (KSh)</p>
            <div className="grid grid-cols-4 gap-2">
              {AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => { setSelected(a); setCustom('') }}
                  className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                    selected === a && !custom
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {a.toLocaleString()}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="Custom amount"
              value={custom}
              onChange={(e) => { setCustom(e.target.value); setSelected(0) }}
              className="mt-2 w-full h-10 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none px-3 text-sm text-gray-700"
            />
          </div>

          {/* Payment methods */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Payment method</p>
            <div className="grid grid-cols-2 gap-2">
              {['PayPal', 'Bank Transfer'].map((m) => (
                <div key={m} className="relative">
                  <button disabled className="w-full py-2.5 rounded-xl border-2 border-gray-100 text-sm font-semibold text-gray-300 cursor-not-allowed">
                    {m}
                  </button>
                  <span className="absolute -top-2 right-2 text-[9px] bg-amber-100 text-amber-700 font-black px-1.5 py-0.5 rounded-full tracking-wide">
                    SOON
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            disabled
            className="w-full py-3 rounded-xl bg-indigo-50 text-indigo-300 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2"
          >
            <HandHeart className="size-4" />
            Payment integration coming soon
          </button>

          <p className="text-center text-xs text-gray-400">
            To donate now, email us at{' '}
            <a href="mailto:donate@edupal.org" className="text-indigo-500 hover:underline">donate@edupal.org</a>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

// ── Landing page ──────────────────────────────────────────────────────────────

export function LandingPage() {
  const user = useAuthStore((s) => s.user)
  const [scrolled, setScrolled]     = useState(false)
  const [menuOpen, setMenuOpen]     = useState(false)
  const [donateOpen, setDonateOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  if (user) return <Navigate to="/dashboard" replace />

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.55, ease: 'easeOut' as const, delay },
  })

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ── Navbar ────────────────────────────────────────────── */}
      <header className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-100' : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <span className={`text-xl font-black tracking-tight transition-colors ${scrolled ? 'text-indigo-700' : 'text-white'}`}>
            EduPal
          </span>

          <nav className="hidden md:flex items-center gap-7">
            {[['About', '#about'], ['How it works', '#how-it-works'], ['For families', '#roles'], ['Donate', '#donate']].map(([label, href]) => (
              <a key={label} href={href}
                className={`text-sm font-medium transition-colors hover:opacity-80 ${scrolled ? 'text-gray-700' : 'text-white/85'}`}>
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login"
              className={`text-sm font-semibold transition-colors ${scrolled ? 'text-indigo-700 hover:text-indigo-900' : 'text-white/90 hover:text-white'}`}>
              Sign in
            </Link>
            <Link to="/signup"
              className="text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm">
              Get started
            </Link>
          </div>

          <button
            className={`md:hidden p-1 transition-colors ${scrolled ? 'text-gray-700' : 'text-white'}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
            >
              <div className="px-5 py-4 space-y-3">
                {[['About', '#about'], ['How it works', '#how-it-works'], ['For families', '#roles'], ['Donate', '#donate']].map(([label, href]) => (
                  <a key={label} href={href} className="block text-sm font-medium text-gray-700 py-1"
                    onClick={() => setMenuOpen(false)}>{label}</a>
                ))}
                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <Link to="/login" className="flex-1 text-center py-2.5 rounded-lg border-2 border-indigo-200 text-sm font-bold text-indigo-600">Sign in</Link>
                  <Link to="/signup" className="flex-1 text-center py-2.5 rounded-lg bg-indigo-600 text-sm font-bold text-white">Get started</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section id="about" className="relative min-h-screen flex items-center pt-16"
        style={{ background: 'linear-gradient(135deg,#1a0845 0%,#3730a3 42%,#0c4a6e 75%,#0f766e 100%)' }}>

        {/* Ambient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/3 size-[500px] rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 size-80 rounded-full bg-teal-400/20 blur-3xl" />
          <div className="absolute top-1/2 right-1/3 size-64 rounded-full bg-violet-500/10 blur-2xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 py-28 text-center space-y-8 w-full">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
              <Sparkles className="size-3" /> Disability support for modern schools
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-[3.75rem] font-black text-white leading-tight tracking-tight">
              Every learner deserves<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg,#a5f3fc,#a78bfa)' }}>
                the right support.
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }}
            className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed"
          >
            EduPal connects schools, clinics, and families to coordinate disability support —
            medical records, appointments, and student profiles all in one secure place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.28 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/signup"
              className="flex items-center gap-2 bg-white text-indigo-700 font-black px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors text-sm shadow-2xl">
              Get started free <ArrowRight className="size-4" />
            </Link>
            <Link to="/login"
              className="flex items-center gap-2 border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-sm">
              Sign in to your account
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.42 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            {[{ v: '500+', l: 'Students supported' }, { v: '12', l: 'Partner schools' }, { v: '95%', l: 'Satisfaction rate' }].map(({ v, l }) => (
              <div key={l} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-6 py-4 text-white">
                <p className="text-3xl font-black">{v}</p>
                <p className="text-xs text-white/60 mt-0.5 font-medium">{l}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 inset-x-0 overflow-hidden leading-none">
          <svg viewBox="0 0 1440 72" preserveAspectRatio="none" className="w-full fill-white" style={{ height: 56 }}>
            <path d="M0,36 C480,72 960,0 1440,36 L1440,72 L0,72 Z" />
          </svg>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-white px-5">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-2">Simple process</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">How it works</h2>
            <p className="text-gray-500 mt-3 text-sm max-w-md mx-auto">Three simple steps to get your team connected and working together.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map(({ n, title, body }, i) => (
              <motion.div key={n} {...fadeUp(i * 0.1)}>
                <div className="relative rounded-2xl border-2 border-indigo-50 bg-white p-8 h-full group hover:border-indigo-200 hover:shadow-lg transition-all duration-300">
                  <span className="text-6xl font-black text-indigo-100 group-hover:text-indigo-200 transition-colors">{n}</span>
                  <h3 className="text-lg font-bold text-gray-900 mt-4 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
                  {i < 2 && (
                    <div className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 size-8 rounded-full bg-indigo-100 items-center justify-center">
                      <ChevronRight className="size-4 text-indigo-400" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Role cards ────────────────────────────────────────── */}
      <section id="roles" className="py-24 px-5" style={{ background: 'oklch(0.97 0.008 265)' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-2">Built for everyone</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Your role, your tools</h2>
            <p className="text-gray-500 mt-3 text-sm max-w-lg mx-auto">
              Every person in the support network gets a tailored experience with exactly the tools they need.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ROLES.map(({ icon: Icon, title, gradient, points }, i) => (
              <motion.div key={title} {...fadeUp(i * 0.07)}>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 h-full">
                  <div className={`size-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-sm`}>
                    <Icon className="size-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-base">{title}</h3>
                  <ul className="space-y-2">
                    {points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-gray-500">
                        <Star className="size-3 mt-0.5 shrink-0 text-indigo-300" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Donate ────────────────────────────────────────────── */}
      <section id="donate" className="py-24 px-5 text-white"
        style={{ background: 'linear-gradient(135deg,#4338ca 0%,#0891b2 100%)' }}>
        <div className="max-w-3xl mx-auto text-center space-y-7">
          <motion.div {...fadeUp()}>
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-white/15 mb-4">
              <Heart className="size-7 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">Support inclusive education</h2>
            <p className="text-white/70 mt-4 text-base leading-relaxed max-w-xl mx-auto">
              EduPal is built to serve students with disabilities and the teams supporting them.
              Your contribution helps us maintain the platform and extend it to more schools.
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.12)} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setDonateOpen(true)}
              className="flex items-center gap-2.5 bg-white text-indigo-700 font-black px-8 py-4 rounded-xl hover:bg-indigo-50 transition-colors text-sm shadow-xl"
            >
              <Heart className="size-4" /> Donate now
            </button>
            <Link to="/signup"
              className="flex items-center gap-2.5 border-2 border-white/30 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors text-sm">
              Join as a volunteer <ArrowRight className="size-4" />
            </Link>
          </motion.div>

          <motion.div {...fadeUp(0.2)} className="grid grid-cols-3 gap-4 max-w-lg mx-auto pt-4">
            {[['100%', 'Goes to platform'], ['7 days', 'Support response'], ['Free', 'For all schools']].map(([v, l]) => (
              <div key={l} className="bg-white/10 border border-white/15 rounded-xl py-4 px-2">
                <p className="text-xl font-black">{v}</p>
                <p className="text-xs text-white/60 mt-0.5">{l}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Sponsors ──────────────────────────────────────────── */}
      <section className="py-16 bg-white overflow-hidden">
        <motion.div {...fadeUp()} className="text-center mb-10">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Proudly supported by</p>
        </motion.div>

        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 inset-y-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 inset-y-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <div
            className="flex gap-5 w-max"
            style={{ animation: 'marquee 32s linear infinite' }}
          >
            {[...SPONSORS, ...SPONSORS].map(({ name, abbr, color }, i) => (
              <div key={`${abbr}-${i}`}
                className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-5 py-3.5 shrink-0 select-none">
                <div className="size-10 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0"
                  style={{ backgroundColor: color }}>
                  {abbr}
                </div>
                <span className="text-sm font-bold text-gray-700 whitespace-nowrap">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-gray-950 text-gray-400 py-14 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10">
            <div className="space-y-3 max-w-xs">
              <p className="text-white font-black text-2xl tracking-tight">EduPal</p>
              <p className="text-sm leading-relaxed">
                Connecting schools, clinics, and families to support every learner with a disability.
              </p>
              <a href="mailto:support@edupal.org" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors block">
                support@edupal.org
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 text-sm">
              <div className="space-y-3">
                <p className="text-white font-bold">Platform</p>
                <Link to="/signup" className="block hover:text-white transition-colors">Sign up</Link>
                <Link to="/login" className="block hover:text-white transition-colors">Sign in</Link>
              </div>
              <div className="space-y-3">
                <p className="text-white font-bold">Organisation</p>
                <a href="#about" className="block hover:text-white transition-colors">About</a>
                <a href="#donate" className="block hover:text-white transition-colors">Contact</a>
                <button onClick={() => setDonateOpen(true)} className="block hover:text-white transition-colors text-left">Donate</button>
              </div>
              <div className="space-y-3">
                <p className="text-white font-bold">Legal</p>
                <span className="block text-gray-700 cursor-not-allowed">Privacy policy</span>
                <span className="block text-gray-700 cursor-not-allowed">Terms of service</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-6 text-xs text-center text-gray-700">
            © {new Date().getFullYear()} EduPal. All rights reserved. Built with care for every learner.
          </div>
        </div>
      </footer>

      {/* ── Donate modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {donateOpen && <DonateModal onClose={() => setDonateOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}
