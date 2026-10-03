import { Router, Request, Response } from 'express';

const router = Router();

/**
 * POST /api/v1/inbound/webhook
 * Webhook endpoint for inbound SMS notifications
 */
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
    try {
        const webhookSecret = req.headers['x-webhook-secret'];
        const expectedSecret = process.env.WEBHOOK_SECRET || 'my-super-secret-key-123';

        if (webhookSecret !== expectedSecret) {
            res.status(401).json({
                error: {
                    message: 'Unauthorized: Invalid webhook secret header',
                    statusCode: 401
                }
            });
            return;
        }

        const { event, from, to, message } = req.body;

        console.log(`info: Webhook received - Event: ${event}, From: ${from}, To:${to}`);

        res.status(200).json({
            success: true,
            message: 'Inbound SMS processed successfully',
            data: { event, from, to, message }
        });
    } catch (error: any) {
        console.error('Error processing inbound webhook:', error);
        res.status(500).json({
            error: {
                message: error.message || 'Internal server error',
                statusCode: 500
            }
        });
    }
});

export default router;