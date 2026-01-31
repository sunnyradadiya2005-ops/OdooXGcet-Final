import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { sendReturnReminder, sendLateReturnAlert } from '../utils/email.js';
import { getSettingValue } from '../utils/settings.js';

const REMINDER_HOURS_BEFORE = process.env.RETURN_REMINDER_HOURS || 24;

// Track sent reminders to prevent duplicates (simple in-memory tracking)
const sentReminders = new Set();
const sentLateAlerts = new Set();

/**
 * Return Reminder Job
 * Runs every hour
 * Sends reminder emails 24 hours before rental end date
 */
function startReturnReminderJob() {
    cron.schedule('0 * * * *', async () => {
        try {
            console.log('[Scheduler] Running return reminder job...');

            const now = new Date();
            const reminderTime = new Date(now.getTime() + (REMINDER_HOURS_BEFORE * 60 * 60 * 1000));

            // Find orders that are due in ~24 hours
            const orders = await prisma.rentalOrder.findMany({
                where: {
                    status: 'PICKED_UP',
                    items: {
                        some: {
                            endDate: {
                                gte: now,
                                lte: reminderTime,
                            },
                        },
                    },
                },
                include: {
                    customer: true,
                    items: { include: { product: { select: { name: true } } } },
                },
            });

            for (const order of orders) {
                const reminderKey = `reminder-${order.id}`;

                // Skip if already sent
                if (sentReminders.has(reminderKey)) continue;

                const endDate = new Date(order.items[0].endDate);
                const hoursRemaining = Math.round((endDate - now) / (1000 * 60 * 60));

                try {
                    await sendReturnReminder(order, order.customer, hoursRemaining);
                    sentReminders.add(reminderKey);
                    console.log(`[Scheduler] Sent return reminder for order ${order.orderNumber}`);
                } catch (err) {
                    console.error(`[Scheduler] Failed to send reminder for ${order.orderNumber}:`, err);
                }
            }

            console.log(`[Scheduler] Reminder job complete. Processed ${orders.length} orders.`);
        } catch (err) {
            console.error('[Scheduler] Return reminder job error:', err);
        }
    });

    console.log('[Scheduler] Return reminder job started (runs hourly)');
}

/**
 * Late Return Detection Job
 * Runs every 6 hours
 * Detects overdue rentals and sends alerts
 */
function startLateReturnDetectionJob() {
    cron.schedule('0 */6 * * *', async () => {
        try {
            console.log('[Scheduler] Running late return detection job...');

            const now = new Date();

            // Find orders that are overdue
            const orders = await prisma.rentalOrder.findMany({
                where: {
                    status: 'PICKED_UP',
                    items: {
                        some: {
                            endDate: {
                                lt: now,
                            },
                        },
                    },
                },
                include: {
                    customer: true,
                    vendor: true,
                    items: { include: { product: { select: { name: true } } } },
                },
            });

            for (const order of orders) {
                const alertKey = `late-${order.id}`;

                // Skip if already alerted
                if (sentLateAlerts.has(alertKey)) continue;

                const endDate = new Date(order.items[0].endDate);
                const delayMs = now - endDate;
                const delayHours = delayMs / (1000 * 60 * 60);
                const delayDays = Math.ceil(delayHours / 24);
                const LATE_FEE_PER_DAY = await getSettingValue('late_fee_per_day', parseFloat(process.env.LATE_FEE_PER_DAY || '100'));
                const lateFee = delayDays * LATE_FEE_PER_DAY;

                try {
                    await sendLateReturnAlert(order, order.customer, order.vendor, delayHours, lateFee);
                    sentLateAlerts.add(alertKey);
                    console.log(`[Scheduler] Sent late alert for order ${order.orderNumber} (${delayDays} days overdue)`);
                } catch (err) {
                    console.error(`[Scheduler] Failed to send late alert for ${order.orderNumber}:`, err);
                }
            }

            console.log(`[Scheduler] Late detection job complete. Found ${orders.length} overdue orders.`);
        } catch (err) {
            console.error('[Scheduler] Late return detection job error:', err);
        }
    });

    console.log('[Scheduler] Late return detection job started (runs every 6 hours)');
}

/**
 * Start all scheduled jobs
 */
export function startScheduler() {
    if (process.env.SCHEDULER_ENABLED !== 'false') {
        startReturnReminderJob();
        startLateReturnDetectionJob();
        console.log('[Scheduler] All jobs initialized');
    } else {
        console.log('[Scheduler] Scheduler disabled via environment variable');
    }
}

/**
 * Clear reminder tracking (useful for testing)
 */
export function clearReminderCache() {
    sentReminders.clear();
    sentLateAlerts.clear();
    console.log('[Scheduler] Reminder cache cleared');
}
