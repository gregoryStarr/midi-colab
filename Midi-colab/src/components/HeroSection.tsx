import React from 'react';

export const HeroSection: React.FC = () => {
  return (
    <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Dynamic Background Layers */}
      <div className="absolute inset-0 -z-10">
        {/* Primary gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/70 to-slate-900/80"></div>

        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 via-purple-600/25 to-pink-500/20 rounded-full blur-3xl animate-float-complex"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-blue-600/15 to-orange-500/20 rounded-full blur-3xl animate-float-reverse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-tr from-emerald-500/10 to-cyan-500/15 rounded-full blur-2xl animate-pulse-slow"></div>

        {/* Geometric overlays */}
        <div className="absolute top-1/6 left-1/6 w-32 h-32 border-2 border-cyan-400/20 rotate-45 animate-spin-slow" style={{ animationDuration: '20s' }}></div>
        <div className="absolute bottom-1/6 right-1/6 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full animate-bounce-slow"></div>

        {/* Particle field */}
        {[...Array(15)].map((_, i) => (
          <div
            key={`hero-particle-${i}`}
            className="absolute w-2 h-2 bg-gradient-to-r from-cyan-400/60 to-purple-400/60 rounded-full animate-particle-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${8 + Math.random() * 6}s`
            }}
          ></div>
        ))}
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-6xl mx-auto px-8 text-center">
        {/* Enhanced Status Badge */}
        <div className="inline-flex items-center space-x-3 px-6 py-3 rounded-full backdrop-blur-xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 border border-white/20 mb-8 shadow-2xl shadow-purple-500/20 group hover:scale-105 transition-all duration-500">
          <div className="relative">
            <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 to-purple-300 rounded-full animate-ping opacity-60"></div>
          </div>
          <span className="text-sm font-bold text-white tracking-widest uppercase">Live Collaboration</span>
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
        </div>

        {/* Dramatic Main Heading */}
        <h2 className="text-7xl md:text-8xl lg:text-9xl font-display text-white mb-8 tracking-wider leading-none">
          <span className="block bg-gradient-to-r from-white via-cyan-200 via-purple-200 via-pink-200 to-white bg-clip-text text-transparent animate-gradient-text mb-2">
            Create Music
          </span>
          <span className="block bg-gradient-to-r from-cyan-400 via-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent animate-gradient-flow">
            Together
          </span>
        </h2>

        {/* Enhanced Description */}
        <p className="text-2xl md:text-3xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light mb-12 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          Experience real-time collaborative music creation.
          <span className="bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent font-medium"> Connect with musicians worldwide </span>
          and compose beautiful melodies together in perfect harmony.
        </p>

        {/* Interactive Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              icon: '🎹',
              title: '6 Instruments',
              description: 'Piano, guitar, sax, synth & more',
              gradient: 'from-purple-500/20 to-pink-500/20',
              glow: 'shadow-purple-500/30'
            },
            {
              icon: '⚡',
              title: 'Real-time Sync',
              description: 'Instant collaboration across devices',
              gradient: 'from-cyan-500/20 to-blue-500/20',
              glow: 'shadow-cyan-500/30'
            },
            {
              icon: '🌍',
              title: 'Global Sessions',
              description: 'Connect with musicians worldwide',
              gradient: 'from-emerald-500/20 to-teal-500/20',
              glow: 'shadow-emerald-500/30'
            }
          ].map((feature, index) => (
            <div
              key={feature.title}
              className={`group relative p-6 rounded-3xl backdrop-blur-xl bg-gradient-to-br ${feature.gradient} border border-white/10 hover:border-white/20 transition-all duration-700 hover:scale-105 hover:shadow-2xl ${feature.glow} animate-fade-in-up`}
              style={{ animationDelay: `${0.8 + index * 0.2}s` }}
            >
              {/* Background glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`}></div>

              {/* Icon */}
              <div className="relative mb-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-white/20 to-white/10 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-100 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover particles */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={`feature-particle-${index}-${i}`}
                    className="absolute w-1 h-1 bg-white rounded-full animate-ping"
                    style={{
                      left: `${20 + i * 30}%`,
                      top: `${30 + i * 20}%`,
                      animationDelay: `${i * 0.2}s`
                    }}
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Call-to-Action Hint */}
        <div className="mt-12 animate-fade-in-up" style={{ animationDelay: '1.5s' }}>
          <div className="inline-flex items-center space-x-2 text-gray-400 group">
            <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Scroll to start creating</span>
            <div className="w-4 h-4 border-2 border-gray-400 rounded-full animate-bounce group-hover:border-cyan-400 transition-colors duration-300"></div>
          </div>
        </div>
      </div>
    </div>
  );
};