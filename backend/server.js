const dotenv = require('dotenv');
dotenv.config(); // Must be called before requiring files that use process.env

const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    await connectDB();
    console.log(`Server running in ${process.env.NODE_ENV} mode on port http://localhost:${PORT}`);
});
