import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const port = process.env.PORT || 3000;

const indexHtml = path.join(distDir, 'index.html');

if (!fs.existsSync(indexHtml)) {
    console.error(`Missing build output at ${indexHtml}. Run "npm run build" before starting the server.`);
    process.exit(1);
}

const app = express();

// Hashed build assets never change; everything else stays revalidated.
app.use(express.static(distDir, { index: false, maxAge: '1h' }));

// Any unmatched path (e.g. /{referral_slug}) is handled by the SPA router.
app.get(/.*/, (_req, res) => {
    res.sendFile(indexHtml);
});

app.listen(port, () => {
    console.log(`lavanya-react listening on port ${port}`);
});
