const cron = require("node-cron");
const domainModel = require("../../models/domainModel");
const planPurchaseModel = require("../../models/planPurchaseModel");
var dotenv = require("dotenv");
const { ensContract } = require("../domain/domain");
dotenv.config();
const { sendMail } = require("../alerts/sendMail");
const { sendSMS } = require("../alerts/sendSMS");
const { sendWhatsapp } = require("../alerts/sendWhatsapp");

cron.schedule("* * * * *", async () => {
    try {
        console.log("checking");
        const epochTime = Math.floor(new Date().getTime() / 1000);
        const details = await planPurchaseModel.aggregate([
            {
                $match: {
                    isActive: true,
                },
            },
            {
                $addFields: {
                    user: {
                        $toObjectId: "$userId",
                    },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userDetails",
                },
            },
            {
                $lookup: {
                    from: "domains",
                    localField: "userId",
                    foreignField: "userId",
                    as: "domains",
                },
            },
            {
                $project: {
                    name: {
                        $arrayElemAt: ["$userDetails.name", 0],
                    },
                    email: {
                        $arrayElemAt: ["$userDetails.email", 0],
                    },
                    mobile: {
                        $arrayElemAt: ["$userDetails.phoneNo", 0],
                    },
                    whatsapp: {
                        $arrayElemAt: ["$userDetails.whatsappNo", 0],
                    },
                    countryCode: {
                        $arrayElemAt: ["$userDetails.countryCode", 0],
                    },
                    domains: 1,
                },
            },
            {
                $unwind: {
                    path: "$domains",
                },
            },
        ]);
        details.map(async (item) => {
            console.log("checking 1", details.length);
        ensContract.options.address = "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85";
        const expiryDate = await ensContract.methods.nameExpires(item.domains.labelHash).call();
        if (expiryDate > item.domains.expiryDate) {
            await domainModel.findOneAndUpdate(
                { _id: item.domains._id },
                { expiryDate: expiryDate, alertTime: expiryDate - (item.domains.expiryDate - item.domains.alertTime) }
                );
            } else {
                item.domains.alerts.forEach(async (alert) => {
                    console.log("checking 12", item.domains.domain);
                    if (alert == "sms" && epochTime === item.domains.alertTime) {
                        // sendSMS(item.countryCode+item.mobile.toString());?
                        await domainModel.findOneAndUpdate(
                            { _id: item.domains._id },
                            { status: "Complete", alertTime: item.domains.alertTime + 86400 }
                        );
                    } else if (alert == "whatsapp" && epochTime === item.domains.alertTime) {
                        // sendWhatsapp(item.countryCode+item.whatsapp.toString())
                        await domainModel.findOneAndUpdate(
                            { _id: item.domains._id },
                            { status: "Complete", alertTime: item.domains.alertTime + 86400 }
                        );
                    } else if (alert == "email" && epochTime === item.domains.alertTime) {
                        sendMail(item.email);
                        await domainModel.findOneAndUpdate(
                            { _id: item.domains._id },
                            { status: "Complete", alertTime: item.domains.alertTime + 86400 }
                        );
                    }
                });
            }
        });
    } catch (error) {
        console.log(error.message);
    }
});
