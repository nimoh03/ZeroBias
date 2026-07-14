import Link from 'next/link';
import { 
  Zap, Play, Bot, Sparkles, TrendingUp, Activity, 
  FileText, MessageSquare, Network, CheckCircle2, 
  Star, ChevronDown, ArrowRight 
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface selection:bg-primary-fixed selection:text-on-primary-fixed font-sans text-on-surface">
      
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 h-20 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap size={18} className="text-white" fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight">HireFlow AI</span>
          </div>
          <div className="hidden md:flex gap-8">
            <Link href="#product" className="text-sm font-semibold text-primary border-b-2 border-primary py-7">Product</Link>
            <Link href="#features" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors py-7">Features</Link>
            <Link href="#pricing" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors py-7">Pricing</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors py-7">How it Works</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/jobs" className="text-sm font-medium text-on-surface-variant hover:text-primary hidden sm:block">Sign In</Link>
          <Link href="/jobs" className="bg-primary text-on-primary text-sm font-bold px-6 py-2.5 rounded-full hover:opacity-90 transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5">
            Request Demo
          </Link>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 md:py-32 px-6 max-w-[1400px] mx-auto text-center lg:text-left">
          {/* Ambient Glow */}
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="z-10 relative">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-xs font-bold bg-primary-container/10 border border-primary/20 text-primary rounded-full uppercase tracking-wider">
                <Sparkles size={14} /> New: GPT-4o Powered Screening
              </span>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.1]">
                Screen candidates <br className="hidden lg:block"/> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">while you sleep</span>
              </h1>
              <p className="text-lg text-on-surface-variant mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                HireFlow AI automates initial pre-interviews through natural conversation. Find your best fit among thousands of applicants without lifting a finger.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/jobs" className="bg-primary text-on-primary text-base font-bold px-8 py-4 rounded-xl hover:scale-[1.02] transition-transform shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
                  Start Free Trial <ArrowRight size={18} />
                </Link>
                <button className="bg-surface text-on-surface border-2 border-outline-variant text-base font-bold px-8 py-4 rounded-xl hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2">
                  <Play size={18} /> Watch Demo
                </button>
              </div>
            </div>

            {/* Mockup of AI Chat */}
            <div className="relative group w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-tertiary/30 blur-2xl rounded-[2rem] opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-surface/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-white/20 transition-transform duration-700 hover:-translate-y-2">
                
                <div className="bg-surface-container-low/80 p-4 border-b border-outline-variant/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-error"></div>
                    <div className="w-3 h-3 rounded-full bg-tertiary"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-xs font-bold text-on-surface-variant">Live Interview: Sarah J.</span>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">SJ</div>
                </div>
                
                <div className="p-6 space-y-5 h-[420px] bg-surface-container-lowest">
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center shadow-sm">
                      <Bot size={16} className="text-white" />
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-2xl rounded-tl-none border border-outline-variant/30">
                      <p className="text-sm">Hi Sarah! I'm HireFlow AI. Could you tell me about your experience managing React projects with high traffic?</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-surface-container-highest flex-shrink-0 border border-outline-variant">
                       {/* Placeholder for candidate image */}
                       <div className="w-full h-full rounded-full bg-outline-variant/30"></div>
                    </div>
                    <div className="bg-primary text-on-primary p-4 rounded-2xl rounded-tr-none shadow-md">
                      <p className="text-sm">Absolutely. At my last role, I scaled a dashboard for 50k DAU using Next.js and optimized our bundle size by 40%.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center shadow-sm">
                      <Bot size={16} className="text-white" />
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-2xl rounded-tl-none border border-outline-variant/30">
                      <p className="text-sm">Impressive. How did you handle the state management for that specific scale?</p>
                    </div>
                  </div>
                </div>

                {/* AI Insight Overlay */}
                <div className="absolute bottom-6 right-6 left-6 p-4 bg-primary-container text-on-primary-container rounded-xl shadow-2xl backdrop-blur-md flex items-center justify-between border border-white/10 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-500">
                  <div className="flex items-center gap-3">
                    <Sparkles size={24} className="text-tertiary-fixed" />
                    <div>
                      <p className="text-sm font-bold">AI Insight: Skill Match 94%</p>
                      <p className="text-[10px] opacity-80 uppercase tracking-wider font-bold mt-0.5">Strong technical proficiency</p>
                    </div>
                  </div>
                  <TrendingUp size={20} className="opacity-80" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="py-24 px-6 max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Enterprise-grade Intelligence</h2>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">Precision-engineered tools to help your hiring team move 10x faster without sacrificing quality.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 (Spans 2 cols) */}
            <div className="md:col-span-2 bg-surface/50 backdrop-blur-md border border-outline-variant/50 p-8 rounded-3xl hover:border-primary/30 transition-all group shadow-sm">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                    <Activity size={28} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Automated Scoring</h3>
                  <p className="text-on-surface-variant">Our engine evaluates candidates based on your specific rubric, ensuring unbiased and consistent grading every time.</p>
                </div>
                <div className="hidden sm:flex gap-2">
                  <div className="w-12 h-2 rounded-full bg-primary/20"></div>
                  <div className="w-12 h-2 rounded-full bg-primary"></div>
                  <div className="w-12 h-2 rounded-full bg-primary/20"></div>
                </div>
              </div>
              <div className="h-48 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-6 flex flex-col justify-center space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>Problem Solving</span>
                    <span className="text-primary">8.5/10</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="w-[85%] h-full bg-primary rounded-full"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>Communication</span>
                    <span className="text-primary">9.2/10</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="w-[92%] h-full bg-primary rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-surface/50 backdrop-blur-md border border-outline-variant/50 p-8 rounded-3xl hover:border-primary/30 transition-all group shadow-sm flex flex-col">
              <div className="w-14 h-14 bg-tertiary/10 rounded-2xl flex items-center justify-center mb-6 text-tertiary group-hover:scale-110 transition-transform">
                <FileText size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Smart CV Parsing</h3>
              <p className="text-on-surface-variant mb-8 flex-1">Extract insights, not just text. We map skills to your job requirements instantly.</p>
              <div className="h-32 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl flex items-center justify-center">
                <FileText size={40} className="text-outline-variant animate-pulse" />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-surface/50 backdrop-blur-md border border-outline-variant/50 p-8 rounded-3xl hover:border-primary/30 transition-all group shadow-sm">
              <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 text-secondary group-hover:scale-110 transition-transform">
                <MessageSquare size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Transcripts</h3>
              <p className="text-on-surface-variant">Full word-for-word text records of every AI interaction for legal compliance and easy review.</p>
            </div>

            {/* Feature 4 (Spans 2 cols) */}
            <div className="md:col-span-2 bg-surface/50 backdrop-blur-md border border-outline-variant/50 p-8 rounded-3xl hover:border-primary/30 transition-all flex flex-col md:flex-row gap-8 items-center group shadow-sm">
              <div className="flex-1">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                  <Network size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-3">API Integrations</h3>
                <p className="text-on-surface-variant">Connect with Greenhouse, Lever, Workday, and 50+ other ATS platforms seamlessly.</p>
              </div>
              <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
                <div className="w-16 h-16 rounded-2xl bg-surface-container-highest flex items-center justify-center font-black text-xl text-on-surface shadow-inner">GH</div>
                <div className="w-16 h-16 rounded-2xl bg-surface-container-highest flex items-center justify-center font-black text-xl text-on-surface shadow-inner">LV</div>
                <div className="w-16 h-16 rounded-2xl bg-surface-container-highest flex items-center justify-center font-black text-xl text-on-surface shadow-inner">WD</div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works Timeline */}
        <section id="how-it-works" className="py-24 bg-surface-container-low/50 border-y border-outline-variant/30">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">From Post to Hire in Days</h2>
              <p className="text-lg text-on-surface-variant">Experience the future of recruiting workflow.</p>
            </div>
            
            <div className="relative">
              <div className="hidden lg:block absolute top-8 left-12 right-12 h-[2px] bg-outline-variant/50"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                {[
                  { step: 1, title: "Post Link", desc: "Share your HireFlow link on job boards or in your ATS. Candidates click to start." },
                  { step: 2, title: "Candidate Chat", desc: "AI interviews applicants 24/7, answering their questions while gathering data." },
                  { step: 3, title: "AI Scores", desc: "The engine rank-orders candidates based on performance and experience fit." },
                  { step: 4, title: "Review & Hire", desc: "Your team reviews the top 1% of talent and books final human interviews." }
                ].map((item) => (
                  <div key={item.step} className="relative group text-center lg:text-left">
                    <div className="w-16 h-16 mx-auto lg:mx-0 bg-primary text-white rounded-full flex items-center justify-center font-black text-2xl mb-8 relative z-10 transition-transform group-hover:scale-110 shadow-xl shadow-primary/20 ring-8 ring-surface">
                      {item.step}
                    </div>
                    <h4 className="text-xl font-bold mb-3">{item.title}</h4>
                    <p className="text-on-surface-variant leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 px-6 max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Simple, Scalable Pricing</h2>
            <p className="text-lg text-on-surface-variant">Find the perfect plan for your team's velocity.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 items-center">
            {/* Starter */}
            <div className="p-8 rounded-3xl border border-outline-variant bg-surface flex flex-col shadow-sm">
              <h4 className="text-lg font-bold text-on-surface-variant mb-2">Starter</h4>
              <div className="text-5xl font-black mb-4">$49<span className="text-lg font-medium text-on-surface-variant">/mo</span></div>
              <p className="text-on-surface-variant mb-8 pb-8 border-b border-outline-variant/50">Perfect for early-stage startups hiring 1-2 roles.</p>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3"><CheckCircle2 className="text-primary shrink-0" size={20} /> <span className="font-medium">3 Active Job Posts</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="text-primary shrink-0" size={20} /> <span className="font-medium">100 AI Screens / Month</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="text-primary shrink-0" size={20} /> <span className="font-medium">Email Support</span></li>
              </ul>
              <button className="w-full py-4 border-2 border-outline-variant rounded-xl font-bold hover:bg-surface-container-low transition-colors">Choose Starter</button>
            </div>
            
            {/* Pro */}
            <div className="p-8 rounded-3xl bg-primary text-on-primary relative flex flex-col shadow-2xl scale-105 z-10 border border-primary-container">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-tertiary text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg">Most Popular</div>
              <h4 className="text-lg font-bold text-primary-fixed mb-2">Pro</h4>
              <div className="text-5xl font-black mb-4">$199<span className="text-lg font-medium text-primary-fixed">/mo</span></div>
              <p className="text-primary-fixed mb-8 pb-8 border-b border-primary-container">For growing companies with ongoing hiring needs.</p>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3"><CheckCircle2 className="text-white shrink-0" size={20} /> <span className="font-medium">Unlimited Job Posts</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="text-white shrink-0" size={20} /> <span className="font-medium">1,000 AI Screens / Month</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="text-white shrink-0" size={20} /> <span className="font-medium">ATS Integration API</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="text-white shrink-0" size={20} /> <span className="font-medium">Priority Support</span></li>
              </ul>
              <button className="w-full py-4 bg-white text-primary rounded-xl font-bold hover:bg-surface transition-colors shadow-lg">Get Started with Pro</button>
            </div>
            
            {/* Enterprise */}
            <div className="p-8 rounded-3xl border border-outline-variant bg-surface flex flex-col shadow-sm">
              <h4 className="text-lg font-bold text-on-surface-variant mb-2">Enterprise</h4>
              <div className="text-5xl font-black mb-4">Custom</div>
              <p className="text-on-surface-variant mb-8 pb-8 border-b border-outline-variant/50">Tailored solutions for massive scale and security.</p>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3"><CheckCircle2 className="text-primary shrink-0" size={20} /> <span className="font-medium">Dedicated AI Fine-tuning</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="text-primary shrink-0" size={20} /> <span className="font-medium">Custom SSO & Security</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="text-primary shrink-0" size={20} /> <span className="font-medium">Dedicated Account Manager</span></li>
              </ul>
              <button className="w-full py-4 border-2 border-outline-variant rounded-xl font-bold hover:bg-surface-container-low transition-colors">Contact Sales</button>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 bg-surface-container-lowest border-y border-outline-variant/30">
          <div className="max-w-[1200px] mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
            <div className="w-full lg:w-1/3 text-center lg:text-left">
              <h2 className="text-4xl font-bold mb-6 tracking-tight">Trusted by the world's best recruiters.</h2>
              <div className="flex justify-center lg:justify-start gap-1 mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} size={24} className="text-primary fill-primary" />)}
              </div>
              <p className="text-lg font-medium text-on-surface-variant">Rated 4.9/5 on G2 Crowd</p>
            </div>
            
            <div className="w-full lg:w-2/3 grid sm:grid-cols-2 gap-6">
              <div className="p-8 bg-surface rounded-3xl border border-outline-variant/50 shadow-sm">
                <p className="text-lg font-medium italic mb-8 leading-relaxed">"HireFlow AI cut our time-to-interview by 65%. It's like having five extra recruiters working through the night."</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-outline-variant/30"></div>
                  <div>
                    <p className="font-bold">Alex Chen</p>
                    <p className="text-sm text-on-surface-variant">Head of Talent @ TechScale</p>
                  </div>
                </div>
              </div>
              <div className="p-8 bg-surface rounded-3xl border border-outline-variant/50 shadow-sm">
                <p className="text-lg font-medium italic mb-8 leading-relaxed">"The AI's ability to probe deeper on technical skills is what surprised us most. It's truly conversational."</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-outline-variant/30"></div>
                  <div>
                    <p className="font-bold">Sarah Williams</p>
                    <p className="text-sm text-on-surface-variant">Recruitment Lead @ Innovate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 px-6 max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 tracking-tight">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "How does the AI understand technical job requirements?", a: "Our models are trained on millions of job descriptions and interview transcripts. We also allow you to upload specific rubrics and golden responses to calibrate the AI for your unique hiring bar." },
              { q: "Is it easy to integrate with my existing ATS?", a: "Yes, we offer one-click integrations for major platforms like Greenhouse and Lever. For custom systems, our robust REST API allows your developers to pipe data wherever you need it." },
              { q: "Can candidates tell they're talking to an AI?", a: "We prioritize transparency. Every interaction begins with a disclaimer. However, the conversation is so fluid and context-aware that 89% of candidates report a highly positive experience." }
            ].map((faq, i) => (
              <details key={i} className="group bg-surface-container-lowest rounded-2xl border border-outline-variant/50 overflow-hidden cursor-pointer">
                <summary className="flex justify-between items-center p-6 font-bold text-lg list-none hover:bg-surface-container-low transition-colors">
                  {faq.q}
                  <ChevronDown className="transition-transform group-open:rotate-180 text-on-surface-variant" />
                </summary>
                <div className="p-6 pt-0 text-on-surface-variant leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6 max-w-[1200px] mx-auto mb-12">
          <div className="bg-primary rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-container"></div>
            {/* Decorative circles */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-black/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Ready to transform your hiring?</h2>
              <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto text-primary-fixed">Join 500+ companies already using HireFlow AI to find their next superstar team members.</p>
              <Link href="/jobs" className="inline-block bg-white text-primary text-lg font-bold px-12 py-5 rounded-2xl hover:scale-105 transition-transform shadow-xl">
                Get Started Free
              </Link>
              <p className="mt-6 font-medium text-primary-fixed">No credit card required. 14-day free trial.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-6 border-t border-outline-variant/50 bg-surface-container-lowest">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <span className="text-xl font-bold">HireFlow AI</span>
            <p className="text-sm font-medium text-on-surface-variant mt-1">The future of intelligent recruitment.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 font-medium">
            <Link href="#" className="text-on-surface-variant hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-on-surface-variant hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="#" className="text-on-surface-variant hover:text-primary transition-colors">Contact Support</Link>
            <Link href="#" className="text-on-surface-variant hover:text-primary transition-colors">API Documentation</Link>
          </div>
          <p className="text-sm font-medium text-on-surface-variant">© 2026 HireFlow AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}