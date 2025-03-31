const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Razorpay Setup
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, "frontend")));

// API: Create Order
app.post("/create-order", async (req, res) => {
    try {
        const options = {
            amount: req.body.amount,
            currency: req.body.currency,
            receipt: "order_rcptid_" + new Date().getTime()
        };
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error("Order Creation Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to create order" });
    }
});

// API: Verify Payment
app.post("/verify-payment", async (req, res) => {
    try {
        const { order_id, payment_id, signature } = req.body;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(order_id + "|" + payment_id)
            .digest("hex");

        if (expectedSignature !== signature) {
            return res.status(400).json({ success: false, message: "Invalid Signature" });
        }

        res.json({ success: true, message: "Payment Verified Successfully!" });
    } catch (error) {
        console.error("Payment Verification Error:", error.message);
        res.status(500).json({ success: false, message: "Payment verification failed" });
    }
});

// Catch-all route for serving `index.html`
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
