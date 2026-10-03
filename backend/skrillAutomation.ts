import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

interface AccountDetails {
    id: number;
    email: string;
}

async function openSkrillBox(account: AccountDetails) {
    console.log(`[Box ${account.id}] Launching browser box for: ${account.email}`);

    const browser = await puppeteer.launch({
        headless: false, // false rakha hai taake aapko saare boxes screen par khulte nazar aayein
        args: ['--window-size=1000,700']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 900, height: 650 });

        console.log(`[Box ${account.id}] Navigating to Skrill...`);
        await page.goto('https://www.skrill.com/en/s/register/', { waitUntil: 'networkidle2', timeout: 60000 });

        console.log(`[Box ${account.id}] Skrill page loaded successfully!`);

        // Yahan aap kuch dair rok sakte hain ya form fill kar sakte hain
        await new Promise(r => setTimeout(r, 10000)); // 10 seconds open rahega

    } catch (error) {
        console.error(`[Box ${account.id}] Error:`, error);
    } finally {
        await browser.close();
        console.log(`[Box ${account.id}] Browser closed.`);
    }
}

async function runBatchAutomation() {
    // Total 25 accounts ki list generate kar rahe hain (aap yahan apni real details daal sakte hain)
    const totalAccounts: AccountDetails[] = Array.from({ length: 25 }, (_, index) => ({
        id: index + 1,
        email: `skrill_user_${index + 1}@gmail.com`
    }));

    // Batch size: Aik waqt mein kitne browsers khulne chahiyein (PC load bachane ke liye 3 ya 5 best hai)
    const BATCH_SIZE = 3;

    for (let i = 0; i < totalAccounts.length; i += BATCH_SIZE) {
        const batch = totalAccounts.slice(i, i + BATCH_SIZE);
        console.log(`\n--- Starting Batch ${Math.floor(i / BATCH_SIZE) + 1} (Accounts ${i + 1} to ${i + batch.length}) ---`);

        // Batch ke saare browsers aik sath khulenge
        await Promise.all(batch.map(acc => openSkrillBox(acc)));

        console.log(`--- Batch Completed --- \n`);
    }

    console.log('[Automation] All 25 accounts processed!');
}

runBatchAutomation();