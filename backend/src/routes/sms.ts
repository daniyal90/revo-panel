import { Router, Request, Response } from 'express';
import lamixAutomation from '../services/lamixAutomation';

const router = Router();

/**
 * POST /api/sms/fetch-otp
 * Body: { "destination": "+94740348022" }
 */
router.post('/fetch-otp', async (req: Request, res: Response): Promise<void> => {
    try {
        const { destination } = req.body;

        if (!destination) {
            res.status(400).json({
                error: {
                    message: 'Destination phone number is required.',
                    statusCode: 400
                }
            });
            return;
        }

        console.log(`info: Initiating OTP fetch from panel for ${destination}`);

        const result = await lamixAutomation.fetchOTP(destination);

        if (!result || !result.otp) {
            res.status(444).json({
                success: false,
                message: 'OTP not received yet for the given destination number.'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('Error fetching OTP:', error);
        res.status(500).json({
            error: {
                message: error.message || 'Internal server error',
                statusCode: 500
            }
        });
    }
});

export default router;