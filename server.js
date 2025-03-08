const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/screenshot', async (req, res) => {
    let url = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;  // Ensure we get the first URL if it's an array

    // Convert to a string and remove unnecessary characters
    url = String(url).trim().replace(/;$/, ''); // Trim spaces and remove any trailing `;`

    console.log("🚀 Cleaned URL value:", url, "| Type:", typeof url);




    // Decode the URL to handle encoding issues
    if (url) {
        url = decodeURIComponent(url);
    }

    console.log("🚀 Received URL:", url); // Log the URL for debugging

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

        // Scroll to the bottom to trigger lazy loading
        await autoScroll(page);


        const screenshot = await page.screenshot({ encoding: 'base64', fullPage: true });

        await browser.close();

        res.json({ image: `data:image/png;base64,${screenshot}` });

    } catch (error) {
        console.error("❌ Error processing screenshot:", error);
        res.status(500).send("Error generating screenshot");
    }
});

app.listen(PORT, () => console.log(`🚀 Screenshot service running on port ${PORT}`));

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            let totalHeight = 0;
            let distance = 500; // Scroll step size
            let timer = setInterval(() => {
                let scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100); // Adjust speed (milliseconds)
        });
    });
}