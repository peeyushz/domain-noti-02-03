const cron = require("node-cron");
const domainModel = require("../../models/domainModel");
const planPurchaseModel = require("../../models/planPurchaseModel");

cron.schedule("0 0 * * *", async () => {
    try {
        const domains = await planPurchaseModel.aggregate([
            {
                $match: {
                    isActive: true,
                },
            },
            {
                $lookup: {
                    from: "domains",
                    localField: "userId",
                    foreignField: "userId",
                    as: "domain",
                },
            },
            {
                $unwind: {
                    path: "$domain",
                },
            },
        ]);
        domains.forEach(async (domain) => {
            const epochTime = Math.floor(new Date().getTime() / 1000);
            if (epochTime > domain.domain.expiryDate) {
                await domainModel.findOneAndUpdate(
                    { _id: domain.domain._id },
                    { status: "Grace Period", alertTime: domain.domain.expiryDate + 7516800 }
                );
            }
        });
    } catch (error) {
        console.log(error.message);
    }
});

cron.schedule("* * * * *", async () => {
    try {
        const subscribedUsers = await planPurchaseModel.find({ isActive: true });
        subscribedUsers.forEach(async (user) => {
            const epochTime = Math.floor(new Date().getTime() / 1000);
            if (user.planExpiryTime < epochTime) {
                await planPurchaseModel.findOneAndUpdate({ _id: user._id }, { isActive: false });
            }
        });
    } catch (error) {
        console.log(error.message);
    }
});
