const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// XP System: 100 XP per level
const awardXP = async (userId, amount) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return null;
        
        const newXp = user.xp + amount;
        const newLevel = Math.floor(newXp / 100) + 1;
        
        await prisma.user.update({
            where: { id: userId },
            data: { xp: newXp, level: newLevel }
        });
        
        return { xp: newXp, level: newLevel, leveledUp: newLevel > user.level };
    } catch (err) {
        console.error('Error awarding XP:', err);
        return null;
    }
};

module.exports = { awardXP };
