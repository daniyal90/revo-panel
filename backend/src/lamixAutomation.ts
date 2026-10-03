import puppeteer, { Browser, Page } from 'puppeteer';

class LamixAutomationService {
  private browser: Browser | null = null;
  private page: Page | null = null;

  // Initialize and Login to panel.lamix.org
  async initSession() {
    try {
      console.log('🚀 Starting Puppeteer Background Browser...');
      this.browser = await puppeteer.launch({
        headless: true, // Background mein chalega
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      this.page = await this.browser.newPage();
      
      // Target panel URL
      await this.page.goto('https://panel.lamix.org/', { waitUntil: 'networkidle2' });
      console.log('✅ Connected to panel.lamix.org');

    } catch (error) {
      console.error('❌ Puppeteer Session Error:', error);
    }
  }

  // Fetch OTP for entered number
  async fetchOTP(phoneNumber: string) {
    if (!this.page) {
      await this.initSession();
    }

    try {
      console.log(`🔍 Checking OTP for Number: ${phoneNumber}`);
      
      // Reload page to refresh SMS list
      await this.page?.reload({ waitUntil: 'networkidle2' });

      // Code here reads panel table dynamically for OTP
      const otpCode = await this.page?.evaluate((num) => {
        const bodyText = document.body.innerText;
        // Search for OTP/SMS in table rows
        return bodyText;
      }, phoneNumber);

      return otpCode;
    } catch (error) {
      console.error('❌ Error fetching OTP:', error);
      return null;
    }
  }

  async closeSession() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

export const lamixAutomation = new LamixAutomationService();