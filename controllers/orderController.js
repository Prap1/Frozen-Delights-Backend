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
        discount,
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
            discount,
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
// Get Logged in User Orders
exports.myOrders = async (req, res) => {
    try {
        const { status, time, search } = req.query;
        let query = { user: req.user._id };

        // 1. Filter by Status
        if (status) {
            const statusArray = status.split(',');
            // Mapping frontend status text to backend enum if needed, or direct match
            // Front: "On the way" -> Back: "Processing" / "Shipped" ?? 
            // Let's assume direct mapping for now, or mapped on frontend.
            // If "On the way" covers multiple, we might need logic here.
            // For now, let's trust the frontend sends valid status strings or we map them.
            // Common mapping: 
            // 'On the way' -> ['Processing', 'Shipped']
            // 'Delivered' -> ['Delivered']
            // 'Cancelled' -> ['Cancelled']
            // 'Returned' -> ['Returned']

            let statusConditions = [];
            if (statusArray.includes('On the way')) {
                statusConditions.push('Processing', 'Shipped');
            }
            if (statusArray.includes('Delivered')) {
                statusConditions.push('Delivered');
            }
            if (statusArray.includes('Cancelled')) {
                statusConditions.push('Cancelled');
            }
            if (statusArray.includes('Returned')) {
                statusConditions.push('Returned');
            }

            if (statusConditions.length > 0) {
                query.orderStatus = { $in: statusConditions };
            }
        }

        // 2. Filter by Time
        if (time) {
            const timeArray = time.split(',');
            let dateConditions = [];
            const now = new Date();

            if (timeArray.includes('Last 30 days')) {
                const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
                dateConditions.push({ createdAt: { $gte: thirtyDaysAgo } });
            }

            // Check for years (2024, 2023, etc.)
            timeArray.forEach(t => {
                if (!isNaN(t) && t.length === 4) {
                    const yearStart = new Date(`${t}-01-01`);
                    const yearEnd = new Date(`${t}-12-31T23:59:59.999Z`);
                    dateConditions.push({ createdAt: { $gte: yearStart, $lte: yearEnd } });
                }
            });

            if (dateConditions.length > 0) {
                // If multiple time filters, usually it's OR logic (e.g. 2023 OR 2024)
                query.$or = dateConditions;
            }
        }

        // 3. Search by Product Name
        // This is trickier because product name is inside orderItems.
        // We need to look at 'orderItems.name'
        if (search) {
            query['orderItems.name'] = { $regex: search, $options: 'i' };
        }

        const orders = await Order.find(query).sort({ createdAt: -1 });

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
        const order = await Order.findById(req.params.id).populate('user', 'name email');

        if (!order) {
            return res.status(404).json({ message: 'Order not found with this Id' });
        }

        if (order.orderStatus === 'Delivered') {
            return res.status(400).json({ message: 'You have already delivered this order' });
        }

        if (order.orderStatus === 'Cancelled') {
            return res.status(400).json({ message: 'You cannot change the status of a cancelled order' });
        }

        order.orderStatus = req.body.status;

        if (req.body.status === 'Shipped') {
            order.shippedAt = Date.now();
        }

        if (req.body.status === 'Out For Delivery') {
            order.outForDeliveryAt = Date.now();
        }

        if (req.body.status === 'Delivered') {
            order.deliveredAt = Date.now();
        }

        await order.save({ validateBeforeSave: false });

        // Send Email on Status Change
        const message = `
            <h1>Order Status Updated</h1>
            <p>Hi ${order.user.name},</p>
            <p>Your order with ID: <strong>${order._id}</strong> status has been updated to: <strong>${req.body.status}</strong></p>
            
            <p>Thanks,<br>Frozen Delights Team</p>
        `;

        try {
            await sendEmail({
                email: order.user.email,
                subject: `Order Status Updated - ${order._id}`,
                message
            });
        } catch (error) {
            console.error("Email sending failed:", error);
        }

        res.status(200).json({
            success: true,
            order
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

// Cancel Order -- User
exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found with this Id' });
        }

        // Check if order belongs to user
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to cancel this order' });
        }

        // Check status
        if (order.orderStatus !== 'Processing') {
            return res.status(400).json({ message: 'You cannot cancel this order as it has already been shipped or delivered' });
        }

        order.orderStatus = 'Cancelled';
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully'
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
