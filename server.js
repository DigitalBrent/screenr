const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/screenshot', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).send('Missing URL');

    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        const screenshot = await page.screenshot({ encoding: 'base64', fullPage: true });
        await browser.close();

        res.json({ image: `data:image/png;base64,${screenshot}` });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating screenshot');
    }
});

app.listen(PORT, () => console.log(`🚀 Screenshot service running on port ${PORT}`));
