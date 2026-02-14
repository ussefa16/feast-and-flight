import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── GAME CONSTANTS ───
const W = 800, H = 500;
const PLAYER_W = 40, PLAYER_H = 50;
const BULLET_W = 6, BULLET_H = 18;
const BULLET_SPEED = 10;
const PLAYER_SPEED = 4.5;
const FIRE_RATE = 180; // ms between shots
const GRAVITY = 0.4;
const TENNESSEE_PLATFORMS = [
  { x: 50, y: 430, w: 200, h: 20 },
  { x: 280, y: 350, w: 200, h: 20 },
  { x: 100, y: 260, w: 200, h: 20 },
  { x: 380, y: 170, w: 200, h: 20 },
  { x: 240, y: 90, w: 80, h: 20 },
  { x: 600, y: 430, w: 80, h: 20 },
];
const JUMP_POWER_TENNESSEE = -13;
const EGYPT_PLATFORM = { x: 100, y: 300, w: 600, h: 20 };
const JUMP_POWER_EGYPT = -15;

// ─── BOSTON MAZE DATA ───
const CELL = 20; // Grid cell size (40 cols x 25 rows = 800x500)
const BOSTON_MAZES = {
  // Phase 0: 9 platforms INSIDE red box (rows 3-21, cols 2-37), max 600 clams
  0: [
    "########################################",
    "#......................................#",
    "#......................................#",
    "#...#######.........#########.........#",
    "#...#######.........#########.........#",
    "#...#######.........#########.........#",
    "#......................................#",
    "#......................................#",
    "#......................................#",
    "#...########...#....#########..........#",
    "#...########...#....#########..........#",
    "#...########...#....#########..........#",
    "#......................................#",
    "#......................................#",
    "#......................................#",
    "#...#######.........##########........#",
    "#...#######.........##########........#",
    "#...#######.........##########........#",
    "#......................................#",
    "#......................................#",
    "#.......##################.............#",
    "#......................................#",
    "#......................................#",
    "#......................................#",
    "########################################"
  ],
  // Phase 1: 12 platforms INSIDE red box, max 600 clams
  1: [
    "########################################",
    "#......................................#",
    "#......................................#",
    "#..#######......########......######..#",
    "#..#######......########......######..#",
    "#..#######......########......######..#",
    "#......................................#",
    "#......................................#",
    "#..########.....#######.......######..#",
    "#..########.....#######.......######..#",
    "#..########.....#######.......######..#",
    "#......................................#",
    "#......................................#",
    "#..#######......###..###......##..##..#",
    "#..#######......##...###......######..#",
    "#..#######......########......##..##..#",
    "#......................................#",
    "#......................................#",
    "#..########.....#######.......######...#",
    "#..########.....#######.......######...#",
    "#......................................#",
    "#..........###############.............#",
    "#......................................#",
    "#......................................#",
    "########################################"
  ],
  // Phase 2: 15 platforms INSIDE red box, max 600 clams
  2: [
    "########################################",
    "#......................................#",
    "#......................................#",
    "#..#######....#######.....#######.....#",
    "#..#######....#######.....#######.....#",
    "#..#######....#######.....#######.....#",
    "#......................................#",
    "#......................................#",
    "#..######.....########....#######.....#",
    "#..######.....########....#######.....#",
    "#..######.....########....#######.....#",
    "#......................................#",
    "#......................................#",
    "#..#######....#######.....########....#",
    "#..#######....#######.....########....#",
    "#..#######....#######.....########....#",
    "#......................................#",
    "#......................................#",
    "#..######.....########....#######.....#",
    "#..######.....########....#######.....#",
    "#..######.....########....#######.....#",
    "#......................................#",
    "#......................................#",
    "#......................................#",
    "########################################"
  ]
};

// ─── VOCAB DATA ───
const VOCAB = {
  atlanta: [
    { word: "EPHEMERAL", correct: "Lasting for a very short time", options: ["Lasting for a very short time", "Extremely large in size", "Deeply emotional and intense", "Lasting forever and unchanging"] },
    { word: "SERENDIPITY", correct: "Finding something good by chance", options: ["Finding something good by chance", "A feeling of deep sadness", "An act of deliberate planning", "A state of continuous motion"] },
    { word: "NOSTALGIA", correct: "Sentimental longing for the past", options: ["Sentimental longing for the past", "A fear of the unknown future", "An appetite for exotic foods", "A sense of present happiness"] },
  ],
  nyc: [
    { word: "VORACIOUS", correct: "Wanting or devouring great quantities", options: ["Wanting or devouring great quantities", "Being extremely cautious", "Moving with great speed", "Having a calm disposition"] },
    { word: "CACOPHONY", correct: "A harsh, discordant mixture of sounds", options: ["A harsh, discordant mixture of sounds", "A peaceful melody", "A type of Italian cuisine", "A state of perfect harmony"] },
    { word: "QUINTESSENTIAL", correct: "The most perfect example of something", options: ["The most perfect example of something", "A rare chemical compound", "An incomplete representation", "A minor or insignificant detail"] },
  ],
  boston: [
    { word: "RESILIENT", correct: "Able to recover from difficulty", options: ["Able to recover from difficulty", "Easily broken or damaged", "Completely inflexible", "Unwilling to face challenges"] },
    { word: "WANDERLUST", correct: "A strong desire to travel", options: ["A strong desire to travel", "A fear of open spaces", "A longing to stay at home", "A dislike of new experiences"] },
    { word: "ELOQUENT", correct: "Fluent and persuasive in speech", options: ["Fluent and persuasive in speech", "Unable to express thoughts", "Speaking in a monotone voice", "Refusing to communicate"] },
  ],
  tennessee: [
    { word: "TRANQUIL", correct: "Free from disturbance; calm", options: ["Free from disturbance; calm", "Full of chaotic energy", "Extremely loud and vibrant", "Constantly in motion"] },
    { word: "AUTHENTIC", correct: "Genuine; not fake or copied", options: ["Genuine; not fake or copied", "Clearly imitation", "Only partially real", "A copy of an original"] },
    { word: "WHIMSICAL", correct: "Playfully quaint or fanciful", options: ["Playfully quaint or fanciful", "Extremely serious and stern", "Rigid and predictable", "Dark and somber in tone"] },
  ],
  athens: [
    { word: "ETHEREAL", correct: "Extremely delicate; heavenly", options: ["Extremely delicate; heavenly", "Heavy and dense", "Harsh and rough", "Dark and gloomy"] },
    { word: "LABYRINTH", correct: "A complicated network; a maze", options: ["A complicated network; a maze", "A straight and simple path", "An open field", "A single room"] },
    { word: "ODYSSEY", correct: "A long, eventful journey", options: ["A long, eventful journey", "A short walk nearby", "A boring routine", "A single moment in time"] },
  ],
  egypt: [
    { word: "INEFFABLE", correct: "Too great to be expressed in words", options: ["Too great to be expressed in words", "Easy to describe simply", "Small and unremarkable", "Boring and forgettable"] },
    { word: "LUMINOUS", correct: "Full of light; radiant", options: ["Full of light; radiant", "Completely dark", "Dull and lifeless", "Dim and hard to see"] },
    { word: "CHERISH", correct: "To protect and care for lovingly", options: ["To protect and care for lovingly", "To ignore completely", "To discard without thought", "To treat with indifference"] },
    { word: "DEVOTION", correct: "Love and loyalty for a person", options: ["Love and loyalty for a person", "A casual passing interest", "Complete disregard", "An act of rebellion"] },
  ],
};

// ─── VICTORY MEMORIES ───
const MEMORIES = {
  atlanta: "Remember our first meal together in ATL?\nHere's to many more.",
  nyc: "$5 pizza deals, off-Broadway laughs,\nBook of Mormon, and that sketchy rice pudding spot\nthat was definitely a front.\nBest money laundering dessert ever.",
  boston: "Does clam chowder really hurt stomachs this bad?\nNarrator: It did.\nWorth it though.",
  tennessee: "Mountain air, terrible tourist traps,\nperfect company.",
  athens: "You have completed this level\nfor the ones who are suffering\nin the taxi strikes.\nTheir struggle was real.\nOur fettuccine were realer.",
  egypt: "We never made this journey together — yet.\nBut Egypt runs through both our veins.\nFrom the same soil, the same sun,\nnow the same story.\nHome is wherever you are.",
};

const FINAL_MESSAGE = `You've traveled through our memories,\nbattled monsters made of our favorite meals,\nand proven your vocabulary is as impressive as your appetite.\n\nFrom Atlanta to Egypt,\nevery location reminds me why\nevery day with you is an adventure.\n\nHappy Valentine's Day.\nI love you more than all the food in this game combined.\n(And that's saying something.)`;

// ─── LEVEL ORDER ───
const LEVELS = ["atlanta", "nyc", "boston", "tennessee", "athens", "egypt"];

const LEVEL_TYPES = {
  atlanta: "shooter",
  nyc: "shooter",
  boston: "maze",
  tennessee: "platformer",
  athens: "runner",
  egypt: "cuphead",
};

const LEVEL_NAMES = {
  atlanta: "Atlanta",
  nyc: "New York City",
  boston: "Boston",
  tennessee: "Pigeon Forge, TN",
  athens: "Athens, Greece",
  egypt: "Egypt",
};

const BOSS_NAMES = {
  atlanta: "The Peach Colossus",
  nyc: "The Hot Dog Hydra",
  boston: "The Lobster Lord",
  tennessee: "The Pancake Stack Beast",
  athens: "The Souvlaki Cyclops",
  egypt: "The Koshari Pharaoh",
};

// ─── COLOR PALETTES PER LEVEL ───
const LEVEL_COLORS = {
  atlanta: { sky: "#ff7043", ground: "#4e342e", accent: "#ffcc80", bg2: "#d84315" },
  nyc: { sky: "#1a237e", ground: "#37474f", accent: "#ffeb3b", bg2: "#283593" },
  boston: { sky: "#0d47a1", ground: "#3e2723", accent: "#80deea", bg2: "#1565c0" },
  tennessee: { sky: "#4caf50", ground: "#5d4037", accent: "#fff9c4", bg2: "#2e7d32" },
  athens: { sky: "#e3f2fd", ground: "#efebe9", accent: "#1565c0", bg2: "#bbdefb" },
  egypt: { sky: "#ff8f00", ground: "#795548", accent: "#fff176", bg2: "#f57c00" },
};

// ─── CANVAS DRAWING HELPERS ───
function drawPlayer(ctx, x, y) {
  // Body
  ctx.fillStyle = "#e53935";
  ctx.fillRect(x, y + 10, PLAYER_W, PLAYER_H - 10);
  // Head
  ctx.fillStyle = "#ffccbc";
  ctx.beginPath();
  ctx.arc(x + PLAYER_W / 2, y + 12, 12, 0, Math.PI * 2);
  ctx.fill();
  // Eyes
  ctx.fillStyle = "#fff";
  ctx.fillRect(x + 8, y + 8, 7, 6);
  ctx.fillRect(x + 25, y + 8, 7, 6);
  ctx.fillStyle = "#000";
  ctx.fillRect(x + 11, y + 10, 3, 3);
  ctx.fillRect(x + 28, y + 10, 3, 3);
  // Cape
  ctx.fillStyle = "#c62828";
  ctx.fillRect(x - 5, y + 12, 8, 22);
  ctx.fillRect(x + PLAYER_W - 3, y + 12, 8, 22);
}

function drawBullet(ctx, x, y) {
  ctx.fillStyle = "#ffeb3b";
  ctx.shadowColor = "#ffeb3b";
  ctx.shadowBlur = 6;
  ctx.fillRect(x, y, BULLET_W, BULLET_H);
  ctx.shadowBlur = 0;
}

function drawHeart(ctx, x, y, alive) {
  ctx.fillStyle = alive ? "#e53935" : "#555";
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 6);
  ctx.bezierCurveTo(x + 10, y, x, y, x, y + 6);
  ctx.bezierCurveTo(x, y + 12, x + 10, y + 18, x + 10, y + 20);
  ctx.bezierCurveTo(x + 10, y + 18, x + 20, y + 12, x + 20, y + 6);
  ctx.bezierCurveTo(x + 20, y, x + 10, y, x + 10, y + 6);
  ctx.fill();
}

// ─── BOSS DRAWING ───
function drawPeachColossus(ctx, x, y, phase) {
  const bob = Math.sin(Date.now() / 300) * 3;
  // Body (peach)
  ctx.fillStyle = "#ff7043";
  ctx.beginPath();
  ctx.ellipse(x + 60, y + 55 + bob, 55, 50, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ef5350";
  ctx.beginPath();
  ctx.ellipse(x + 60, y + 55 + bob, 40, 35, 0, 0, Math.PI * 2);
  ctx.fill();
  // Leaf top
  ctx.fillStyle = "#66bb6a";
  ctx.fillRect(x + 52, y - 5 + bob, 16, 20);
  // Arms
  ctx.fillStyle = "#a5d6a7";
  ctx.fillRect(x - 20, y + 40 + bob, 25, 16);
  ctx.fillRect(x + 115, y + 40 + bob, 25, 16);
  // Angry eyes
  ctx.fillStyle = "#fff";
  ctx.fillRect(x + 35, y + 40 + bob, 16, 14);
  ctx.fillRect(x + 69, y + 40 + bob, 16, 14);
  ctx.fillStyle = "#000";
  ctx.fillRect(x + 42, y + 43 + bob, 6, 6);
  ctx.fillRect(x + 76, y + 43 + bob, 6, 6);
  // Mouth
  ctx.fillStyle = "#000";
  ctx.fillRect(x + 42, y + 60 + bob, 36, 4);
}

function drawHotDogHydra(ctx, x, y, phase) {
  const bob = Math.sin(Date.now() / 250) * 3;
  // Trenchcoat
  ctx.fillStyle = "#795548";
  ctx.fillRect(x + 10, y + 40 + bob, 80, 65);
  // Hat
  ctx.fillStyle = "#4e342e";
  ctx.fillRect(x + 15, y + 10 + bob, 70, 15);
  ctx.fillRect(x + 5, y + 24 + bob, 90, 8);
  // Three hot dogs peeking
  const colors = ["#d32f2f", "#ff8f00", "#c62828"];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.ellipse(x + 25 + i * 25, y + 32 + bob, 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eyes on each
    ctx.fillStyle = "#fff";
    ctx.fillRect(x + 17 + i * 25, y + 28 + bob, 5, 4);
    ctx.fillRect(x + 28 + i * 25, y + 28 + bob, 5, 4);
    ctx.fillStyle = "#000";
    ctx.fillRect(x + 18 + i * 25, y + 29 + bob, 2, 2);
    ctx.fillRect(x + 29 + i * 25, y + 29 + bob, 2, 2);
  }
  // Mustard drips
  ctx.fillStyle = "#ffee58";
  ctx.fillRect(x + 30, y + 100 + bob, 4, 10);
  ctx.fillRect(x + 60, y + 105 + bob, 4, 8);
}

function drawLobsterLord(ctx, x, y, phase) {
  const bob = Math.sin(Date.now() / 280) * 3;
  // Body
  ctx.fillStyle = "#e53935";
  ctx.beginPath();
  ctx.ellipse(x + 55, y + 60 + bob, 45, 40, 0, 0, Math.PI * 2);
  ctx.fill();
  // Shell segments
  ctx.fillStyle = "#c62828";
  ctx.fillRect(x + 20, y + 35 + bob, 70, 12);
  ctx.fillRect(x + 25, y + 47 + bob, 60, 10);
  // Claws
  ctx.fillStyle = "#ef5350";
  ctx.beginPath();
  ctx.ellipse(x - 15, y + 50 + bob, 22, 14, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 125, y + 50 + bob, 22, 14, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Eyes on stalks
  ctx.fillStyle = "#4e342e";
  ctx.fillRect(x + 35, y + 18 + bob, 4, 12);
  ctx.fillRect(x + 71, y + 18 + bob, 4, 12);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x + 37, y + 18 + bob, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 73, y + 18 + bob, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#000";
  ctx.fillRect(x + 36, y + 16 + bob, 3, 3);
  ctx.fillRect(x + 72, y + 16 + bob, 3, 3);
}

function drawPancakeStack(ctx, x, y, phase) {
  const bob = Math.sin(Date.now() / 320) * 3;
  const pancakeColors = ["#d7a94e", "#c8953d", "#dbb55a", "#bf8a30", "#e0c06a"];
  for (let i = 4; i >= 0; i--) {
    ctx.fillStyle = pancakeColors[i];
    ctx.beginPath();
    ctx.ellipse(x + 55, y + 80 - i * 18 + bob, 48 - i * 2, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Syrup drips
  ctx.fillStyle = "#8d6e00";
  ctx.fillRect(x + 20, y + 80 + bob, 5, 18);
  ctx.fillRect(x + 75, y + 75 + bob, 4, 22);
  // Butter on top
  ctx.fillStyle = "#ffee58";
  ctx.fillRect(x + 40, y - 2 + bob, 30, 14);
  // Face
  ctx.fillStyle = "#fff";
  ctx.fillRect(x + 30, y + 8 + bob, 12, 10);
  ctx.fillRect(x + 68, y + 8 + bob, 12, 10);
  ctx.fillStyle = "#000";
  ctx.fillRect(x + 34, y + 11 + bob, 5, 5);
  ctx.fillRect(x + 72, y + 11 + bob, 5, 5);
  // Mouth
  ctx.fillStyle = "#000";
  ctx.fillRect(x + 40, y + 26 + bob, 30, 3);
}

function drawSouvlakiCyclops(ctx, x, y, phase) {
  const bob = Math.sin(Date.now() / 270) * 3;
  // Body
  ctx.fillStyle = "#8d6e63";
  ctx.beginPath();
  ctx.ellipse(x + 55, y + 60 + bob, 48, 45, 0, 0, Math.PI * 2);
  ctx.fill();
  // Meat pieces on body
  ctx.fillStyle = "#d32f2f";
  [{ px: 25, py: 45 }, { px: 60, py: 55 }, { px: 80, py: 40 }, { px: 45, py: 70 }].forEach(m => {
    ctx.beginPath();
    ctx.ellipse(x + m.px, y + m.py + bob, 8, 5, 0.5, 0, Math.PI * 2);
    ctx.fill();
  });
  // Skewers sticking out
  ctx.strokeStyle = "#5d4037";
  ctx.lineWidth = 3;
  [[x - 10, y + 30, x + 25, y + 55], [x + 120, y + 35, x + 85, y + 60], [x + 55, y - 10, x + 55, y + 25]].forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s[0], s[1] + bob);
    ctx.lineTo(s[2], s[3] + bob);
    ctx.stroke();
  });
  // Big single eye
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x + 55, y + 42 + bob, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a237e";
  ctx.beginPath();
  ctx.arc(x + 55, y + 42 + bob, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(x + 55, y + 42 + bob, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawKoshariPharaoh(ctx, x, y, phase) {
  const bob = Math.sin(Date.now() / 300) * 3;
  // Mummy wraps (body)
  ctx.fillStyle = "#fff8e1";
  ctx.fillRect(x + 15, y + 30 + bob, 80, 80);
  // Wrap lines
  ctx.strokeStyle = "#ffe082";
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 15, y + 45 + i * 14 + bob);
    ctx.lineTo(x + 95, y + 45 + i * 14 + bob);
    ctx.stroke();
  }
  // Pasta tentacles
  ctx.strokeStyle = "#ffcc80";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 20, y + 80 + bob);
  ctx.quadraticCurveTo(x - 15, y + 60 + bob, x - 5, y + 40 + bob);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 90, y + 80 + bob);
  ctx.quadraticCurveTo(x + 125, y + 60 + bob, x + 115, y + 40 + bob);
  ctx.stroke();
  // Golden pharaoh crown/headdress
  ctx.fillStyle = "#ffd600";
  ctx.beginPath();
  ctx.moveTo(x + 30, y + 30 + bob);
  ctx.lineTo(x + 25, y - 20 + bob);
  ctx.lineTo(x + 45, y + 15 + bob);
  ctx.lineTo(x + 55, y - 30 + bob);
  ctx.lineTo(x + 65, y + 15 + bob);
  ctx.lineTo(x + 85, y - 20 + bob);
  ctx.lineTo(x + 80, y + 30 + bob);
  ctx.fill();
  // Eyes (through bandages)
  ctx.fillStyle = "#ffcc00";
  ctx.beginPath();
  ctx.ellipse(x + 40, y + 42 + bob, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 70, y + 42 + bob, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#000";
  ctx.fillRect(x + 38, y + 40 + bob, 4, 4);
  ctx.fillRect(x + 68, y + 40 + bob, 4, 4);
}

const BOSS_DRAWERS = {
  atlanta: drawPeachColossus,
  nyc: drawHotDogHydra,
  boston: drawLobsterLord,
  tennessee: drawPancakeStack,
  athens: drawSouvlakiCyclops,
  egypt: drawKoshariPharaoh,
};

// ─── BACKGROUND DRAWERS ───
function drawAtlantaBg(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#ff5722");
  g.addColorStop(1, "#ffab76");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Buildings
  const buildings = [[50, 180, 60, 220], [130, 140, 50, 260], [210, 200, 70, 200], [320, 120, 55, 280], [410, 170, 65, 230], [510, 100, 50, 300], [600, 160, 70, 240], [700, 130, 60, 270]];
  buildings.forEach(([bx, by, bw, bh]) => {
    ctx.fillStyle = "#4e342e";
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = "#ffcc80";
    for (let wy = by + 10; wy < by + bh - 10; wy += 18) {
      for (let wx = bx + 8; wx < bx + bw - 8; wx += 16) {
        if (Math.random() > 0.4) { ctx.fillRect(wx, wy, 8, 10); }
      }
    }
  });
  // Ground
  ctx.fillStyle = "#3e2723";
  ctx.fillRect(0, H - 60, W, 60);
}

function drawNYCBg(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#1a237e");
  g.addColorStop(1, "#3949ab");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Tall buildings
  const buildings = [[20, 60, 45, 340], [80, 30, 55, 370], [160, 80, 40, 320], [230, 20, 60, 380], [320, 70, 50, 330], [400, 10, 45, 390], [480, 50, 55, 350], [570, 40, 50, 360], [650, 70, 60, 330], [740, 30, 55, 370]];
  buildings.forEach(([bx, by, bw, bh]) => {
    ctx.fillStyle = "#283593";
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = "#ffeb3b";
    for (let wy = by + 8; wy < by + bh - 8; wy += 14) {
      for (let wx = bx + 5; wx < bx + bw - 5; wx += 12) {
        if (Math.random() > 0.3) { ctx.fillRect(wx, wy, 6, 8); }
      }
    }
  });
  // Yellow taxi
  ctx.fillStyle = "#ffee58";
  ctx.fillRect(W - 100, H - 80, 70, 30);
  ctx.fillStyle = "#000";
  ctx.fillRect(W - 95, H - 75, 25, 15);
  ctx.fillRect(W - 55, H - 75, 20, 15);
  // Ground
  ctx.fillStyle = "#37474f";
  ctx.fillRect(0, H - 60, W, 60);
}

function drawBostonBg(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#0d47a1");
  g.addColorStop(1, "#1976d2");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Water
  ctx.fillStyle = "#1565c0";
  ctx.fillRect(0, H - 120, W, 120);
  // Waves
  ctx.strokeStyle = "#42a5f5";
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    for (let wx = 0; wx < W; wx += 20) {
      const wy = H - 90 + i * 22 + Math.sin((wx + Date.now() * 0.02) / 40) * 5;
      wx === 0 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy);
    }
    ctx.stroke();
  }
  // Old buildings
  const buildings = [[30, 200, 70, 200], [120, 180, 55, 220], [200, 210, 80, 190], [320, 170, 60, 230], [420, 195, 75, 205], [540, 180, 65, 220], [640, 200, 80, 200]];
  buildings.forEach(([bx, by, bw, bh]) => {
    ctx.fillStyle = "#5d4037";
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = "#80deea";
    for (let wy = by + 12; wy < by + bh - 12; wy += 20) {
      for (let wx = bx + 10; wx < bx + bw - 10; wx += 18) {
        ctx.fillRect(wx, wy, 8, 10);
      }
    }
  });
  ctx.fillStyle = "#3e2723";
  ctx.fillRect(0, H - 60, W, 60);
}

function drawTennesseeBg(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#66bb6a");
  g.addColorStop(0.5, "#81c784");
  g.addColorStop(1, "#a5d6a7");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Mountains
  const mountains = [[{ x: -50, y: H - 100 }, { x: 200, y: 80 }, { x: 450, y: H - 100 }], [{ x: 100, y: H - 80 }, { x: 350, y: 120 }, { x: 600, y: H - 80 }], [{ x: 350, y: H - 90 }, { x: 550, y: 60 }, { x: 850, y: H - 90 }]];
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
  ctx.fillStyle = "#4e342e";
  ctx.fillRect(0, H - 60, W, 60);
}

function drawAthens(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#e3f2fd");
  g.addColorStop(1, "#bbdefb");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Parthenon columns
  const colX = 180;
  ctx.fillStyle = "#efebe9";
  // Base
  ctx.fillRect(colX - 30, H - 160, 260, 20);
  ctx.fillRect(colX - 20, H - 180, 240, 25);
  // Top
  ctx.fillRect(colX - 25, H - 240, 250, 20);
  // Columns
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(colX + i * 40, H - 240, 22, 65);
  }
  // Hills
  ctx.fillStyle = "#81c784";
  ctx.beginPath();
  ctx.ellipse(650, H - 60, 180, 80, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#a5d6a7";
  ctx.beginPath();
  ctx.ellipse(100, H - 50, 120, 60, 0, Math.PI, 0);
  ctx.fill();
  // Ground
  ctx.fillStyle = "#d7ccc8";
  ctx.fillRect(0, H - 60, W, 60);
}

function drawEgyptBg(ctx) {
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
  const pyramids = [[{ x: 50, y: H - 60 }, { x: 200, y: 80 }, { x: 350, y: H - 60 }], [{ x: 300, y: H - 60 }, { x: 420, y: 140 }, { x: 540, y: H - 60 }], [{ x: 520, y: H - 60 }, { x: 620, y: 180 }, { x: 720, y: H - 60 }]];
  pyramids.forEach((pts, i) => {
    ctx.fillStyle = i === 0 ? "#f57c00" : i === 1 ? "#ef6c00" : "#e65100";
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.fill();
    // Shadow side
    ctx.fillStyle = i === 0 ? "#d84315" : i === 1 ? "#bf360c" : "#bf360c";
    ctx.beginPath();
    ctx.moveTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.lineTo((pts[1].x + pts[2].x) / 2, (pts[1].y + pts[2].y) / 2 + 10);
    ctx.fill();
  });
  // Sand dunes
  ctx.fillStyle = "#ffe082";
  ctx.beginPath();
  ctx.ellipse(400, H - 30, 500, 40, 0, Math.PI, 0);
  ctx.fill();
  // Ground
  ctx.fillStyle = "#ffb74d";
  ctx.fillRect(0, H - 60, W, 60);
}

const BG_DRAWERS = {
  atlanta: drawAtlantaBg,
  nyc: drawNYCBg,
  boston: drawBostonBg,
  tennessee: drawTennesseeBg,
  athens: drawAthens,
  egypt: drawEgyptBg,
};

// ─── BOSS ATTACK PATTERN GENERATORS ───
function getAttacks(level, phase, bossX, bossY) {
  const attacks = [];
  const time = Date.now();
  switch (level) {
    case "atlanta":
      if (phase === 0) {
        // Raining vertical rods - continuous falling, alternating patterns
        const cycle = Math.floor(time / 2500) % 2; // Switch pattern every 2.5 seconds
        
        if (cycle === 0) {
          // Pattern 1: Half screen covered (left half danger, right half safe)
          const rodY = (time % 2500) / 2500 * (H + 100) - 100;
          attacks.push({ x: 0, y: rodY, vx: 0, vy: 5, w: W / 2, h: 80, type: "fallingrod" });
        } else {
          // Pattern 2: Three narrow rods with gaps
          const rodY = (time % 2500) / 2500 * (H + 100) - 100;
          attacks.push({ x: 0, y: rodY, vx: 0, vy: 5, w: 120, h: 80, type: "fallingrod" });
          attacks.push({ x: 220, y: rodY, vx: 0, vy: 5, w: 120, h: 80, type: "fallingrod" });
          attacks.push({ x: 440, y: rodY, vx: 0, vy: 5, w: 120, h: 80, type: "fallingrod" });
        }
      } else if (phase === 1) {
        // 3 horizontal levels - pits moving across screen
        // Low level
        if (time % 1200 < 50) {
          attacks.push({ x: -20, y: H - 100, vx: 4, vy: 0, w: 14, h: 14, type: "pit" });
        }
        // Mid level
        if (time % 1400 < 50) {
          attacks.push({ x: W + 20, y: H - 200, vx: -4, vy: 0, w: 14, h: 14, type: "pit" });
        }
        // High level
        if (time % 1600 < 50) {
          attacks.push({ x: -20, y: H - 300, vx: 4, vy: 0, w: 14, h: 14, type: "pit" });
        }
      } else {
        // Juice spray - 4 beams
        if (time % 950 < 50) {
          for (let i = -1.5; i <= 1.5; i += 1) {
            attacks.push({ x: bossX + 60, y: bossY + 60, vx: i * 1.0, vy: 1.5 + Math.abs(i) * 0.15, w: 10, h: 10, type: "juice" });
          }
        }
      }
      break;
    case "nyc":
      if (phase === 0) {
        // Ketchup packets from random edges
        if (time % 900 < 50) {
          const side = Math.random();
          if (side < 0.4) {
            attacks.push({ x: W + 10, y: 60 + Math.random() * (H - 200), vx: -4, vy: 0, w: 30, h: 16, type: "charge" });
          } else if (side < 0.8) {
            attacks.push({ x: -40, y: 60 + Math.random() * (H - 200), vx: 4, vy: 0, w: 30, h: 16, type: "charge" });
          } else {
            attacks.push({ x: 30 + Math.random() * (W - 100), y: -20, vx: 0, vy: 3.5, w: 30, h: 16, type: "charge" });
          }
        }
      } else if (phase === 1) {
        // BOTTLE PHASE - bottles spawn and shoot from game loop
        // NO boss attacks during this phase
      } else {
        // Dogs + mustard
        if (time % 1400 < 50) {
          attacks.push({ x: Math.random() * (W - 40), y: -10, vx: (Math.random() - 0.5) * 1.5, vy: 2.5 + Math.random() * 1.5, w: 16, h: 20, type: "smalldog" });
        }
        if (time % 800 < 50) {
          for (let i = -1; i <= 1; i++) {
            attacks.push({ x: bossX + 50, y: bossY + 70, vx: i * 2.2, vy: 2.8 + Math.abs(i) * 0.4, w: 8, h: 8, type: "mustard" });
          }
        }
      }
      break;
    case "boston":
      // Boston is Pac-Man style - no attacks, all handled in game loop
      break;
  }
  return attacks;
}

// ─── MAIN GAME COMPONENT ───
export default function Game() {
  const canvasRef = useRef(null);
  const gameState = useRef(null);
  const animRef = useRef(null);
  const [screen, setScreen] = useState("title"); // title, playing, vocab, victory, gameover, finalwin
  const [currentLevel, setCurrentLevel] = useState(0);
  const [vocabIndex, setVocabIndex] = useState(0);
  const [currentVocab, setCurrentVocab] = useState(null);
  const [vocabTimer, setVocabTimer] = useState(5);
  const [wrongAnswer, setWrongAnswer] = useState(false);
  const vocabTimerRef = useRef(null);
  const keysRef = useRef({});
  const lastShotRef = useRef(0);
  const vocabHandlerRef = useRef(null);

  const initGameState = useCallback(() => {
    const level = LEVELS[currentLevel];
    const baseState = {
      playerX: 100,
      playerY: 380,
      bullets: [],
      bossX: 680,
      bossY: 50,
      bossHP: level === "egypt" ? 4 : 3,
      bossPhase: 0,
      damageBar: 0,
      attacks: [],
      hearts: 3,
      invincible: 0,
      lastShot: 0,
      bossFlash: 0,
    };

    if (level === "tennessee") {
      gameState.current = {
        ...baseState,
        playerVY: 0,
        onGround: false,
        enemies: [],
        enemiesSpawned: false,
      };
    } else if (level === "athens") {
      gameState.current = {
        ...baseState,
        playerY: H - 130,
        playerVY: 0,
        onGround: true,
        scrollX: 0,
        wallX: -100,
        wallSpeed: 4,
        obstacles: [],
        obstaclesGenerated: false,
        levelWidth: 5000,
        doorX: 4900,
        stunned: 0,
      };
    } else if (level === "egypt") {
      gameState.current = {
        ...baseState,
        playerY: H - 110,
        playerVY: 0,
        onGround: true,
        bossX: 650,
        bossY: H - 60 - 180,
        bossCharging: false,
        bossChargeDir: -1,
        bossReturnX: 650,
        tentacles: [],
        fallingObjects: [],
        lastSpreadShot: 0,
        lastCharge: 0,
        lastTentacle: 0,
        lastFalling: 0,
      };
    } else if (level === "boston") {
      gameState.current = {
        ...baseState,
        playerX: 60,
        playerY: 60,
        bossX: W / 2 - 60,
        bossY: 60,
        bottles: [],
        clams: [],
        mazeWalls: [],
        crabs: [],
        crabsSpawned: false,
        bostonMaze: BOSTON_MAZES[0],
      };
    } else {
      gameState.current = {
        ...baseState,
        playerX: 80,
        playerY: H - 120,
        bossX: W / 2 - 60,
        bossY: 60,
        bottles: [],
      };
    }
  }, [currentLevel]);

  // ─── INPUT ───
  useEffect(() => {
    const down = (e) => {
      keysRef.current[e.key.toLowerCase()] = true;
      // Number keys for vocab
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx <= 3 && vocabHandlerRef.current) {
        vocabHandlerRef.current(idx);
      }
    };
    const up = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // ─── VOCAB TIMER ───
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

  // ─── GAME LOOP ───
  useEffect(() => {
    if (screen !== "playing") { cancelAnimationFrame(animRef.current); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!gameState.current) initGameState();
    const gs = gameState.current;
    const level = LEVELS[currentLevel];

    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 16.67, 3);
      lastTime = now;

      // ── Player movement ──
      const keys = keysRef.current;
      const levelType = LEVEL_TYPES[level];

      if (levelType === "platformer") {
        if (keys["arrowleft"] || keys["a"]) gs.playerX -= 5;
        if (keys["arrowright"] || keys["d"]) gs.playerX += 5;
        gs.playerX = Math.max(0, Math.min(W - PLAYER_W, gs.playerX));

        if ((keys["arrowup"] || keys["w"]) && gs.onGround) {
          gs.playerVY = JUMP_POWER_TENNESSEE;
          gs.onGround = false;
        }

        gs.playerVY += GRAVITY;
        gs.playerY += gs.playerVY;

        gs.onGround = false;
        for (const plat of TENNESSEE_PLATFORMS) {
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

        if (gs.playerY > H) {
          gs.hearts -= 1;
          if (gs.hearts <= 0) {
            setScreen("gameover");
            return;
          }
          const highest = TENNESSEE_PLATFORMS.reduce((h, p) => (p.y < h.y ? p : h));
          gs.playerX = highest.x + 20;
          gs.playerY = highest.y - PLAYER_H;
          gs.playerVY = 0;
          gs.onGround = true;
          gs.invincible = 90;
        }

        if ((keys[" "] || keys["spacebar"]) && now - lastShotRef.current > FIRE_RATE) {
          gs.bullets.push({ x: gs.playerX + PLAYER_W, y: gs.playerY + PLAYER_H / 2, vx: 8 });
          lastShotRef.current = now;
        }
        gs.bullets = gs.bullets.map((b) => ({ ...b, x: b.x + b.vx })).filter((b) => b.x < W + 20);

        if (!gs.bossDirection) gs.bossDirection = 1;
        gs.bossY += gs.bossDirection * 2;
        if (gs.bossY <= 50) {
          gs.bossY = 50;
          gs.bossDirection = 1;
        }
        if (gs.bossY >= 400) {
          gs.bossY = 400;
          gs.bossDirection = -1;
        }

        if (now % 1200 < 20) {
          gs.attacks.push({ x: gs.bossX - 20, y: gs.bossY + 50, vx: -5, vy: 0, w: 8, h: 20, type: "syrup" });
        }
        if (gs.bossPhase === 2 && now % 2000 < 20) {
          gs.attacks.push({ x: Math.random() * (W - 100) + 50, y: -20, vx: 0, vy: 2, w: 8, h: 20, type: "syrup" });
        }
        gs.attacks = gs.attacks.map((a) => ({ ...a, x: a.x + a.vx, y: a.y + a.vy })).filter((a) => a.x > -20 && a.x < W + 20 && a.y < H + 50);

        if (gs.bossPhase >= 1 && gs.enemies.length === 0 && !gs.enemiesSpawned) {
          gs.enemies = [
            { x: 120, y: 240, plat: 2, dir: 1, hp: 3 },
            { x: 420, y: 150, plat: 3, dir: 1, hp: 3 },
          ];
          gs.enemiesSpawned = true;
        }

        gs.enemies.forEach((e) => {
          const plat = TENNESSEE_PLATFORMS[e.plat];
          e.x += e.dir * 1.5;
          if (e.x <= plat.x) { e.x = plat.x; e.dir = 1; }
          if (e.x >= plat.x + plat.w - 30) { e.x = plat.x + plat.w - 30; e.dir = -1; }
          e.y = plat.y - 30;
        });

        for (let i = gs.enemies.length - 1; i >= 0; i--) {
          const e = gs.enemies[i];
          for (let j = gs.bullets.length - 1; j >= 0; j--) {
            const b = gs.bullets[j];
            if (b.x > e.x && b.x < e.x + 30 && b.y > e.y && b.y < e.y + 30) {
              e.hp -= 1;
              gs.bullets.splice(j, 1);
              if (e.hp <= 0) gs.enemies.splice(i, 1);
              break;
            }
          }
        }

        const canHitBoss = gs.bossPhase === 0 || gs.enemies.length === 0;
        if (canHitBoss) {
          let hits = 0;
          gs.bullets = gs.bullets.filter((b) => {
            if (b.x > gs.bossX - 20 && b.x < gs.bossX + 60 && b.y > gs.bossY && b.y < gs.bossY + 100) {
              hits++;
              return false;
            }
            return true;
          });
          gs.damageBar = Math.min(1, gs.damageBar + hits * 0.05);
          if (gs.damageBar >= 1) {
            gs.damageBar = 0;
            setCurrentVocab(VOCAB[level][vocabIndex]);
            setScreen("vocab");
            return;
          }
        }

        if (gs.invincible <= 0) {
          for (const a of gs.attacks) {
            if (gs.playerX + PLAYER_W > a.x && gs.playerX < a.x + a.w && gs.playerY + PLAYER_H > a.y && gs.playerY < a.y + a.h) {
              gs.hearts -= 1;
              gs.invincible = 60;
              if (gs.hearts <= 0) {
                setScreen("gameover");
                return;
              }
              break;
            }
          }
          for (const e of gs.enemies) {
            if (gs.playerX + PLAYER_W > e.x && gs.playerX < e.x + 30 && gs.playerY + PLAYER_H > e.y && gs.playerY < e.y + 30) {
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

        BG_DRAWERS[level](ctx);
        ctx.fillStyle = "#4e342e";
        ctx.fillRect(0, H - 60, W, 60);
        TENNESSEE_PLATFORMS.forEach((p) => {
          ctx.fillStyle = "#8B4513";
          ctx.fillRect(p.x, p.y, p.w, p.h);
          ctx.fillStyle = "#A0522D";
          ctx.fillRect(p.x, p.y, p.w, 5);
        });
        gs.attacks.forEach((a) => {
          ctx.fillStyle = "#8d6e00";
          ctx.fillRect(a.x, a.y, a.w, a.h);
        });
        gs.enemies.forEach((e) => {
          ctx.fillStyle = "#d7a94e";
          ctx.beginPath();
          ctx.ellipse(e.x + 15, e.y + 15, 15, 10, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffee58";
          ctx.fillRect(e.x + 8, e.y + 5, 14, 8);
        });
        BOSS_DRAWERS[level](ctx, gs.bossX - 25, gs.bossY, gs.bossPhase);
        if (gs.invincible <= 0 || Math.floor(gs.invincible / 5) % 2 === 0) drawPlayer(ctx, gs.playerX, gs.playerY);
        gs.bullets.forEach((b) => {
          ctx.fillStyle = "#ffeb3b";
          ctx.fillRect(b.x, b.y, 8, 4);
        });
        for (let i = 0; i < 3; i++) drawHeart(ctx, 15 + i * 28, 12, i < gs.hearts);
        ctx.fillStyle = "#fff";
        ctx.font = "12px 'Courier New'";
        ctx.fillText(`Phase ${gs.bossPhase + 1}/3`, W - 115, 48);
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      if (levelType === "runner") {
        const phase = gs.bossPhase;
        gs.wallSpeed = phase === 0 ? 4 : phase === 1 ? 5.5 : 6.0;
        if (!gs.obstaclesGenerated) {
          gs.obstacles = [];
          const obstacleCount = phase === 0 ? 8 : phase === 1 ? 12 : 16;
          const spacing = gs.levelWidth / obstacleCount;
          for (let i = 0; i < obstacleCount; i++) {
            const x = 400 + i * spacing + Math.random() * 100;
            const rand = Math.random();
            if (rand < 0.25) gs.obstacles.push({ x, y: H - 100, w: 40, h: 25, type: "spike" });
            else if (rand < 0.7) gs.obstacles.push({ x, y: -50, w: 50, h: 50, type: "block", vy: 0, falling: false });
            else gs.obstacles.push({ x: x + 800, y: H - 100, w: 30, h: 30, type: "ball", vx: -3 });
          }
          gs.obstaclesGenerated = true;
        }

        let baseSpeed = gs.stunned > 0 ? 0 : 4;
        if (keys["arrowright"] || keys["d"]) baseSpeed = gs.stunned > 0 ? 0 : 6.85;
        if (keys["arrowleft"] || keys["a"]) baseSpeed = gs.stunned > 0 ? 0 : 2;
        gs.playerX += baseSpeed;

        if ((keys["arrowup"] || keys["w"] || keys[" "]) && gs.onGround) {
          gs.playerVY = -10;
          gs.onGround = false;
        }
        gs.playerVY += GRAVITY;
        gs.playerY += gs.playerVY;
        const groundY = H - 80 - PLAYER_H;
        if (gs.playerY >= groundY) {
          gs.playerY = groundY;
          gs.playerVY = 0;
          gs.onGround = true;
        } else {
          gs.onGround = false;
        }
        if (gs.playerY > H) {
          gs.playerY = groundY;
          gs.playerVY = 0;
          gs.onGround = true;
        }

        gs.scrollX = Math.max(0, gs.playerX - 200);
        gs.wallX += gs.wallSpeed;
        if (gs.wallX >= gs.playerX - 50) {
          setScreen("gameover");
          return;
        }

        gs.obstacles.forEach((obs) => {
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
          if (obs.type === "ball") obs.x += obs.vx;
        });

        if (gs.invincible <= 0 && gs.stunned <= 0) {
          for (let i = gs.obstacles.length - 1; i >= 0; i--) {
            const obs = gs.obstacles[i];
            if (gs.playerX + PLAYER_W > obs.x && gs.playerX < obs.x + obs.w && gs.playerY + PLAYER_H > obs.y && gs.playerY < obs.y + obs.h) {
              gs.hearts -= 1;
              gs.invincible = 90;
              gs.stunned = 18;
              gs.playerX -= 60;
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

        if (gs.playerX >= gs.doorX) {
          setCurrentVocab(VOCAB[level][vocabIndex]);
          setScreen("vocab");
          return;
        }

        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#e3f2fd");
        g.addColorStop(1, "#bbdefb");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        const colX = 180 - gs.scrollX * 0.3;
        ctx.fillStyle = "#efebe9";
        ctx.fillRect(colX - 30, H - 160, 260, 20);
        ctx.fillRect(colX - 20, H - 180, 240, 25);
        ctx.fillRect(colX - 25, H - 240, 250, 20);
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = "#fafafa";
          ctx.fillRect(colX + i * 40, H - 240, 22, 65);
        }
        ctx.fillStyle = "#81c784";
        ctx.beginPath();
        ctx.ellipse(650 - gs.scrollX * 0.5, H - 60, 180, 80, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = "#a5d6a7";
        ctx.beginPath();
        ctx.ellipse(100 - gs.scrollX * 0.4, H - 50, 120, 60, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = "#d7ccc8";
        ctx.fillRect(0, H - 80, W, 80);

        const bob = Math.sin(now / 270) * 3;
        const cx = gs.wallX - gs.scrollX + 40;
        const cy = 100;
        const beamWidth = 50;
        const beamStartY = cy + 20;
        const beamGradient = ctx.createLinearGradient(0, beamStartY, 0, H);
        beamGradient.addColorStop(0, "rgba(255, 0, 0, 0.8)");
        beamGradient.addColorStop(1, "rgba(255, 0, 0, 0.3)");
        ctx.fillStyle = beamGradient;
        ctx.fillRect(cx + 30 - beamWidth, beamStartY, beamWidth * 2, H - beamStartY);
        ctx.fillStyle = "rgba(255, 50, 50, 0.9)";
        ctx.fillRect(cx + 10, beamStartY, 40, H - beamStartY);
        ctx.fillStyle = "rgba(255, 200, 200, 0.8)";
        ctx.fillRect(cx + 22, beamStartY, 16, H - beamStartY);
        ctx.fillStyle = "#8d6e63";
        ctx.beginPath();
        ctx.ellipse(cx + 30, cy + bob, 35, 32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(cx + 30, cy + bob, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        ctx.beginPath();
        ctx.arc(cx + 30, cy + bob, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.arc(cx + 30, cy + bob, 10, 0, Math.PI * 2);
        ctx.fill();

        gs.obstacles.forEach((obs) => {
          const screenX = obs.x - gs.scrollX;
          if (screenX > -100 && screenX < W + 100) {
            if (obs.type === "spike") {
              ctx.fillStyle = "#e53935";
              ctx.beginPath();
              ctx.moveTo(screenX, obs.y + obs.h);
              ctx.lineTo(screenX + obs.w / 2, obs.y);
              ctx.lineTo(screenX + obs.w, obs.y + obs.h);
              ctx.fill();
            } else if (obs.type === "block") {
              ctx.fillStyle = "#5d4037";
              ctx.fillRect(screenX, obs.y, obs.w, obs.h);
            } else if (obs.type === "ball") {
              ctx.fillStyle = "#757575";
              ctx.beginPath();
              ctx.arc(screenX + obs.w / 2, obs.y + obs.h / 2, obs.w / 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });

        const doorScreenX = gs.doorX - gs.scrollX;
        if (doorScreenX > -100 && doorScreenX < W + 100) {
          ctx.fillStyle = "#4caf50";
          ctx.fillRect(doorScreenX, H - 140, 60, 60);
          ctx.fillStyle = "#2e7d32";
          ctx.fillRect(doorScreenX + 10, H - 130, 40, 50);
        }

        const playerScreenX = gs.playerX - gs.scrollX;
        if (gs.invincible <= 0 || Math.floor(gs.invincible / 5) % 2 === 0) drawPlayer(ctx, playerScreenX, gs.playerY);
        for (let i = 0; i < 3; i++) drawHeart(ctx, 15 + i * 28, 12, i < gs.hearts);
        ctx.fillStyle = "#fff";
        ctx.font = "12px 'Courier New'";
        ctx.fillText(`Phase ${gs.bossPhase + 1}/3`, W - 115, 30);
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      if (levelType === "cuphead") {
        if (keys["arrowleft"] || keys["a"]) gs.playerX -= 5;
        if (keys["arrowright"] || keys["d"]) gs.playerX += 5;
        gs.playerX = Math.max(0, Math.min(W - PLAYER_W, gs.playerX));

        if ((keys["arrowup"] || keys["w"]) && gs.onGround) {
          gs.playerVY = JUMP_POWER_EGYPT;
          gs.onGround = false;
        }

        gs.playerVY += GRAVITY;
        gs.playerY += gs.playerVY;
        const groundY = H - 60 - PLAYER_H;
        if (gs.playerY >= groundY) {
          gs.playerY = groundY;
          gs.playerVY = 0;
          gs.onGround = true;
        }
        if (gs.playerX + PLAYER_W > EGYPT_PLATFORM.x && gs.playerX < EGYPT_PLATFORM.x + EGYPT_PLATFORM.w &&
            gs.playerY + PLAYER_H >= EGYPT_PLATFORM.y && gs.playerY + PLAYER_H <= EGYPT_PLATFORM.y + EGYPT_PLATFORM.h + 10 &&
            gs.playerVY >= 0) {
          gs.playerY = EGYPT_PLATFORM.y - PLAYER_H;
          gs.playerVY = 0;
          gs.onGround = true;
        }

        const cupheadFireRate = 60;
        if ((keys[" "] || keys["spacebar"]) && now - lastShotRef.current > cupheadFireRate) {
          gs.bullets.push({ x: gs.playerX + PLAYER_W, y: gs.playerY + PLAYER_H / 2, vx: 8 });
          lastShotRef.current = now;
        }
        gs.bullets = gs.bullets.map((b) => ({ ...b, x: b.x + b.vx })).filter((b) => b.x < W + 10);

        if (!gs.bossCharging && now - gs.lastCharge > 3000) {
          gs.bossCharging = true;
          gs.bossChargeDir = -1;
          gs.lastCharge = now;
        }
        if (gs.bossCharging) {
          gs.bossX += gs.bossChargeDir * 6;
          if (gs.bossChargeDir === -1 && gs.bossX <= 50) gs.bossChargeDir = 1;
          if (gs.bossChargeDir === 1 && gs.bossX >= gs.bossReturnX) {
            gs.bossX = gs.bossReturnX;
            gs.bossCharging = false;
          }
        }

        if (!gs.bossCharging && now - gs.lastSpreadShot > 3500) {
          for (let i = 0; i < 3; i++) {
            const angle = (i - 1) * 0.7;
            gs.attacks.push({
              x: gs.bossX,
              y: gs.bossY + 90,
              vx: -4 * Math.cos(angle),
              vy: 4 * Math.sin(angle),
              w: 12,
              h: 12,
              type: "chickpea",
            });
          }
          gs.lastSpreadShot = now;
        }
        gs.attacks = gs.attacks.map((a) => ({ ...a, x: a.x + a.vx, y: a.y + a.vy })).filter((a) => a.x > -20 && a.y > -20 && a.y < H + 20);

        if (gs.bossPhase >= 1 && now - gs.lastTentacle > 2000) {
          const tentX = Math.random() * (W + 40) - 20;
          gs.tentacles.push({ x: tentX, y: H - 60, w: 40, h: 0, growing: true, maxH: 100, life: 120 });
          gs.lastTentacle = now;
        }
        gs.tentacles.forEach((t) => {
          if (t.growing && t.h < t.maxH) {
            t.h += 5;
            t.y -= 5;
          } else {
            t.growing = false;
            t.life -= 1;
          }
        });
        gs.tentacles = gs.tentacles.filter((t) => t.life > 0);

        const fallingFrequency = gs.bossPhase === 3 ? 2500 : 2000;
        if (gs.bossPhase >= 2 && now - gs.lastFalling > fallingFrequency) {
          const fallX = Math.random() * (W + 30) - 15;
          gs.fallingObjects.push({ x: fallX, y: -30, w: 30, h: 30, vy: 3 });
          gs.lastFalling = now;
        }
        gs.fallingObjects = gs.fallingObjects.map((f) => ({ ...f, y: f.y + f.vy })).filter((f) => f.y < H + 30);

        if (!gs.bossCharging) {
          let hits = 0;
          gs.bullets = gs.bullets.filter((b) => {
            if (b.x > gs.bossX && b.x < gs.bossX + 110 && b.y > gs.bossY && b.y < gs.bossY + 180) {
              hits++;
              return false;
            }
            return true;
          });
          gs.damageBar = Math.min(1, gs.damageBar + hits * 0.05);
          if (gs.damageBar >= 1) {
            gs.damageBar = 0;
            setCurrentVocab(VOCAB[level][vocabIndex]);
            setScreen("vocab");
            return;
          }
        }

        if (gs.invincible <= 0) {
          for (const a of gs.attacks) {
            if (gs.playerX + PLAYER_W > a.x && gs.playerX < a.x + a.w && gs.playerY + PLAYER_H > a.y && gs.playerY < a.y + a.h) {
              gs.hearts -= 1;
              gs.invincible = 90;
              if (gs.hearts <= 0) {
                setScreen("gameover");
                return;
              }
              break;
            }
          }
          for (const t of gs.tentacles) {
            if (gs.playerX + PLAYER_W > t.x && gs.playerX < t.x + t.w && gs.playerY + PLAYER_H > t.y && gs.playerY < t.y + t.h) {
              gs.hearts -= 1;
              gs.invincible = 90;
              if (gs.hearts <= 0) {
                setScreen("gameover");
                return;
              }
              break;
            }
          }
          for (let i = gs.fallingObjects.length - 1; i >= 0; i--) {
            const f = gs.fallingObjects[i];
            if (gs.playerX + PLAYER_W > f.x && gs.playerX < f.x + f.w && gs.playerY + PLAYER_H > f.y && gs.playerY < f.y + f.h) {
              gs.hearts -= 1;
              gs.invincible = 90;
              gs.fallingObjects.splice(i, 1);
              if (gs.hearts <= 0) {
                setScreen("gameover");
                return;
              }
              break;
            }
          }
          if (gs.bossCharging &&
              gs.playerX + PLAYER_W > gs.bossX && gs.playerX < gs.bossX + 110 &&
              gs.playerY + PLAYER_H > gs.bossY && gs.playerY < gs.bossY + 180) {
            gs.hearts -= 1;
            gs.invincible = 90;
            if (gs.hearts <= 0) {
              setScreen("gameover");
              return;
            }
          }
        }
        gs.invincible = Math.max(0, gs.invincible - 1);

        BG_DRAWERS[level](ctx);
        ctx.fillStyle = "#8d6e63";
        ctx.fillRect(EGYPT_PLATFORM.x, EGYPT_PLATFORM.y, EGYPT_PLATFORM.w, EGYPT_PLATFORM.h);
        ctx.fillStyle = "#a1887f";
        ctx.fillRect(EGYPT_PLATFORM.x, EGYPT_PLATFORM.y, EGYPT_PLATFORM.w, 5);
        gs.attacks.forEach((a) => {
          ctx.fillStyle = "#ffd600";
          ctx.beginPath();
          ctx.arc(a.x + 6, a.y + 6, 6, 0, Math.PI * 2);
          ctx.fill();
        });
        gs.tentacles.forEach((t) => {
          ctx.fillStyle = "#8d6e63";
          ctx.fillRect(t.x, t.y, t.w, t.h);
          ctx.fillStyle = "#6d4c41";
          ctx.fillRect(t.x + 5, t.y, 10, t.h);
        });
        gs.fallingObjects.forEach((f) => {
          ctx.fillStyle = "#bf360c";
          ctx.beginPath();
          ctx.arc(f.x + 15, f.y + 15, 15, 0, Math.PI * 2);
          ctx.fill();
        });
        const bob = Math.sin(now / 300) * 3;
        ctx.fillStyle = "#fff8e1";
        ctx.fillRect(gs.bossX + 15, gs.bossY + 30 + bob, 80, 150);
        ctx.strokeStyle = "#ffe082";
        ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
          ctx.beginPath();
          ctx.moveTo(gs.bossX + 15, gs.bossY + 45 + i * 14 + bob);
          ctx.lineTo(gs.bossX + 95, gs.bossY + 45 + i * 14 + bob);
          ctx.stroke();
        }
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
        ctx.fillStyle = "#fff";
        ctx.fillRect(gs.bossX + 35, gs.bossY + 50 + bob, 12, 12);
        ctx.fillRect(gs.bossX + 63, gs.bossY + 50 + bob, 12, 12);
        ctx.fillStyle = "#000";
        ctx.fillRect(gs.bossX + 40, gs.bossY + 54 + bob, 4, 4);
        ctx.fillRect(gs.bossX + 68, gs.bossY + 54 + bob, 4, 4);
        if (gs.invincible <= 0 || Math.floor(gs.invincible / 5) % 2 === 0) drawPlayer(ctx, gs.playerX, gs.playerY);
        gs.bullets.forEach((b) => {
          ctx.fillStyle = "#ffeb3b";
          ctx.fillRect(b.x, b.y, 8, 4);
        });
        for (let i = 0; i < 3; i++) drawHeart(ctx, 15 + i * 28, 12, i < gs.hearts);
        ctx.fillStyle = "#fff";
        ctx.font = "12px 'Courier New'";
        ctx.fillText(`Phase ${gs.bossPhase + 1}/4`, W - 115, 30);
        ctx.fillStyle = "#333";
        ctx.fillRect(W - 200, 12, 180, 22);
        ctx.fillStyle = "#222";
        ctx.fillRect(W - 198, 14, 176, 18);
        for (let i = 0; i < 4; i++) {
          const segW = 176 / 4;
          ctx.fillStyle = i < gs.bossHP ? "#2e7d32" : "#1a1a1a";
          ctx.fillRect(W - 198 + i * segW, 14, segW - 1, 18);
        }
        ctx.fillStyle = "#fff";
        ctx.font = "bold 11px 'Courier New'";
        ctx.fillText(BOSS_NAMES[level], W - 195, 27);
        animRef.current = requestAnimationFrame(loop);
        return;
      }
      
      // Boston uses same size as crabs
      const pW = level === "boston" ? 20 : PLAYER_W;
      const pH = level === "boston" ? 20 : PLAYER_H;
      
      // Try to move and check walls for Boston
      if (level === "boston") {
        const maze = BOSTON_MAZES[gs.bossPhase];
        const oldX = gs.playerX;
        const oldY = gs.playerY;
        
        if (keys["arrowleft"] || keys["a"]) gs.playerX -= PLAYER_SPEED * dt;
        if (keys["arrowright"] || keys["d"]) gs.playerX += PLAYER_SPEED * dt;
        if (keys["arrowup"] || keys["w"]) gs.playerY -= PLAYER_SPEED * dt;
        if (keys["arrowdown"] || keys["s"]) gs.playerY += PLAYER_SPEED * dt;
        
        // Clamp to screen first
        gs.playerX = Math.max(0, Math.min(W - pW, gs.playerX));
        gs.playerY = Math.max(0, Math.min(H - pH, gs.playerY));
        
        // Check if new position hits wall
        const checkWall = (x, y) => {
          const col = Math.floor(x / CELL);
          const row = Math.floor(y / CELL);
          if (row < 0 || row >= maze.length || col < 0 || col >= maze[0].length) return true;
          return maze[row][col] === '#';
        };
        
        // Check 4 corners of player hitbox
        const hitWall = 
          checkWall(gs.playerX + 1, gs.playerY + 1) || 
          checkWall(gs.playerX + pW - 1, gs.playerY + 1) || 
          checkWall(gs.playerX + 1, gs.playerY + pH - 1) || 
          checkWall(gs.playerX + pW - 1, gs.playerY + pH - 1);
        
        if (hitWall) {
          // Revert to old position
          gs.playerX = oldX;
          gs.playerY = oldY;
        }
      } else {
        // Normal movement for other levels
        if (keys["arrowleft"] || keys["a"]) gs.playerX -= PLAYER_SPEED * dt;
        if (keys["arrowright"] || keys["d"]) gs.playerX += PLAYER_SPEED * dt;
        if (keys["arrowup"] || keys["w"]) gs.playerY -= PLAYER_SPEED * dt;
        if (keys["arrowdown"] || keys["s"]) gs.playerY += PLAYER_SPEED * dt;
        gs.playerX = Math.max(0, Math.min(W - PLAYER_W, gs.playerX));
        gs.playerY = Math.max(0, Math.min(H - PLAYER_H - 60, gs.playerY));
      }

      // ── Boss movement ──
      if (!gs.bossBaseX) gs.bossBaseX = gs.bossX;
      gs.bossX = gs.bossBaseX + Math.sin(now / (1200 - gs.bossPhase * 200)) * (80 + gs.bossPhase * 40);
      gs.bossX = Math.max(20, Math.min(W - 140, gs.bossX));

      // ── NYC Phase 1: Bottle spawn and shooting ──
      if (level === "nyc" && gs.bossPhase === 1) {
        if (!gs.bottlesSpawned) {
          // Spawn 4 bottles at TOP corners/sides only (ONCE)
          gs.bottles = [
            { x: 80, y: 80, hp: 7, label: "K", lastShot: 0, shootDelay: 1200 }, // Top-left ketchup
            { x: W - 120, y: 80, hp: 7, label: "M", lastShot: 300, shootDelay: 1400 }, // Top-right mustard
            { x: 20, y: 140, hp: 7, label: "M", lastShot: 600, shootDelay: 1300 }, // Upper-left mustard
            { x: W - 60, y: 140, hp: 7, label: "K", lastShot: 900, shootDelay: 1500 }, // Upper-right ketchup
          ];
          gs.bottlesSpawned = true; // Mark as spawned, never respawn
        }
        // Bottles shoot diagonal sauce
        gs.bottles.forEach((b) => {
          if (now - b.lastShot > b.shootDelay) {
            const angle = Math.atan2(gs.playerY - b.y, gs.playerX - b.x);
            gs.attacks.push({
              x: b.x + 20,
              y: b.y + 20,
              vx: Math.cos(angle) * 3,
              vy: Math.sin(angle) * 3,
              w: 8,
              h: 8,
              type: b.label === "K" ? "ketchupsauce" : "mustardsauce",
            });
            b.lastShot = now;
          }
        });
      }

      // ── BOSTON Pac-Man logic ──
      if (level === "boston") {
        // Initialize clams and crabs
        if (!gs.bostonInit) {
          // Populate clams from maze dots
          gs.clams = [];
          const maze = BOSTON_MAZES[gs.bossPhase];
          for (let row = 0; row < maze.length; row++) {
            for (let col = 0; col < maze[row].length; col++) {
              if (maze[row][col] === '.') {
                gs.clams.push({ x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 });
              }
            }
          }
          // Spawn crabs at EXACT positions from YOUR diagram (orange circles)
          const crabCount = gs.bossPhase === 0 ? 2 : gs.bossPhase === 1 ? 4 : 6;
          gs.crabs = [];
          
          const configs = [
            // Phase 0: 2 crabs
            [
              { x: 760, y: 50, type: 'vertical', dir: 'down' },      // Top-right corner
              { x: 40, y: 450, type: 'horizontal', dir: 'right' },   // Bottom-left corner
            ],
            // Phase 1: 4 crabs (all corners)
            [
              { x: 760, y: 50, type: 'vertical', dir: 'down' },      // Top-right
              { x: 40, y: 450, type: 'horizontal', dir: 'right' },   // Bottom-left
              { x: 40, y: 50, type: 'vertical', dir: 'down' },       // Top-left
              { x: 760, y: 450, type: 'horizontal', dir: 'left' },   // Bottom-right
            ],
            // Phase 2: 6 crabs (4 corners + 2 centers)
            [
              { x: 760, y: 50, type: 'vertical', dir: 'down' },      // Top-right
              { x: 40, y: 450, type: 'horizontal', dir: 'right' },   // Bottom-left
              { x: 40, y: 50, type: 'vertical', dir: 'down' },       // Top-left
              { x: 760, y: 450, type: 'horizontal', dir: 'left' },   // Bottom-right
              { x: 400, y: 50, type: 'vertical', dir: 'down' },      // Top-center
              { x: 400, y: 450, type: 'horizontal', dir: 'left' },   // Bottom-center
            ],
          ];
          
          configs[gs.bossPhase].forEach((cfg) => {
            gs.crabs.push({
              x: cfg.x,
              y: cfg.y,
              moveType: cfg.type,
              zigzagDir: cfg.dir,
              speed: 2,
            });
          });
          
          gs.bostonInit = true;
        }

        // Player-clam collision (collect clams)
        gs.clams = gs.clams.filter((clam) => {
          const dist = Math.hypot(gs.playerX + 10 - clam.x, gs.playerY + 10 - clam.y);
          return dist > 12; // Collect if within 12px
        });

        // Check if all clams collected
        if (gs.clams.length === 0 && gs.bostonInit) {
          // Trigger vocab
          gs.bostonInit = false; // Reset for next phase
          const vocab = VOCAB[level];
          setCurrentVocab(vocab[vocabIndex]);
          setScreen("vocab");
          return;
        }

        // Zigzag crab AI - continuous sweeping movement
        gs.crabs.forEach((crab) => {
          const speed = crab.speed * dt;
          
          if (crab.moveType === 'vertical') {
            // Vertical zigzag: down → right 40px → up → right 40px → repeat
            if (crab.zigzagDir === 'down') {
              crab.y += speed;
              if (crab.y >= H - 60) {
                crab.x += 40;
                crab.zigzagDir = 'up';
                if (crab.x >= W - 60) crab.x = 40; // Wrap around
              }
            } else if (crab.zigzagDir === 'up') {
              crab.y -= speed;
              if (crab.y <= 60) {
                crab.x += 40;
                crab.zigzagDir = 'down';
                if (crab.x >= W - 60) crab.x = 40; // Wrap around
              }
            }
          } else {
            // Horizontal zigzag: right → down 40px → left → down 40px → repeat
            if (crab.zigzagDir === 'right') {
              crab.x += speed;
              if (crab.x >= W - 60) {
                crab.y += 40;
                crab.zigzagDir = 'left';
                if (crab.y >= H - 60) crab.y = 60; // Wrap around
              }
            } else if (crab.zigzagDir === 'left') {
              crab.x -= speed;
              if (crab.x <= 60) {
                crab.y += 40;
                crab.zigzagDir = 'right';
                if (crab.y >= H - 60) crab.y = 60; // Wrap around
              }
            }
          }
          
          // Keep in bounds
          crab.x = Math.max(30, Math.min(W - 30, crab.x));
          crab.y = Math.max(30, Math.min(H - 30, crab.y));
        });

        // Player-crab collision
        if (gs.invincible <= 0) {
          for (const crab of gs.crabs) {
            const dist = Math.hypot(gs.playerX + 10 - crab.x, gs.playerY + 10 - crab.y);
            if (dist < 20) {
              gs.hearts -= 1;
              gs.invincible = 90;
              if (gs.hearts <= 0) {
                setScreen("gameover");
                return;
              }
              break;
            }
          }
        }

      }

      // ── Shooting ──
      if (level !== "boston" && (keys[" "] || keys["spacebar"])) {
        if (now - lastShotRef.current > FIRE_RATE) {
          gs.bullets.push({ x: gs.playerX + PLAYER_W / 2 - BULLET_W / 2, y: gs.playerY, vy: -BULLET_SPEED });
          lastShotRef.current = now;
        }
      }

      // ── Update bullets ──
      gs.bullets = gs.bullets.map((b) => ({ ...b, y: b.y + b.vy * dt })).filter((b) => b.y > -20);

      // ── Bullet-Bottle collision (NYC Phase 1) ──
      if (level === "nyc" && gs.bossPhase === 1 && gs.bottles && gs.bottles.length > 0) {
        gs.bullets = gs.bullets.filter((b) => {
          for (let i = gs.bottles.length - 1; i >= 0; i--) {
            const bot = gs.bottles[i];
            if (b.x > bot.x && b.x < bot.x + 40 && b.y > bot.y && b.y < bot.y + 50) {
              bot.hp--;
              if (bot.hp <= 0) {
                gs.bottles.splice(i, 1);
              }
              return false; // Bullet consumed
            }
          }
          return true;
        });
      }

      // ── Bullet-Boss collision ──
      const bx = gs.bossX, by = gs.bossY;
      let hitsThisFrame = 0;
      // Boss invulnerable if bottles exist in NYC phase 1
      const bossVulnerable = !(level === "nyc" && gs.bossPhase === 1 && gs.bottles && gs.bottles.length > 0);
      if (bossVulnerable) {
        gs.bullets = gs.bullets.filter((b) => {
          if (b.x > bx - 10 && b.x < bx + 130 && b.y > by - 10 && b.y < by + 115) {
            hitsThisFrame++;
            return false;
          }
          return true;
        });
      }

      // ── Generate attacks ──
      const newAttacks = getAttacks(level, gs.bossPhase, gs.bossX, gs.bossY);
      gs.attacks.push(...newAttacks);

      // ── Update attacks ──
      gs.attacks = gs.attacks
        .map((a) => {
          if (a.type === "shockwave") return { ...a, timer: a.timer - dt };
          return { ...a, x: a.x + a.vx * dt, y: a.y + a.vy * dt };
        })
        .filter((a) => {
          if (a.type === "shockwave") return a.timer > 0;
          return a.x > -50 && a.x < W + 50 && a.y > -50 && a.y < H + 50;
        });

      // ── Player-attack collision ──
      if (gs.invincible <= 0) {
        for (const a of gs.attacks) {
          let hit = false;
          if (a.type === "shockwave") {
            // Shockwave: player must be above it
            if (gs.playerY + PLAYER_H > H - 95 && gs.playerY + PLAYER_H < H - 55) hit = true;
          } else if (a.type === "laser") {
            if (gs.playerX + PLAYER_W > a.x && gs.playerX < a.x + a.w && gs.playerY + PLAYER_H > a.y && gs.playerY < a.y + a.h) hit = true;
          } else {
            if (gs.playerX + PLAYER_W > a.x && gs.playerX < a.x + a.w && gs.playerY + PLAYER_H > a.y && gs.playerY < a.y + a.h) hit = true;
          }
          if (hit) {
            gs.hearts -= 1;
            gs.invincible = 90; // frames
            gs.attacks = gs.attacks.filter((att) => att !== a);
            if (gs.hearts <= 0) {
              setScreen("gameover");
              return;
            }
            break;
          }
        }
      } else {
        gs.invincible -= dt;
      }

      // ── Boss damage accumulator ──
      if (!gs.damageBar) gs.damageBar = 0;
      gs.damageBar = Math.min(1, gs.damageBar + hitsThisFrame * 0.04);

      if (gs.damageBar >= 1) {
        // Trigger vocab
        gs.damageBar = 0;
        const vocab = VOCAB[level];
        setCurrentVocab(vocab[vocabIndex]);
        setScreen("vocab");
        return;
      }

      // ── DRAW ──
      // Background
      if (level === "boston") {
        // Boston Pac-Man rendering
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, H);
        
        // Draw maze
        const maze = BOSTON_MAZES[gs.bossPhase];
        ctx.strokeStyle = "#2196f3";
        ctx.lineWidth = 3;
        for (let row = 0; row < maze.length; row++) {
          for (let col = 0; col < maze[row].length; col++) {
            if (maze[row][col] === '#') {
              ctx.strokeRect(col * CELL, row * CELL, CELL, CELL);
            }
          }
        }
        
        // Draw clams
        ctx.fillStyle = "#fff";
        gs.clams.forEach((clam) => {
          ctx.beginPath();
          ctx.arc(clam.x, clam.y, 3, 0, Math.PI * 2);
          ctx.fill();
        });
        
        // Draw crabs
        gs.crabs.forEach((crab) => {
          ctx.fillStyle = "#ef5350";
          ctx.beginPath();
          ctx.arc(crab.x, crab.y, 10, 0, Math.PI * 2);
          ctx.fill();
          // Eyes
          ctx.fillStyle = "#fff";
          ctx.fillRect(crab.x - 5, crab.y - 3, 4, 4);
          ctx.fillRect(crab.x + 1, crab.y - 3, 4, 4);
          ctx.fillStyle = "#000";
          ctx.fillRect(crab.x - 4, crab.y - 2, 2, 2);
          ctx.fillRect(crab.x + 2, crab.y - 2, 2, 2);
          // Claws
          ctx.fillStyle = "#e53935";
          ctx.fillRect(crab.x - 12, crab.y, 4, 6);
          ctx.fillRect(crab.x + 8, crab.y, 4, 6);
        });
      } else {
        BG_DRAWERS[level](ctx);
      }

      // Ground line
      ctx.fillStyle = "#222";
      ctx.fillRect(0, level === "boston" ? H : H - 60, W, 2);

      // Attacks
      gs.attacks.forEach((a) => {
        switch (a.type) {
          case "fallingrod":
            // Bright neon pink/magenta with glow - very visible against orange/brown
            ctx.fillStyle = "#ff1744";
            ctx.shadowColor = "#ff1744";
            ctx.shadowBlur = 15;
            ctx.fillRect(a.x, a.y, a.w, a.h);
            ctx.fillStyle = "#ff5252";
            ctx.fillRect(a.x + 5, a.y, a.w - 10, a.h);
            ctx.shadowBlur = 0;
            break;
          case "pit": 
            // Bright cyan/electric blue - pops against warm background
            ctx.fillStyle = "#00e5ff"; 
            ctx.shadowColor = "#00e5ff";
            ctx.shadowBlur = 10;
            ctx.beginPath(); 
            ctx.arc(a.x + 7, a.y + 7, 7, 0, Math.PI * 2); 
            ctx.fill();
            ctx.shadowBlur = 0;
            break;
          case "shockwave":
            ctx.fillStyle = "rgba(139,69,19,0.4)";
            ctx.fillRect(0, H - 95, W, 35);
            break;
          case "juice": ctx.fillStyle = "#ff5722"; ctx.beginPath(); ctx.arc(a.x + 5, a.y + 5, 5, 0, Math.PI * 2); ctx.fill(); break;
          case "charge": ctx.fillStyle = "#d32f2f"; ctx.fillRect(a.x, a.y, a.w, a.h); ctx.fillStyle = "#ffee58"; ctx.fillRect(a.x + 5, a.y + 2, 12, 8); break;
          case "smalldog": 
            // Bright pink hot dog with white spots
            ctx.fillStyle = "#ff4081"; 
            ctx.shadowColor = "#ff4081";
            ctx.shadowBlur = 8;
            ctx.fillRect(a.x, a.y, a.w, a.h); 
            ctx.fillStyle = "#fff"; 
            ctx.fillRect(a.x + 3, a.y + 3, 4, 3); 
            ctx.fillRect(a.x + 9, a.y + 3, 4, 3);
            ctx.shadowBlur = 0;
            break;
          case "mustard": 
            // Regular mustard from boss - bright yellow-green to stand out from building lights
            ctx.fillStyle = "#ffeb3b"; 
            ctx.shadowColor = "#ffeb3b";
            ctx.shadowBlur = 8;
            ctx.beginPath(); 
            ctx.ellipse(a.x + 4, a.y + 4, 6, 4, 0, 0, Math.PI * 2); 
            ctx.fill();
            ctx.shadowBlur = 0;
            break;
          case "ketchupsauce": 
            // Bottle ketchup - bright red oval, bigger
            ctx.fillStyle = "#f44336"; 
            ctx.shadowColor = "#f44336";
            ctx.shadowBlur = 10;
            ctx.beginPath(); 
            ctx.ellipse(a.x + 4, a.y + 4, 7, 5, 0, 0, Math.PI * 2); 
            ctx.fill();
            ctx.shadowBlur = 0;
            break;
          case "mustardsauce": 
            // Bottle mustard - lime green to differentiate from building lights
            ctx.fillStyle = "#cddc39"; 
            ctx.shadowColor = "#cddc39";
            ctx.shadowBlur = 10;
            ctx.beginPath(); 
            ctx.ellipse(a.x + 4, a.y + 4, 7, 5, 0, 0, Math.PI * 2); 
            ctx.fill();
            ctx.shadowBlur = 0;
            break;
          case "claw": ctx.fillStyle = "#ef5350"; ctx.fillRect(a.x, a.y, a.w, a.h); break;
          case "bubble": ctx.strokeStyle = "#80deea"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(a.x + 6, a.y + 6, 6, 0, Math.PI * 2); ctx.stroke(); break;
          case "lobstercharge": ctx.fillStyle = "#e53935"; ctx.fillRect(a.x, a.y, a.w, a.h); break;
          case "butter": ctx.fillStyle = "#ffee58"; ctx.fillRect(a.x, a.y, a.w, a.h); break;
          case "syrup": ctx.fillStyle = "#8d6e00"; ctx.fillRect(a.x, a.y, a.w, a.h); break;
          case "pancake": ctx.fillStyle = "#d7a94e"; ctx.beginPath(); ctx.ellipse(a.x + 10, a.y + 5, 10, 5, 0, 0, Math.PI * 2); ctx.fill(); break;
          case "skewer": ctx.save(); ctx.translate(a.x + 3, a.y + 11); ctx.rotate(a.rot || 0); ctx.fillStyle = "#5d4037"; ctx.fillRect(-3, -11, 6, 22); ctx.fillStyle = "#d32f2f"; ctx.fillRect(-4, -4, 8, 8); ctx.restore(); break;
          case "laser": ctx.fillStyle = "rgba(255, 235, 59, 0.7)"; ctx.fillRect(a.x, a.y, a.w, a.h); ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.fillRect(a.x, a.y + 3, a.w, 6); break;
          case "scarab": ctx.fillStyle = "#5d4037"; ctx.beginPath(); ctx.ellipse(a.x + 3, a.y + 3, 3, 3, 0, 0, Math.PI * 2); ctx.fill(); break;
          case "tentacle": ctx.fillStyle = "#ffcc80"; ctx.fillRect(a.x, a.y, a.w, a.h); break;
          case "chickpea": ctx.fillStyle = "#d4a843"; ctx.beginPath(); ctx.arc(a.x + 12, a.y + 12, 12, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#b8860b"; ctx.beginPath(); ctx.arc(a.x + 8, a.y + 8, 4, 0, Math.PI * 2); ctx.fill(); break;
          default: break;
        }
      });

      // Bottles (NYC Phase 1)
      if (level === "nyc" && gs.bossPhase === 1 && gs.bottles) {
        gs.bottles.forEach((b) => {
          // Bottle body
          ctx.fillStyle = b.label === "K" ? "#d32f2f" : "#ffeb3b";
          ctx.fillRect(b.x, b.y + 10, 40, 40);
          // Cap
          ctx.fillStyle = "#fff";
          ctx.fillRect(b.x + 12, b.y, 16, 12);
          // Label text
          ctx.fillStyle = "#000";
          ctx.font = "bold 16px monospace";
          ctx.fillText(b.label, b.x + 15, b.y + 33);
          // HP bar
          ctx.fillStyle = "#333";
          ctx.fillRect(b.x, b.y - 8, 40, 6);
          ctx.fillStyle = "#4caf50";
          ctx.fillRect(b.x, b.y - 8, 40 * (b.hp / 7), 6);
        });
      }

      // Boss
      if (level !== "boston") {
        BOSS_DRAWERS[level](ctx, gs.bossX, gs.bossY, gs.bossPhase);
      }

      // Boss flash when hit
      if (level !== "boston") {
        if (!gs.bossFlash) gs.bossFlash = 0;
        if (hitsThisFrame > 0) gs.bossFlash = 5;
        if (gs.bossFlash > 0) {
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.fillRect(gs.bossX - 10, gs.bossY - 10, 140, 125);
          gs.bossFlash -= dt;
        }
      }

      // Player (flash when invincible)
      if (gs.invincible <= 0 || Math.floor(gs.invincible) % 3 < 2) {
        if (level === "boston") {
          // Player for Boston - same size as crabs, purple with yellow eyes
          ctx.fillStyle = "#9c27b0"; // Purple
          ctx.beginPath();
          ctx.arc(gs.playerX + 10, gs.playerY + 10, 10, 0, Math.PI * 2);
          ctx.fill();
          // Yellow eyes
          ctx.fillStyle = "#ffeb3b";
          ctx.fillRect(gs.playerX + 5, gs.playerY + 7, 4, 4);
          ctx.fillRect(gs.playerX + 11, gs.playerY + 7, 4, 4);
          // Black pupils
          ctx.fillStyle = "#000";
          ctx.fillRect(gs.playerX + 6, gs.playerY + 8, 2, 2);
          ctx.fillRect(gs.playerX + 12, gs.playerY + 8, 2, 2);
        } else {
          drawPlayer(ctx, gs.playerX, gs.playerY);
        }
      }

      // Bullets
      gs.bullets.forEach((b) => drawBullet(ctx, b.x, b.y));

      // ── HUD ──
      // Hearts
      for (let i = 0; i < 3; i++) drawHeart(ctx, 15 + i * 28, 12, i < gs.hearts);

      // HUD
      if (level === "boston") {
        // Clam counter for Boston
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px 'Courier New'";
        ctx.fillText(`Clams: ${gs.clams.length}`, W - 120, 30);
        ctx.fillText(`Phase ${gs.bossPhase + 1}/3`, W - 120, 50);
      } else {
        // Boss HP bar
        const totalHP = LEVELS[currentLevel] === "egypt" ? 4 : 3;
        ctx.fillStyle = "#333";
        ctx.fillRect(W - 200, 12, 180, 22);
        ctx.fillStyle = "#222";
        ctx.fillRect(W - 198, 14, 176, 18);
        // Background segments
        for (let i = 0; i < totalHP; i++) {
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(W - 198 + i * (176 / totalHP), 14, 176 / totalHP - 1, 18);
        }
        // Filled segments for remaining HP
        for (let i = 0; i < gs.bossHP; i++) {
          const segW = 176 / totalHP;
          const isCurrentPhase = i === gs.bossHP - 1;
          ctx.fillStyle = isCurrentPhase ? (gs.damageBar > 0.6 ? "#ff9800" : "#4caf50") : "#2e7d32";
          ctx.fillRect(W - 198 + i * segW, 14, isCurrentPhase ? segW * gs.damageBar : segW - 1, 18);
        }
        ctx.fillStyle = "#fff";
        ctx.font = "bold 11px 'Courier New'";
        ctx.fillText(BOSS_NAMES[level], W - 195, 27);

        // Phase indicator
        ctx.fillStyle = "#fff";
        ctx.font = "12px 'Courier New'";
        ctx.fillText(`Phase ${gs.bossPhase + 1}/${totalHP}`, W - 195, 48);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [screen, currentLevel, vocabIndex, initGameState]);

  // ─── VOCAB ANSWER HANDLER ───
  const handleVocabAnswer = (chosen) => {
    clearInterval(vocabTimerRef.current);
    const vocab = VOCAB[LEVELS[currentLevel]];
    if (chosen === currentVocab.correct) {
      // Correct!
      const gs = gameState.current;
      gs.bossHP -= 1;
      if (gs.hearts < 3) gs.hearts = Math.min(3, gs.hearts + 1); // restore a heart
      const nextVocabIdx = vocabIndex + 1;
      if (gs.bossHP <= 0) {
        // Boss defeated!
        setScreen("victory");
      } else {
        gs.bossPhase += 1;
        gs.damageBar = 0;
        const level = LEVELS[currentLevel];
        if (level === "tennessee") {
          gs.enemies = [];
          gs.enemiesSpawned = false;
        } else if (level === "athens") {
          gs.playerX = 100;
          gs.playerY = H - 130;
          gs.playerVY = 0;
          gs.onGround = true;
          gs.scrollX = 0;
          gs.wallX = -100;
          gs.obstacles = [];
          gs.obstaclesGenerated = false;
          gs.stunned = 0;
        } else if (level === "egypt") {
          gs.playerX = 100;
          gs.playerY = H - 110;
          gs.playerVY = 0;
          gs.onGround = true;
          gs.bossX = gs.bossReturnX ?? 650;
          gs.bossCharging = false;
          gs.attacks = [];
          gs.tentacles = [];
          gs.fallingObjects = [];
        }
        setVocabIndex(nextVocabIdx);
        setScreen("playing");
      }
    } else {
      // Wrong - boss recovers
      setWrongAnswer(true);
      setTimeout(() => {
        setWrongAnswer(false);
        const gs = gameState.current;
        gs.damageBar = 0;
        setScreen("playing");
      }, 1200);
    }
  };

  // ─── NEXT LEVEL ───
  const handleNextLevel = () => {
    const next = currentLevel + 1;
    if (next >= LEVELS.length) {
      setScreen("finalwin");
    } else {
      setCurrentLevel(next);
      setVocabIndex(0);
      gameState.current = null;
      setScreen("playing");
    }
  };

  // ─── RESTART BOSS ───
  const handleRestart = () => {
    setVocabIndex(0);
    gameState.current = null;
    setScreen("playing");
  };

  // ─── RENDER SCREENS ───

  // ─── Set vocab handler ref so input useEffect can call it ───
  vocabHandlerRef.current = (screen === "vocab" && currentVocab && !wrongAnswer)
    ? (idx) => { if (idx < currentVocab.options.length) handleVocabAnswer(currentVocab.options[idx]); }
    : null;

  // Title Screen
  if (screen === "title") {
    return (
      <div style={{ width: W, height: H, background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New', monospace", color: "#fff", userSelect: "none", position: "relative", overflow: "hidden" }}>
        {/* Floating food particles */}
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{ position: "absolute", fontSize: 24 + (i % 3) * 12, opacity: 0.15 + (i % 4) * 0.08, top: `${(i * 37) % 90}%`, left: `${(i * 53 + 10) % 90}%`, animation: `float ${3 + (i % 3)}s ease-in-out infinite`, animationDelay: `${i * 0.3}s` }}>
            {["🍕", "🍩", "🍤", "🥐", "🍝", "🍑", "🌮", "🍱"][i % 8]}
          </div>
        ))}
        <style>{`@keyframes float { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-15px) rotate(5deg); } }`}</style>
        <div style={{ fontSize: 13, letterSpacing: 6, color: "#e91e63", textTransform: "uppercase", marginBottom: 12 }}>A Valentine's Adventure</div>
        <div style={{ fontSize: 42, fontWeight: "bold", textShadow: "0 0 20px rgba(233,30,99,0.6)", letterSpacing: 2, lineHeight: 1.2 }}>
          <span style={{ color: "#fff" }}>FEAST</span>
          <span style={{ color: "#e91e63" }}> & </span>
          <span style={{ color: "#fff" }}>FLIGHT</span>
        </div>
        <div style={{ fontSize: 13, color: "#aaa", marginTop: 8, letterSpacing: 1 }}>Boss Rush Romance</div>
        <div style={{ marginTop: 40, padding: "14px 36px", background: "linear-gradient(135deg, #e91e63, #c2185b)", border: "none", borderRadius: 30, color: "#fff", fontSize: 16, fontWeight: "bold", cursor: "pointer", letterSpacing: 2, boxShadow: "0 4px 20px rgba(233,30,99,0.4)", transition: "transform 0.2s, box-shadow 0.2s" }}
          onMouseEnter={(e) => { e.target.style.transform = "scale(1.05)"; e.target.style.boxShadow = "0 6px 28px rgba(233,30,99,0.6)"; }}
          onMouseLeave={(e) => { e.target.style.transform = "scale(1)"; e.target.style.boxShadow = "0 4px 20px rgba(233,30,99,0.4)"; }}
          onClick={() => { initGameState(); setScreen("playing"); }}
        >
          START GAME
        </div>
        <div style={{ marginTop: 32, fontSize: 11, color: "#666", textAlign: "center", lineHeight: 1.8 }}>
          Arrow Keys / WASD — Move<br />
          Spacebar — Shoot<br />
          1-4 — Answer Vocab Challenges
        </div>
        <div style={{ position: "absolute", bottom: 18, fontSize: 10, color: "#444", letterSpacing: 1 }}>6 BOSSES · 6 LOCATIONS · 1 LOVE STORY</div>
      </div>
    );
  }

  // Game Over
  if (screen === "gameover") {
    return (
      <div style={{ width: W, height: H, background: "linear-gradient(180deg, #1a0000, #3c0000)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New', monospace", color: "#fff", userSelect: "none" }}>
        <div style={{ fontSize: 48, color: "#e53935", fontWeight: "bold", textShadow: "0 0 30px rgba(229,57,53,0.5)" }}>DEFEATED</div>
        <div style={{ fontSize: 14, color: "#aaa", marginTop: 8 }}>The {BOSS_NAMES[LEVELS[currentLevel]]} got you...</div>
        <div style={{ marginTop: 36, padding: "12px 32px", background: "#e53935", borderRadius: 24, color: "#fff", fontSize: 15, fontWeight: "bold", cursor: "pointer", letterSpacing: 1 }} onClick={handleRestart}>
          TRY AGAIN
        </div>
        <div style={{ fontSize: 11, color: "#555", marginTop: 12 }}>You can do this.</div>
      </div>
    );
  }

  // Vocab Screen
  if (screen === "vocab") {
    const level = LEVELS[currentLevel];
    return (
      <div style={{ width: W, height: H, background: "linear-gradient(135deg, #0d1b2a, #1b263b, #415a77)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New', monospace", color: "#fff", userSelect: "none", position: "relative" }}>
        {wrongAnswer && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(229,57,53,0.25)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
            <div style={{ fontSize: 28, color: "#e53935", fontWeight: "bold", textShadow: "0 0 20px rgba(229,57,53,0.6)" }}>✕ WRONG</div>
          </div>
        )}
        <div style={{ fontSize: 11, color: "#e91e63", letterSpacing: 3, marginBottom: 6 }}>VOCABULARY CHALLENGE</div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>{LEVEL_NAMES[level]} — {BOSS_NAMES[level]}</div>

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

  // Victory / Memory Screen
  if (screen === "victory") {
    const isLastLevel = currentLevel === 5;
    if (isLastLevel) {
      return (
        <div style={{ width: W, height: H, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "monospace", padding: "40px", textAlign: "center" }}>
          <h1 style={{ fontSize: 48, marginBottom: 20 }}>You Did It! 💝</h1>
          <p style={{ fontSize: 16, whiteSpace: "pre-line", maxWidth: 600, lineHeight: 1.6 }}>
            {FINAL_MESSAGE}
          </p>
          <button
            style={{ marginTop: 30, padding: "12px 24px", fontSize: 16, cursor: "pointer" }}
            onClick={() => window.location.reload()}
          >
            Play Again
          </button>
        </div>
      );
    }
    return (
      <div style={{ width: W, height: H, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "monospace", padding: "40px", textAlign: "center" }}>
        <h1 style={{ fontSize: 48, marginBottom: 20 }}>Level Complete!</h1>
        <p style={{ fontSize: 16, whiteSpace: "pre-line", maxWidth: 600, lineHeight: 1.6 }}>
          {MEMORIES[LEVELS[currentLevel]]}
        </p>
        <button
          style={{ marginTop: 30, padding: "12px 24px", fontSize: 16, cursor: "pointer" }}
          onClick={() => {
            setCurrentLevel(currentLevel + 1);
            setVocabIndex(0);
            gameState.current = null;
            setScreen("playing");
          }}
        >
          Next Level →
        </button>
      </div>
    );
  }

  // Final Win Screen
  if (screen === "finalwin") {
    const lines = FINAL_MESSAGE.split("\n");
    return (
      <div style={{ width: W, height: H, background: "linear-gradient(135deg, #1a0a2e, #16213e, #0d2137)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New', monospace", color: "#fff", userSelect: "none", position: "relative", overflow: "hidden" }}>
        {/* Stars */}
        {[...Array(40)].map((_, i) => (
          <div key={i} style={{ position: "absolute", width: 2 + (i % 3), height: 2 + (i % 3), borderRadius: "50%", background: "#fff", top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, opacity: 0.3 + Math.random() * 0.5, animation: `twinkle ${1.5 + Math.random() * 2}s ease-in-out infinite`, animationDelay: `${Math.random() * 2}s` }} />
        ))}
        <style>{`@keyframes twinkle { 0%,100% { opacity: 0.2; } 50% { opacity: 0.9; } }`}</style>

        <div style={{ fontSize: 11, color: "#e91e63", letterSpacing: 5, marginBottom: 6 }}>🎮 GAME COMPLETE 🎮</div>
        <div style={{ fontSize: 30, fontWeight: "bold", color: "#fff", textShadow: "0 0 25px rgba(233,30,99,0.5)", marginBottom: 28 }}>
          <span style={{ color: "#fff" }}>FEAST</span><span style={{ color: "#e91e63" }}> & </span><span style={{ color: "#fff" }}>FLIGHT</span>
        </div>

        {/* Message card */}
        <div style={{ background: "rgba(233,30,99,0.08)", border: "1px solid rgba(233,30,99,0.3)", borderRadius: 16, padding: "28px 36px", maxWidth: 480, textAlign: "center" }}>
          {lines.map((line, i) => (
            <div key={i} style={{ fontSize: line === "" ? 4 : 13, color: line.includes("Happy Valentine") || line.includes("I love you") ? "#e91e63" : "#bbb", lineHeight: 2, fontStyle: "italic", fontWeight: line.includes("Happy Valentine") || line.includes("I love you") ? "bold" : "normal" }}>
              {line}
            </div>
          ))}
          <div style={{ marginTop: 20, fontSize: 22 }}>❤️</div>
        </div>
        <div style={{ marginTop: 24, fontSize: 11, color: "#444" }}>❤️ [ Youssef and Nora ] ❤️</div>
      </div>
    );
  }

  // ─── PLAYING SCREEN ───
  return (
    <div style={{ position: "relative", width: W, height: H, userSelect: "none" }}>
      <canvas ref={canvasRef} width={W} height={H} style={{ display: "block", background: "#000" }} />
      {/* Level indicator overlay */}
      <div style={{ position: "absolute", top: 50, left: 16, fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "'Courier New', monospace", letterSpacing: 1 }}>
        {LEVEL_NAMES[LEVELS[currentLevel]]}
      </div>
      {screen === "playing" && (
        <div
          style={{ position: "absolute", bottom: 16, right: 16, padding: "8px 16px", background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 11, fontFamily: "'Courier New', monospace", cursor: "pointer", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 4, userSelect: "none" }}
          onClick={() => {
            const next = currentLevel + 1;
            if (next >= LEVELS.length) {
              setScreen("finalwin");
            } else {
              setCurrentLevel(next);
              setVocabIndex(0);
              gameState.current = null;
              setScreen("playing");
            }
          }}
        >
          SKIP LEVEL →
        </div>
      )}
    </div>
  );
}
