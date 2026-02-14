import { useState, useEffect, useRef } from "react";

// ─── CONSTANTS ───
const W = 800, H = 500;
const PLAYER_W = 40, PLAYER_H = 50;
const GRAVITY = 0.4;
const JUMP_POWER = -10;
const MOVE_SPEED = 5;

// 4 LONG platforms + 2 SHORT platforms
const PLATFORMS = [
  { x: 50, y: 430, w: 200, h: 20 },   // Long - ground left
  { x: 280, y: 350, w: 200, h: 20 },  // Long - mid-low
  { x: 100, y: 260, w: 200, h: 20 },  // Long - mid
  { x: 380, y: 170, w: 200, h: 20 },  // Long - high
  { x: 240, y: 90, w: 80, h: 20 },    // Short - very high
  { x: 600, y: 430, w: 80, h: 20 },   // Short - ground right
];

const VOCAB = [
  { word: "TRANQUIL", correct: "Calm and peaceful", options: ["Calm and peaceful", "Loud and chaotic", "Fast-moving", "Dangerous"] },
  { word: "AUTHENTIC", correct: "Genuine and real", options: ["Genuine and real", "Fake and artificial", "Modern", "Ancient"] },
  { word: "WHIMSICAL", correct: "Playful and fanciful", options: ["Playful and fanciful", "Serious and formal", "Angry", "Sad"] },
];

export default function TennesseeLevel() {
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
      playerY: 380,
      playerVY: 0,
      onGround: false,
      bullets: [],
      bossX: 700,
      bossY: 150,
      bossDirection: 1,
      bossHP: 1, // 1 HP per phase = 3 total vocab quizzes (one per phase)
      damageBar: 0,
      attacks: [],
      enemies: [],
      enemiesSpawned: false,
      hearts: 3,
      invincible: 0,
      lastShot: 0,
    };
  }, []);

  // Reset enemies when phase changes
  useEffect(() => {
    if (gameState.current) {
      gameState.current.enemiesSpawned = false;
      gameState.current.enemies = [];
    }
  }, [phase]);

  // Input
  useEffect(() => {
    const down = (e) => { 
      keysRef.current[e.key.toLowerCase()] = true;
      
      // Vocab keyboard answers (1-4)
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
      gameState.current.bossHP -= 1;
      gameState.current.damageBar = 0;
      gameState.current.hearts = Math.min(3, gameState.current.hearts + 1);
      
      if (gameState.current.bossHP <= 0) {
        if (phase >= 2) { // Phase 2 is the last phase (0, 1, 2 = 3 total)
          setScreen("victory");
        } else {
          setPhase(p => p + 1);
          setScreen("playing");
          gameState.current.bossHP = 1;
        }
      } else {
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
      // Horizontal
      if (keys["arrowleft"] || keys["a"]) gs.playerX -= MOVE_SPEED;
      if (keys["arrowright"] || keys["d"]) gs.playerX += MOVE_SPEED;
      gs.playerX = Math.max(0, Math.min(W - PLAYER_W, gs.playerX));
      
      // Jump
      if ((keys["arrowup"] || keys["w"]) && gs.onGround) {
        gs.playerVY = JUMP_POWER;
        gs.onGround = false;
      }
      
      // Gravity
      gs.playerVY += GRAVITY;
      gs.playerY += gs.playerVY;
      
      // Platform collision
      gs.onGround = false;
      for (const plat of PLATFORMS) {
        if (gs.playerX + PLAYER_W > plat.x && 
            gs.playerX < plat.x + plat.w &&
            gs.playerY + PLAYER_H >= plat.y &&
            gs.playerY + PLAYER_H <= plat.y + plat.h + 10 &&
            gs.playerVY >= 0) {
          gs.playerY = plat.y - PLAYER_H;
          gs.playerVY = 0;
          gs.onGround = true;
          break;
        }
      }
      
      // Fall off screen = die and respawn
      if (gs.playerY > H) {
        gs.hearts -= 1;
        if (gs.hearts <= 0) {
          setScreen("gameover");
          return;
        }
        // Respawn at highest platform
        const highest = PLATFORMS.reduce((h, p) => p.y < h.y ? p : h);
        gs.playerX = highest.x + 20;
        gs.playerY = highest.y - PLAYER_H;
        gs.playerVY = 0;
        gs.onGround = true;
        gs.invincible = 90;
      }
      
      // ─── SHOOTING ───
      if (keys[" "] || keys["spacebar"]) {
        if (now - gs.lastShot > 200) {
          gs.bullets.push({ x: gs.playerX + PLAYER_W, y: gs.playerY + PLAYER_H / 2, vx: 8 });
          gs.lastShot = now;
        }
      }
      
      // Update bullets
      gs.bullets = gs.bullets.map(b => ({ ...b, x: b.x + b.vx })).filter(b => b.x < W);
      
      // ─── BOSS MOVEMENT ───
      gs.bossY += gs.bossDirection * 2;
      if (gs.bossY <= 50) {
        gs.bossY = 50;
        gs.bossDirection = 1;
      }
      if (gs.bossY >= 400) {
        gs.bossY = 400;
        gs.bossDirection = -1;
      }
      
      // ─── BOSS ATTACKS ───
      // Phase 0: Boss shoots 1 beam only
      // Phase 1: Boss shoots 1 beam (2 enemies spawn)
      // Phase 2: Boss shoots 1 beam (2 enemies + syrup drops from sky)
      if (now % 1200 < 20) {
        gs.attacks.push({
          x: gs.bossX - 20,
          y: gs.bossY + 50,
          vx: -5,
          vy: 0,
          w: 8,
          h: 20,
        });
      }
      
      // Phase 2: Add syrup drops from sky (slow and infrequent)
      if (phase === 2 && now % 2000 < 20) {
        const dropX = Math.random() * (W - 100) + 50;
        gs.attacks.push({
          x: dropX,
          y: -20,
          vx: 0,
          vy: 2, // Slow falling speed
          w: 8,
          h: 20,
        });
      }
      
      gs.attacks = gs.attacks.map(a => ({ ...a, x: a.x + a.vx, y: a.y + a.vy }))
        .filter(a => a.x > 0 && a.y < H + 50);
      
      // ─── SPAWN ENEMIES ───
      // Phase 1: 2 enemies on LONG platforms
      if (phase === 1 && gs.enemies.length === 0 && !gs.enemiesSpawned) {
        gs.enemies = [
          { x: 120, y: 240, plat: 2, dir: 1, hp: 3 }, // Platform 2 (long)
          { x: 420, y: 150, plat: 3, dir: 1, hp: 3 }, // Platform 3 (long)
        ];
        gs.enemiesSpawned = true;
      }
      
      // Phase 2: Same 2 enemies on LONG platforms
      if (phase === 2 && gs.enemies.length === 0 && !gs.enemiesSpawned) {
        gs.enemies = [
          { x: 120, y: 240, plat: 2, dir: 1, hp: 3 }, // Platform 2 (long)
          { x: 420, y: 150, plat: 3, dir: 1, hp: 3 }, // Platform 3 (long)
        ];
        gs.enemiesSpawned = true;
      }
      
      // Enemy patrol
      gs.enemies.forEach(e => {
        const plat = PLATFORMS[e.plat];
        e.x += e.dir * 1.5;
        if (e.x <= plat.x) { e.x = plat.x; e.dir = 1; }
        if (e.x >= plat.x + plat.w - 30) { e.x = plat.x + plat.w - 30; e.dir = -1; }
        e.y = plat.y - 30;
      });
      
      // Bullet-Enemy collision (3 hits to kill)
      for (let i = gs.enemies.length - 1; i >= 0; i--) {
        const e = gs.enemies[i];
        for (let j = gs.bullets.length - 1; j >= 0; j--) {
          const b = gs.bullets[j];
          if (b.x > e.x && b.x < e.x + 30 && b.y > e.y && b.y < e.y + 30) {
            e.hp -= 1;
            gs.bullets.splice(j, 1);
            if (e.hp <= 0) {
              gs.enemies.splice(i, 1);
            }
            break;
          }
        }
      }
      
      // Bullet-Boss collision
      // Phase 0: Boss vulnerable always
      // Phase 1 & 2: Boss invulnerable until ALL enemies dead
      const canHitBoss = phase === 0 || gs.enemies.length === 0;
      
      if (canHitBoss) {
        let hits = 0;
        gs.bullets = gs.bullets.filter(b => {
          if (b.x > gs.bossX - 20 && b.x < gs.bossX + 60 && b.y > gs.bossY && b.y < gs.bossY + 100) {
            hits++;
            return false;
          }
          return true;
        });
        
        gs.damageBar += hits * 0.05;
        if (gs.damageBar >= 1) {
          gs.damageBar = 0;
          setCurrentVocab(VOCAB[vocabIndex % VOCAB.length]);
          setScreen("vocab");
          return;
        }
      }
      
      // Player-Attack collision
      if (gs.invincible <= 0) {
        for (const a of gs.attacks) {
          if (gs.playerX + PLAYER_W > a.x && gs.playerX < a.x + a.w &&
              gs.playerY + PLAYER_H > a.y && gs.playerY < a.y + a.h) {
            gs.hearts -= 1;
            gs.invincible = 60;
            if (gs.hearts <= 0) {
              setScreen("gameover");
              return;
            }
            break;
          }
        }
      }
      gs.invincible = Math.max(0, gs.invincible - 1);
      
      // Player-Enemy collision
      if (gs.invincible <= 0) {
        for (const e of gs.enemies) {
          if (gs.playerX + PLAYER_W > e.x && gs.playerX < e.x + 30 &&
              gs.playerY + PLAYER_H > e.y && gs.playerY < e.y + 30) {
            gs.hearts -= 1;
            gs.invincible = 60;
            if (gs.hearts <= 0) {
              setScreen("gameover");
              return;
            }
            break;
          }
        }
      }
      
      // ─── DRAW ───
      // Background - green gradient like original
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#66bb6a");
      g.addColorStop(0.5, "#81c784");
      g.addColorStop(1, "#a5d6a7");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      
      // Mountains
      const mountains = [
        [{ x: -50, y: H - 100 }, { x: 200, y: 80 }, { x: 450, y: H - 100 }],
        [{ x: 100, y: H - 80 }, { x: 350, y: 120 }, { x: 600, y: H - 80 }],
        [{ x: 350, y: H - 90 }, { x: 550, y: 60 }, { x: 850, y: H - 90 }]
      ];
      mountains.forEach((pts, i) => {
        ctx.fillStyle = i === 0 ? "#2e7d32" : i === 1 ? "#388e3c" : "#43a047";
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.fill();
      });
      
      // Trees
      for (let tx = 20; tx < W; tx += 45) {
        ctx.fillStyle = "#5d4037";
        ctx.fillRect(tx, H - 90, 8, 30);
        ctx.fillStyle = "#2e7d32";
        ctx.beginPath();
        ctx.moveTo(tx - 12, H - 80);
        ctx.lineTo(tx + 4, H - 130);
        ctx.lineTo(tx + 20, H - 80);
        ctx.fill();
      }
      
      // Ground
      ctx.fillStyle = "#4e342e";
      ctx.fillRect(0, H - 60, W, 60);
      
      // Platforms
      PLATFORMS.forEach(p => {
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = "#A0522D";
        ctx.fillRect(p.x, p.y, p.w, 5);
      });
      
      // Attacks (syrup drops)
      gs.attacks.forEach(a => {
        ctx.fillStyle = "#8d6e00";
        ctx.fillRect(a.x, a.y, 8, 20);
      });
      
      // Enemies (mini pancakes)
      gs.enemies.forEach(e => {
        ctx.fillStyle = "#d7a94e";
        ctx.beginPath();
        ctx.ellipse(e.x + 15, e.y + 15, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // Butter on top
        ctx.fillStyle = "#ffee58";
        ctx.fillRect(e.x + 8, e.y + 5, 14, 8);
      });
      
      // Boss (Pancake Stack) - matching original
      const bob = Math.sin(now / 320) * 3;
      const pancakeColors = ["#d7a94e", "#c8953d", "#dbb55a", "#bf8a30", "#e0c06a"];
      for (let i = 4; i >= 0; i--) {
        ctx.fillStyle = pancakeColors[i];
        ctx.beginPath();
        ctx.ellipse(gs.bossX + 30, gs.bossY + 80 - i * 18 + bob, 48 - i * 2, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Syrup drips
      ctx.fillStyle = "#8d6e00";
      ctx.fillRect(gs.bossX - 5, gs.bossY + 80 + bob, 5, 18);
      ctx.fillRect(gs.bossX + 50, gs.bossY + 75 + bob, 4, 22);
      // Butter on top
      ctx.fillStyle = "#ffee58";
      ctx.fillRect(gs.bossX + 15, gs.bossY - 2 + bob, 30, 14);
      // Face
      ctx.fillStyle = "#fff";
      ctx.fillRect(gs.bossX + 5, gs.bossY + 8 + bob, 12, 10);
      ctx.fillRect(gs.bossX + 43, gs.bossY + 8 + bob, 12, 10);
      ctx.fillStyle = "#000";
      ctx.fillRect(gs.bossX + 11, gs.bossY + 11 + bob, 3, 3);
      ctx.fillRect(gs.bossX + 47, gs.bossY + 11 + bob, 3, 3);
      
      // Player
      if (gs.invincible <= 0 || Math.floor(gs.invincible / 5) % 2 === 0) {
        // Body
        ctx.fillStyle = "#e53935";
        ctx.fillRect(gs.playerX, gs.playerY + 10, PLAYER_W, PLAYER_H - 10);
        // Head
        ctx.fillStyle = "#ffccbc";
        ctx.beginPath();
        ctx.arc(gs.playerX + PLAYER_W / 2, gs.playerY + 12, 12, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = "#fff";
        ctx.fillRect(gs.playerX + 8, gs.playerY + 8, 7, 6);
        ctx.fillRect(gs.playerX + 25, gs.playerY + 8, 7, 6);
        ctx.fillStyle = "#000";
        ctx.fillRect(gs.playerX + 11, gs.playerY + 10, 3, 3);
        ctx.fillRect(gs.playerX + 28, gs.playerY + 10, 3, 3);
        // Cape
        ctx.fillStyle = "#c62828";
        ctx.fillRect(gs.playerX - 5, gs.playerY + 12, 8, 22);
        ctx.fillRect(gs.playerX + PLAYER_W - 3, gs.playerY + 12, 8, 22);
      }
      
      // Bullets
      gs.bullets.forEach(b => {
        ctx.fillStyle = "#ffeb3b";
        ctx.fillRect(b.x, b.y, 8, 4);
      });
      
      // HUD
      // Hearts (proper heart shape like original)
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
      
      // Boss name label (top right)
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(W - 220, 10, 210, 26);
      ctx.fillStyle = "#4caf50";
      ctx.font = "bold 12px 'Courier New', monospace";
      ctx.fillText("The Pancake Stack Beast", W - 215, 28);
      
      // Phase indicator
      ctx.fillStyle = "#90caf9";
      ctx.font = "11px 'Courier New', monospace";
      ctx.fillText(`Phase ${phase + 1}/3`, W - 215, 50);
      
      // Boss HP bars (styled like original)
      const barY = 60;
      for (let i = 0; i < 3; i++) {
        // Background
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(W - 220 + i * 72, barY, 68, 20);
        
        // HP fill
        if (i < gs.bossHP) {
          ctx.fillStyle = "#4caf50";
          const fillWidth = i === gs.bossHP - 1 ? 66 * gs.damageBar : 66;
          ctx.fillRect(W - 219 + i * 72, barY + 1, fillWidth, 18);
        }
        
        // Border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 2;
        ctx.strokeRect(W - 220 + i * 72, barY, 68, 20);
      }
      
      requestAnimationFrame(loop);
    };
    
    const id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [screen, phase, vocabIndex]);

  // ─── RENDER SCREENS ───
  if (screen === "vocab") {
    return (
      <div style={{ width: W, height: H, background: "linear-gradient(135deg, #0d1b2a, #1b263b, #415a77)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New', monospace", color: "#fff", userSelect: "none", position: "relative" }}>
        {wrongAnswer && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(229,57,53,0.25)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
            <div style={{ fontSize: 28, color: "#e53935", fontWeight: "bold", textShadow: "0 0 20px rgba(229,57,53,0.6)" }}>✕ WRONG</div>
          </div>
        )}
        <div style={{ fontSize: 11, color: "#e91e63", letterSpacing: 3, marginBottom: 6 }}>VOCABULARY CHALLENGE</div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>Tennessee — The Pancake Stack Beast</div>

        {/* Timer */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ width: 28, height: 6, borderRadius: 3, background: i < vocabTimer ? "#e91e63" : "#333", transition: "background 0.3s" }} />
          ))}
        </div>

        {/* Word */}
        <div style={{ fontSize: 36, fontWeight: "bold", letterSpacing: 4, color: "#fff", textShadow: "0 0 15px rgba(233,30,99,0.4)", marginBottom: 8 }}>
          {currentVocab?.word}
        </div>
        <div style={{ fontSize: 12, color: "#555", marginBottom: 28 }}>What does this word mean?</div>

        {/* Options */}
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

  if (screen === "victory") {
    return (
      <div style={{ width: W, height: H, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}>
        <h1 style={{ fontSize: 48 }}>Tennessee Complete!</h1>
        <p style={{ fontSize: 20, marginTop: 20 }}>Mountain air, terrible tourist traps, perfect company.</p>
      </div>
    );
  }

  if (screen === "gameover") {
    return (
      <div style={{ width: W, height: H, background: "linear-gradient(180deg, #1a0000, #3c0000)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New', monospace", color: "#fff", userSelect: "none" }}>
        <div style={{ fontSize: 48, color: "#e53935", fontWeight: "bold", textShadow: "0 0 30px rgba(229,57,53,0.5)" }}>DEFEATED</div>
        <div style={{ fontSize: 14, color: "#aaa", marginTop: 8 }}>The Pancake Stack Beast got you...</div>
        <div style={{ marginTop: 36, padding: "12px 32px", background: "#e53935", borderRadius: 24, color: "#fff", fontSize: 15, fontWeight: "bold", cursor: "pointer", letterSpacing: 1 }} onClick={() => window.location.reload()}>
          TRY AGAIN
        </div>
        <div style={{ fontSize: 11, color: "#555", marginTop: 12 }}>You can do this.</div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: W, height: H }}>
      <canvas ref={canvasRef} width={W} height={H} style={{ display: "block", background: "#000" }} />
    </div>
  );
}
