document.addEventListener('DOMContentLoaded', () => {
    console.log("Initializing Neon Pong...");

    // =======================
    // CONFIGURATION
    // =======================
    const SUPABASE_URL = "https://glesquvczauoqxxbdbdt.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsZXNxdXZjemF1b3F4eGJkYmR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjUwMjYsImV4cCI6MjA4NjQwMTAyNn0.HiXkjS5cXrG38RZCcODu0axwFgWSuYVklc_lV-ZZXa8";

    // =======================
    // SUPABASE SETUP
    // =======================
    let sb = null;
    try {
        if (typeof supabase !== 'undefined') {
            sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log("System: Online - Connected to Supabase");
        } else {
            console.warn("System: Offline Mode (Supabase SDK missing).");
        }
    } catch (e) {
        console.error("Supabase init failed:", e);
    }

    // =======================
    // AUDIO SYSTEM (SYNTH)
    // =======================
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    function playSound(type) {
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'paddle') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'wall') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'score') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now); 
            osc.frequency.setValueAtTime(880, now + 0.1); 
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        }
    }

    // =======================
    // CANVAS SETUP
    // =======================
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    // =======================
    // GAME STATE
    // =======================
    let playerScore = 0;
    let aiScore = 0;
    const paddleH = 90;
    const paddleW = 15;
    const paddleSpeed = 8;

    const player = { x: 20, y: H/2 - paddleH/2, color: "#00f3ff" };
    const ai = { x: W - 35, y: H/2 - paddleH/2, color: "#bc13fe" };
    const ball = { x: W/2, y: H/2, dx: 5, dy: 3, size: 10, color: "#ffffff" };

    const keys = { w: false, s: false, ArrowUp: false, ArrowDown: false };
    let particles = [];

    // =======================
    // CONTROLS
    // =======================
    document.addEventListener("keydown", e => {
        if(keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.code)) keys[e.key] = true;
        if (audioCtx.state === 'suspended') audioCtx.resume();
    });
    document.addEventListener("keyup", e => {
        if(keys.hasOwnProperty(e.key) || keys.hasOwnProperty(e.code)) keys[e.key] = false;
    });

    function handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const rect = canvas.getBoundingClientRect();
        const scaleY = canvas.height / rect.height;
        const touchY = (touch.clientY - rect.top) * scaleY;
        
        player.y = touchY - paddleH / 2;
        player.y = Math.max(0, Math.min(H - paddleH, player.y));
    }

    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('touchmove', handleTouch, { passive: false });

    // =======================
    // PARTICLE SYSTEM
    // =======================
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 6 - 3;
            this.speedY = Math.random() * 6 - 3;
            this.life = 1.0;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.life -= 0.03;
        }
        draw(ctx) {
            ctx.globalAlpha = Math.max(0, this.life);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }

    function spawnParticles(x, y, color) {
        for(let i=0; i<10; i++) {
            particles.push(new Particle(x, y, color));
        }
    }

    // =======================
    // LOGIC & PHYSICS
    // =======================
    function update() {
        // Player movement
        if (keys["w"] || keys["ArrowUp"]) player.y -= paddleSpeed;
        if (keys["s"] || keys["ArrowDown"]) player.y += paddleSpeed;
        player.y = Math.max(0, Math.min(H - paddleH, player.y));

        // Ball movement
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Wall Collisions (Top/Bottom)
        if (ball.y <= 0 || ball.y >= H - ball.size) {
            ball.dy *= -1;
            // Clamp ball inside to prevent sticking
            if(ball.y <= 0) ball.y = 1;
            if(ball.y >= H - ball.size) ball.y = H - ball.size - 1;
            
            spawnParticles(ball.x, ball.y, "#ffffff");
            playSound('wall');
        }

        // AI Movement
        if (ball.dx > 0) {
            let targetY = ball.y - paddleH / 2;
            // AI reaction delay/error
            let error = (Math.random() - 0.5) * 10;
            ai.y += (targetY - ai.y + error) * 0.08;
        }
        ai.y = Math.max(0, Math.min(H - paddleH, ai.y));

        // Paddle Collisions
        // FIX 1: Explicitly set ball.x to avoid "stuck inside paddle" infinite loop
        if (hit(player)) {
            reflect(player, 1);
            ball.x = player.x + paddleW + 2; // Force outside
            spawnParticles(player.x + paddleW, ball.y, player.color);
            playSound('paddle');
        }
        else if (hit(ai)) { 
            reflect(ai, -1);
            ball.x = ai.x - ball.size - 2; // Force outside
            spawnParticles(ai.x, ball.y, ai.color);
            playSound('paddle');
        }

        // Scoring
        if (ball.x < 0) { 
            aiScore++; 
            playSound('score');
            resetBall(1); 
        }
        if (ball.x > W) { 
            playerScore++; 
            playSound('score');
            resetBall(-1); 
        }

        // Particles
        particles.forEach(p => p.update());
        particles = particles.filter(p => p.life > 0);
    }

    function hit(p) {
        return ball.x < p.x + paddleW &&
               ball.x + ball.size > p.x &&
               ball.y < p.y + paddleH &&
               ball.y + ball.size > p.y;
    }

    function reflect(p, dir) {
        let speed = Math.sqrt(ball.dx**2 + ball.dy**2) * 1.05;
        
        // Cap max paddle reflection speed
        speed = Math.min(speed, 20); 

        let relativeIntersectY = (p.y + (paddleH / 2)) - ball.y;
        let normalizedIntersectY = (relativeIntersectY / (paddleH / 2));
        let bounceAngle = normalizedIntersectY * Math.PI / 4;
        
        ball.dx = speed * Math.cos(bounceAngle) * dir;
        ball.dy = speed * -Math.sin(bounceAngle);
    }

    function resetBall(dir) {
        ball.x = W / 2;
        ball.y = H / 2;
        
        // FIX 2: Cap the initial speed based on score. 
        // Previously: 5 + score * 0.5 (could go to infinity)
        // New: Cap at 15 max speed
        let difficulty = (playerScore + aiScore) * 0.5;
        let baseSpeed = Math.min(15, 5 + difficulty);
        
        ball.dx = baseSpeed * dir;
        ball.dy = (Math.random() * 4 - 2);
    }

    function draw() {
        // Clear background
        ctx.fillStyle = "#0a0a0f";
        ctx.fillRect(0, 0, W, H);

        // Net
        ctx.fillStyle = "#222";
        ctx.shadowBlur = 0;
        for (let y = 0; y < H; y += 30) ctx.fillRect(W / 2 - 1, y, 2, 15);

        ctx.shadowBlur = 15;
        
        // Player
        ctx.shadowColor = player.color;
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, paddleW, paddleH);

        // AI
        ctx.shadowColor = ai.color;
        ctx.fillStyle = ai.color;
        ctx.fillRect(ai.x, ai.y, paddleW, paddleH);

        // Ball
        ctx.shadowColor = "#ffffff";
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(ball.x, ball.y, ball.size, ball.size);

        // Particles
        particles.forEach(p => {
            ctx.shadowColor = p.color;
            p.draw(ctx);
        });

        // Score
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = "60px 'Orbitron', sans-serif";
        ctx.fillText(playerScore, W / 2 - 100, 80);
        ctx.fillText(aiScore, W / 2 + 60, 80);
    }

    function loop() {
        update();
        draw();
        requestAnimationFrame(loop);
    }

    // Start Game Loop
    loop();

    // =======================
    // LEADERBOARD FUNCTIONS
    // =======================
    window.submitScore = async function() {
        if (!sb) { alert("Offline Mode: Cannot save score."); return; }
        const nameInput = document.getElementById("name");
        const name = nameInput.value.trim() || "UNK";
        if(playerScore === 0) { alert("Score some points first!"); return; }

        const { error } = await sb.from("leaderboard").insert({
            name: name.toUpperCase(),
            score: playerScore
        });

        if (error) { 
            console.error(error); 
            alert("Error saving score"); 
        } else { 
            alert("SCORE UPLOADED"); 
            loadBoard(); 
            playerScore = 0; 
            aiScore = 0; 
            resetBall(1); 
        }
    };

    window.loadBoard = async function() {
        const tbody = document.getElementById("board-body");
        if(!tbody) return;

        if (!sb) {
            tbody.innerHTML = `<tr><td colspan="3" style="color: #666;">OFFLINE MODE</td></tr>`;
            return;
        }
        
        tbody.innerHTML = `<tr><td colspan="3" class="loading-text">FETCHING DATA...</td></tr>`;

        const { data, error } = await sb
            .from("leaderboard")
            .select("*")
            .order("score", { ascending: false })
            .limit(10);

        if (error) {
            tbody.innerHTML = `<tr><td colspan="3" style="color:red">CONNECTION FAILED</td></tr>`;
            return;
        }

        if(!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3">NO SCORES YET</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map((r, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${r.name}</td>
                <td>${r.score}</td>
            </tr>
        `).join("");
    };

    // Initial Load
    window.loadBoard();
});
