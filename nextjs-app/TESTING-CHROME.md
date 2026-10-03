# Chrome Testing Guide - Limax SMS Monetization Platform

This guide covers how to test your application in Google Chrome, both locally and on Vercel.

---

## Prerequisites

- Google Chrome browser installed
- Local server running (`npm run dev`) OR Vercel deployment live
- Developer tools knowledge (F12)

---

## Testing Locally (http://localhost:3000)

### Step 1: Start Local Server

```powershell
cd "c:\Users\Hani\Desktop\Limax new\nextjs-app"
npm run dev
```

Wait for:
```
✓ Ready in 2.5s
- Local: http://localhost:3000
```

### Step 2: Open in Chrome

1. Open Google Chrome
2. Navigate to: `http://localhost:3000`
3. Press `F12` to open Developer Tools
4. Click "Console" tab to check for errors

---

## Testing Landing Page

### 1. Hero Section

**What to test:**
- ✅ Headline displays correctly
- ✅ "Get Started" and "View Rates" buttons are clickable
- ✅ UTC clock updates every second
- ✅ No console errors

**How to test:**
```javascript
// In Chrome Console
// Check if UTC clock is updating
setInterval(() => console.log(new Date().toUTCString()), 1000);
```

### 2. Live Traffic Monitor

**What to test:**
- ✅ Table displays 5 mock countries
- ✅ Status indicators (delivered/pending/failed) show correct colors
- ✅ Status updates every 3 seconds (simulated)
- ✅ No console errors

**How to test:**
```javascript
// In Chrome Console
// Wait 3 seconds and check if status changes
// Look for green (delivered), yellow (pending), red (failed) badges
```

### 3. 4-Step Process Section

**What to test:**
- ✅ 4 cards display with icons
- ✅ Step numbers (1-4) are visible
- ✅ Hover effects work on cards
- ✅ Animations load smoothly

**How to test:**
- Hover over each card
- Check for border color change to blue

### 4. Value Proposition Grid

**What to test:**
- ✅ 4 feature cards display
- ✅ Icons render correctly
- ✅ Hover effects work

### 5. FAQ Accordion

**What to test:**
- ✅ 5 FAQ questions display
- ✅ Clicking expands/collapses answers
- ✅ Chevron icon rotates
- ✅ Only one FAQ open at a time

**How to test:**
```javascript
// In Chrome Console
// Click each FAQ and verify expansion
document.querySelectorAll('button').forEach(btn => btn.click());
```

### 6. Contact Section

**What to test:**
- ✅ WhatsApp button opens WhatsApp
- ✅ Telegram button opens Telegram
- ✅ Links open in new tab

**How to test:**
- Click WhatsApp button → Should open `https://wa.me/1234567890`
- Click Telegram button → Should open `https://t.me/limax_support`

### 7. Navigation

**What to test:**
- ✅ Logo links to home
- ✅ "Features" scrolls to features section
- ✅ "Rates" scrolls to rates section
- ✅ "FAQ" scrolls to FAQ section
- ✅ "Contact" scrolls to contact section
- ✅ "Login" button (placeholder)
- ✅ "Get Started" button (placeholder)

**How to test:**
```javascript
// In Chrome Console
// Test smooth scroll
document.querySelector('a[href="#features"]').click();
```

---

## Testing User Dashboard (http://localhost:3000/dashboard)

### Step 1: Navigate to Dashboard

Since authentication is not implemented yet, navigate directly:
```
http://localhost:3000/dashboard
```

### 2. Dashboard Header

**What to test:**
- ✅ Logo and "Dashboard" breadcrumb display
- ✅ Settings icon (placeholder)
- ✅ User profile shows "John Doe"
- ✅ Logout button (placeholder)

### 3. Tab Navigation

**What to test:**
- ✅ 4 tabs: Overview, Ranges, Integration, Financials
- ✅ Clicking tabs switches content
- ✅ Active tab is highlighted in blue
- ✅ Smooth transitions between tabs

**How to test:**
```javascript
// In Chrome Console
// Click each tab
const tabs = ['overview', 'ranges', 'integration', 'financials'];
tabs.forEach(tab => {
  document.querySelector(`button:contains("${tab}")`).click();
  console.log(`Switched to ${tab}`);
});
```

### 4. Overview Tab

**What to test:**
- ✅ 4 stat cards display:
  - Total Traffic: 15,420
  - Delivered SMS: 14,850
  - Net Earnings: $594.00
  - Pending Payouts: $237.60
- ✅ Percentage indicators show green
- ✅ Recent Activity list shows 4 items
- ✅ Activity items have correct timestamps

**How to test:**
```javascript
// In Chrome Console
// Verify stats
console.log(document.body.textContent.includes('15,420')); // true
console.log(document.body.textContent.includes('$594.00')); // true
```

### 5. Ranges Tab

**What to test:**
- ✅ Table displays 5 country ranges
- ✅ Search bar filters ranges
- ✅ Filter button (placeholder)
- ✅ "Claim Range" buttons are clickable
- ✅ Status badges show correct colors (Live = green, Maintenance = yellow)

**How to test:**
```javascript
// In Chrome Console
// Test search
const searchInput = document.querySelector('input[placeholder*="Search"]');
searchInput.value = 'UK';
searchInput.dispatchEvent(new Event('input'));
// Should filter to show only UK ranges
```

### 6. Integration Tab

**What to test:**
- ✅ HTTP API Endpoint displays
- ✅ API Key displays
- ✅ Copy buttons work (click → shows checkmark)
- ✅ SMPP configuration displays:
  - Host: smpp.limax.org
  - Port: 2775
  - System ID: limax_user_001
  - Password: masked (••••••••••••)
- ✅ Copy buttons for each field

**How to test:**
```javascript
// In Chrome Console
// Test copy functionality
const copyBtn = document.querySelector('button');
copyBtn.click();
// Check clipboard
navigator.clipboard.readText().then(text => console.log('Copied:', text));
```

### 7. Financials Tab

**What to test:**
- ✅ Payout progress bar shows correct percentage
- ✅ Minimum threshold ($50) displays
- ✅ Current amount ($237.60) displays
- ✅ Success message when threshold reached
- ✅ 3 withdrawal method cards:
  - USDT-TRC20 (Active)
  - Wise (Not Configured)
  - Bank Wire (Not Configured)
- ✅ Payout history shows 3 entries
- ✅ "Export CSV" button (placeholder)

**How to test:**
```javascript
// In Chrome Console
// Verify progress bar
const progress = (237.60 / 50) * 100;
console.log(`Progress should be ${progress}%`);
```

---

## Testing Production (Vercel Deployment)

### Step 1: Open Production URL

Navigate to your Vercel deployment:
```
https://limax-sms-platform.vercel.app
```

### Step 2: Repeat All Tests

Perform the same tests as local testing:
- Landing page sections
- Dashboard tabs
- All interactions

### Step 3: Check Performance

**In Chrome DevTools:**
1. Press `F12`
2. Click "Lighthouse" tab
3. Select "Performance"
4. Click "Analyze page load"

**Target scores:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 100

### Step 4: Check Network

**In Chrome DevTools:**
1. Press `F12`
2. Click "Network" tab
3. Refresh page (F5)
4. Check:
  - All resources load successfully (200 status)
  - No 404 or 500 errors
  - Load times are reasonable (< 3s)

### Step 5: Check Console

**In Chrome DevTools:**
1. Press `F12`
2. Click "Console" tab
3. Look for:
  - ❌ Red errors (fix these)
  - ⚠️ Yellow warnings (review these)
  - ✅ No errors = good

---

## Testing Responsive Design

### Test on Different Screen Sizes

**In Chrome DevTools:**
1. Press `F12`
2. Click "Device Toolbar" (Ctrl+Shift+M)
3. Test these devices:
  - iPhone 12 Pro (390x844)
  - iPad (768x1024)
  - Desktop (1920x1080)

**What to test:**
- ✅ Navigation collapses to hamburger on mobile
- ✅ Tables scroll horizontally on mobile
- ✅ Cards stack vertically on mobile
- ✅ Text remains readable
- ✅ Buttons are tap-friendly (min 44px height)

---

## Testing Dark Mode

The app uses a dark theme by default.

**What to test:**
- ✅ Background is dark (slate-950)
- ✅ Text is light (white/slate-300)
- ✅ Contrast ratios are accessible (WCAG AA)
- ✅ No eye strain

---

## Testing Accessibility

**In Chrome DevTools:**
1. Press `F12`
2. Click "Lighthouse" tab
3. Select "Accessibility"
4. Click "Analyze page load"

**What to test:**
- ✅ Alt text on images
- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Focus indicators visible
- ✅ Color contrast ratios

**Keyboard navigation test:**
```javascript
// In Chrome Console
// Test Tab navigation
document.body.tabIndex = 0;
document.body.focus();
// Press Tab to navigate through elements
```

---

## Testing API Routes (When Implemented)

### Test Landing Page API

```javascript
// In Chrome Console
fetch('/api/traffic')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

### Test Dashboard API

```javascript
// In Chrome Console
fetch('/api/stats')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

### Test Authentication API (When Implemented)

```javascript
// In Chrome Console
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'password' })
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

---

## Testing Database Connection

### Test Prisma Client

```javascript
// In Chrome Console (won't work in browser - use server logs)
// Check server logs for database connection status
// Look for: "Database connection successful"
```

---

## Common Issues and Solutions

### Issue: Page loads blank

**Solution:**
1. Check Console for errors
2. Verify `npm run dev` is running
3. Clear browser cache (Ctrl+Shift+Delete)
4. Try incognito mode (Ctrl+Shift+N)

### Issue: Styles not loading

**Solution:**
1. Check Network tab for CSS file errors
2. Verify `tailwind.config.ts` is correct
3. Run `npm run build` to check for build errors

### Issue: Icons not displaying

**Solution:**
1. Verify `lucide-react` is installed
2. Check Console for import errors
3. Reinstall dependencies: `npm install`

### Issue: Animations not working

**Solution:**
1. Verify `framer-motion` is installed
2. Check Console for animation errors
3. Test with reduced motion preference disabled

---

## Performance Testing

### Measure Load Time

**In Chrome DevTools:**
1. Press `F12`
2. Click "Performance" tab
3. Click "Record"
4. Refresh page
5. Stop recording

**Target metrics:**
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.8s
- Cumulative Layout Shift (CLS): < 0.1

---

## Security Testing

### Check for Vulnerabilities

```powershell
# Run dependency audit
npm audit

# Fix vulnerabilities
npm audit fix
```

### Test HTTPS (Production Only)

1. Navigate to `https://limax-sms-platform.vercel.app`
2. Check for lock icon in address bar
3. Click lock icon → "Connection is secure"

---

## Cross-Browser Testing

Test in additional browsers:
- ✅ Google Chrome (primary)
- ✅ Firefox
- ✅ Safari (if on Mac)
- ✅ Edge

---

## Mobile Testing

Test on actual mobile devices:
1. Connect phone to same WiFi as computer
2. Find computer's IP address:
   ```powershell
   ipconfig
   # Look for IPv4 Address (e.g., 192.168.1.100)
   ```
3. On phone, navigate to: `http://192.168.1.100:3000`

---

## Testing Checklist

### Landing Page
- [ ] Hero section displays correctly
- [ ] UTC clock updates
- [ ] Live traffic monitor shows data
- [ ] 4-step process cards display
- [ ] Value proposition grid displays
- [ ] FAQ accordion works
- [ ] Contact buttons open correct links
- [ ] Navigation links work
- [ ] No console errors

### Dashboard
- [ ] Header displays correctly
- [ ] Tab navigation works
- [ ] Overview tab shows stats
- [ ] Ranges tab shows table
- [ ] Search filters ranges
- [ ] Integration tab shows credentials
- [ ] Copy buttons work
- [ ] Financials tab shows progress
- [ ] Withdrawal methods display
- [ ] Payout history shows
- [ ] No console errors

### Performance
- [ ] Lighthouse score 90+
- [ ] Load time < 3s
- [ ] No 404/500 errors
- [ ] Images optimized

### Responsive
- [ ] Mobile layout works
- [ ] Tablet layout works
- [ ] Desktop layout works
- [ ] Touch targets accessible

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Color contrast compliant
- [ ] ARIA labels present

---

## Next Steps

1. ✅ Complete all tests locally
2. ✅ Deploy to Vercel
3. ✅ Complete all tests on production
4. ✅ Fix any issues found
5. ✅ Set up monitoring (Vercel Analytics)
6. ✅ Launch to users

---

## Quick Test Commands

```javascript
// Chrome Console - Quick checks

// Check for errors
console.log('Page loaded successfully');

// Check if React is loaded
console.log(React ? 'React loaded' : 'React not loaded');

// Check if Framer Motion is loaded
console.log(motion ? 'Framer Motion loaded' : 'Framer Motion not loaded');

// Check page title
console.log(document.title);

// Check viewport
console.log(window.innerWidth, window.innerHeight);
```

---

## Support

- Chrome DevTools Docs: https://developer.chrome.com/docs/devtools
- Next.js Testing Docs: https://nextjs.org/docs/testing
- Vercel Analytics: https://vercel.com/docs/analytics
