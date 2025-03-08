const express = require('express');
const puppeteer = require('puppeteer-extra'); // Using Puppeteer Extra for stealth mode
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Apply stealth plugin to bypass bot detection
puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/screenshot', async (req, res) => {
    let url = req.query.url || "https://nike.com"; // Default for testing

    console.log("🚀 Received URL:", url); // Debugging log

    // Validate URL to prevent Puppeteer crashes
    if (!url || typeof url !== 'string' || !url.startsWith("http")) {
        console.error("❌ Invalid URL received:", url);
        return res.status(400).send("Invalid URL parameter");
    }

    try {
        // Launch Puppeteer with proper cloud settings
        const browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ],
            headless: true
        });

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Capture full-page screenshot
        const screenshot = await page.screenshot({ encoding: 'base64', fullPage: true });

        await browser.close();

        // Return screenshot as base64 JSON
        res.json({ image: `data:image/png;base64,${screenshot}` });

    } catch (error) {
        console.error("❌ Error processing screenshot:", error);
        res.status(500).send("Error generating screenshot");
    }
});

// Start Express server
app.listen(PORT, () => console.log(`🚀 Screenshot service running on port ${PORT}`));
