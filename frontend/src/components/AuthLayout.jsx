export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row selection:bg-purple-200 selection:text-purple-900">
      {/* Left Panel - Liquid Gradient Background */}
      <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden isolate">
        <div className="absolute inset-0 bg-[#F3F0FF]">
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-gradient-to-b from-purple-300 via-indigo-300 to-transparent blur-[120px] opacity-60 animate-float-slow mix-blend-multiply"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-violet-400 via-fuchsia-200 to-blue-200 blur-[100px] opacity-50 animate-float-medium mix-blend-multiply"></div>
          <div className="absolute top-[30%] left-[40%] w-[500px] h-[500px] rounded-full bg-purple-200 blur-[80px] opacity-40 animate-float-slow mix-blend-overlay"></div>
          <div className="absolute top-[20%] right-[20%] w-[400px] h-[400px] rounded-full bg-pink-300/30 blur-[60px] animate-float-medium mix-blend-multiply"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-white/40 backdrop-blur-md border border-white/50 flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>
            <span className="text-xl font-semibold tracking-tight text-gray-900">
              Minh Thắng<span className="opacity-40">_</span>
            </span>
          </div>

          <div className="max-w-lg">
            <h1 className="text-5xl xl:text-6xl font-semibold text-gray-900 tracking-tighter leading-[1.05] mb-6 animate-fade-in-up">
              Hệ thống quản lý
              <span className="block text-purple-600 relative">
                tủ nhựa
                <span className="absolute inset-0 bg-purple-400/20 blur-xl -z-10 rounded-full"></span>
              </span>
              <span className="block mt-1 font-serif italic text-purple-600/80 text-4xl xl:text-5xl">Minh Thắng.</span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed font-normal animate-fade-in-up delay-200">
              Nền tảng số hóa quy trình sản xuất, kho hàng và giám sát tiến độ thời gian thực.
            </p>
          </div>

          <p className="text-xs text-gray-400 animate-fade-in-up delay-300">&copy; 2026 Tủ Nhựa Minh Thắng</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-white relative">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-10 h-10 rounded-2xl bg-gray-900 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>
            <span className="text-xl font-semibold tracking-tight text-gray-900">Minh Thắng<span className="opacity-40">_</span></span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
