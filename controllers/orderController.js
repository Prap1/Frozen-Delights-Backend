const Order = require('../models/Order');
const Product = require('../models/Product');

const sendEmail = require('../utils/sendEmail');

// Create new Order
exports.newOrder = async (req, res) => {
    const {
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice
    } = req.body;

    try {
        const order = await Order.create({
            shippingInfo,
            orderItems,
            paymentInfo,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            paidAt: Date.now(),
            user: req.user._id
        });

        // Update Stock
        for (const item of orderItems) {
            await updateStock(item.product, item.quantity);
        }

        // Send Email
        const message = `
            <h1>Thank You for Your Order!</h1>
            <p>Hi ${req.user.username},</p>
            <p>Your order with ID: <strong>${order._id}</strong> has been placed successfully.</p>
            <h2>Order Details:</h2>
            <ul>
                ${orderItems.map(item => `<li>${item.name} - ${item.quantity} x ₹${item.price}</li>`).join('')}
            </ul>
            <h3>Total Amount: ₹${totalPrice}</h3>
            <p>We will notify you once your order is shipped.</p>
            <br>
            <p>Thanks,<br>Frozen Delights Team</p>
        `;

        try {
            await sendEmail({
                email: req.user.email,
                subject: `Order Confirmation - ${order._id}`,
                message
            });
        } catch (error) {
            console.error("Email sending failed:", error);
        }

        res.status(201).json({
            success: true,
            order
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

async function updateStock(id, quantity) {
    const product = await Product.findById(id);
    if (product) {
        product.Stock -= quantity;
        await product.save({ validateBeforeSave: false });
    }
}

// Get Single Order
exports.getSingleOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');

        if (!order) {
            return res.status(404).json({ message: 'Order not found with this Id' });
        }

        res.status(200).json({
            success: true,
            order
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Logged in User Orders
exports.myOrders = async (req, res) => {
    try {
        console.log("Fetching orders for user:", req.user._id);
        const orders = await Order.find({ user: req.user._id });
        console.log("Found orders:", orders.length);

        res.status(200).json({
            success: true,
            orders
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Vendor Orders
exports.getVendorOrders = async (req, res) => {
    try {
        const orders = await Order.find({ 'orderItems.vendor': req.user._id });

        res.status(200).json({
            success: true,
            orders
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get All Orders -- Admin
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find();

        let totalAmount = 0;
        orders.forEach(order => {
            totalAmount += order.totalPrice;
        });

        res.status(200).json({
            success: true,
            totalAmount,
            orders
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update Order Status -- Admin / Vendor (basic)
exports.updateOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found with this Id' });
        }

        if (order.orderStatus === 'Delivered') {
            return res.status(400).json({ message: 'You have already delivered this order' });
        }

        order.orderStatus = req.body.status;

        if (req.body.status === 'Delivered') {
            order.deliveredAt = Date.now();
        }

        await order.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete Order -- Admin
exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found with this Id' });
        }

        await order.deleteOne();

        res.status(200).json({
            success: true
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
