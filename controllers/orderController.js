const Order = require('../models/Order');
const Product = require('../models/Product');

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

        res.status(201).json({
            success: true,
            order
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

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
        const orders = await Order.find({ user: req.user._id });

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
