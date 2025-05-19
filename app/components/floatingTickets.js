'use client'
import { useState, useEffect } from 'react';

const FloatingTickets = () => {
  // State for particles
  const [particles, setParticles] = useState([]);
  const [windowDimensions, setWindowDimensions] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  // Theme colors - subtle, professional palette
  const themeColors = {
    primary: '#0a1930',
    accent1: '#244175',
    accent2: '#2d5da4',
    highlight: '#6892d5'
  };

  // Particle configuration - very subtle
  const particleConfig = {
    count: Math.min(50, Math.floor((windowDimensions.width * windowDimensions.height) / 25000)),
    minSize: 2,
    maxSize: 6,
    minOpacity: 0.05,
    maxOpacity: 0.15,
    minSpeed: 0.1,
    maxSpeed: 0.3
  };

  // Generate initial particles
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      
      for (let i = 0; i < particleConfig.count; i++) {
        newParticles.push(createParticle());
      }
      
      setParticles(newParticles);
    };
    
    generateParticles();
    
    // Handle window resize
    const handleResize = () => {
      setWindowDimensions({ 
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Create a new particle with random properties
  const createParticle = () => {
    const size = Math.random() * (particleConfig.maxSize - particleConfig.minSize) + particleConfig.minSize;
    const opacity = Math.random() * (particleConfig.maxOpacity - particleConfig.minOpacity) + particleConfig.minOpacity;
    const speed = Math.random() * (particleConfig.maxSpeed - particleConfig.minSpeed) + particleConfig.minSpeed;
    
    // Position particles evenly across the screen
    const x = Math.random() * windowDimensions.width;
    const y = Math.random() * windowDimensions.height;
    
    // Choose a color, weighted to use more primary and accent1
    const colorSelector = Math.random();
    const color = colorSelector < 0.5 ? themeColors.primary : 
                 colorSelector < 0.8 ? themeColors.accent1 : 
                 colorSelector < 0.95 ? themeColors.accent2 : 
                 themeColors.highlight;
    
    // Random but very subtle movement direction
    const directionX = (Math.random() - 0.5) * 2 * speed;
    const directionY = (Math.random() - 0.5) * 2 * speed;
    
    return {
      id: Date.now() + Math.random(),
      x,
      y,
      size,
      opacity,
      color,
      directionX,
      directionY,
      pulsePhase: Math.random() * Math.PI * 2, // For subtle pulsing effect
      pulseSpeed: 0.005 + Math.random() * 0.02
    };
  };

  // Animation loop
  useEffect(() => {
    const animateParticles = () => {
      setParticles(prevParticles => {
        return prevParticles.map(particle => {
          // Move particle
          let newX = particle.x + particle.directionX;
          let newY = particle.y + particle.directionY;
          
          // Wrap particles around the screen
          if (newX > windowDimensions.width) newX = 0;
          if (newX < 0) newX = windowDimensions.width;
          if (newY > windowDimensions.height) newY = 0;
          if (newY < 0) newY = windowDimensions.height;
          
          // Update pulse phase
          const newPhase = (particle.pulsePhase + particle.pulseSpeed) % (Math.PI * 2);
          
          // Calculate pulsing opacity
          const pulsingFactor = (Math.sin(newPhase) + 1) / 2; // 0 to 1
          const baseOpacity = particle.opacity;
          const opacityVariation = baseOpacity * 0.3; // Small variation
          const currentOpacity = baseOpacity - (opacityVariation * pulsingFactor);
          
          return {
            ...particle,
            x: newX,
            y: newY,
            pulsePhase: newPhase,
            currentOpacity
          };
        });
      });
    };
    
    const intervalId = setInterval(animateParticles, 50); // Slower animation for subtlety
    return () => clearInterval(intervalId);
  }, [windowDimensions]);

  // Connection lines between nearby particles
  const generateConnections = () => {
    const connections = [];
    const connectionDistance = Math.min(150, windowDimensions.width / 10);
    
    // Only check connections between nearby particles for efficiency
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];
        
        const distance = Math.sqrt(
          Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
        );
        
        if (distance < connectionDistance) {
          // Calculate opacity based on distance (closer = more visible)
          const opacity = 0.05 * (1 - (distance / connectionDistance));
          
          connections.push({
            id: `${p1.id}-${p2.id}`,
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y,
            opacity
          });
        }
      }
    }
    
    return connections;
  };

  const connections = generateConnections();

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      pointerEvents: 'none', 
      zIndex: 5, // Very low z-index
      overflow: 'hidden',
      opacity: 0.85 // Further reduce overall visibility
    }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${windowDimensions.width} ${windowDimensions.height}`} preserveAspectRatio="xMidYMid slice">
        {/* Subtle gradient background */}
        <defs>
          <radialGradient id="bg-gradient" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
            <stop offset="0%" stopColor={themeColors.primary} stopOpacity="0.01" />
            <stop offset="100%" stopColor={themeColors.primary} stopOpacity="0.05" />
          </radialGradient>
        </defs>
        
        {/* Ultra-subtle radial gradient */}
        <rect x="0" y="0" width="100%" height="100%" fill="url(#bg-gradient)" />
        
        {/* Connection lines between particles - faint network effect */}
        {connections.map(conn => (
          <line 
            key={conn.id}
            x1={conn.x1}
            y1={conn.y1}
            x2={conn.x2}
            y2={conn.y2}
            stroke={themeColors.accent1}
            strokeWidth="0.5"
            opacity={conn.opacity}
          />
        ))}
        
        {/* Particles */}
        {particles.map(particle => (
          <circle
            key={particle.id}
            cx={particle.x}
            cy={particle.y}
            r={particle.size}
            fill={particle.color}
            opacity={particle.currentOpacity || particle.opacity}
          />
        ))}
      </svg>
    </div>
  );
};

export default FloatingTickets;