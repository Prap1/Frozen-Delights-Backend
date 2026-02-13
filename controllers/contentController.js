const Banner = require('../models/Banner');
const Content = require('../models/Content');

// --- BANNERS ---

// Get Public Banners
exports.getBanners = async (req, res) => {
    try {
        let banners = await Banner.find({ isActive: true }).sort('order');

        // Seed initial data if empty
        if (banners.length === 0) {
            const initialBanners = [
                {
                    title: 'Creamy Chocolate Bliss',
                    subtitle: 'Indulge in our rich, velvety chocolate ice cream made with premium cocoa.',
                    image: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?q=80&w=2544&auto=format&fit=crop',
                    cta: 'Shop Chocolate',
                    link: '/products?category=chocolate',
                    order: 1
                },
                {
                    title: 'Strawberry Swirl',
                    subtitle: 'Fresh strawberries blended into perfection for a refreshing summer treat.',
                    image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?q=80&w=2574&auto=format&fit=crop',
                    cta: 'Taste Freshness',
                    link: '/products?category=fruit',
                    order: 2
                },
                {
                    title: 'Mint Chip Madness',
                    subtitle: 'Cool mint ice cream loaded with crunchy dark chocolate chips.',
                    image: 'https://images.unsplash.com/photo-1557142046-c704a3adf364?q=80&w=2574&auto=format&fit=crop',
                    cta: 'Get Cool',
                    link: '/products?category=mint',
                    order: 3
                }
            ];
            await Banner.insertMany(initialBanners);
            banners = await Banner.find({ isActive: true }).sort('order');
        }

        res.status(200).json({ success: true, banners });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin: Get All Banners
exports.getAllBanners = async (req, res) => {
    try {
        const banners = await Banner.find().sort('order');
        res.status(200).json({ success: true, banners });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin: Create Banner
exports.createBanner = async (req, res) => {
    try {
        const banner = await Banner.create(req.body);
        res.status(201).json({ success: true, banner });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin: Update Banner
exports.updateBanner = async (req, res) => {
    try {
        const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, banner });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin: Delete Banner
exports.deleteBanner = async (req, res) => {
    try {
        await Banner.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Banner deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- CONTENT (Features, Announcements) ---

// Get Public Content
exports.getContent = async (req, res) => {
    try {
        const { type } = req.query;
        const query = { isActive: true };
        if (type) query.type = type;

        const content = await Content.find(query).sort('order');
        res.status(200).json({ success: true, content });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin: Get All Content
exports.getAllContent = async (req, res) => {
    try {
        const content = await Content.find().sort('type order');
        res.status(200).json({ success: true, content });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin: Create Content
exports.createContent = async (req, res) => {
    try {
        const content = await Content.create(req.body);
        res.status(201).json({ success: true, content });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin: Update Content
exports.updateContent = async (req, res) => {
    try {
        const content = await Content.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, content });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin: Delete Content
exports.deleteContent = async (req, res) => {
    try {
        await Content.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Content deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
