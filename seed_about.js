const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Content = require('./models/Content');

dotenv.config();

const seedAbout = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const aboutData = {
            type: 'about',
            title: 'About Frozen Delights',
            content: 'Frozen Delight is a premium frozen dessert brand dedicated to delivering high-quality, flavorful, and refreshing treats. Our goal is to combine taste, freshness, and innovation to create an exceptional dessert experience for our customers. With a strong focus on quality standards and customer satisfaction, Frozen Delight aims to be a trusted name in frozen desserts.',
            image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=2727&auto=format&fit=crop', // A nice ice cream image
            isActive: true,
            order: 0
        };

        // Check if exists
        const exists = await Content.findOne({ type: 'about' });
        if (exists) {
            console.log('About content already exists. Updating...');
            await Content.updateOne({ type: 'about' }, aboutData);
        } else {
            await Content.create(aboutData);
            console.log('About content created.');
        }

        console.log('Seeding Complete');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAbout();
