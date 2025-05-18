import { useState, useEffect, useRef } from 'react';

export default function RutherfordSimulation() {
  const canvasRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [counter, setCounter] = useState(0);
  const [scatteringAngle, setScatteringAngle] = useState(0);
  const [nuclearCharge, setNuclearCharge] = useState(79); // Gold = 79
  const [alphaEnergy, setAlphaEnergy] = useState(5); // MeV
  const [showPaths, setShowPaths] = useState(true);
  const [showHistogram, setShowHistogram] = useState(true);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const histogramDataRef = useRef({});
  const startTimeRef = useRef(null);
  
  const WIDTH = 600;
  const HEIGHT = 400;
  const NUCLEUS_RADIUS = 5;
  const PARTICLE_RADIUS = 2;
  const MAX_PARTICLES = 100;
  const EMISSION_INTERVAL = 100; // ms
  
  // Initialize histogram data
  useEffect(() => {
    histogramDataRef.current = {};
    for (let i = 0; i < 180; i += 10) {
      histogramDataRef.current[i] = 0;
    }
  }, []);

  const calculateTrajectory = (particle) => {
    // Rutherford scattering physics
    // Distance of closest approach: d = (1 + 1/sin(θ/2)) * (Z₁Z₂e²)/(4πε₀E)
    // Where θ is scattering angle, Z₁,Z₂ are charges, e is elementary charge, ε₀ is vacuum permittivity, E is energy
    // Simplifying with constants for simulation purposes
    
    const impactParameter = particle.impactParameter;
    const Z = nuclearCharge;
    const energy = alphaEnergy;
    
    // Simplified formula based on Rutherford scattering
    // Using a mix of classical electrostatic and simplified quantum mechanics
    const k = 1.44; // Coulomb constant in convenient units (MeV·fm/e²)
    const alphaCharge = 2; // Alpha particle charge
    
    // Scale factor to make simulation visually effective
    const scaleFactor = 5000 / (energy * energy);
    
    // Calculate scattering angle using simplified Rutherford formula
    let angle = 0;
    if (impactParameter !== 0) {
      // tan(θ/2) = k·Z·Z_alpha / (2·E·b)
      // where b is impact parameter
      const tanHalfTheta = (k * Z * alphaCharge) / (2 * energy * Math.abs(impactParameter) * scaleFactor);
      angle = 2 * Math.atan(tanHalfTheta);
      
      // Apply randomness to make it more realistic
      angle *= (0.9 + Math.random() * 0.2);
    }
    
    // Convert to degrees and set direction
    angle = angle * (180 / Math.PI);
    if (impactParameter < 0) {
      angle = -angle;
    }
    
    return angle;
  };

  const updateParticlePosition = (particle) => {
    if (!particle.hasReachedNucleus && 
        Math.sqrt(Math.pow(particle.x - WIDTH/2, 2) + Math.pow(particle.y - HEIGHT/2, 2)) <= NUCLEUS_RADIUS * 3) {
      // Particle has reached close to the nucleus, apply scattering
      particle.hasReachedNucleus = true;
      
      // Calculate scattering angle based on impact parameter
      const angle = calculateTrajectory(particle);
      
      // Record angle for histogram
      const binKey = Math.floor(Math.abs(angle) / 10) * 10;
      if (histogramDataRef.current[binKey] !== undefined) {
        histogramDataRef.current[binKey]++;
      }
      
      // Update velocity based on scattering angle
      const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
      const angleRad = angle * (Math.PI / 180);
      particle.vx = speed * Math.cos(angleRad);
      particle.vy = speed * Math.sin(angleRad);
      
      // Apply slight random variation to make it more realistic
      particle.vx += (Math.random() - 0.5) * 0.2;
      particle.vy += (Math.random() - 0.5) * 0.2;
    }
    
    // Update position
    particle.x += particle.vx;
    particle.y += particle.vy;
    
    // Store path
    if (showPaths && particle.path.length < 100) {
      particle.path.push({ x: particle.x, y: particle.y });
    }
    
    // Remove particles that have left the canvas
    return !(particle.x < 0 || particle.x > WIDTH || particle.y < 0 || particle.y > HEIGHT);
  };

  const createParticle = () => {
    // Start from left side
    const y = HEIGHT / 2 + (Math.random() - 0.5) * (HEIGHT / 2);
    
    // Calculate impact parameter (distance from central horizontal line)
    const impactParameter = y - HEIGHT / 2;
    
    return {
      x: 0,
      y: y,
      vx: 1.5,
      vy: 0,
      impactParameter: impactParameter,
      hasReachedNucleus: false,
      path: [{ x: 0, y: y }]
    };
  };

  const drawSimulation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // Draw background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    // Draw gold foil (vertical line in the middle)
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(WIDTH/2, 0);
    ctx.lineTo(WIDTH/2, HEIGHT);
    ctx.stroke();
    
    // Draw nucleus at center of foil
    ctx.fillStyle = `rgba(255, 0, 0, ${nuclearCharge/100})`;
    ctx.beginPath();
    ctx.arc(WIDTH/2, HEIGHT/2, NUCLEUS_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw particles
    ctx.fillStyle = 'blue';
    particlesRef.current.forEach(particle => {
      // Draw particle paths
      if (showPaths && particle.path.length > 1) {
        ctx.strokeStyle = 'rgba(0, 0, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particle.path[0].x, particle.path[0].y);
        for (let i = 1; i < particle.path.length; i++) {
          ctx.lineTo(particle.path[i].x, particle.path[i].y);
        }
        ctx.stroke();
      }
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, PARTICLE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw histogram if enabled
    if (showHistogram) {
      drawHistogram(ctx);
    }
    
    // Draw labels and info
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Particles: ${counter}`, 10, 20);
    ctx.fillText(`Nuclear Charge (Z): ${nuclearCharge}`, 10, 40);
    ctx.fillText(`α Energy: ${alphaEnergy} MeV`, 10, 60);
  };
  
  const drawHistogram = (ctx) => {
    const histogramHeight = 100;
    const histogramWidth = 180;
    const histogramX = WIDTH - histogramWidth - 20;
    const histogramY = 20;
    
    // Draw histogram background
    ctx.fillStyle = 'rgba(240, 240, 240, 0.7)';
    ctx.fillRect(histogramX - 10, histogramY - 10, histogramWidth + 20, histogramHeight + 30);
    
    // Find max value for scaling
    const maxValue = Math.max(1, ...Object.values(histogramDataRef.current));
    
    // Draw axes
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(histogramX, histogramY + histogramHeight);
    ctx.lineTo(histogramX + histogramWidth, histogramY + histogramHeight);
    ctx.stroke();
    
    // Draw bars
    ctx.fillStyle = 'rgba(0, 0, 255, 0.6)';
    Object.entries(histogramDataRef.current).forEach(([angle, count], index) => {
      const barHeight = (count / maxValue) * histogramHeight;
      const barWidth = histogramWidth / 18; // 180 degrees / 10 degree bins
      const x = histogramX + (index * barWidth);
      const y = histogramY + histogramHeight - barHeight;
      
      ctx.fillRect(x, y, barWidth - 1, barHeight);
      
      // Draw angle labels for some bars
      if (index % 3 === 0) {
        ctx.fillStyle = 'black';
        ctx.font = '9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${angle}°`, x + barWidth/2, histogramY + histogramHeight + 12);
        ctx.fillStyle = 'rgba(0, 0, 255, 0.6)';
      }
    });
    
    // Draw title
    ctx.fillStyle = 'black';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Scattering Angle Distribution', histogramX + histogramWidth/2, histogramY - 2);
  };

  const animate = (timestamp) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }
    
    const elapsed = timestamp - startTimeRef.current;
    
    // Add new particles at intervals
    if (elapsed > counter * EMISSION_INTERVAL && particlesRef.current.length < MAX_PARTICLES && running) {
      particlesRef.current.push(createParticle());
      setCounter(prevCount => prevCount + 1);
    }
    
    // Update particle positions
    particlesRef.current = particlesRef.current.filter(updateParticlePosition);
    
    // Draw everything
    drawSimulation();
    
    // Continue animation if running
    if (running) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (running) {
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [running]);

  const handleToggleSimulation = () => {
    if (!running) {
      // Reset if starting again
      startTimeRef.current = null;
    }
    setRunning(!running);
  };
  
  const handleReset = () => {
    setRunning(false);
    setCounter(0);
    particlesRef.current = [];
    histogramDataRef.current = {};
    for (let i = 0; i < 180; i += 10) {
      histogramDataRef.current[i] = 0;
    }
    startTimeRef.current = null;
    
    // Redraw empty simulation
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      drawSimulation();
    }
  };
  
  // Initial draw
  useEffect(() => {
    if (canvasRef.current) {
      drawSimulation();
    }
  }, [canvasRef, nuclearCharge, alphaEnergy, showPaths, showHistogram]);

  return (
    <div className="flex flex-col items-center border rounded-lg p-4 bg-white shadow-md">
      <h2 className="text-xl font-bold mb-4">Rutherford Alpha Particle Scattering</h2>
      
      <canvas 
        ref={canvasRef} 
        width={WIDTH} 
        height={HEIGHT}
        className="border border-gray-300 mb-4"
      />
      
      <div className="flex flex-wrap gap-4 justify-center mb-4">
        <button
          onClick={handleToggleSimulation}
          className={`px-4 py-2 rounded font-medium ${running ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
        >
          {running ? 'Pause' : 'Start'}
        </button>
        
        <button
          onClick={handleReset}
          className="bg-gray-300 px-4 py-2 rounded font-medium"
        >
          Reset
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nuclear Charge (Z):</label>
            <input
              type="range"
              min="1"
              max="92"
              value={nuclearCharge}
              onChange={(e) => setNuclearCharge(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs">
              <span>1 (H)</span>
              <span>79 (Au)</span>
              <span>92 (U)</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Alpha Energy (MeV):</label>
            <input
              type="range"
              min="1"
              max="10"
              value={alphaEnergy}
              onChange={(e) => setAlphaEnergy(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs">
              <span>1 MeV</span>
              <span>5 MeV</span>
              <span>10 MeV</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showPaths"
              checked={showPaths}
              onChange={() => setShowPaths(!showPaths)}
              className="mr-2"
            />
            <label htmlFor="showPaths" className="text-sm">Show Particle Paths</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showHistogram"
              checked={showHistogram}
              onChange={() => setShowHistogram(!showHistogram)}
              className="mr-2"
            />
            <label htmlFor="showHistogram" className="text-sm">Show Angle Distribution</label>
          </div>
          
          <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
            <p><strong>Rutherford Scattering:</strong> Alpha particles deflect more with:</p>
            <ul className="list-disc list-inside pl-2">
              <li>Higher nuclear charge</li>
              <li>Lower alpha energy</li>
              <li>Smaller impact parameter</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
