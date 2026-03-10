import { motion } from 'framer-motion';
import NavBar from './NavBar';

export default function AboutUs() {
    return (
        <>
        <NavBar/>
        <div className="font-sans bg-[#060810] min-h-screen text-[#e8eaf6] selection:bg-[#00e5a0]/30 selection:text-white">
  {/* Hero Section */}
  <header className="relative py-24 md:py-32 overflow-hidden bg-[#0c0f1a] border-b border-[#1e2440] text-white">
    {/* Abstract background elements */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-[#00e5a0]/5 rounded-full blur-[120px]" />
      <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-[#4d9fff]/5 rounded-full blur-[120px]" />
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDEwaDQwTTEwIDB2NDBtMjAtNDB2NDAiIHN0cm9rZT0icmdiYSgzMCwgMzYsIDY0LCAwLjIpIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiLz4KPC9zdmc+')] opacity-50" />
    </div>

    <div className="max-w-7xl mx-auto px-6 relative z-10">
      <div className="max-w-3xl">
        <div className="inline-block px-4 py-1.5 rounded-lg bg-[#00e5a0]/10 border border-[#00e5a0]/30 text-[10px] font-mono uppercase tracking-widest mb-6 text-[#00e5a0] font-bold shadow-[0_0_15px_rgba(0,229,160,0.1)]">
          Pioneering Sustainable Energy
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight font-['Syne']">
          About <span className="text-[#00e5a0]">EcoGrid</span>
        </h1>
        
        <p className="mt-6 text-lg md:text-xl text-[#8892b0] max-w-2xl leading-relaxed font-mono">
          Empowering communities with decentralized, sustainable energy solutions that connect people and protect our planet.
        </p>
        
        <div className="mt-10">
          <a 
            href="#mission" 
            className="inline-flex items-center gap-2 text-[#00e5a0] hover:text-[#e8eaf6] font-mono text-sm uppercase tracking-wider transition-colors duration-300 group"
          >
            <span>Discover our story</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="m6 9 6 6 6-6"/></svg>
          </a>
        </div>
      </div>
    </div>
  </header>

  {/* Mission & Approach Section */}
  <section id="mission" className="max-w-7xl mx-auto py-20 px-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-[#111525] p-10 rounded-xl shadow-lg border border-[#1e2440] hover:border-[#00e5a0]/50 transition-all duration-500 group relative overflow-hidden">
        {/* Top styling bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00e5a0] to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <div className="flex items-center gap-4 mb-6 relative">
          <div className="p-3 bg-[#00e5a0]/10 border border-[#00e5a0]/20 rounded-lg text-[#00e5a0] group-hover:bg-[#00e5a0]/20 transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
          </div>
          <h2 className="text-3xl font-bold text-[#e8eaf6] font-['Syne']">Our Mission</h2>
        </div>
        <div className="space-y-4 font-mono text-sm text-[#8892b0] leading-relaxed">
            <p>
            EcoGrid is committed to reshaping the future of energy by introducing decentralized smart grids, optimizing renewable energy consumption, and ensuring long-term sustainability for generations to come.
            </p>
            <p>
            We believe that access to clean, affordable energy is a fundamental right, and we're working to make that a reality for communities worldwide.
            </p>
        </div>
      </div>

      <div className="bg-[#111525] p-10 rounded-xl shadow-lg border border-[#1e2440] hover:border-[#4d9fff]/50 transition-all duration-500 group relative overflow-hidden">
        {/* Top styling bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#4d9fff] to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <div className="flex items-center gap-4 mb-6 relative">
          <div className="p-3 bg-[#4d9fff]/10 border border-[#4d9fff]/20 rounded-lg text-[#4d9fff] group-hover:bg-[#4d9fff]/20 transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          </div>
          <h2 className="text-3xl font-bold text-[#e8eaf6] font-['Syne']">Our Approach</h2>
        </div>
        <ul className="space-y-4 font-mono text-sm text-[#8892b0]">
          <li className="flex items-center gap-3">
            <span className="text-[#4d9fff]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
            <span>AI-Driven Demand Forecasting</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-[#4d9fff]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
            <span>Blockchain-Based P2P Energy Trading</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-[#4d9fff]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
            <span>Smart Grid Optimization</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-[#4d9fff]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
            <span>Scalable & Adaptable Solutions</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-[#4d9fff]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
            <span>Community-Centered Development</span>
          </li>
        </ul>
      </div>
    </div>
  </section>

  {/* Stats Section */}
  <section className="bg-[#0c0f1a] py-16 border-y border-[#1e2440]">
    <div className="max-w-7xl mx-auto px-6">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-[#e8eaf6] font-['Syne']">
        Our Impact <span className="text-[#00e5a0]">in Numbers</span>
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <div className="p-6 rounded-xl bg-[#111525] border border-[#1e2440] hover:border-[#00e5a0]/50 transition-colors shadow-lg">
          <div className="text-4xl md:text-5xl font-bold text-[#00e5a0] mb-2 font-mono">50+</div>
          <div className="text-xs md:text-sm text-[#8892b0] font-mono uppercase tracking-wider font-bold">Communities Served</div>
        </div>
        <div className="p-6 rounded-xl bg-[#111525] border border-[#1e2440] hover:border-[#00e5a0]/50 transition-colors shadow-lg">
          <div className="text-4xl md:text-5xl font-bold text-[#00e5a0] mb-2 font-mono">30%</div>
          <div className="text-xs md:text-sm text-[#8892b0] font-mono uppercase tracking-wider font-bold">Average Energy Savings</div>
        </div>
        <div className="p-6 rounded-xl bg-[#111525] border border-[#1e2440] hover:border-[#00e5a0]/50 transition-colors shadow-lg">
          <div className="text-4xl md:text-5xl font-bold text-[#00e5a0] mb-2 font-mono">15K</div>
          <div className="text-xs md:text-sm text-[#8892b0] font-mono uppercase tracking-wider font-bold">Tons of CO₂ Reduced</div>
        </div>
        <div className="p-6 rounded-xl bg-[#111525] border border-[#1e2440] hover:border-[#00e5a0]/50 transition-colors shadow-lg">
          <div className="text-4xl md:text-5xl font-bold text-[#00e5a0] mb-2 font-mono">24/7</div>
          <div className="text-xs md:text-sm text-[#8892b0] font-mono uppercase tracking-wider font-bold">Grid Monitoring</div>
        </div>
      </div>
    </div>
  </section>

  {/* Why Choose Us Section */}
  <section className="py-20 px-6">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <div className="inline-block px-4 py-1.5 rounded-lg bg-[#00e5a0]/10 border border-[#00e5a0]/30 text-[10px] font-mono uppercase tracking-widest mb-4 text-[#00e5a0] font-bold shadow-[0_0_15px_rgba(0,229,160,0.1)]">
          Our Advantages
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-[#e8eaf6] font-['Syne']">
          Why Choose <span className="text-[#00e5a0]">EcoGrid</span>?
        </h2>
        <p className="mt-4 text-sm text-[#8892b0] max-w-3xl mx-auto font-mono leading-relaxed">
          We combine cutting-edge technology with environmental responsibility to deliver energy solutions that work for people and the planet.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-[#111525] p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 group border border-[#1e2440] hover:border-[#00e5a0]/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00e5a0] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="p-4 bg-[#00e5a0]/10 border border-[#00e5a0]/20 rounded-lg text-[#00e5a0] inline-block mb-6 group-hover:bg-[#00e5a0]/20 transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <h3 className="text-xl font-bold text-[#e8eaf6] mb-3 font-['Syne']">Efficiency</h3>
          <p className="text-[#8892b0] font-mono text-xs leading-relaxed">Our smart grid technology optimizes energy distribution, reducing waste and lowering costs.</p>
        </div>
        
        <div className="bg-[#111525] p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 group border border-[#1e2440] hover:border-[#4d9fff]/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#4d9fff] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="p-4 bg-[#4d9fff]/10 border border-[#4d9fff]/20 rounded-lg text-[#4d9fff] inline-block mb-6 group-hover:bg-[#4d9fff]/20 transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h3 className="text-xl font-bold text-[#e8eaf6] mb-3 font-['Syne']">Security</h3>
          <p className="text-[#8892b0] font-mono text-xs leading-relaxed">Blockchain technology ensures secure, transparent transactions between energy producers and consumers.</p>
        </div>
        
        <div className="bg-[#111525] p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 group border border-[#1e2440] hover:border-[#a78bfa]/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#a78bfa] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="p-4 bg-[#a78bfa]/10 border border-[#a78bfa]/20 rounded-lg text-[#a78bfa] inline-block mb-6 group-hover:bg-[#a78bfa]/20 transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
          </div>
          <h3 className="text-xl font-bold text-[#e8eaf6] mb-3 font-['Syne']">Scalability</h3>
          <p className="text-[#8892b0] font-mono text-xs leading-relaxed">Our solutions grow with your community, from small neighborhoods to entire cities.</p>
        </div>
        
        <div className="bg-[#111525] p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 group border border-[#1e2440] hover:border-[#00e5a0]/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00e5a0] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="p-4 bg-[#00e5a0]/10 border border-[#00e5a0]/20 rounded-lg text-[#00e5a0] inline-block mb-6 group-hover:bg-[#00e5a0]/20 transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M9 11 12 14 22 4"/></svg>
          </div>
          <h3 className="text-xl font-bold text-[#e8eaf6] mb-3 font-['Syne']">Innovation</h3>
          <p className="text-[#8892b0] font-mono text-xs leading-relaxed">Continuous research and development keeps our technology at the cutting edge of the energy sector.</p>
        </div>
        
        <div className="bg-[#111525] p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 group border border-[#1e2440] hover:border-[#4d9fff]/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#4d9fff] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="p-4 bg-[#4d9fff]/10 border border-[#4d9fff]/20 rounded-lg text-[#4d9fff] inline-block mb-6 group-hover:bg-[#4d9fff]/20 transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
          </div>
          <h3 className="text-xl font-bold text-[#e8eaf6] mb-3 font-['Syne']">Sustainability</h3>
          <p className="text-[#8892b0] font-mono text-xs leading-relaxed">Every aspect of our operation is designed with environmental impact in mind.</p>
        </div>
        
        <div className="bg-[#111525] p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 group border border-[#1e2440] hover:border-[#a78bfa]/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#a78bfa] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="p-4 bg-[#a78bfa]/10 border border-[#a78bfa]/20 rounded-lg text-[#a78bfa] inline-block mb-6 group-hover:bg-[#a78bfa]/20 transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h3 className="text-xl font-bold text-[#e8eaf6] mb-3 font-['Syne']">Community</h3>
          <p className="text-[#8892b0] font-mono text-xs leading-relaxed">We build solutions that strengthen communities and promote energy independence.</p>
        </div>
      </div>
    </div>
  </section>

  {/* Team Section */}
  <section className="bg-[#0c0f1a] py-20 px-6 border-y border-[#1e2440]">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <div className="inline-block px-4 py-1.5 rounded-lg bg-[#00e5a0]/10 border border-[#00e5a0]/30 text-[10px] font-mono uppercase tracking-widest mb-4 text-[#00e5a0] font-bold shadow-[0_0_15px_rgba(0,229,160,0.1)]">
          Our People
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-[#e8eaf6] font-['Syne']">
          Meet the <span className="text-[#00e5a0]">Team</span>
        </h2>
        <p className="mt-4 text-sm text-[#8892b0] max-w-3xl mx-auto font-mono leading-relaxed">
          Passionate experts dedicated to revolutionizing the energy sector with sustainable solutions.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-[#111525] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group border border-[#1e2440] hover:border-[#00e5a0]/50 relative">
          <div className="relative h-64 overflow-hidden">
            <img 
              src="/assets/team-member.svg" 
              alt="Manish Prakash"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060810] to-transparent opacity-0 group-hover:opacity-80 transition-opacity duration-300"></div>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-[#e8eaf6] font-['Syne']">Manish Prakash</h3>
          </div>
        </div>
        
        <div className="bg-[#111525] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group border border-[#1e2440] hover:border-[#00e5a0]/50 relative">
          <div className="relative h-64 overflow-hidden">
            <img 
              src="/assets/team-member.svg" 
              alt="Khusi Ranjan"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060810] to-transparent opacity-0 group-hover:opacity-80 transition-opacity duration-300"></div>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-[#e8eaf6] font-['Syne']">Kushi Ranjan</h3>
          </div>
        </div>
        
        <div className="bg-[#111525] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group border border-[#1e2440] hover:border-[#00e5a0]/50 relative">
          <div className="relative h-64 overflow-hidden">
            <img 
              src="/assets/team-member.svg" 
              alt="Sammrudh"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060810] to-transparent opacity-0 group-hover:opacity-80 transition-opacity duration-300"></div>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-[#e8eaf6] font-['Syne']">Sammrudh</h3>
          </div>
        </div>

        <div className="bg-[#111525] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group border border-[#1e2440] hover:border-[#00e5a0]/50 relative">
          <div className="relative h-64 overflow-hidden">
            <img 
              src="/assets/team-member.svg" 
              alt="Suvam Mohapatra"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060810] to-transparent opacity-0 group-hover:opacity-80 transition-opacity duration-300"></div>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-[#e8eaf6] font-['Syne']">Suvam Mohapatra</h3>
          </div>
        </div>

        <div className="bg-[#111525] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group border border-[#1e2440] hover:border-[#00e5a0]/50 relative">
          <div className="relative h-64 overflow-hidden">
            <img 
              src="/assets/team-member.svg" 
              alt="Ashutosh"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060810] to-transparent opacity-0 group-hover:opacity-80 transition-opacity duration-300"></div>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-[#e8eaf6] font-['Syne']">Ashutosh</h3>
          </div>
        </div>

        <div className="bg-[#111525] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group border border-[#1e2440] hover:border-[#00e5a0]/50 relative">
          <div className="relative h-64 overflow-hidden">
            <img 
              src="/assets/team-member.svg" 
              alt="Priyanshu"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060810] to-transparent opacity-0 group-hover:opacity-80 transition-opacity duration-300"></div>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-[#e8eaf6] font-['Syne']">Priyanshu</h3>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* Timeline Section */}
  <section className="bg-[#0c0f1a] py-20 px-6 border-b border-[#1e2440]">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <div className="inline-block px-4 py-1.5 rounded-lg bg-[#00e5a0]/10 border border-[#00e5a0]/30 text-[10px] font-mono uppercase tracking-widest mb-4 text-[#00e5a0] font-bold shadow-[0_0_15px_rgba(0,229,160,0.1)]">
          Our Journey
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-[#e8eaf6] font-['Syne']">
          The <span className="text-[#00e5a0]">EcoGrid</span> Story
        </h2>
        <p className="mt-4 text-sm text-[#8892b0] max-w-3xl mx-auto font-mono leading-relaxed">
          From concept to reality, our path to revolutionizing energy distribution.
        </p>
      </div>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-px bg-gradient-to-b from-[#00e5a0]/50 via-[#4d9fff]/50 to-transparent"></div>
        
        <div className="space-y-12">
          <div className="relative flex items-center flex-row-reverse">
            <div className="flex-1"></div>
            <div className="z-10 flex items-center justify-center w-12 h-12 bg-[#00e5a0]/10 border border-[#00e5a0]/50 rounded-full shadow-[0_0_15px_rgba(0,229,160,0.2)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00e5a0]"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div className="flex-1 p-6 bg-[#111525] rounded-xl shadow-lg text-right mr-6 border border-[#1e2440] hover:border-[#00e5a0]/50 transition-colors">
              <div className="inline-block px-3 py-1 rounded-md bg-[#00e5a0]/10 border border-[#00e5a0]/30 text-xs font-mono uppercase tracking-wider mb-3 text-[#00e5a0]">
                2018
              </div>
              <h3 className="text-xl font-bold text-[#e8eaf6] font-['Syne'] mb-2">The Beginning</h3>
              <p className="text-[#8892b0] font-mono text-sm leading-relaxed">EcoGrid was founded with a vision to democratize energy distribution.</p>
            </div>
          </div>
          
          <div className="relative flex items-center flex-row">
            <div className="flex-1"></div>
            <div className="z-10 flex items-center justify-center w-12 h-12 bg-[#4d9fff]/10 border border-[#4d9fff]/50 rounded-full shadow-[0_0_15px_rgba(77,159,255,0.2)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#4d9fff]"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div className="flex-1 p-6 bg-[#111525] rounded-xl shadow-lg ml-6 border border-[#1e2440] hover:border-[#4d9fff]/50 transition-colors">
              <div className="inline-block px-3 py-1 rounded-md bg-[#4d9fff]/10 border border-[#4d9fff]/30 text-xs font-mono uppercase tracking-wider mb-3 text-[#4d9fff]">
                2019
              </div>
              <h3 className="text-xl font-bold text-[#e8eaf6] font-['Syne'] mb-2">First Prototype</h3>
              <p className="text-[#8892b0] font-mono text-sm leading-relaxed">Developed and tested our first smart grid prototype in a small community.</p>
            </div>
          </div>
          
          <div className="relative flex items-center flex-row-reverse">
            <div className="flex-1"></div>
            <div className="z-10 flex items-center justify-center w-12 h-12 bg-[#00e5a0]/10 border border-[#00e5a0]/50 rounded-full shadow-[0_0_15px_rgba(0,229,160,0.2)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00e5a0]"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div className="flex-1 p-6 bg-[#111525] rounded-xl shadow-lg text-right mr-6 border border-[#1e2440] hover:border-[#00e5a0]/50 transition-colors">
              <div className="inline-block px-3 py-1 rounded-md bg-[#00e5a0]/10 border border-[#00e5a0]/30 text-xs font-mono uppercase tracking-wider mb-3 text-[#00e5a0]">
                2020
              </div>
              <h3 className="text-xl font-bold text-[#e8eaf6] font-['Syne'] mb-2">Blockchain Integration</h3>
              <p className="text-[#8892b0] font-mono text-sm leading-relaxed">Integrated blockchain technology for secure peer-to-peer energy trading.</p>
            </div>
          </div>
          
          <div className="relative flex items-center flex-row">
            <div className="flex-1"></div>
            <div className="z-10 flex items-center justify-center w-12 h-12 bg-[#4d9fff]/10 border border-[#4d9fff]/50 rounded-full shadow-[0_0_15px_rgba(77,159,255,0.2)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#4d9fff]"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div className="flex-1 p-6 bg-[#111525] rounded-xl shadow-lg ml-6 border border-[#1e2440] hover:border-[#4d9fff]/50 transition-colors">
              <div className="inline-block px-3 py-1 rounded-md bg-[#4d9fff]/10 border border-[#4d9fff]/30 text-xs font-mono uppercase tracking-wider mb-3 text-[#4d9fff]">
                2022
              </div>
              <h3 className="text-xl font-bold text-[#e8eaf6] font-['Syne'] mb-2">Global Expansion</h3>
              <p className="text-[#8892b0] font-mono text-sm leading-relaxed">Expanded operations to 10 countries across 3 continents.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* Call to Action Footer */}
  <footer className="bg-[#060810] py-20 px-6 border-t border-[#1e2440] relative overflow-hidden">
    <div className="max-w-7xl mx-auto relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight text-[#e8eaf6] font-['Syne']">
            Join Us in Building a <span className="text-[#00e5a0]">Sustainable Future</span>
          </h2>
          <p className="mt-4 text-sm text-[#8892b0] max-w-lg font-mono leading-relaxed">
            Together, we can transform how energy is produced, distributed, and consumed. Let's create a cleaner, more equitable world for generations to come.
          </p>
          <button className="mt-8 bg-[#00e5a0]/10 text-[#00e5a0] border border-[#00e5a0]/50 px-8 py-3 rounded-lg font-mono text-xs uppercase tracking-wider font-bold shadow-[0_0_15px_rgba(0,229,160,0.1)] hover:bg-[#00e5a0]/20 hover:shadow-[0_0_20px_rgba(0,229,160,0.2)] transition-all duration-300 flex items-center gap-2 group">
            <span>Get Started</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>
        
        <div className="relative h-64 lg:h-auto rounded-xl overflow-hidden border border-[#1e2440]">
          <img
            src="/assets/sustainable-energy.svg"
            alt="Sustainable energy"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060810] via-[#060810]/50 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6">
            <div className="text-2xl font-bold text-[#e8eaf6] font-['Syne']">100% Renewable</div>
            <div className="text-[#00e5a0] font-mono text-xs uppercase tracking-wider mt-1 font-bold">Our commitment to the planet</div>
          </div>
        </div>
      </div>
      
      <div className="mt-16 pt-8 border-t border-[#1e2440] text-center text-[#8892b0] font-mono text-[10px] uppercase tracking-wider">
        <p>© {new Date().getFullYear()} EcoGrid. All rights reserved.</p>
      </div>
    </div>
  </footer>
</div>

        </>
    );
}
