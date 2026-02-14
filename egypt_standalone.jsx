import { useState, useEffect, useRef } from "react";

// ─── CONSTANTS ───
const W = 800, H = 500;
const PLAYER_W = 40, PLAYER_H = 50;
const GRAVITY = 0.4;
const JUMP_POWER = -15; // Higher jump to clear charging boss from ground
const MOVE_SPEED = 5;

// Platform at mid-level (reachable with jump)
const PLATFORM = { x: 100, y: 300, w: 600, h: 20 };

const VOCAB = [
  { word: "EPHEMERAL", correct: "Lasting for a very short time", options: ["Lasting for a very short time", "Eternal and permanent", "Extremely large", "Very small"] },
  { word: "RESILIENT", correct: "Able to recover quickly", options: ["Able to recover quickly", "Weak and fragile", "Stubborn", "Angry"] },
  { word: "LUMINOUS", correct: "Giving off light", options: ["Giving off light", "Very dark", "Extremely heavy", "Colorless"] },
];

export default function EgyptLevel() {
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
      playerY: H - 110,
      playerVY: 0,
      onGround: true,
      bullets: [],
      bossX: 650,
      bossY: H - 60 - 180, // Ground level (180px tall boss)
      bossCharging: false,
      bossChargeDir: -1, // -1 = left, 1 = right
      bossReturnX: 650,
      bossHP: 1, // 1 HP per phase
      damageBar: 0,
      attacks: [],
      tentacles: [],
      fallingObjects: [],
      hearts: 3,
      invincible: 0,
      lastShot: 0,
      lastSpreadShot: 0,
      lastCharge: 0,
      lastTentacle: 0,
      lastFalling: 0,
    };
  }, []);

  // Reset on phase change
  useEffect(() => {
    if (gameState.current && phase > 0 && phase < 4) {
      gameState.current.playerX = 100;
      gameState.current.playerY = H - 110;
      gameState.current.playerVY = 0;
      gameState.current.onGround = true;
      gameState.current.bossX = 650;
      gameState.current.bossCharging = false;
      gameState.current.bossHP = 1;
      gameState.current.damageBar = 0;
      gameState.current.attacks = [];
      gameState.current.tentacles = [];
      gameState.current.fallingObjects = [];
      gameState.current.hearts = 3;
      gameState.current.invincible = 0;
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
      if (phase >= 3) {
        // Phase 4 complete = victory
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
    
    let lastTime = performance.now();
    
    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 16.67, 3);
      lastTime = now;
      
      const keys = keysRef.current;
      
      // ─── PLAYER MOVEMENT ───
      if (keys["arrowleft"] || keys["a"]) gs.playerX -= MOVE_SPEED;
      if (keys["arrowright"] || keys["d"]) gs.playerX += MOVE_SPEED;
      gs.playerX = Math.max(0, Math.min(W - PLAYER_W, gs.playerX));
      
      // Jump (Up arrow only)
      if ((keys["arrowup"] || keys["w"]) && gs.onGround) {
        gs.playerVY = JUMP_POWER;
        gs.onGround = false;
      }
      
      // Gravity
      gs.playerVY += GRAVITY;
      gs.playerY += gs.playerVY;
      
      // Ground collision
      const groundY = H - 60 - PLAYER_H;
      if (gs.playerY >= groundY) {
        gs.playerY = groundY;
        gs.playerVY = 0;
        gs.onGround = true;
      }
      
      // Platform collision
      if (gs.playerX + PLAYER_W > PLATFORM.x && gs.playerX < PLATFORM.x + PLATFORM.w &&
          gs.playerY + PLAYER_H >= PLATFORM.y && gs.playerY + PLAYER_H <= PLATFORM.y + PLATFORM.h + 10 &&
          gs.playerVY >= 0) {
        gs.playerY = PLATFORM.y - PLAYER_H;
        gs.playerVY = 0;
        gs.onGround = true;
      }
      
      // ─── SHOOTING (Spacebar only) ───
      if (keys[" "]) {
        if (now - gs.lastShot > 200) {
          gs.bullets.push({ x: gs.playerX + PLAYER_W, y: gs.playerY + PLAYER_H / 2, vx: 8 });
          gs.lastShot = now;
        }
      }
      
      gs.bullets = gs.bullets.map(b => ({ ...b, x: b.x + b.vx })).filter(b => b.x < W);
      
      // ─── BOSS CHARGE ───
      if (!gs.bossCharging && now - gs.lastCharge > 3000) { // 3 seconds stationary
        gs.bossCharging = true;
        gs.bossChargeDir = -1;
        gs.lastCharge = now;
      }
      
      if (gs.bossCharging) {
        gs.bossX += gs.bossChargeDir * 6;
        
        if (gs.bossChargeDir === -1 && gs.bossX <= 50) {
          gs.bossChargeDir = 1;
        }
        if (gs.bossChargeDir === 1 && gs.bossX >= gs.bossReturnX) {
          gs.bossX = gs.bossReturnX;
          gs.bossCharging = false;
        }
      }
      
      // ─── BOSS SPREAD SHOT (only when not charging) ───
      if (!gs.bossCharging && now - gs.lastSpreadShot > 3500) { // Much slower: 3.5s
        const spreadCount = 3;
        for (let i = 0; i < spreadCount; i++) {
          const angle = (i - 1) * 0.7; // Wider spread: 0.5 → 0.7 radians
          gs.attacks.push({
            x: gs.bossX,
            y: gs.bossY + 90, // Center of bigger boss
            vx: -4 * Math.cos(angle), // Slower projectiles: 5 → 4
            vy: 4 * Math.sin(angle),
            w: 12,
            h: 12,
          });
        }
        gs.lastSpreadShot = now;
      }
      
      gs.attacks = gs.attacks.map(a => ({ ...a, x: a.x + a.vx, y: a.y + a.vy }))
        .filter(a => a.x > 0 && a.y > 0 && a.y < H);
      
      // ─── TENTACLES (Phase 2+) ───
      if (phase >= 1 && now - gs.lastTentacle > 2000) {
        const tentX = Math.random() * (W + 40) - 20; // Spawn from -20 to 820 (covers entire screen + edges)
        gs.tentacles.push({ x: tentX, y: H - 60, w: 40, h: 0, growing: true, maxH: 100, life: 120 });
        gs.lastTentacle = now;
      }
      
      gs.tentacles.forEach(t => {
        if (t.growing && t.h < t.maxH) {
          t.h += 5;
          t.y -= 5;
        } else {
          t.growing = false;
          t.life -= 1;
        }
      });
      gs.tentacles = gs.tentacles.filter(t => t.life > 0);
      
      // ─── FALLING OBJECTS (Phase 3+) ───
      const fallingFrequency = phase === 3 ? 2500 : 2000; // Phase 4 faster
      if (phase >= 2 && now - gs.lastFalling > fallingFrequency) {
        const fallX = Math.random() * (W + 30) - 15; // Spawn from -15 to 815 (covers entire screen + edges)
        gs.fallingObjects.push({ x: fallX, y: -30, w: 30, h: 30, vy: 3 });
        gs.lastFalling = now;
      }
      
      gs.fallingObjects = gs.fallingObjects.map(f => ({ ...f, y: f.y + f.vy }))
        .filter(f => f.y < H);
      
      // ─── BULLET-BOSS COLLISION (not during charge) ───
      if (!gs.bossCharging) {
        let hits = 0;
        gs.bullets = gs.bullets.filter(b => {
          if (b.x > gs.bossX && b.x < gs.bossX + 110 && b.y > gs.bossY && b.y < gs.bossY + 180) {
            hits++;
            return false;
          }
          return true;
        });
        
        gs.damageBar += hits * 0.05;
        if (gs.damageBar >= 1) {
          gs.damageBar = 0;
          gs.bossHP -= 1;
          
          if (gs.bossHP <= 0) {
            if (phase === 3) {
              // Phase 4 complete
              setScreen("victory");
              return;
            }
            setCurrentVocab(VOCAB[vocabIndex % VOCAB.length]);
            setScreen("vocab");
            return;
          }
        }
      }
      
      // ─── PLAYER-ATTACK COLLISION ───
      if (gs.invincible <= 0) {
        for (const a of gs.attacks) {
          if (gs.playerX + PLAYER_W > a.x && gs.playerX < a.x + a.w &&
              gs.playerY + PLAYER_H > a.y && gs.playerY < a.y + a.h) {
            gs.hearts -= 1;
            gs.invincible = 90;
            if (gs.hearts <= 0) {
              setScreen("gameover");
              return;
            }
            break;
          }
        }
        
        // Tentacles
        for (const t of gs.tentacles) {
          if (gs.playerX + PLAYER_W > t.x && gs.playerX < t.x + t.w &&
              gs.playerY + PLAYER_H > t.y && gs.playerY < t.y + t.h) {
            gs.hearts -= 1;
            gs.invincible = 90;
            if (gs.hearts <= 0) {
              setScreen("gameover");
              return;
            }
            break;
          }
        }
        
        // Falling objects
        for (let i = gs.fallingObjects.length - 1; i >= 0; i--) {
          const f = gs.fallingObjects[i];
          if (gs.playerX + PLAYER_W > f.x && gs.playerX < f.x + f.w &&
              gs.playerY + PLAYER_H > f.y && gs.playerY < f.y + f.h) {
            gs.hearts -= 1;
            gs.invincible = 90;
            gs.fallingObjects.splice(i, 1); // Remove falling object after hit
            if (gs.hearts <= 0) {
              setScreen("gameover");
              return;
            }
            break;
          }
        }
        
        // Boss charge
        if (gs.bossCharging) {
          if (gs.playerX + PLAYER_W > gs.bossX && gs.playerX < gs.bossX + 110 &&
              gs.playerY + PLAYER_H > gs.bossY && gs.playerY < gs.bossY + 180) {
            gs.hearts -= 1;
            gs.invincible = 90;
            if (gs.hearts <= 0) {
              setScreen("gameover");
              return;
            }
          }
        }
      }
      gs.invincible = Math.max(0, gs.invincible - 1);
      
      // ─── DRAW ───
      // Background (Egypt)
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#ff8f00");
      g.addColorStop(0.6, "#ffb300");
      g.addColorStop(1, "#fff176");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      
      // Sun
      ctx.fillStyle = "#fff9c4";
      ctx.shadowColor = "#ffee58";
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(650, 80, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Pyramids
      const pyramids = [
        [{ x: 50, y: H - 60 }, { x: 200, y: 80 }, { x: 350, y: H - 60 }],
        [{ x: 300, y: H - 60 }, { x: 420, y: 140 }, { x: 540, y: H - 60 }],
        [{ x: 520, y: H - 60 }, { x: 620, y: 180 }, { x: 720, y: H - 60 }]
      ];
      pyramids.forEach((pts, i) => {
        ctx.fillStyle = i === 0 ? "#f57c00" : i === 1 ? "#ef6c00" : "#e65100";
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.fill();
      });
      
      // Ground
      ctx.fillStyle = "#d7ccc8";
      ctx.fillRect(0, H - 60, W, 60);
      
      // Platform
      ctx.fillStyle = "#8d6e63";
      ctx.fillRect(PLATFORM.x, PLATFORM.y, PLATFORM.w, PLATFORM.h);
      ctx.fillStyle = "#a1887f";
      ctx.fillRect(PLATFORM.x, PLATFORM.y, PLATFORM.w, 5);
      
      // Attacks
      gs.attacks.forEach(a => {
        ctx.fillStyle = "#ffd600";
        ctx.beginPath();
        ctx.arc(a.x + 6, a.y + 6, 6, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Tentacles
      gs.tentacles.forEach(t => {
        ctx.fillStyle = "#8d6e63";
        ctx.fillRect(t.x, t.y, t.w, t.h);
        ctx.fillStyle = "#6d4c41";
        ctx.fillRect(t.x + 5, t.y, 10, t.h);
      });
      
      // Falling objects
      gs.fallingObjects.forEach(f => {
        ctx.fillStyle = "#bf360c";
        ctx.beginPath();
        ctx.arc(f.x + 15, f.y + 15, 15, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Boss (Koshari Pharaoh) - BIGGER and ground level
      const bob = Math.sin(now / 300) * 3;
      ctx.fillStyle = "#fff8e1";
      ctx.fillRect(gs.bossX + 15, gs.bossY + 30 + bob, 80, 150); // 180px total height
      
      // Wrap lines
      ctx.strokeStyle = "#ffe082";
      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(gs.bossX + 15, gs.bossY + 45 + i * 14 + bob);
        ctx.lineTo(gs.bossX + 95, gs.bossY + 45 + i * 14 + bob);
        ctx.stroke();
      }
      
      // Crown
      ctx.fillStyle = "#ffd600";
      ctx.beginPath();
      ctx.moveTo(gs.bossX + 30, gs.bossY + 30 + bob);
      ctx.lineTo(gs.bossX + 25, gs.bossY - 20 + bob);
      ctx.lineTo(gs.bossX + 45, gs.bossY + 15 + bob);
      ctx.lineTo(gs.bossX + 55, gs.bossY - 10 + bob);
      ctx.lineTo(gs.bossX + 65, gs.bossY + 15 + bob);
      ctx.lineTo(gs.bossX + 85, gs.bossY - 20 + bob);
      ctx.lineTo(gs.bossX + 80, gs.bossY + 30 + bob);
      ctx.fill();
      
      // Eyes
      ctx.fillStyle = "#fff";
      ctx.fillRect(gs.bossX + 35, gs.bossY + 50 + bob, 12, 12);
      ctx.fillRect(gs.bossX + 63, gs.bossY + 50 + bob, 12, 12);
      ctx.fillStyle = "#000";
      ctx.fillRect(gs.bossX + 40, gs.bossY + 54 + bob, 4, 4);
      ctx.fillRect(gs.bossX + 68, gs.bossY + 54 + bob, 4, 4);
      
      // Player
      if (gs.invincible <= 0 || Math.floor(gs.invincible / 5) % 2 === 0) {
        ctx.fillStyle = "#e53935";
        ctx.fillRect(gs.playerX, gs.playerY + 10, PLAYER_W, PLAYER_H - 10);
        ctx.fillStyle = "#ffccbc";
        ctx.beginPath();
        ctx.arc(gs.playerX + PLAYER_W / 2, gs.playerY + 12, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillRect(gs.playerX + 8, gs.playerY + 8, 7, 6);
        ctx.fillRect(gs.playerX + 25, gs.playerY + 8, 7, 6);
        ctx.fillStyle = "#000";
        ctx.fillRect(gs.playerX + 11, gs.playerY + 10, 3, 3);
        ctx.fillRect(gs.playerX + 28, gs.playerY + 10, 3, 3);
        ctx.fillStyle = "#c62828";
        ctx.fillRect(gs.playerX - 5, gs.playerY + 12, 8, 22);
        ctx.fillRect(gs.playerX + PLAYER_W - 3, gs.playerY + 12, 8, 22);
      }
      
      // Bullets
      gs.bullets.forEach(b => {
        ctx.fillStyle = "#ffeb3b";
        ctx.fillRect(b.x, b.y, 8, 4);
      });
      
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
      
      // Boss HP bar
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(W - 220, 60, 200, 20);
      ctx.fillStyle = "#4caf50";
      ctx.fillRect(W - 218, 62, 196 * gs.damageBar, 16);
      
      // Phase
      ctx.fillStyle = "#fff";
      ctx.font = "12px 'Courier New'";
      ctx.fillText(`Phase ${phase + 1}/4`, W - 100, 30);
      
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
        <div style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>Egypt — The Koshari Pharaoh</div>

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
        <div style={{ fontSize: 14, color: "#aaa", marginTop: 8 }}>The Koshari Pharaoh got you...</div>
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
        <h1 style={{ fontSize: 48 }}>Egypt Complete!</h1>
        <p style={{ fontSize: 20, marginTop: 20 }}>Ancient wonders, timeless memories.</p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: W, height: H }}>
      <canvas ref={canvasRef} width={W} height={H} style={{ display: "block", background: "#000" }} />
    </div>
  );
}
