import { PrismaClient, WhoGrowthIndicator } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const wfhAggr = await prisma.whoGrowthStandard.aggregate({
        where: {
            indicator: WhoGrowthIndicator.WEIGHT_FOR_HEIGHT
        },
        _min: {
            ageDays: true,
            lengthHeightCm: true
        },
        _max: {
            ageDays: true,
            lengthHeightCm: true
        }
    });

    const wflAggr = await prisma.whoGrowthStandard.aggregate({
        where: {
            indicator: WhoGrowthIndicator.WEIGHT_FOR_LENGTH
        },
        _min: {
            ageDays: true,
            lengthHeightCm: true
        },
        _max: {
            ageDays: true,
            lengthHeightCm: true
        }
    });

    const wfhCount = await prisma.whoGrowthStandard.count({
        where: {
            indicator: WhoGrowthIndicator.WEIGHT_FOR_HEIGHT
        }
    });

    const wflCount = await prisma.whoGrowthStandard.count({
        where: {
            indicator: WhoGrowthIndicator.WEIGHT_FOR_LENGTH
        }
    });

    const result = {
        WEIGHT_FOR_HEIGHT: {
            count: wfhCount,
            minAgeDays: wfhAggr._min.ageDays,
            maxAgeDays: wfhAggr._max.ageDays,
            minLengthHeightCm: wfhAggr._min.lengthHeightCm,
            maxLengthHeightCm: wfhAggr._max.lengthHeightCm
        },
        WEIGHT_FOR_LENGTH: {
            count: wflCount,
            minAgeDays: wflAggr._min.ageDays,
            maxAgeDays: wflAggr._max.ageDays,
            minLengthHeightCm: wflAggr._min.lengthHeightCm,
            maxLengthHeightCm: wflAggr._max.lengthHeightCm
        }
    };

    fs.writeFileSync('prisma/who_ranges.json', JSON.stringify(result, null, 2));
    console.log('Results written to prisma/who_ranges.json');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
