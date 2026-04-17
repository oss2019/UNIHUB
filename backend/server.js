import "dotenv/config";

import connectDB from './config/db.js';
import app from './app.js';

const PORT = process.env.PORT || 8000;

app.listen(PORT, async () => {
    await connectDB();
    console.log(`Server running in ${process.env.NODE_ENV} mode on port http://localhost:${PORT}`);
});
