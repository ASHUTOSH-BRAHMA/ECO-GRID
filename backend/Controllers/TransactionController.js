import Transaction from "../Models/Transaction.js";

// Get all transactions for the logged-in user
export const getUserTransactions = async (req, res) => {
    try {
        const userId = req.user._id;
        const transactions = await Transaction.find({ userId })
            .sort({ timestamp: -1 })
            .limit(50);

        res.status(200).json({ success: true, transactions });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Create a new transaction (and auto-create a 'sold' record for the producer if type is 'bought')
export const createTransaction = async (req, res) => {
    try {
        const userId = req.user._id;
        const { type, energyKwh, amount, listingId, listingTitle, txHash, counterparty } = req.body;

        // Save the buyer's transaction
        const transaction = new Transaction({
            userId,
            type,
            energyKwh: Number(energyKwh),
            amount: Number(amount),
            listingId,
            listingTitle,
            txHash,
            counterparty,
            status: 'completed'
        });
        await transaction.save();

        // If this is a 'bought' transaction, auto-create a 'sold' record for the listing's producer
        if (type === 'bought' && listingId) {
            try {
                const EnergyListing = (await import('../Models/EnergyListing.js')).default;
                const listing = await EnergyListing.findById(listingId).lean();
                if (listing && listing.producer) {
                    const soldTx = new Transaction({
                        userId: listing.producer,   // prosumer's userId
                        type: 'sold',
                        energyKwh: Number(energyKwh),
                        amount: Number(amount),
                        listingId,
                        listingTitle,
                        txHash,
                        counterparty: userId.toString(), // buyer's userId as counterparty
                        status: 'completed'
                    });
                    await soldTx.save();
                }
            } catch (innerErr) {
                console.warn('Could not create sold record for producer:', innerErr.message);
            }
        }

        res.status(201).json({ success: true, transaction });
    } catch (error) {
        console.error("Error creating transaction:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
