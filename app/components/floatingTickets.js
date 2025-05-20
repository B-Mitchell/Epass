'use client'
import { useState, useEffect } from 'react';

const FloatingTickets = () => {
  // State for animation elements
  const [elements, setElements] = useState([]);
  const [windowDimensions, setWindowDimensions] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  // Theme colors - professional, modern palette
  const themeColors = {
    primary: '#0a1930',
    secondary: '#244175',
    accent: '#3a6fc9',
    highlight: '#6892d5'
  };

  // Element shapes configuration
  const shapes = [
    // Ticket shape with slight curve
    "M 0,0 L 50,0 C 55,0 55,5 60,5 C 65,5 65,0 70,0 L 120,0 L 120,60 L 70,60 C 65,60 65,55 60,55 C 55,55 55,60 50,60 L 0,60 Z",
    // Diamond shape
    "M 0,30 L 60,0 L 120,30 L 60,60 Z",
    // Abstract wave
    "M 0,30 Q 30,60 60,30 Q 90,0 120,30 L 120,60 Q 90,30 60,60 Q 30,90 0,60 Z"
  ];

  // Animation configuration
  const elementConfig = {
    count: Math.min(15, Math.floor((windowDimensions.width * windowDimensions.height) / 80000)),
    minSize: 80,
    maxSize: 200,
    minOpacity: 0.03,
    maxOpacity: 0.08,
    minSpeed: 0.2,
    maxSpeed: 0.5
  };

  // Generate initial elements
  useEffect(() => {
    const generateElements = () => {
      const newElements = [];
      
      for (let i = 0; i < elementConfig.count; i++) {
        newElements.push(createElement());
      }
      
      setElements(newElements);
    };
    
    generateElements();
    
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

  // Create a new animated element with random properties
  const createElement = () => {
    const baseSize = Math.random() * (elementConfig.maxSize - elementConfig.minSize) + elementConfig.minSize;
    const opacity = Math.random() * (elementConfig.maxOpacity - elementConfig.minOpacity) + elementConfig.minOpacity;
    const speed = Math.random() * (elementConfig.maxSpeed - elementConfig.minSpeed) + elementConfig.minSpeed;
    
    // Position elements across the screen
    const x = Math.random() * windowDimensions.width;
    const y = Math.random() * windowDimensions.height;
    
    // Choose a color with weighting
    const colorSelector = Math.random();
    const fillColor = colorSelector < 0.4 ? themeColors.primary : 
                     colorSelector < 0.7 ? themeColors.secondary : 
                     colorSelector < 0.9 ? themeColors.accent : 
                     themeColors.highlight;
    
    // Gentle movement direction
    const directionX = (Math.random() - 0.5) * speed;
    const directionY = (Math.random() - 0.5) * speed;
    
    // Choose a random shape
    const shapeIndex = Math.floor(Math.random() * shapes.length);
    
    // Random rotation
    const rotation = Math.random() * 360;
    const rotationSpeed = (Math.random() - 0.5) * 0.2;
    
    return {
      id: Date.now() + Math.random(),
      x,
      y,
      baseSize,
      opacity,
      fillColor,
      directionX,
      directionY,
      shapeIndex,
      rotation,
      rotationSpeed,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.005 + Math.random() * 0.01
    };
  };

  // Animation loop
  useEffect(() => {
    const animateElements = () => {
      setElements(prevElements => {
        return prevElements.map(element => {
          // Move element
          let newX = element.x + element.directionX;
          let newY = element.y + element.directionY;
          
          // Wrap elements around the screen with some margin
          const margin = element.baseSize;
          if (newX > windowDimensions.width + margin) newX = -margin;
          if (newX < -margin) newX = windowDimensions.width + margin;
          if (newY > windowDimensions.height + margin) newY = -margin;
          if (newY < -margin) newY = windowDimensions.height + margin;
          
          // Update pulse phase
          const newPhase = (element.pulsePhase + element.pulseSpeed) % (Math.PI * 2);
          
          // Calculate size pulsing
          const pulseFactor = (Math.sin(newPhase) + 1) / 2; // 0 to 1
          const sizeVariation = element.baseSize * 0.1;
          const currentSize = element.baseSize + (sizeVariation * pulseFactor);
          
          // Update rotation
          const newRotation = (element.rotation + element.rotationSpeed) % 360;
          
          return {
            ...element,
            x: newX,
            y: newY,
            currentSize,
            pulsePhase: newPhase,
            rotation: newRotation
          };
        });
      });
    };
    
    const intervalId = setInterval(animateElements, 50);
    return () => clearInterval(intervalId);
  }, [windowDimensions]);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      pointerEvents: 'none', 
      zIndex: 0,
      overflow: 'hidden'
    }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${windowDimensions.width} ${windowDimensions.height}`} preserveAspectRatio="xMidYMid slice">
        {/* Subtle gradient background */}
        <defs>
          <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={themeColors.primary} stopOpacity="0.01" />
            <stop offset="50%" stopColor={themeColors.secondary} stopOpacity="0.02" />
            <stop offset="100%" stopColor={themeColors.primary} stopOpacity="0.01" />
          </linearGradient>
          
          {/* Define shape patterns */}
          {shapes.map((path, index) => (
            <pattern 
              key={`pattern-${index}`} 
              id={`shape-pattern-${index}`} 
              patternUnits="userSpaceOnUse" 
              width="120" 
              height="60" 
              patternTransform="scale(0.5)"
            >
              <path d={path} fill="currentColor" />
            </pattern>
          ))}
        </defs>
        
        {/* Very subtle background gradient */}
        <rect x="0" y="0" width="100%" height="100%" fill="url(#bg-gradient)" />
        
        {/* Animated elements */}
        {elements.map(element => {
          const size = element.currentSize || element.baseSize;
          const aspectRatio = 2; // Most shapes are twice as wide as tall
          
          return (
            <g 
              key={element.id}
              transform={`translate(${element.x}, ${element.y}) rotate(${element.rotation}) scale(${size/120})`}
              style={{ 
                opacity: element.opacity,
                color: element.fillColor
              }}
            >
              <rect 
                x={-60} 
                y={-30} 
                width="120" 
                height="60"
                fill={`url(#shape-pattern-${element.shapeIndex})`}
                style={{ filter: 'blur(1px)' }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default FloatingTickets;