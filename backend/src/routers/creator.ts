import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import axios from "axios";

const router = Router();
const prisma = new PrismaClient();

async function fetchAndStoreMediaData(userId: string, accessToken: string) {
    try {
        const mediaResponse = await axios.get('https://graph.instagram.com/me/media', {
            params: {
                fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',
                access_token: accessToken,
            },
        });

        const mediaItems = mediaResponse.data.data;

        await prisma.$transaction(async (prisma) => {
            for (const media of mediaItems) {
                await prisma.mediaItem.upsert({
                    where: { id: media.id },
                    update: {
                        caption: media.caption,
                        mediaType: media.media_type,
                        mediaUrl: media.media_url,
                        thumbnailUrl: media.thumbnail_url,
                        permalink: media.permalink,
                        timestamp: new Date(media.timestamp),
                        userId: userId,
                    },
                    create: {
                        id: media.id,
                        caption: media.caption,
                        mediaType: media.media_type,
                        mediaUrl: media.media_url,
                        thumbnailUrl: media.thumbnail_url,
                        permalink: media.permalink,
                        timestamp: new Date(media.timestamp),
                        userId: userId,
                    },
                });

                const insightsResponse = await axios.get(`https://graph.instagram.com/${media.id}/insights`, {
                    params: {
                        metric: 'impressions,reach,engagement,saved',
                        access_token: accessToken,
                    },
                });
                const insights = insightsResponse.data.data;

                for (const insight of insights) {
                    await prisma.insight.upsert({
                        where: { id: `${media.id}_${insight.name}` },
                        update: {
                            value: insight.values[0]?.value || 0,
                        },
                        create: {
                            id: `${media.id}_${insight.name}`,
                            metric: insight.name,
                            value: insight.values[0]?.value || 0,
                            mediaItemId: media.id,
                        },
                    });
                }
            }
        });
    } catch (error) {
        console.error('Error fetching and storing media data:', error);
    }
};
//user media data logic
router.post("/token", async (req, res) => {
    const { accessToken } = req.body;
    try {
        const profileDataResponse = await axios.get('https://graph.instagram.com/me', {
            params: {
                fields: 'id,username,account_type',
                access_token: accessToken
            }
        });

        let creator = await prisma.user.findUnique({
            where: {
                id: profileDataResponse.data.id
            }
        });
        if (!creator) {
            creator = await prisma.user.create({
                data: {
                    id: profileDataResponse.data.id,
                    name: profileDataResponse.data.displayName,
                    accessToken,
                    isBusiness: profileDataResponse.data.account_type
                },
            });
        } else {
            creator = await prisma.user.update({
                where: {
                    id: profileDataResponse.data.id
                },
                data: {
                    accessToken
                },
            });
        }
        await fetchAndStoreMediaData(profileDataResponse.data.id, accessToken);
        res.status(200).json({
            message: "Creator successfully handled",
        });
    } catch (error) {
        res.status(401).json({
            message: "Bad Access Token",
        })
    }
});
router.get("/media", async (req, res) => {
    const { userId } = req.query;
    try {
        const mediaItems = await prisma.mediaItem.findMany({
            where: {
                userId: userId?.toString(),
            },
            include: {
                insights: true,
            },
        });
        res.status(200).json(mediaItems);
    }
    catch (error) {
        console.error('Error fetching media items:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

//proposal fetching logic

router.get("/proposals/recieved", async (req, res) => {
    const { userId } = req.query;
    try {

        const recievedProposals = await prisma.proposal.findMany({
            where: {
                receiverId: userId?.toString(),
            },
            include: {
                sender: true,
            }
        })
        res.status(200).json(recievedProposals);
    } catch (error) {
        console.error('Error fetching received proposals:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.get('/proposals/sent', async (req, res) => {
    const { senderId, receiverId } = req.query;

    try {
        const existingProposal = await prisma.proposal.findFirst({
            where: {
                senderId: senderId?.toString(),
                receiverId: receiverId?.toString(),
                isAccepted: false
            }
        });

        res.status(200).json({ exists: !!existingProposal, sentProposal: existingProposal });
    } catch (error) {
        console.error('Error checking existing proposal:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//proposal crud logic

router.post("/proposals/accept", async (req, res) => {
    const { proposalId } = req.query;
    try {
        const proposal = await prisma.proposal.update({
            where: {
                id: proposalId?.toString(),
            },
            data: {
                isAccepted: true,
            },
        });
        res.status(200).json({ proposal });
    } catch (error) {
        console.error('Error sending existing proposal:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.post('/proposals/modify', async (req, res) => {
    const { proposalId, userId } = req.query;
    const { proposalMessage, equityPercentage } = req.body;

    if (!proposalId || !userId) {
        return res.status(400).json({ error: 'Proposal ID and User ID are required' });
    }

    if (equityPercentage === undefined) {
        return res.status(400).json({ error: 'Equity Percentage is required' });
    }

    if (proposalMessage === undefined) {
        return res.status(400).json({ error: 'Proposal Message is required' });
    }

    try {
        const existingProposal = await prisma.proposal.findUnique({
            where: {
                id: proposalId.toString(),
            },
        });

        if (!existingProposal || existingProposal.senderId !== userId.toString()) {
            return res.status(404).json({ error: 'Proposal not found or user is not authorized' });
        }

        const updatedProposal = await prisma.proposal.update({
            where: {
                id: proposalId.toString(),
            },
            data: {
                proposalMessage: proposalMessage.toString(),
                equityPercentage: parseFloat(equityPercentage.toString()),
            },
        });

        res.status(200).json({ proposal: updatedProposal });
    } catch (error) {
        console.error('Error modifying proposal:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.post("proposals/new", async (req, res) => {
    const { receiverId, senderId } = req.query;
    const { message, equityPercentage } = req.body;
    if (!senderId || !receiverId) {
        return res.status(400).json({ error: 'SenderId and ReceiverId are required' });
    }
    try {
        const sentproposal = await prisma.proposal.create({
            data: {
                id: [senderId, receiverId].join('$$2211'),
                proposalMessage: message.toString(),
                equityPercentage: parseFloat(equityPercentage),
                senderId: senderId?.toString(),
                receiverId: receiverId?.toString(),
                isAccepted: false,
            }
        });
        res.status(200).json({
            message: "Proposal sent successfully.",
        })
    } catch (error) {
        console.error('Error sending existing proposal:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


export default router