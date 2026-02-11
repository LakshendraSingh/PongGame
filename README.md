# NEON PONG: CYBER EDITION

A cyberpunk-themed reimagining of the classic arcade game, built with vanilla JavaScript and HTML5 Canvas. This project features neon visuals, a CRT scanline aesthetic, real-time synthesized audio, and a global leaderboard powered by Supabase.

Play online: https://pong-game-ochre.vercel.app

---

## Features

- Retro Aesthetics: Glowing neon visuals, particle collision effects, and a CRT scanline overlay  
- Synth Audio: Native Web Audio API implementation for procedurally generated sound effects (no external audio files required)  
- Global Leaderboard: Real-time score tracking and retrieval using Supabase  
- Responsive Design: Optimized for both desktop and mobile touch controls  
- Dynamic Gameplay: Ball speed increases as the score gets higher, capped at a playable maximum  
- Offline Support: Graceful degradation if Supabase connection fails — local play still works without leaderboard saving  

---

## Tech Stack

- Frontend: HTML5, CSS3, JavaScript (ES6+)  
- Rendering: HTML5 Canvas API  
- Backend: Supabase (Database & API)  
- Fonts: Google Fonts — Orbitron

---

## How to Run

1. Clone or download the repository  
2. Ensure the file structure is correct:

```
index.html
style.css
script.js
README.md
````

3. Launch: Open `index.html` in any modern web browser.

Note: No build step or server is strictly required for local play. Running via a local server (such as Live Server) is recommended to avoid potential CORS issues with some browser security settings.

---

## Controls

### Desktop
- Move Up: W or Arrow Up  
- Move Down: S or Arrow Down  

### Mobile
- Move: Touch and drag vertically anywhere on the canvas.

---

## Configuration

The project uses Supabase for the leaderboard. Configuration is located in `script.js`:

```javascript
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_KEY";
````

Current status: The project is pre-configured with a public anonymous key. If you wish to host your own backend, replace these credentials with your own Supabase project details.

---

## Project Structure

```
/
├── index.html      # Main game entry point and UI structure
├── style.css       # Visual styling, neon effects, and animations
└── script.js       # Game loop, physics, audio synth, and database logic
```

---

## To Do

* [ ] Add a Pause functionality
* [ ] Implement a mute button for the audio synthesizer
* [ ] Create a Two Player local mode
* [ ] Add more power-ups (e.g., shrink paddle, slow ball)
* [ ] Improve AI difficulty scaling

---

## Liability Disclaimer

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
