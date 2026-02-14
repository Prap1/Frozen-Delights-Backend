const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Content = require('./models/Content');

dotenv.config();

const seedPolicies = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Delete existing policy FAQs to avoid duplicates (optional, use care)
        // await Content.deleteMany({ type: 'faq', subtitle: { $in: ['Shipping', 'Returns & Refunds'] } });

        const faqs = [
            // --- SHIPPING POLICY ---
            {
                type: 'faq',
                title: 'Why does the delivery date not correspond to the delivery timeline of X-Y business days?',
                content: 'It is possible that the Seller or our delivery partners have a holiday between the day you placed your order and the date of delivery, which is based on the timelines shown on the product page. In this case, we add a day to the estimated date. Some delivery partners and Sellers do not work on Sundays and this is factored in to the delivery dates.',
                subtitle: 'Shipping',
                isActive: true,
                order: 1
            },
            {
                type: 'faq',
                title: 'What is the estimated delivery time?',
                content: 'Sellers generally procure and ship the items within the time specified on the product page. Business days exclude public holidays and Sundays.\n\nEstimated delivery time depends on the following factors:\n• The Seller offering the product\n• Product\'s availability with the Seller\n• The destination to which you want the order shipped to and location of the Seller.',
                subtitle: 'Shipping',
                isActive: true,
                order: 2
            },
            {
                type: 'faq',
                title: 'Why does the estimated delivery time vary for each seller?',
                content: 'You have probably noticed varying estimated delivery times for sellers of the product you are interested in. Delivery times are influenced by product availability, geographic location of the Seller, your shipping destination and the delivery partner\'s time-to-deliver in your location.\n\nPlease enter your default pin code on the product page (you don\'t have to enter it every single time) to know more accurate delivery times on the product page itself.',
                subtitle: 'Shipping',
                isActive: true,
                order: 3
            },
            {
                type: 'faq',
                title: 'Seller does not/cannot ship to my area. Why?',
                content: 'Please enter your pincode on the product page (you don\'t have to enter it every single time) to know whether the product can be delivered to your location.\n\nIf you haven\'t provided your pincode until the checkout stage, the pincode in your shipping address will be used to check for serviceability.\n\nNote: Whether your location can be serviced or not depends on:\n• Whether the Seller ships to your location\n• Legal restrictions, if any, in shipping particular products to your location\n• The availability of reliable courier partners in your location',
                subtitle: 'Shipping',
                isActive: true,
                order: 4
            },

            // --- RETURNS POLICY ---
            {
                type: 'faq',
                title: 'What is the Return Policy?',
                content: 'You have 30 calendar days to return an item from the date you received it. To be eligible for a return, your item must be unused and in the same condition that you received it. Your item must be in the original packaging and have the receipt or proof of purchase.',
                subtitle: 'Returns & Refunds',
                isActive: true,
                order: 1
            },
            {
                type: 'faq',
                title: 'How do Refunds work?',
                content: 'Once we receive your item, we will inspect it and notify you that we have received your returned item. We will immediately notify you on the status of your refund after inspecting the item. If your return is approved, we will initiate a refund to your credit card (or original method of payment).',
                subtitle: 'Returns & Refunds',
                isActive: true,
                order: 2
            },
            {
                type: 'faq',
                title: 'Who pays for Shipping on returns?',
                content: 'You will be responsible for paying for your own shipping costs for returning your item. Shipping costs are non-refundable. If you receive a refund, the cost of return shipping will be deducted from your refund.',
                subtitle: 'Returns & Refunds',
                isActive: true,
                order: 3
            },
            {
                type: 'faq',
                title: 'How do I contact support for returns?',
                content: 'If you have any questions on how to return your item to us, contact us at support@frozendelights.com.',
                subtitle: 'Returns & Refunds',
                isActive: true,
                order: 4
            },

            // --- CANCELLATION (User Image Requests) ---
            {
                type: 'faq',
                title: 'Can I modify/change the specification for the ordered product without cancelling it?',
                content: 'No, you cannot modify the order once placed. You will need to cancel the order and place a new one with the desired specifications.',
                subtitle: 'Cancellation related',
                isActive: true,
                order: 1
            },
            {
                type: 'faq',
                title: 'Why am I getting charged for cancellation? / What is cancellation Fee?',
                content: 'A cancellation fee may apply if you cancel the order after it has been processed or shipped to cover the logistics costs.',
                subtitle: 'Cancellation related',
                isActive: true,
                order: 2
            },
            {
                type: 'faq',
                title: 'I see the \'Cancel\' button but I can\'t click on it. Why?',
                content: 'The cancel button is disabled if the order has already been delivered or if the cancellation window has expired.',
                subtitle: 'Cancellation related',
                isActive: true,
                order: 3
            },
            {
                type: 'faq',
                title: 'How long does it take to cancel an order?',
                content: 'Cancellations are processed immediately. You will receive a confirmation email and SMS shortly.',
                subtitle: 'Cancellation related',
                isActive: true,
                order: 4
            },
            {
                type: 'faq',
                title: 'Can I reinstate a cancelled order?',
                content: 'No, a cancelled order cannot be reinstated. You will need to place a new order.',
                subtitle: 'Cancellation related',
                isActive: true,
                order: 5
            }
        ];

        for (const faq of faqs) {
            // Check if exists to avoid duplicates
            const exists = await Content.findOne({ title: faq.title });
            if (!exists) {
                await Content.create(faq);
                console.log(`Added: ${faq.title}`);
            } else {
                console.log(`Skipped: ${faq.title} (Exists)`);
            }
        }

        console.log('Seeding Complete');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedPolicies();
