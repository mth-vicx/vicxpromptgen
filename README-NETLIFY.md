# Vicx Reel Forge — Netlify Edition

## Deploy dari HP

1. Upload project ini ke GitHub (atau upload folder/ZIP ke Netlify jika metode upload manual tersedia).
2. Di Netlify, import project dari GitHub.
3. Build command: kosongkan.
4. Publish directory: `.`
5. Deploy.
6. Buka Site configuration / Project configuration → Environment variables.
7. Tambahkan:
   - `GEMINI_API_KEY` = API key Gemini BARU kamu
   - `GEMINI_MODEL` = `gemini-flash-latest`
8. Redeploy site setelah environment variable disimpan.

## Keamanan
Jangan masukkan API key ke `index.html` dan jangan commit file `.env` ke GitHub.
API key dibaca oleh Netlify Function melalui `process.env.GEMINI_API_KEY`.

## Endpoint
Frontend memanggil `/api/generate`, yang diarahkan Netlify ke:
`/.netlify/functions/generate`
