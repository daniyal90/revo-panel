import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Skrill / Website Anti-Bot Bypass Enable Karein
puppeteer.use(StealthPlugin());

export async function fetchOTP(destinationNumber: string): Promise<string | null> {
    let browser;
    try {
        // Isolated session launch karein taaki cookies/cache duplicate na hon
        browser = await puppeteer.launch({
            headless: false, // Chrome open nazar aayega
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled', // Bot Detection Hide karta hai
                '--window-size=1280,800'
            ]
        });

        const page = await browser.newPage();

        // User Agent Masking (Skrill ko real human desktop lagega)
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
        );

        // Page Load Timeout & Navigation
        await page.goto('https://panel.lamix.org/dashboard', { waitUntil: 'networkidle2' });

        // Table elements scan karke destination number dhoondna
        const otp = await page.evaluate((targetNum) => {
            const rows = Array.from(document.querySelectorAll('table tr'));
            for (const row of rows) {
                const text = row.textContent || '';
                if (text.includes(targetNum)) {
                    // SMS text se 4 ya 6 digit OTP extract karna
                    const match = text.match(/\b\d{4,6}\b/);
                    return match ? match[0] : null;
                }
            }
            return null;
        }, destinationNumber);

        await browser.close();
        return otp;

    } catch (error) {
        console.error('Scraper Error:', error);
        if (browser) await browser.close();
        return null;
    }
}

// Skrill Form Auto-Fill Function With Human Delay (For Future Automation)
export async function typeLikeHuman(page: any, selector: string, text: string) {
    await page.waitForSelector(selector);
    await page.focus(selector);
    // Real human ki tarah random 80ms - 150ms delay ke sath typing
    for (const char of text) {
        await page.type(selector, char, { delay: Math.floor(Math.random() * 70) + 80 });
    }
}