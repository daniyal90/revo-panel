import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Stealth plugin apply karein taake automation detect na ho
puppeteer.use(StealthPlugin());

interface AccountDetails {
    email: string;
    firstName: string;
    lastName: string;
    country: string;
    currency: string;
}

async function registerSkrillAccount(account: AccountDetails) {
    console.log(`[Automation] Starting registration for: ${account.email}`);

    // Browser launch karein (Headless false rakha hai taake aap khud dekh sakein, baad mein true kar sakte hain)
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-size=1280,800'
        ]
    });

    try {
        const page = await browser.newPage();
        
        // Viewport set karein
        await page.setViewport({ width: 1280, height: 800 });

        // User-agent aur extra headers mask karein
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log('[Automation] Navigating to Skrill registration page...');
        await page.goto('https://www.skrill.com/en/s/register/', { waitUntil: 'networkidle2', timeout: 60000 });

        // Random human-like delay
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Note: Skrill ke selectors waqt ke sath change ho sakte hain, unhe yahan target kiya jata hai
        // Misal ke taur par fields fill karne ka logic:
        /*
        await page.type('#first-name', account.firstName, { delay: 100 });
        await page.type('#last-name', account.lastName, { delay: 100 });
        await page.type('#email', account.email, { delay: 100 });
        */

        console.log(`[Automation] Successfully reached registration page for ${account.email}`);
        
        // Testing ke liye 5 second ruk kar browser close kar rahe hain
        await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error) {
        console.error(`[Automation Error] Failed for ${account.email}:`, error);
    } finally {
        await browser.close();
    }
}

// Test Run Function
async function runBatch() {
    const sampleAccount: AccountDetails = {
        email: 'testuser_limax@gmail.com',
        firstName: 'Daniyal',
        lastName: 'Sattar',
        country: 'Pakistan',
        currency: 'EUR'
    };

    await registerSkrillAccount(sampleAccount);
}

// Execute
runBatch();