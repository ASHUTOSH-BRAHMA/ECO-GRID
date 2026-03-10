import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import EnergyData from './Models/EnergyData.js';
import Transaction from './Models/Transaction.js';
import BlogPost from './Models/BlogPost.js';
import EnergyListing from './Models/EnergyListing.js';
import Users from './Models/Users.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log('Connected to MongoDB');
    seedDatabase();
}).catch(err => { console.error('Failed to connect', err); process.exit(1); });

const seedDatabase = async () => {
    try {
        // ── Clear old listings only (keep user accounts) ──────────────────
        await EnergyListing.deleteMany({});
        console.log('Cleared old listings');

        // ── Find or create a demo prosumer to own the listings ────────────
        let prosumer = await Users.findOne({ userType: 'prosumer' });
        if (!prosumer) {
            const hashed = await bcrypt.hash('Demo@1234', 10);
            prosumer = await Users.create({
                name: 'EcoGrid Demo',
                email: 'demo@ecogrid.com',
                password: hashed,
                userType: 'prosumer',
                onboardingCompleted: true
            });
            console.log('Created demo prosumer:', prosumer.email);
        } else {
            console.log('Using existing prosumer:', prosumer.email);
        }

        // ── Seed Energy Listings ──────────────────────────────────────────
        const listings = [
            {
                title: 'Rooftop Solar Surplus',
                location: 'Bhubaneswar, Odisha',
                capacity: '5 kWh',
                price: 18,
                category: 'Solar',
                icon: '☀️',
                availability: 'available',
                producer: prosumer._id
            },
            {
                title: 'Community Solar Farm',
                location: 'Pune, Maharashtra',
                capacity: '50 kWh',
                price: 14,
                category: 'Solar',
                icon: '🌞',
                availability: 'available',
                producer: prosumer._id
            },
            {
                title: 'Coastal Wind Energy',
                location: 'Chennai, Tamil Nadu',
                capacity: '30 kWh',
                price: 12,
                category: 'Wind',
                icon: '💨',
                availability: 'available',
                producer: prosumer._id
            },
            {
                title: 'Hill Station Wind Park',
                location: 'Shimla, Himachal Pradesh',
                capacity: '20 kWh',
                price: 10,
                category: 'Wind',
                icon: '🌬️',
                availability: 'limited',
                producer: prosumer._id
            },
            {
                title: 'River Micro Hydro',
                location: 'Dehradun, Uttarakhand',
                capacity: '15 kWh',
                price: 9,
                category: 'Hydro',
                icon: '💧',
                availability: 'available',
                producer: prosumer._id
            },
            {
                title: 'Biomass Cogeneration',
                location: 'Nagpur, Maharashtra',
                capacity: '25 kWh',
                price: 11,
                category: 'Biomass',
                icon: '🌿',
                availability: 'available',
                producer: prosumer._id
            },
            {
                title: 'Industrial Solar Array',
                location: 'Ahmedabad, Gujarat',
                capacity: '100 kWh',
                price: 13,
                category: 'Solar',
                icon: '🔆',
                availability: 'available',
                producer: prosumer._id
            },
            {
                title: 'Offshore Wind Energy',
                location: 'Mumbai, Maharashtra',
                capacity: '75 kWh',
                price: 16,
                category: 'Wind',
                icon: '🌊',
                availability: 'limited',
                producer: prosumer._id
            }
        ];

        await EnergyListing.insertMany(listings);
        console.log(`✅ Seeded ${listings.length} energy listings`);

        // ── Seed Energy Data (dashboard charts) ───────────────────────────
        await EnergyData.deleteMany({});
        const energyPoints = [];
        let time = Date.now() - 1000 * 60 * 60 * 2;
        for (let i = 0; i < 30; i++) {
            energyPoints.push({
                timestamp: time + i * 1000 * 60 * 5,
                produced: Math.floor(Math.random() * 20) + 35,
                consumed: Math.floor(Math.random() * 15) + 20,
                solar: 5, wind: 2, hydro: 0
            });
        }
        await EnergyData.insertMany(energyPoints);
        console.log('✅ Seeded energy data');

        // ── Seed Blog Posts ────────────────────────────────────────────────
        await BlogPost.deleteMany({});
        await BlogPost.insertMany([
            {
                title: 'Solar Panel Installation Experience',
                content: 'I just installed EcoGrid-compatible solar panels on my roof and the results are amazing...',
                authorName: 'SolarEnthusiast',
                authorAvatar: '🧑‍🔧',
                upvotes: 42,
                comments: [{ content: 'Great job!', authorName: 'GreenTech' }]
            },
            {
                title: 'Neighbourhood Microgrid Success Story',
                content: 'Our community of 45 homes joined together to form a microgrid...',
                authorName: 'CommunityPower',
                authorAvatar: '🏘️',
                upvotes: 135
            }
        ]);
        console.log('✅ Seeded blog posts');

        console.log('\n🌱 Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};
