/**
 * Payment routes (client checkout module).
 * Mounted from the forum router at `/v1/payments`, so the endpoints are:
 *   POST /api/v1/payments/validate-discount
 *   POST /api/v1/payments/receipt
 *   POST /api/v1/payments/confirm              (retry + backoff confirmation)
 *   POST /api/v1/payments/webhooks/stripe      (idempotent webhook ingestion)
 *   POST /api/v1/payments/webhooks/razorpay    (idempotent webhook ingestion)
 */

const express = require("express");

const router = express.Router();

const paymentController = require("../controllers/paymentController");

router.post("/validate-discount", paymentController.validateDiscount);
router.post("/receipt", paymentController.generateReceipt);
router.post("/confirm", paymentController.confirmPayment);
router.post("/webhooks/stripe", paymentController.handleStripeWebhook);
router.post("/webhooks/razorpay", paymentController.handleRazorpayWebhook);

module.exports = router;