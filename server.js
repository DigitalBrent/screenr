const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/screenshot', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).send('Missing URL');

    try {
        // ✅ Launch Puppeteer and open a new page
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true
        });

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        // ✅ Capture a full-page screenshot
        const screenshot = await page.screenshot({ encoding: 'base64', fullPage: true });

        // ✅ Close the browser after use
        await browser.close();

        // ✅ Send back Base64 image
        res.json({ image: `data:image/png;base64,${screenshot}` });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating screenshot');
    }
});

// ✅ Start Express server
app.listen(PORT, () => console.log(`🚀 Screenshot service running on port ${PORT}`));
