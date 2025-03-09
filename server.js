const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/screenshot', async (req, res) => {
    let url = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;  
    url = String(url).trim().replace(/;$/, ''); // Ensure URL is a proper string

    console.log("🚀 Cleaned URL value:", url, "| Type:", typeof url);

    if (!url || typeof url !== 'string' || !url.startsWith("http")) {
        console.error("❌ Invalid URL received:", url);
        return res.status(400).send("Invalid URL parameter");
    }

    try {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true
        });

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        // 🔹 Set Full Desktop Width (1920px)
        await page.setViewport({
            width: 1920,   // Full HD width
            height: 1080,  // Adjust height if needed
            deviceScaleFactor: 1
        });

        // 🔹 Remove sticky headers, chat boxes, and footers before capturing the screenshot
        await page.evaluate(() => {
            const removeSelectors = [
                'header', 
                '.sticky', 
                '[id*="chat"]', 
                '[class*="chat"]', 
                '[class*="cookie"]',
                '[class*="popup"]',
                'footer', 
                '.footer', 
                '[id*="footer"]',
                '#podium-website-widget'
            ];

            removeSelectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(el => el.remove());
            });
        });

        // 🔹 Scroll through the page to trigger lazy-loaded content
        await scrollUntilLoaded(page);

        // 🔹 Extra delay to allow animations & AJAX to finish loading
        await new Promise(r => setTimeout(r, 2000));

        // 🔹 Take full-page screenshot (base64-encoded)
        const screenshot = await page.screenshot({ encoding: 'base64', fullPage: true });

        await browser.close();

        // Send back a data URL
        res.json({ image: `data:image/png;base64,${screenshot}` });

    } catch (error) {
        console.error("❌ Error processing screenshot:", error);
        res.status(500).send("Error generating screenshot");
    }
});

// 🔹 Scroll function to ensure all content is loaded
async function scrollUntilLoaded(page) {
    await page.evaluate(async () => {
        return new Promise((resolve) => {
            let totalHeight = 0;
            let lastHeight = 0;
            let scrollStep = 500;
            let maxAttempts = 15; 

            function scroll() {
                window.scrollBy(0, scrollStep);
                totalHeight += scrollStep;

                if (document.body.scrollHeight !== lastHeight) {
                    lastHeight = document.body.scrollHeight;
                    maxAttempts = 15;
                } else {
                    maxAttempts--;
                }

                if (maxAttempts <= 0) {
                    resolve();
                } else {
                    setTimeout(scroll, 500);
                }
            }

            scroll();
        });
    });
}

// Start the Express server
app.listen(PORT, () => console.log(`🚀 Screenshot service running on port ${PORT}`));
