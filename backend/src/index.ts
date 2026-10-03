import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { fetchOTP } from './services/lamixAutomation';

dotenv.config();

// Configure Puppeteer with Stealth plugin
puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Helper delay function
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ==========================================
// 1. DASHBOARD FRONTEND (AVIATION & LUXURY STYLE)
// ==========================================
app.get('/', (req: Request, res: Response) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Limax Aviation & Luxury Suite</title>
            <style>
                :root {
                    --bg-color: #04060d;
                    --card-bg: rgba(16, 20, 32, 0.75);
                    --card-border: rgba(212, 175, 55, 0.3);
                    --text-main: #f8fafc;
                    --text-muted: #94a3b8;
                    --gold: #d4af37;
                    --gold-hover: #f3e5ab;
                    --success: #10b981;
                    --danger: #ef4444;
                    --warning: #f59e0b;
                }
                * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                
                body {
                    background-color: var(--bg-color);
                    color: var(--text-main);
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    overflow-x: hidden;
                    position: relative;
                }

                body::before {
                    content: '';
                    position: absolute;
                    width: 700px;
                    height: 700px;
                    background: radial-gradient(circle, rgba(212, 175, 55, 0.12) 0%, rgba(30, 58, 138, 0.08) 50%, transparent 70%);
                    top: -150px;
                    left: -150px;
                    z-index: 0;
                    pointer-events: none;
                    animation: floatGlow 12s ease-in-out infinite alternate;
                }

                @keyframes floatGlow {
                    0% { transform: translateY(0px) scale(1); }
                    100% { transform: translateY(40px) scale(1.08); }
                }
                
                header {
                    background: rgba(10, 14, 26, 0.9);
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
                    padding: 1.25rem 2.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.8);
                }

                .logo-area h1 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    background: linear-gradient(90deg, #f3e5ab, #d4af37, #aa771c);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .logo-area span { font-size: 0.85rem; color: var(--text-muted); letter-spacing: 2px; text-transform: uppercase; }
                
                .global-controls { display: flex; gap: 1rem; align-items: center; z-index: 10; }
                .btn { background: linear-gradient(135deg, var(--gold), #aa771c); color: #04060d; border: none; padding: 0.6rem 1.25rem; border-radius: 8px; cursor: pointer; font-weight: 700; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3); transition: all 0.3s ease; }
                .btn:hover { background: var(--gold-hover); transform: translateY(-2px); }
                .btn-danger { background: linear-gradient(135deg, var(--danger), #dc2626); color: white; }

                main { padding: 2.5rem; flex: 1; z-index: 10; }
                
                .grid-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1.75rem;
                }

                .profile-card {
                    background: var(--card-bg);
                    backdrop-filter: blur(14px);
                    border: 1px solid var(--card-border);
                    border-radius: 14px;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    height: 200px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
                    transition: all 0.4s ease;
                }

                .profile-card:hover {
                    transform: translateY(-6px);
                    border-color: rgba(212, 175, 55, 0.8);
                }

                .card-header { display: flex; justify-content: space-between; align-items: center; }
                .profile-title { font-weight: 700; font-size: 1.1rem; color: var(--gold); }

                .status-dot { width: 10px; height: 10px; border-radius: 50%; background-color: var(--text-muted); transition: all 0.3s; }
                .status-dot.running { background-color: var(--warning); box-shadow: 0 0 12px var(--warning); animation: pulse 1.5s infinite; }
                .status-dot.success { background-color: var(--success); box-shadow: 0 0 12px var(--success); }
                .status-dot.idle { background-color: var(--text-muted); }

                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
                    70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
                }

                .card-body {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    flex: 1;
                    color: var(--text-muted);
                    background: rgba(0, 0, 0, 0.4);
                    border-radius: 8px;
                    margin: 0.8rem 0;
                    border: 1px dashed rgba(212, 175, 55, 0.15);
                }
                .status-label { font-weight: 600; color: #f1f5f9; font-size: 0.95rem; }

                .card-footer { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: var(--text-muted); }

                .action-btn {
                    background: rgba(212, 175, 55, 0.08);
                    border: 1px solid var(--card-border);
                    color: var(--gold);
                    padding: 0.4rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 700;
                    transition: all 0.2s;
                }
                .action-btn:hover { background-color: var(--gold); color: #04060d; }

                footer {
                    background: rgba(8, 11, 20, 0.95);
                    border-top: 1px solid rgba(212, 175, 55, 0.15);
                    padding: 1.25rem;
                    text-align: center;
                    font-size: 0.9rem;
                    color: var(--text-muted);
                    z-index: 10;
                }
                footer span { color: var(--gold); font-weight: 700; }
            </style>
        </head>
        <body>
            <header>
                <div class="logo-area">
                    <h1>Limax Aviation Suite</h1>
                    <span>First-Class Flight Deck & Automation</span>
                </div>
                <div class="global-controls">
                    <button class="btn" onclick="startAll()">Launch All Fleet</button>
                    <button class="btn btn-danger" onclick="stopAll()">Abort All</button>
                </div>
            </header>

            <main>
                <div class="grid-container" id="gridContainer"></div>
            </main>

            <footer>
                Limax Aviation & Luxury Suite &bull; Crafted for Excellence by <span>Hani 2026</span>
            </footer>

            <script>
                const TOTAL_PROFILES = 35;
                const gridContainer = document.getElementById('gridContainer');
                
                function initGrid() {
                    let html = '';
                    for (let i = 1; i <= TOTAL_PROFILES; i++) {
                        const idStr = i < 10 ? \`FL-0\${i}\` : \`FL-\${i}\`;
                        html += \`
                            <div class="profile-card" id="card-\${i}">
                                <div class="card-header">
                                    <span class="profile-title">\${idStr}</span>
                                    <div class="status-dot idle" id="dot-\${i}" title="Idle"></div>
                                </div>
                                <div class="card-body">
                                    <span class="status-label" id="status-text-\${i}">standby</span>
                                </div>
                                <div class="card-footer">
                                    <span id="metric-\${i}">Flight: Ready</span>
                                    <button class="action-btn" onclick="toggleProfile(\${i})">Launch</button>
                                </div>
                            </div>
                        \`;
                    }
                    gridContainer.innerHTML = html;
                }

                async function toggleProfile(id) {
                    const dot = document.getElementById(\`dot-\${id}\`);
                    const statusText = document.getElementById(\`status-text-\${id}\`);
                    const metric = document.getElementById(\`metric-\${id}\`);
                    const idStr = id < 10 ? \`FL-0\${id}\` : \`FL-\${id}\`;
                    
                    if (dot.classList.contains('idle')) {
                        dot.className = 'status-dot running';
                        statusText.innerText = 'departing...';
                        metric.innerText = 'Opening Skrill...';

                        try {
                            const response = await fetch('/api/launch-skrill', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ profileId: idStr })
                            });
                            const data = await response.json();
                            
                            if (data.success) {
                                statusText.innerText = 'airborne';
                                metric.innerText = 'Active Deck';
                            } else {
                                statusText.innerText = 'failed';
                                dot.className = 'status-dot idle';
                                metric.innerText = 'Flight: Ready';
                            }
                        } catch (err) {
                            console.error('Launch error:', err);
                            statusText.innerText = 'error';
                            dot.className = 'status-dot idle';
                            metric.innerText = 'Flight: Ready';
                        }
                    } else {
                        dot.className = 'status-dot idle';
                        statusText.innerText = 'standby';
                        metric.innerText = 'Flight: Ready';
                    }
                }

                function startAll() {
                    for (let i = 1; i <= TOTAL_PROFILES; i++) {
                        toggleProfile(i);
                    }
                }

                function stopAll() {
                    for (let i = 1; i <= TOTAL_PROFILES; i++) {
                        const dot = document.getElementById(\`dot-\${i}\`);
                        dot.className = 'status-dot idle';
                        document.getElementById(\`status-text-\${i}\`).innerText = 'standby';
                        document.getElementById(\`metric-\${i}\`).innerText = 'Flight: Ready';
                    }
                }

                initGrid();
            </script>
        </body>
        </html>
    `);
});

// ==========================================
// 2. BACKEND API: LAUNCH SKRILL (WITH ERROR HANDLING)
// ==========================================
app.post('/api/launch-skrill', async (req: Request, res: Response): Promise<void> => {
    let browser;
    try {
        const { profileId } = req.body;
        console.log(`[Aviation Deck] Launching stealth browser for Flight: ${profileId}`);

        browser = await puppeteer.launch({
            headless: false,
            args: [
                '--window-size=1000,700',
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-infobars',
                '--start-maximized'
            ],
            ignoreDefaultArgs: ['--enable-automation']
        });

        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1000, height: 700 });

        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });

        // Safe navigation with error catch
        await page.goto('https://account.skrill.com/signup', { waitUntil: 'networkidle2', timeout: 60000 }).catch(async () => {
            console.log('⚠️ Network idle timeout reached, attempting reload...');
            await page.reload({ waitUntil: 'domcontentloaded' });
        });

        res.status(200).json({ success: true, message: `Flight ${profileId} launched successfully!` });
    } catch (error: any) {
        console.error('Browser Launch Error:', error.message);
        if (browser) {
            try { await browser.close(); } catch (e) { }
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 3. BACKEND API: FETCH OTP (WITH RETRY & ERROR CATCHING)
// ==========================================
app.post('/api/sms/fetch-otp', async (req: Request, res: Response): Promise<void> => {
    try {
        const { destination, timeoutSeconds = 40 } = req.body;
        if (!destination) {
            res.status(400).json({ success: false, message: 'Destination number is required.' });
            return;
        }
        console.log(`info: Searching OTP for ${destination} (Waiting up to ${timeoutSeconds}s)...`);
        const startTime = Date.now();
        const maxWaitTime = timeoutSeconds * 1000;

        while (Date.now() - startTime < maxWaitTime) {
            try {
                const result = await fetchOTP(destination);
                if (result) {
                    res.status(200).json({ success: true, data: result });
                    return;
                }
            } catch (innerErr) {
                // Ignore transient API errors during loop polling
            }
            console.log('⏳ OTP pending. Retrying in 3 seconds...');
            await sleep(3000);
        }

        res.status(404).json({ success: false, message: `Timed out: OTP did not arrive within ${timeoutSeconds} seconds.` });
    } catch (error: any) {
        console.error('SMS API Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error while fetching OTP.', error: error.message });
    }
});

// Global unhandled rejection safety to prevent server crashes
process.on('unhandledRejection', (reason: any) => {
    console.error('⚠️ Unhandled Promise Rejection:', reason?.message || reason);
});

// ==========================================
// 4. START SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(`info: Limax Aviation Suite running securely on port ${PORT}`);
});