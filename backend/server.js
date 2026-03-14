import app from './app.js';
import cronService from './services/cronService.js';

const PORT = process.env.PORT || 5000;

// Initialize Cron Jobs
cronService.initCronJobs();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
