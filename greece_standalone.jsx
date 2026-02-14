import { useState, useEffect, useRef } from "react";

// ─── CONSTANTS ───
const W = 800, H = 500;
const PLAYER_W = 40, PLAYER_H = 50;
const GRAVITY = 0.4;
const JUMP_POWER = -10;

const VOCAB = [
  { word: "SERENE", correct: "Calm and untroubled", options: ["Calm and untroubled", "Chaotic and busy", "Loud and harsh", "Dark and gloomy"] },
  { word: "RESILIENT", correct: "Able to recover quickly", options: ["Able to recover quickly", "Weak and fragile", "Stubborn", "Angry"] },
  { word: "NOSTALGIC", correct: "Longing for the past", options: ["Longing for the past", "Focused on future", "Living in present", "Forgetful"] },
];

export default function GreeceLevel() {
  const canvasRef = useRef(null);
  const keysRef = useRef({});
  const gameState = useRef(null);
  const [screen, setScreen] = useState("playing");
  const [phase, setPhase] = useState(0);
  const [vocabIndex, setVocabIndex] = useState(0);
  const [currentVocab, setCurrentVocab] = useState(null);
  const [vocabTimer, setVocabTimer] = useState(5);
  const [wrongAnswer, setWrongAnswer] = useState(false);
  const vocabTimerRef = useRef(null);

  // Initialize game
  useEffect(() => {
    gameState.current = {
      playerX: 100,
      playerY: H - 130, // Start on ground
      playerVY: 0,
      onGround: true,
      scrollX: 0,
      wallX: -100, // Wall starts closer and visible
      obstacles: [],
      obstaclesGenerated: false,
      hearts: 3,
      invincible: 0,
      stunned: 0, // Stun timer when hit
      levelWidth: 5000, // Even longer escape sequence
      doorX: 4900, // Door near end
      wallSpeed: 4, // Faster wall speed
    };
  }, []);

  // Reset on phase change
  useEffect(() => {
    if (gameState.current && phase > 0) {
      const wallSpeed = phase === 0 ? 4 : phase === 1 ? 5.5 : 6.0; // Phase 3: 6.0 more forgiving
      gameState.current.playerX = 100;
      gameState.current.playerY = H - 130;
      gameState.current.playerVY = 0;
      gameState.current.onGround = true;
      gameState.current.scrollX = 0;
      gameState.current.wallX = -100;
      gameState.current.obstacles = [];
      gameState.current.obstaclesGenerated = false;
      gameState.current.wallSpeed = wallSpeed;
      gameState.current.hearts = 3;
      gameState.current.invincible = 0;
      gameState.current.stunned = 0;
    }
  }, [phase]);

  // Input
  useEffect(() => {
    const down = (e) => { 
      keysRef.current[e.key.toLowerCase()] = true;
      
      // Vocab keyboard
      if (screen === "vocab" && currentVocab && !wrongAnswer) {
        const idx = parseInt(e.key) - 1;
        if (idx >= 0 && idx <= 3) {
          handleVocabAnswer(currentVocab.options[idx]);
        }
      }
    };
    const up = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [screen, currentVocab, wrongAnswer]);

  // Vocab timer
  useEffect(() => {
    if (screen === "vocab") {
      setVocabTimer(5);
      vocabTimerRef.current = setInterval(() => {
        setVocabTimer((t) => {
          if (t <= 1) {
            clearInterval(vocabTimerRef.current);
            setWrongAnswer(true);
            setTimeout(() => {
              setWrongAnswer(false);
              setScreen("playing");
            }, 1200);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(vocabTimerRef.current);
    }
  }, [screen]);

  // Vocab answer
  const handleVocabAnswer = (selectedOption) => {
    clearInterval(vocabTimerRef.current);
    const correct = selectedOption === currentVocab.correct;
    
    if (correct) {
      if (phase >= 2) {
        setScreen("victory");
      } else {
        setPhase(p => p + 1);
        setScreen("playing");
      }
      setVocabIndex(v => v + 1);
    } else {
      gameState.current.hearts -= 1;
      setWrongAnswer(true);
      setTimeout(() => {
        setWrongAnswer(false);
        if (gameState.current.hearts <= 0) {
          setScreen("gameover");
        } else {
          setScreen("playing");
        }
      }, 1200);
    }
  };

  // Game loop
  useEffect(() => {
    if (screen !== "playing") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const gs = gameState.current;
    
    // Set wall speed based on phase: 4, 5.5, 6.0
    const wallSpeed = phase === 0 ? 4 : phase === 1 ? 5.5 : 6.0;
    gs.wallSpeed = wallSpeed;
    
    // Generate obstacles once per phase
    if (!gs.obstaclesGenerated) {
      gs.obstacles = [];
      const obstacleCount = phase === 0 ? 8 : phase === 1 ? 12 : 16;
      const spacing = gs.levelWidth / obstacleCount;
      
      for (let i = 0; i < obstacleCount; i++) {
        const x = 400 + i * spacing + Math.random() * 100;
        const rand = Math.random();
        
        if (rand < 0.25) {
          // Ground spikes (25%)
          gs.obstacles.push({ x, y: H - 100, w: 40, h: 25, type: "spike" });
        } else if (rand < 0.70) {
          // Falling blocks from ceiling (45% - more blocks!)
          gs.obstacles.push({ x, y: -50, w: 50, h: 50, type: "block", vy: 0, falling: false });
        } else {
          // Rolling balls coming from right (30%)
          gs.obstacles.push({ x: x + 800, y: H - 100, w: 30, h: 30, type: "ball", vx: -3 });
        }
      }
      gs.obstaclesGenerated = true;
    }
    
    let lastTime = performance.now();
    
    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 16.67, 3);
      lastTime = now;
      
      const keys = keysRef.current;
      
      // ─── PLAYER MOVEMENT ───
      // Auto-run right at base speed (unless stunned)
      let baseSpeed = gs.stunned > 0 ? 0 : 4;
      
      // Speed up with right key (faster boost to outrun wall)
      if (keys["arrowright"] || keys["d"]) {
        baseSpeed = gs.stunned > 0 ? 0 : 6.85;
      }
      // Slow down with left key
      if (keys["arrowleft"] || keys["a"]) {
        baseSpeed = gs.stunned > 0 ? 0 : 2;
      }
      
      gs.playerX += baseSpeed;
      
      // Jump
      if ((keys["arrowup"] || keys["w"] || keys[" "]) && gs.onGround) {
        gs.playerVY = JUMP_POWER;
        gs.onGround = false;
      }
      
      // Gravity
      gs.playerVY += GRAVITY;
      gs.playerY += gs.playerVY;
      
      // Ground collision (must stay on ground)
      const groundY = H - 80 - PLAYER_H;
      if (gs.playerY >= groundY) {
        gs.playerY = groundY;
        gs.playerVY = 0;
        gs.onGround = true;
      } else {
        gs.onGround = false;
      }
      
      // Safety: never let player fall below screen
      if (gs.playerY > H) {
        gs.playerY = groundY;
        gs.playerVY = 0;
        gs.onGround = true;
      }
      
      // ─── CAMERA SCROLL ───
      gs.scrollX = gs.playerX - 200;
      gs.scrollX = Math.max(0, gs.scrollX);
      
      // ─── CHASE WALL ───
      gs.wallX += gs.wallSpeed;
      
      // Wall catches player = game over (compare absolute positions)
      if (gs.wallX >= gs.playerX - 50) {
        setScreen("gameover");
        return;
      }
      
      // ─── OBSTACLES ───
      gs.obstacles.forEach(obs => {
        // Falling blocks - trigger when player gets close
        if (obs.type === "block" && !obs.falling) {
          const screenX = obs.x - gs.scrollX;
          if (screenX < 600 && screenX > 0) {
            obs.falling = true;
            obs.vy = 0;
          }
        }
        
        if (obs.type === "block" && obs.falling) {
          obs.vy += 0.3;
          obs.y += obs.vy;
        }
        
        // Rolling balls - move left toward player
        if (obs.type === "ball") {
          obs.x += obs.vx;
        }
      });
      
      // Obstacle collision
      if (gs.invincible <= 0 && gs.stunned <= 0) {
        for (let i = gs.obstacles.length - 1; i >= 0; i--) {
          const obs = gs.obstacles[i];
          if (gs.playerX + PLAYER_W > obs.x && gs.playerX < obs.x + obs.w &&
              gs.playerY + PLAYER_H > obs.y && gs.playerY < obs.y + obs.h) {
            gs.hearts -= 1;
            gs.invincible = 90;
            gs.stunned = 18; // Stun for 18 frames (~0.3 seconds)
            gs.playerX -= 60; // Reduced knockback (was 80)
            gs.obstacles.splice(i, 1);
            if (gs.hearts <= 0) {
              setScreen("gameover");
              return;
            }
            break;
          }
        }
      }
      gs.invincible = Math.max(0, gs.invincible - 1);
      gs.stunned = Math.max(0, gs.stunned - 1);
      
      // ─── REACH DOOR ───
      if (gs.playerX >= gs.doorX) {
        setCurrentVocab(VOCAB[vocabIndex % VOCAB.length]);
        setScreen("vocab");
        return;
      }
      
      // ─── DRAW ───
      // Background (Greek island)
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#e3f2fd");
      g.addColorStop(1, "#bbdefb");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      
      // Parthenon columns (in background, scrolls slower)
      const colX = 180 - gs.scrollX * 0.3;
      ctx.fillStyle = "#efebe9";
      ctx.fillRect(colX - 30, H - 160, 260, 20);
      ctx.fillRect(colX - 20, H - 180, 240, 25);
      ctx.fillRect(colX - 25, H - 240, 250, 20);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = "#fafafa";
        ctx.fillRect(colX + i * 40, H - 240, 22, 65);
      }
      
      // Hills
      ctx.fillStyle = "#81c784";
      ctx.beginPath();
      ctx.ellipse(650 - gs.scrollX * 0.5, H - 60, 180, 80, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#a5d6a7";
      ctx.beginPath();
      ctx.ellipse(100 - gs.scrollX * 0.4, H - 50, 120, 60, 0, Math.PI, 0);
      ctx.fill();
      
      // Ground
      ctx.fillStyle = "#d7ccc8";
      ctx.fillRect(0, H - 80, W, 80);
      
      // Cyclops with laser beam (fixed on left side, beam shoots DOWN)
      const bob = Math.sin(now / 270) * 3;
      const cx = gs.wallX - gs.scrollX + 40; // Cyclops positioned at wall location
      const cy = 100; // Higher up so beam shoots down
      
      // Draw vertical beam first (behind Cyclops)
      const beamWidth = 50;
      const beamStartY = cy + 20; // Start from eye
      const beamEndY = H; // Go all the way down
      
      // Outer glow (vertical)
      const beamGradient = ctx.createLinearGradient(0, beamStartY, 0, beamEndY);
      beamGradient.addColorStop(0, "rgba(255, 0, 0, 0.8)");
      beamGradient.addColorStop(1, "rgba(255, 0, 0, 0.3)");
      ctx.fillStyle = beamGradient;
      ctx.fillRect(cx + 30 - beamWidth, beamStartY, beamWidth * 2, beamEndY - beamStartY);
      
      // Core beam (vertical)
      ctx.fillStyle = "rgba(255, 50, 50, 0.9)";
      ctx.fillRect(cx + 30 - 20, beamStartY, 40, beamEndY - beamStartY);
      
      // Bright center (vertical)
      ctx.fillStyle = "rgba(255, 200, 200, 0.8)";
      ctx.fillRect(cx + 30 - 8, beamStartY, 16, beamEndY - beamStartY);
      
      // Cyclops body
      ctx.fillStyle = "#8d6e63";
      ctx.beginPath();
      ctx.ellipse(cx + 30, cy + bob, 35, 32, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Meat pieces on body
      ctx.fillStyle = "#d32f2f";
      [[15, 15], [40, 20], [50, 10], [30, 35]].forEach(([px, py]) => {
        ctx.beginPath();
        ctx.ellipse(cx + px, cy + py + bob - 30, 6, 4, 0.5, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Big glowing eye (source of beam)
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cx + 30, cy + bob, 18, 0, Math.PI * 2);
      ctx.fill();
      
      // Eye glow
      ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
      ctx.beginPath();
      ctx.arc(cx + 30, cy + bob, 22, 0, Math.PI * 2);
      ctx.fill();
      
      // Pupil
      ctx.fillStyle = "#ff0000";
      ctx.beginPath();
      ctx.arc(cx + 30, cy + bob, 10, 0, Math.PI * 2);
      ctx.fill();
      
      // Obstacles
      gs.obstacles.forEach(obs => {
        const screenX = obs.x - gs.scrollX;
        if (screenX > -100 && screenX < W + 100) {
          if (obs.type === "spike") {
            // Red triangle spikes
            ctx.fillStyle = "#e53935";
            ctx.beginPath();
            ctx.moveTo(screenX, obs.y + obs.h);
            ctx.lineTo(screenX + obs.w / 2, obs.y);
            ctx.lineTo(screenX + obs.w, obs.y + obs.h);
            ctx.fill();
          } else if (obs.type === "block") {
            // Brown falling blocks
            ctx.fillStyle = "#5d4037";
            ctx.fillRect(screenX, obs.y, obs.w, obs.h);
          } else if (obs.type === "ball") {
            // Rolling stone balls
            ctx.fillStyle = "#757575";
            ctx.beginPath();
            ctx.arc(screenX + obs.w / 2, obs.y + obs.h / 2, obs.w / 2, 0, Math.PI * 2);
            ctx.fill();
            // Shading
            ctx.fillStyle = "#9e9e9e";
            ctx.beginPath();
            ctx.arc(screenX + obs.w / 2 - 5, obs.y + obs.h / 2 - 5, obs.w / 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
      
      // Door
      const doorScreenX = gs.doorX - gs.scrollX;
      if (doorScreenX > -100 && doorScreenX < W + 100) {
        ctx.fillStyle = "#4caf50";
        ctx.fillRect(doorScreenX, H - 140, 60, 60);
        ctx.fillStyle = "#2e7d32";
        ctx.fillRect(doorScreenX + 10, H - 130, 40, 50);
      }
      
      // Player
      const playerScreenX = gs.playerX - gs.scrollX;
      if (gs.invincible <= 0 || Math.floor(gs.invincible / 5) % 2 === 0) {
        // Body
        ctx.fillStyle = "#e53935";
        ctx.fillRect(playerScreenX, gs.playerY + 10, PLAYER_W, PLAYER_H - 10);
        // Head
        ctx.fillStyle = "#ffccbc";
        ctx.beginPath();
        ctx.arc(playerScreenX + PLAYER_W / 2, gs.playerY + 12, 12, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = "#fff";
        ctx.fillRect(playerScreenX + 8, gs.playerY + 8, 7, 6);
        ctx.fillRect(playerScreenX + 25, gs.playerY + 8, 7, 6);
        ctx.fillStyle = "#000";
        ctx.fillRect(playerScreenX + 11, gs.playerY + 10, 3, 3);
        ctx.fillRect(playerScreenX + 28, gs.playerY + 10, 3, 3);
        // Cape
        ctx.fillStyle = "#c62828";
        ctx.fillRect(playerScreenX - 5, gs.playerY + 12, 8, 22);
        ctx.fillRect(playerScreenX + PLAYER_W - 3, gs.playerY + 12, 8, 22);
      }
      
      // HUD - Hearts
      ctx.fillStyle = "#f44336";
      for (let i = 0; i < gs.hearts; i++) {
        const hx = 20 + i * 40;
        const hy = 20;
        ctx.beginPath();
        ctx.moveTo(hx, hy + 8);
        ctx.bezierCurveTo(hx, hy + 5, hx - 6, hy, hx - 10, hy);
        ctx.bezierCurveTo(hx - 14, hy, hx - 14, hy + 6, hx - 14, hy + 8);
        ctx.bezierCurveTo(hx - 14, hy + 12, hx - 10, hy + 16, hx, hy + 22);
        ctx.bezierCurveTo(hx + 10, hy + 16, hx + 14, hy + 12, hx + 14, hy + 8);
        ctx.bezierCurveTo(hx + 14, hy + 6, hx + 14, hy, hx + 10, hy);
        ctx.bezierCurveTo(hx + 6, hy, hx, hy + 5, hx, hy + 8);
        ctx.fill();
      }
      
      // Phase indicator
      ctx.fillStyle = "#fff";
      ctx.font = "12px 'Courier New'";
      ctx.fillText(`Phase ${phase + 1}/3`, W - 100, 30);
      
      requestAnimationFrame(loop);
    };
    
    const id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [screen, phase, vocabIndex]);

  // ─── SCREENS ───
  if (screen === "vocab") {
    return (
      <div style={{ width: W, height: H, background: "linear-gradient(135deg, #0d1b2a, #1b263b, #415a77)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New', monospace", color: "#fff", userSelect: "none", position: "relative" }}>
        {wrongAnswer && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(229,57,53,0.25)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
            <div style={{ fontSize: 28, color: "#e53935", fontWeight: "bold", textShadow: "0 0 20px rgba(229,57,53,0.6)" }}>✕ WRONG</div>
          </div>
        )}
        <div style={{ fontSize: 11, color: "#e91e63", letterSpacing: 3, marginBottom: 6 }}>VOCABULARY CHALLENGE</div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>Greece — The Souvlaki Cyclops</div>

        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ width: 28, height: 6, borderRadius: 3, background: i < vocabTimer ? "#e91e63" : "#333", transition: "background 0.3s" }} />
          ))}
        </div>

        <div style={{ fontSize: 36, fontWeight: "bold", letterSpacing: 4, color: "#fff", textShadow: "0 0 15px rgba(233,30,99,0.4)", marginBottom: 8 }}>
          {currentVocab?.word}
        </div>
        <div style={{ fontSize: 12, color: "#555", marginBottom: 28 }}>What does this word mean?</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 440 }}>
          {currentVocab?.options.map((opt, i) => (
            <div key={i}
              onClick={() => { if (!wrongAnswer) handleVocabAnswer(opt); }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, cursor: "pointer", transition: "all 0.15s", fontSize: 13, color: "#ddd" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(233,30,99,0.2)"; e.currentTarget.style.borderColor = "#e91e63"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
            >
              <span style={{ color: "#e91e63", fontWeight: "bold", fontSize: 14 }}>{i + 1}</span>
              {opt}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: "#444", marginTop: 18 }}>Press 1-4 or click to answer</div>
      </div>
    );
  }

  if (screen === "gameover") {
    return (
      <div style={{ width: W, height: H, background: "linear-gradient(180deg, #1a0000, #3c0000)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New', monospace", color: "#fff", userSelect: "none" }}>
        <div style={{ fontSize: 48, color: "#e53935", fontWeight: "bold", textShadow: "0 0 30px rgba(229,57,53,0.5)" }}>DEFEATED</div>
        <div style={{ fontSize: 14, color: "#aaa", marginTop: 8 }}>The Souvlaki Cyclops got you...</div>
        <div style={{ marginTop: 36, padding: "12px 32px", background: "#e53935", borderRadius: 24, color: "#fff", fontSize: 15, fontWeight: "bold", cursor: "pointer", letterSpacing: 1 }} onClick={() => window.location.reload()}>
          TRY AGAIN
        </div>
        <div style={{ fontSize: 11, color: "#555", marginTop: 12 }}>You can do this.</div>
      </div>
    );
  }

  if (screen === "victory") {
    return (
      <div style={{ width: W, height: H, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}>
        <h1 style={{ fontSize: 48 }}>Greece Complete!</h1>
        <p style={{ fontSize: 20, marginTop: 20 }}>Beautiful islands, ancient history, memories for life.</p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: W, height: H }}>
      <canvas ref={canvasRef} width={W} height={H} style={{ display: "block", background: "#000" }} />
    </div>
  );
}
