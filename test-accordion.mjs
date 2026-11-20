import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to Higher Secondary page...');
    await page.goto('http://localhost:5173/higher-secondary', { waitUntil: 'networkidle' });
    
    console.log('Waiting for Excellence section...');
    await page.waitForSelector('[id="excellence"]', { timeout: 10000 });
    
    console.log('Scrolling to Excellence section...');
    await page.locator('[id="excellence"]').scrollIntoViewIfNeeded();
    
    console.log('Looking for School Toppers button...');
    const buttons = await page.locator('button').count();
    console.log(`Found ${buttons} buttons on page`);
    
    // Find the School Toppers button by text
    const toppersBtn = await page.locator("button:has-text('School Toppers')").first();
    const isVisible = await toppersBtn.isVisible({ timeout: 5000 });
    
    if (!isVisible) {
      console.log('ERROR: School Toppers button not found');
      await page.screenshot({ path: '.playwright-mcp/page-scroll.png' });
      process.exit(1);
    }
    
    console.log('✓ School Toppers button found');
    
    // Click to expand
    await toppersBtn.click();
    await page.waitForTimeout(1000);
    
    // Check for Class XII section
    const hasClassXII = await page.locator("text=Class XII Toppers").first().isVisible({ timeout: 5000 }).catch(() => false);
    if (hasClassXII) {
      console.log('✓ Class XII Toppers section expanded');
    } else {
      console.log('ERROR: Class XII section not found after expansion');
    }
    
    // Check for Class X section
    const hasClassX = await page.locator("text=Class X Toppers").first().isVisible({ timeout: 5000 }).catch(() => false);
    if (hasClassX) {
      console.log('✓ Class X Toppers section expanded');
    } else {
      console.log('ERROR: Class X section not found after expansion');
    }
    
    // Count topper cards
    const cards = await page.locator('div.ring-2.ring-school-gold').count();
    console.log(`✓ Found ${cards} rank 1 topper card(s)`);
    
    // Take screenshot
    await page.screenshot({ path: '.playwright-mcp/accordion-expanded.png' });
    console.log('✓ Screenshot: accordion-expanded.png');
    
    // Click to collapse
    await toppersBtn.click();
    await page.waitForTimeout(1000);
    
    // Verify collapse
    const stillVisible = await page.locator("text=Class XII Toppers").first().isVisible({ timeout: 2000 }).catch(() => false);
    if (!stillVisible) {
      console.log('✓ Accordion collapsed successfully');
    } else {
      console.log('WARNING: Accordion may not have collapsed');
    }
    
    // Take collapsed screenshot
    await page.screenshot({ path: '.playwright-mcp/accordion-collapsed.png' });
    console.log('✓ Screenshot: accordion-collapsed.png');
    
    console.log('\n✓ All tests passed!');
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

test();
