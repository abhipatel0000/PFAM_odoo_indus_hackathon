import cron from 'node-cron';
import emailService from './emailService.js';
import expiryModel from '../models/expiryModel.js';
import deadStockModel from '../models/deadStockModel.js';
import reorderModel from '../models/reorderModel.js';

const sendDailyAlerts = async () => {
    try {
        console.log('Running daily alert job...');
        
        // Fetch data
        const [expiringSoon, expired] = await Promise.all([
            expiryModel.getExpiringSoon(30),
            expiryModel.getExpired()
        ]);
        
        const deadStock = await deadStockModel.getDeadStock(90);
        const reorders = await reorderModel.getSuggestions();

        let htmlContent = `<h1>Daily Inventory Alerts</h1>`;
        
        // Add Expiring Soon
        if (expiringSoon && expiringSoon.length > 0) {
            htmlContent += `<h2>Expiring Soon (Next 30 Days)</h2><ul>`;
            expiringSoon.forEach(item => {
                htmlContent += `<li>${item.name} (${item.sku}) - Expires in ${item.days_until_expiry} days (Qty: ${item.qty_on_hand})</li>`;
            });
            htmlContent += `</ul>`;
        }

        // Add Expired
        if (expired && expired.length > 0) {
            htmlContent += `<h2>Already Expired</h2><ul>`;
            expired.forEach(item => {
                htmlContent += `<li><strong>${item.name} (${item.sku}) - Expired ${item.days_past_expiry} days ago!</strong> (Qty: ${item.qty_on_hand})</li>`;
            });
            htmlContent += `</ul>`;
        }

        // Add Dead Stock
        if (deadStock && deadStock.length > 0) {
            htmlContent += `<h2>Dead Stock (No sales in 90+ days)</h2><ul>`;
            deadStock.forEach(item => {
                htmlContent += `<li>${item.name} (${item.sku}) - ${item.days_since_last_sale} days since last sale (Qty: ${item.qty_on_hand})</li>`;
            });
            htmlContent += `</ul>`;
        }

        // Add Reorder
        if (reorders && reorders.length > 0) {
            htmlContent += `<h2>Reorder Suggestions</h2><ul>`;
            reorders.forEach(item => {
                htmlContent += `<li>${item.name} (${item.sku}) - Have: ${item.qty_on_hand}, Min: ${item.reorder_level}, Suggestion: +${item.suggested_reorder_qty}</li>`;
            });
            htmlContent += `</ul>`;
        }
        
        const shouldSend = (expiringSoon?.length > 0) || (expired?.length > 0) || (deadStock?.length > 0) || (reorders?.length > 0);
        
        if (shouldSend) {
            await emailService.sendEmail('Daily Inventory Alerts', 'Please check your inventory for critical alerts. Find the details below.', htmlContent);
        } else {
             console.log('No alerts to send today.');
        }

    } catch (error) {
         console.error('Failed to send daily alerts:', error);
    }
};

const initCronJobs = () => {
    // Run every day at 8:00 AM
    // For testing purposes, uncomment the line below to run every minute:
    // cron.schedule('* * * * *', sendDailyAlerts);
    
    cron.schedule('0 8 * * *', sendDailyAlerts);
    console.log('Cron jobs initialized to run daily at 8:00 AM.');
};

export default {
    initCronJobs,
    sendDailyAlerts // Exported for manual trigger testing
};
