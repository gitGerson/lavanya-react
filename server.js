import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const port = process.env.PORT || 3000;

const app = express();

// Hashed build assets never change; everything else stays revalidated.
app.use(express.static(distDir, { index: false, maxAge: '1h' }));

// Any unmatched path (e.g. /{referral_slug}) is handled by the SPA router.
app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, () => {
    console.log(`lavanya-react listening on port ${port}`);
});
