import React, { useEffect, useRef, useState, useCallback } from 'react';
import { c64Sound } from '../c64/c64SoundEngine';
import { Volume2, VolumeX, RotateCcw, Monitor, Play, Pause, Crosshair } from 'lucide-react';

// Palette Pepto Commodore 64 standard
export const C64_PALETTE = {
  black: '#000000',      // 0
  white: '#FFFFFF',      // 1
  red: '#880000',        // 2
  cyan: '#AAFFEE',       // 3
  purple: '#CC44CC',     // 4
  green: '#00CC55',      // 5
  blue: '#0000AA',       // 6
  yellow: '#EEEE77',     // 7
  orange: '#DD8855',     // 8
  brown: '#664400',      // 9
  lightRed: '#FF7777',   // 10
  darkGrey: '#333333',   // 11
  grey: '#777777',       // 12
  lightGreen: '#AAFF66', // 13
  lightBlue: '#0088FF',  // 14
  lightGrey: '#BBBBBB'   // 15
};

// Matrici Sprite 24x21 ad alta fedeltà e simmetria (1 = pixel acceso, 0 = pixel spento)
const SPRITE_PATTERNS = {
  player: [
    "...........xx...........",
    "...........xx...........",
    "..........xxxx..........",
    "..........xxxx..........",
    ".........xxxxxx.........",
    "....xxxxxxxxxxxxxxxx....",
    "...xxxxxxxxxxxxxxxxxx...",
    "..xxxxxxxxxxxxxxxxxxxx..",
    "..xxxxxxxxxxxxxxxxxxxx..",
    "..xxxxxxxxxxxxxxxxxxxx..",
    "..xxxxxxxxxxxxxxxxxxxx..",
    "..xx..xxxxxxxxxxxx..xx..",
    "..xx...xxxxxxxxxx...xx..",
    "..xx................xx..",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................"
  ],
  invader1_a: [
    "..........xxxx..........",
    "........xxxxxxxx........",
    ".......xxxxxxxxxx.......",
    "......xxx..xx..xxx......",
    "......xxxxxxxxxxxx......",
    "........xx....xx........",
    ".......xx.xxxx.xx.......",
    "......xx..x..x..xx......",
    ".....xx..........xx.....",
    "....xx............xx....",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................"
  ],
  invader1_b: [
    "..........xxxx..........",
    "........xxxxxxxx........",
    ".......xxxxxxxxxx.......",
    "......xxx..xx..xxx......",
    "......xxxxxxxxxxxx......",
    "........xx....xx........",
    ".......xx.xxxx.xx.......",
    ".........xxxxxx.........",
    "........xx....xx........",
    ".......xx......xx.......",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................"
  ],
  invader2_a: [
    "....xx............xx....",
    ".....xx..........xx.....",
    "....xxxxxxxxxxxxxxxx....",
    "...xxx..xxxxxxxx..xxx...",
    "..xxxxxxxxxxxxxxxxxxxx..",
    "..xx.xxxxxxxxxxxxxx.xx..",
    "..xx.xx..........xx.xx..",
    "......xx........xx......",
    ".....xx..........xx.....",
    "....xx............xx....",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................"
  ],
  invader2_b: [
    "....xx............xx....",
    "..xxxx............xxxx..",
    "..xxxxxxxxxxxxxxxxxxxx..",
    "..xxx.xxxxxxxxxxxx.xxx..",
    "..xxxxxxxxxxxxxxxxxxxx..",
    "....xxxxxxxxxxxxxxxx....",
    ".....xx..........xx.....",
    "....xx............xx....",
    "...xx..............xx...",
    "..xx................xx..",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................"
  ],
  invader3_a: [
    ".........xxxxxx.........",
    ".......xxxxxxxxxx.......",
    ".....xxxxxxxxxxxxxx.....",
    "....xxx..xxxxxx..xxx....",
    "....xxxxxxxxxxxxxxxx....",
    "......xxx......xxx......",
    ".....xx.xxxxxxxx.xx.....",
    "....xx..xx....xx..xx....",
    "...xx..............xx...",
    "..xx................xx..",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................"
  ],
  invader3_b: [
    ".........xxxxxx.........",
    ".......xxxxxxxxxx.......",
    ".....xxxxxxxxxxxxxx.....",
    "....xxx..xxxxxx..xxx....",
    "....xxxxxxxxxxxxxxxx....",
    "......xxx......xxx......",
    ".....xx.xxxxxxxx.xx.....",
    "....xx.xxx....xxx.xx....",
    ".....xx..........xx.....",
    "......xx........xx......",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................"
  ],
  ufo: [
    ".........xxxxxx.........",
    ".......xxxxxxxxxx.......",
    ".....xxxxxxxxxxxxxx.....",
    "...xxx.xx.xxxx.xx.xxx...",
    "..xxxxxxxxxxxxxxxxxxxx..",
    "..xxxxxxxxxxxxxxxxxxxx..",
    "...xxxxxxxxxxxxxxxxxx...",
    ".....xx...xxxx...xx.....",
    "......x..........x......",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................"
  ]
};

interface Invader {
  x: number;
  y: number;
  type: 1 | 2 | 3;
  alive: boolean;
  score: number;
}

interface ShieldBlock {
  x: number;
  y: number;
  alive: boolean;
}

interface Bullet {
  x: number;
  y: number;
  active: boolean;
}

interface Bomb {
  x: number;
  y: number;
  active: boolean;
}

interface Explosion {
  x: number;
  y: number;
  timer: number;
  color: string;
}

export const C64GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stati del gioco (inclusa la modalità PAUSA)
  const [gameState, setGameState] = useState<'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY'>('TITLE');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(1280);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [crtEnabled, setCrtEnabled] = useState(true);

  // Riferimenti per evitare re-render nel loop a 60fps
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const scoreRef = useRef(score);
  scoreRef.current = score;

  const livesRef = useRef(lives);
  livesRef.current = lives;

  const playerRef = useRef({
    x: 148,
    y: 182,
    speed: 2.5,
    movingLeft: false,
    movingRight: false,
    isFiring: false,
    cooldown: 0
  });

  const bulletRef = useRef<Bullet>({ x: 0, y: 0, active: false });
  const bombsRef = useRef<Bomb[]>([]);
  const invadersRef = useRef<Invader[]>([]);
  const shieldsRef = useRef<ShieldBlock[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);

  const swarmRef = useRef({
    dir: 1, // 1 = destra, -1 = sinistra
    stepTimer: 30,
    speed: 30,
    animFrame: 0,
    aliveCount: 24
  });

  const ufoRef = useRef({
    active: false,
    x: -30,
    y: 20,
    speed: 1.5,
    timer: 600
  });

  // Disegna uno sprite bitmap sul canvas 2D
  const drawSprite = (
    ctx: CanvasRenderingContext2D,
    pattern: string[],
    x: number,
    y: number,
    color: string,
    scale = 1
  ) => {
    ctx.fillStyle = color;
    for (let r = 0; r < pattern.length; r++) {
      const row = pattern[r];
      for (let c = 0; c < row.length; c++) {
        if (row[c] === 'x') {
          ctx.fillRect(Math.round(x + c * scale), Math.round(y + r * scale), scale, scale);
        }
      }
    }
  };

  // Inizializza i 4 bunker difensivi
  const initShields = useCallback(() => {
    const blocks: ShieldBlock[] = [];
    const shieldXPositions = [45, 110, 175, 240];
    const baseY = 155;

    shieldXPositions.forEach((sx) => {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 8; c++) {
          if (r === 0 && (c === 0 || c === 7)) continue;
          if (r >= 3 && (c >= 2 && c <= 5)) continue;
          blocks.push({
            x: sx + c * 4,
            y: baseY + r * 3,
            alive: true
          });
        }
      }
    });
    shieldsRef.current = blocks;
  }, []);

  // Inizializza la flotta degli invasori
  const initSwarm = useCallback((currentWave: number) => {
    const invaders: Invader[] = [];
    const startX = 40;
    const startY = 38;

    // Riga 1: Squid (30 pts)
    for (let c = 0; c < 8; c++) {
      invaders.push({
        x: startX + c * 26,
        y: startY,
        type: 1,
        alive: true,
        score: 30
      });
    }

    // Riga 2: Crab (20 pts)
    for (let c = 0; c < 8; c++) {
      invaders.push({
        x: startX + c * 26,
        y: startY + 18,
        type: 2,
        alive: true,
        score: 20
      });
    }

    // Riga 3: Octopus (10 pts)
    for (let c = 0; c < 8; c++) {
      invaders.push({
        x: startX + c * 26,
        y: startY + 36,
        type: 3,
        alive: true,
        score: 10
      });
    }

    invadersRef.current = invaders;
    const baseSpeed = Math.max(12, 34 - (currentWave - 1) * 4);
    swarmRef.current = {
      dir: 1,
      stepTimer: baseSpeed,
      speed: baseSpeed,
      animFrame: 0,
      aliveCount: 24
    };
    bombsRef.current = [];
    bulletRef.current = { x: 0, y: 0, active: false };
    explosionsRef.current = [];
  }, []);

  // Avvia una nuova partita
  const startNewGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setWave(1);
    playerRef.current.x = 148;
    initShields();
    initSwarm(1);
    setGameState('PLAYING');
  }, [initShields, initSwarm]);

  // Avanza alla wave successiva
  const nextWave = useCallback(() => {
    setWave((w) => {
      const nw = w + 1;
      initSwarm(nw);
      return nw;
    });
    c64Sound.playWaveClear();
  }, [initSwarm]);

  // Funzione per attivare/disattivare la PAUSA
  const togglePause = useCallback(() => {
    setGameState((prev) => {
      if (prev === 'PLAYING') {
        c64Sound.stopUfoSound();
        return 'PAUSED';
      }
      if (prev === 'PAUSED') {
        return 'PLAYING';
      }
      return prev;
    });
  }, []);

  // Gestione Input da Tastiera
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tasto Pausa: 'P' oppure 'Escape'
      if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        togglePause();
        return;
      }

      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        playerRef.current.movingLeft = true;
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        playerRef.current.movingRight = true;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyZ') {
        e.preventDefault();
        if (gameStateRef.current === 'TITLE' || gameStateRef.current === 'GAMEOVER') {
          startNewGame();
          return;
        }
        if (gameStateRef.current === 'PAUSED') {
          setGameState('PLAYING');
          return;
        }
        playerRef.current.isFiring = true;
      }
      if (e.code === 'KeyM') {
        setIsMuted((prev) => {
          const next = !prev;
          c64Sound.setMuted(next);
          return next;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        playerRef.current.movingLeft = false;
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        playerRef.current.movingRight = false;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyZ') {
        playerRef.current.isFiring = false;
        playerRef.current.cooldown = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startNewGame, togglePause]);

  // Game Loop principale (60 FPS simulati)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const gameLoop = () => {
      const state = gameStateRef.current;

      // ======================================================================
      // 1. UPDATE LOGIC (attiva SOLO in stato PLAYING, bloccata in PAUSED)
      // ======================================================================
      if (state === 'PLAYING') {
        const player = playerRef.current;
        const bullet = bulletRef.current;
        const swarm = swarmRef.current;
        const invaders = invadersRef.current;
        const bombs = bombsRef.current;
        const shields = shieldsRef.current;
        const ufo = ufoRef.current;

        // Movimento Giocatore
        if (player.movingLeft) {
          player.x = Math.max(24, player.x - player.speed);
        }
        if (player.movingRight) {
          player.x = Math.min(278, player.x + player.speed);
        }

        // Sparo Giocatore
        if (player.isFiring && !bullet.active && player.cooldown <= 0) {
          bullet.active = true;
          bullet.x = player.x + 11;
          bullet.y = player.y - 4;
          player.cooldown = 15;
          c64Sound.playShoot();
        }
        if (player.cooldown > 0) {
          player.cooldown--;
        }

        // Movimento Proiettile Giocatore
        if (bullet.active) {
          bullet.y -= 4.5;
          if (bullet.y < 16) {
            bullet.active = false;
          }
        }

        // Movimento UFO Misterioso
        if (!ufo.active) {
          ufo.timer--;
          if (ufo.timer <= 0) {
            ufo.active = true;
            ufo.x = -24;
            ufo.timer = 800 + Math.floor(Math.random() * 400);
            c64Sound.startUfoSound();
          }
        } else {
          ufo.x += ufo.speed;
          if (ufo.x > 320) {
            ufo.active = false;
            c64Sound.stopUfoSound();
          }
        }

        // Movimento a Sciame degli Invasori
        swarm.stepTimer--;
        if (swarm.stepTimer <= 0) {
          swarm.stepTimer = swarm.speed;
          swarm.animFrame = swarm.animFrame === 0 ? 1 : 0;
          c64Sound.playMarchStep();

          let edgeReached = false;
          const aliveInvaders = invaders.filter((inv) => inv.alive);

          for (const inv of aliveInvaders) {
            const nextX = inv.x + swarm.dir * 4;
            if (nextX < 18 || nextX > 286) {
              edgeReached = true;
              break;
            }
          }

          if (edgeReached) {
            swarm.dir *= -1;
            for (const inv of invaders) {
              inv.y += 8;
              if (inv.alive && inv.y >= 168) {
                setGameState('GAMEOVER');
                c64Sound.playExplosion();
                return;
              }
            }
          } else {
            for (const inv of invaders) {
              inv.x += swarm.dir * 4;
            }
          }
        }

        // Bombardamento Alieni
        if (bombs.length < 3 && Math.random() < 0.035) {
          const aliveInvaders = invaders.filter((inv) => inv.alive);
          if (aliveInvaders.length > 0) {
            const shooter = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
            bombs.push({
              x: shooter.x + 11,
              y: shooter.y + 14,
              active: true
            });
          }
        }

        for (let i = bombs.length - 1; i >= 0; i--) {
          const b = bombs[i];
          b.y += 2.2;
          if (b.y > 200) {
            bombs.splice(i, 1);
          }
        }

        // Collisioni Proiettile Giocatore -> Invasori
        if (bullet.active) {
          for (const inv of invaders) {
            if (
              inv.alive &&
              bullet.x >= inv.x + 2 &&
              bullet.x <= inv.x + 20 &&
              bullet.y >= inv.y &&
              bullet.y <= inv.y + 14
            ) {
              inv.alive = false;
              bullet.active = false;
              c64Sound.playExplosion();

              explosionsRef.current.push({
                x: inv.x,
                y: inv.y,
                timer: 12,
                color: C64_PALETTE.yellow
              });

              setScore((s) => {
                const newScore = s + inv.score;
                setHighScore((hs) => Math.max(hs, newScore));
                return newScore;
              });

              swarm.aliveCount--;
              if (swarm.aliveCount > 0) {
                swarm.speed = Math.max(4, Math.floor((swarm.aliveCount / 24) * 30));
              } else {
                nextWave();
              }
              break;
            }
          }
        }

        // Collisione Proiettile Giocatore -> UFO
        if (bullet.active && ufo.active) {
          if (
            bullet.x >= ufo.x + 2 &&
            bullet.x <= ufo.x + 22 &&
            bullet.y >= ufo.y &&
            bullet.y <= ufo.y + 12
          ) {
            ufo.active = false;
            bullet.active = false;
            c64Sound.stopUfoSound();
            c64Sound.playExplosion();

            const ufoPoints = [50, 100, 150, 300][Math.floor(Math.random() * 4)];
            setScore((s) => {
              const newScore = s + ufoPoints;
              setHighScore((hs) => Math.max(hs, newScore));
              return newScore;
            });

            explosionsRef.current.push({
              x: ufo.x,
              y: ufo.y,
              timer: 18,
              color: C64_PALETTE.red
            });
          }
        }

        // Collisioni Bombe Alieni -> Giocatore
        for (let i = bombs.length - 1; i >= 0; i--) {
          const b = bombs[i];
          if (
            b.x >= player.x + 2 &&
            b.x <= player.x + 22 &&
            b.y >= player.y &&
            b.y <= player.y + 14
          ) {
            bombs.splice(i, 1);
            c64Sound.playExplosion();

            explosionsRef.current.push({
              x: player.x,
              y: player.y,
              timer: 24,
              color: C64_PALETTE.lightRed
            });

            setLives((l) => {
              const newLives = l - 1;
              if (newLives <= 0) {
                setGameState('GAMEOVER');
              } else {
                player.x = 148;
              }
              return newLives;
            });
            break;
          }
        }

        // Collisioni Bunker/Shields
        for (const block of shields) {
          if (!block.alive) continue;

          if (
            bullet.active &&
            bullet.x >= block.x &&
            bullet.x <= block.x + 4 &&
            bullet.y >= block.y &&
            bullet.y <= block.y + 3
          ) {
            block.alive = false;
            bullet.active = false;
          }

          for (let i = bombs.length - 1; i >= 0; i--) {
            const b = bombs[i];
            if (
              b.x >= block.x &&
              b.x <= block.x + 4 &&
              b.y >= block.y &&
              b.y <= block.y + 3
            ) {
              block.alive = false;
              bombs.splice(i, 1);
              break;
            }
          }
        }

        // Aggiorna timer esplosioni
        for (let i = explosionsRef.current.length - 1; i >= 0; i--) {
          const exp = explosionsRef.current[i];
          exp.timer--;
          if (exp.timer <= 0) {
            explosionsRef.current.splice(i, 1);
          }
        }
      }

      // ======================================================================
      // 2. RENDER GRAPHICS (320x200 pixel VIC-II Screen Buffer)
      // ======================================================================
      ctx.imageSmoothingEnabled = false;

      // Sfondo nero arcade ($00)
      ctx.fillStyle = C64_PALETTE.black;
      ctx.fillRect(0, 0, 320, 200);

      // HUD Superiore
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = C64_PALETTE.white;
      ctx.fillText('SCORE<1>', 12, 12);
      ctx.fillText('HI-SCORE', 110, 12);
      ctx.fillText('WAVE', 240, 12);

      ctx.fillStyle = C64_PALETTE.cyan;
      ctx.fillText(scoreRef.current.toString().padStart(4, '0'), 24, 22);

      ctx.fillStyle = C64_PALETTE.yellow;
      ctx.fillText(highScore.toString().padStart(4, '0'), 126, 22);

      ctx.fillStyle = C64_PALETTE.lightGreen;
      ctx.fillText(wave.toString().padStart(2, '0'), 250, 22);

      // Linea orizzontale base verde
      ctx.fillStyle = C64_PALETTE.green;
      ctx.fillRect(10, 194, 300, 1);

      // Vite rimaste
      ctx.fillStyle = C64_PALETTE.white;
      ctx.fillText(`LIVES:${livesRef.current}`, 12, 190);

      // Disegna UFO se attivo
      if (ufoRef.current.active) {
        drawSprite(ctx, SPRITE_PATTERNS.ufo, ufoRef.current.x, ufoRef.current.y, C64_PALETTE.red);
      }

      // Disegna Bunker/Shields (Verde brillante $0D)
      ctx.fillStyle = C64_PALETTE.lightGreen;
      for (const block of shieldsRef.current) {
        if (block.alive) {
          ctx.fillRect(block.x, block.y, 4, 3);
        }
      }

      // Disegna gli Invasori Alieni con le nuove matrici centrate
      const swarm = swarmRef.current;
      for (const inv of invadersRef.current) {
        if (!inv.alive) continue;

        let pattern = SPRITE_PATTERNS.invader1_a;
        let color = C64_PALETTE.cyan;

        if (inv.type === 1) {
          pattern = swarm.animFrame === 0 ? SPRITE_PATTERNS.invader1_a : SPRITE_PATTERNS.invader1_b;
          color = C64_PALETTE.cyan;
        } else if (inv.type === 2) {
          pattern = swarm.animFrame === 0 ? SPRITE_PATTERNS.invader2_a : SPRITE_PATTERNS.invader2_b;
          color = C64_PALETTE.yellow;
        } else {
          pattern = swarm.animFrame === 0 ? SPRITE_PATTERNS.invader3_a : SPRITE_PATTERNS.invader3_b;
          color = C64_PALETTE.lightRed;
        }

        drawSprite(ctx, pattern, inv.x, inv.y, color);
      }

      // Disegna Bombe Alieni
      ctx.fillStyle = C64_PALETTE.cyan;
      for (const b of bombsRef.current) {
        ctx.fillRect(b.x, b.y, 2, 5);
        ctx.fillRect(b.x - 1, b.y + 1, 4, 2);
      }

      // Disegna Giocatore (Cannone Tank verde $0D)
      if (livesRef.current > 0) {
        drawSprite(
          ctx,
          SPRITE_PATTERNS.player,
          playerRef.current.x,
          playerRef.current.y,
          C64_PALETTE.lightGreen
        );
      }

      // Disegna Proiettile Laser del Giocatore
      if (bulletRef.current.active) {
        ctx.fillStyle = C64_PALETTE.white;
        ctx.fillRect(bulletRef.current.x, bulletRef.current.y, 2, 6);
      }

      // Disegna Esplosioni
      for (const exp of explosionsRef.current) {
        ctx.fillStyle = exp.color;
        ctx.fillRect(exp.x + 6, exp.y + 4, 12, 12);
        ctx.fillRect(exp.x + 2, exp.y + 2, 4, 4);
        ctx.fillRect(exp.x + 18, exp.y + 2, 4, 4);
        ctx.fillRect(exp.x + 4, exp.y + 14, 4, 4);
        ctx.fillRect(exp.x + 16, exp.y + 14, 4, 4);
      }

      // ======================================================================
      // 3. SCHERMATE DI STATO (TITLE, GAMEOVER, PAUSED)
      // ======================================================================
      if (state === 'PAUSED') {
        // Overlay semi-trasparente per stato di PAUSA
        ctx.fillStyle = 'rgba(0, 0, 0, 0.70)';
        ctx.fillRect(40, 60, 240, 80);

        ctx.strokeStyle = C64_PALETTE.lightBlue;
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 60, 240, 80);

        ctx.fillStyle = C64_PALETTE.yellow;
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText('** GIOCO IN PAUSA **', 65, 88);

        ctx.font = '7px "Press Start 2P", monospace';
        ctx.fillStyle = C64_PALETTE.white;
        ctx.fillText('PREMI P O CLICCA PER RIPRENDERE', 48, 114);

        if (Math.floor(Date.now() / 400) % 2 === 0) {
          ctx.fillStyle = C64_PALETTE.cyan;
          ctx.fillText('PAUSED', 134, 130);
        }
      } else if (state === 'TITLE') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
        ctx.fillRect(0, 0, 320, 200);

        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = C64_PALETTE.lightGreen;
        ctx.fillText('SPACE INVADERS C64', 50, 68);

        ctx.font = '7px "Press Start 2P", monospace';
        ctx.fillStyle = C64_PALETTE.white;
        ctx.fillText('* SCORE ADVANCE TABLE *', 55, 92);

        ctx.fillStyle = C64_PALETTE.red;
        ctx.fillText('= ? MYSTERY UFO', 105, 110);
        drawSprite(ctx, SPRITE_PATTERNS.ufo, 78, 102, C64_PALETTE.red, 0.75);

        ctx.fillStyle = C64_PALETTE.cyan;
        ctx.fillText('= 30 POINTS', 105, 126);
        drawSprite(ctx, SPRITE_PATTERNS.invader1_a, 78, 118, C64_PALETTE.cyan, 0.75);

        ctx.fillStyle = C64_PALETTE.yellow;
        ctx.fillText('= 20 POINTS', 105, 142);
        drawSprite(ctx, SPRITE_PATTERNS.invader2_a, 78, 134, C64_PALETTE.yellow, 0.75);

        ctx.fillStyle = C64_PALETTE.lightRed;
        ctx.fillText('= 10 POINTS', 105, 158);
        drawSprite(ctx, SPRITE_PATTERNS.invader3_a, 78, 150, C64_PALETTE.lightRed, 0.75);

        if (Math.floor(Date.now() / 450) % 2 === 0) {
          ctx.fillStyle = C64_PALETTE.white;
          ctx.fillText('PRESS FIRE OR SPACE TO PLAY', 36, 180);
        }
      } else if (state === 'GAMEOVER') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.70)';
        ctx.fillRect(50, 65, 220, 70);

        ctx.fillStyle = C64_PALETTE.red;
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText('GAME OVER', 105, 95);

        ctx.font = '7px "Press Start 2P", monospace';
        ctx.fillStyle = C64_PALETTE.white;
        ctx.fillText(`FINAL SCORE: ${scoreRef.current}`, 95, 115);

        if (Math.floor(Date.now() / 400) % 2 === 0) {
          ctx.fillStyle = C64_PALETTE.yellow;
          ctx.fillText('PRESS FIRE TO RESTART', 75, 128);
        }
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [nextWave, highScore, wave]);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Contenitore Cornice Monitor C64 con Bordo Blu/Nero Classico */}
      <div className="relative p-3 md:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl max-w-full">
        {/* Barra di stato del monitor */}
        <div className="flex items-center justify-between pb-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold tracking-wider text-slate-200">COMMODORE 64 PAL DISPLAY</span>
            <span className="text-slate-600">·</span>
            <span>VIC-II 320x200</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Pulsante PAUSA nel monitor */}
            {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
              <button
                onClick={togglePause}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors ${
                  gameState === 'PAUSED'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title={gameState === 'PAUSED' ? 'Riprendi Gioco (P)' : 'Metti in Pausa (P)'}
              >
                {gameState === 'PAUSED' ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{gameState === 'PAUSED' ? 'Riprendi' : 'Pausa'}</span>
              </button>
            )}

            <button
              onClick={() => setCrtEnabled(!crtEnabled)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                crtEnabled ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Scanline CRT
            </button>

            <button
              onClick={() => {
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                c64Sound.setMuted(nextMuted);
              }}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title={isMuted ? 'Attiva Audio SID' : 'Disattiva Audio SID'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
            </button>
          </div>
        </div>

        {/* C64 Screen Viewport con bordo tipico (Border Color) */}
        <div className="relative border-8 border-slate-950 rounded-lg overflow-hidden bg-black shadow-inner">
          <canvas
            ref={canvasRef}
            width={320}
            height={200}
            className="w-[320px] h-[200px] sm:w-[480px] sm:h-[300px] md:w-[640px] md:h-[400px] lg:w-[720px] lg:h-[450px] image-render-pixelated block mx-auto cursor-crosshair"
            style={{ imageRendering: 'pixelated' }}
            onClick={() => {
              if (gameState === 'TITLE' || gameState === 'GAMEOVER') {
                startNewGame();
              } else if (gameState === 'PAUSED') {
                setGameState('PLAYING');
              } else {
                playerRef.current.isFiring = true;
                setTimeout(() => {
                  playerRef.current.isFiring = false;
                }, 100);
              }
            }}
          />

          {/* Effetto Linee di Scansione CRT */}
          {crtEnabled && <div className="absolute inset-0 crt-overlay pointer-events-none" />}
        </div>

        {/* Controlli Rapidi Arcade a schermo per Mobile/Touch */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-300">Tasti:</span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono text-[11px]">A</kbd>
            <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono text-[11px]">D</kbd>
            <span>/</span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono text-[11px]">←</kbd>
            <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono text-[11px]">→</kbd>
            <span>Muovi</span>
            <span className="text-slate-600">·</span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono text-[11px]">Spazio</kbd>
            <span>Fuoco</span>
            <span className="text-slate-600">·</span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono text-[11px]">P</kbd>
            <span>Pausa</span>
          </div>

          <div className="flex items-center gap-2">
            {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
              <>
                <button
                  onClick={togglePause}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium text-xs"
                >
                  {gameState === 'PAUSED' ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                  {gameState === 'PAUSED' ? 'Riprendi' : 'Pausa (P)'}
                </button>

                <button
                  onClick={startNewGame}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Riavvia
                </button>
              </>
            )}

            {gameState !== 'PLAYING' && gameState !== 'PAUSED' && (
              <button
                onClick={startNewGame}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium rounded-lg transition-colors shadow-lg shadow-cyan-500/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Avvia Gioco (Space)
              </button>
            )}
          </div>
        </div>

        {/* Pulsanti Touch su dispositivi compatti */}
        <div className="mt-3 flex sm:hidden items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <div className="flex gap-1.5">
            <button
              onMouseDown={() => { playerRef.current.movingLeft = true; }}
              onMouseUp={() => { playerRef.current.movingLeft = false; }}
              onTouchStart={() => { playerRef.current.movingLeft = true; }}
              onTouchEnd={() => { playerRef.current.movingLeft = false; }}
              className="px-3 py-2 bg-slate-800 active:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold"
            >
              ◀ SIN
            </button>
            <button
              onMouseDown={() => { playerRef.current.movingRight = true; }}
              onMouseUp={() => { playerRef.current.movingRight = false; }}
              onTouchStart={() => { playerRef.current.movingRight = true; }}
              onTouchEnd={() => { playerRef.current.movingRight = false; }}
              className="px-3 py-2 bg-slate-800 active:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold"
            >
              DES ▶
            </button>
          </div>

          <button
            onClick={togglePause}
            className="px-3 py-2 bg-slate-800 active:bg-slate-700 text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1"
          >
            {gameState === 'PAUSED' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            PAUSA
          </button>

          <button
            onClick={() => {
              if (gameState === 'PAUSED') {
                setGameState('PLAYING');
              } else {
                playerRef.current.isFiring = true;
                setTimeout(() => { playerRef.current.isFiring = false; }, 120);
              }
            }}
            className="flex-1 py-2 bg-red-600 active:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"
          >
            <Crosshair className="w-3.5 h-3.5" />
            FUOCO
          </button>
        </div>
      </div>
    </div>
  );
};
