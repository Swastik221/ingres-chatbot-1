import { db } from '@/db';
import { historicalData } from '@/db/schema';

async function main() {
    const currentTimestamp = new Date().toISOString();
    const sampleHistoricalData = [];

    // Regional characteristics for realistic data generation
    const regionalData = {
        // Rajasthan regions (water stressed)
        1: { state: 'Rajasthan', rechargeMultiplier: 0.6, extractionMultiplier: 1.4, waterLevelOffset: 10, tdsBase: 1200 },
        2: { state: 'Rajasthan', rechargeMultiplier: 0.7, extractionMultiplier: 1.3, waterLevelOffset: 8, tdsBase: 1000 },
        3: { state: 'Rajasthan', rechargeMultiplier: 0.5, extractionMultiplier: 1.5, waterLevelOffset: 12, tdsBase: 1400 },
        4: { state: 'Rajasthan', rechargeMultiplier: 0.6, extractionMultiplier: 1.4, waterLevelOffset: 9, tdsBase: 1100 },
        5: { state: 'Rajasthan', rechargeMultiplier: 0.8, extractionMultiplier: 1.2, waterLevelOffset: 7, tdsBase: 900 },
        
        // Karnataka regions (moderate conditions)
        6: { state: 'Karnataka', rechargeMultiplier: 1.0, extractionMultiplier: 1.0, waterLevelOffset: 2, tdsBase: 500 },
        7: { state: 'Karnataka', rechargeMultiplier: 1.1, extractionMultiplier: 0.9, waterLevelOffset: 1, tdsBase: 400 },
        8: { state: 'Karnataka', rechargeMultiplier: 0.9, extractionMultiplier: 1.1, waterLevelOffset: 3, tdsBase: 600 },
        9: { state: 'Karnataka', rechargeMultiplier: 1.0, extractionMultiplier: 1.0, waterLevelOffset: 2, tdsBase: 450 },
        10: { state: 'Karnataka', rechargeMultiplier: 1.2, extractionMultiplier: 0.8, waterLevelOffset: 0, tdsBase: 350 },
        
        // Punjab regions (high extraction)
        11: { state: 'Punjab', rechargeMultiplier: 1.0, extractionMultiplier: 1.8, waterLevelOffset: -2, tdsBase: 700 },
        12: { state: 'Punjab', rechargeMultiplier: 0.9, extractionMultiplier: 1.9, waterLevelOffset: -1, tdsBase: 800 },
        13: { state: 'Punjab', rechargeMultiplier: 1.1, extractionMultiplier: 1.7, waterLevelOffset: -3, tdsBase: 650 },
        14: { state: 'Punjab', rechargeMultiplier: 1.0, extractionMultiplier: 1.8, waterLevelOffset: -2, tdsBase: 750 },
        15: { state: 'Punjab', rechargeMultiplier: 0.8, extractionMultiplier: 2.0, waterLevelOffset: 0, tdsBase: 850 },
        
        // Maharashtra regions (mixed patterns)
        16: { state: 'Maharashtra', rechargeMultiplier: 0.8, extractionMultiplier: 1.3, waterLevelOffset: 5, tdsBase: 800 },
        17: { state: 'Maharashtra', rechargeMultiplier: 1.2, extractionMultiplier: 0.9, waterLevelOffset: -1, tdsBase: 400 },
        18: { state: 'Maharashtra', rechargeMultiplier: 0.9, extractionMultiplier: 1.2, waterLevelOffset: 4, tdsBase: 700 },
        19: { state: 'Maharashtra', rechargeMultiplier: 1.1, extractionMultiplier: 1.0, waterLevelOffset: 1, tdsBase: 500 },
        20: { state: 'Maharashtra', rechargeMultiplier: 0.7, extractionMultiplier: 1.4, waterLevelOffset: 6, tdsBase: 900 },
        
        // Other states (varied conditions)
        21: { state: 'Gujarat', rechargeMultiplier: 0.9, extractionMultiplier: 1.2, waterLevelOffset: 3, tdsBase: 600 },
        22: { state: 'Andhra Pradesh', rechargeMultiplier: 1.0, extractionMultiplier: 1.1, waterLevelOffset: 2, tdsBase: 550 },
        23: { state: 'Tamil Nadu', rechargeMultiplier: 0.8, extractionMultiplier: 1.3, waterLevelOffset: 4, tdsBase: 750 },
        24: { state: 'Telangana', rechargeMultiplier: 1.0, extractionMultiplier: 1.0, waterLevelOffset: 2, tdsBase: 500 },
        25: { state: 'Haryana', rechargeMultiplier: 0.9, extractionMultiplier: 1.6, waterLevelOffset: 1, tdsBase: 800 },
        26: { state: 'Uttar Pradesh', rechargeMultiplier: 1.1, extractionMultiplier: 1.2, waterLevelOffset: 0, tdsBase: 600 },
        27: { state: 'Madhya Pradesh', rechargeMultiplier: 1.0, extractionMultiplier: 1.0, waterLevelOffset: 2, tdsBase: 450 },
        28: { state: 'West Bengal', rechargeMultiplier: 1.3, extractionMultiplier: 0.8, waterLevelOffset: -2, tdsBase: 300 }
    };

    // Generate data for each region
    for (let regionId = 1; regionId <= 28; regionId++) {
        const regional = regionalData[regionId];
        
        // Generate monthly data for 2019-2023 (5 years)
        for (let year = 2019; year <= 2023; year++) {
            for (let month = 1; month <= 12; month++) {
                // Year-over-year declining trend for water levels (especially Punjab)
                const yearTrend = regional.state === 'Punjab' ? (year - 2019) * 1.5 : (year - 2019) * 0.5;
                
                // Recharge data - higher during monsoon months
                let rechargeValue;
                if (month >= 6 && month <= 9) { // Monsoon months
                    rechargeValue = (18 + Math.random() * 7) * regional.rechargeMultiplier;
                } else if (month >= 3 && month <= 5) { // Summer months
                    rechargeValue = (2 + Math.random() * 3) * regional.rechargeMultiplier;
                } else { // Winter months
                    rechargeValue = (5 + Math.random() * 5) * regional.rechargeMultiplier;
                }
                
                sampleHistoricalData.push({
                    regionId: regionId,
                    year: year,
                    month: month,
                    parameterType: 'recharge',
                    value: parseFloat(rechargeValue.toFixed(2)),
                    unit: 'MCM',
                    createdAt: currentTimestamp,
                    updatedAt: currentTimestamp,
                });

                // Extraction data - higher during summer months
                let extractionValue;
                if (month >= 3 && month <= 5) { // Summer months
                    extractionValue = (15 + Math.random() * 5) * regional.extractionMultiplier;
                } else if (month >= 6 && month <= 9) { // Monsoon months
                    extractionValue = (9 + Math.random() * 3) * regional.extractionMultiplier;
                } else { // Winter months
                    extractionValue = (11 + Math.random() * 4) * regional.extractionMultiplier;
                }
                
                sampleHistoricalData.push({
                    regionId: regionId,
                    year: year,
                    month: month,
                    parameterType: 'extraction',
                    value: parseFloat(extractionValue.toFixed(2)),
                    unit: 'MCM',
                    createdAt: currentTimestamp,
                    updatedAt: currentTimestamp,
                });

                // Water level data - shallow post-monsoon, deep in summer
                let waterLevelValue;
                if (month >= 10 && month <= 11) { // Post-monsoon
                    waterLevelValue = 10 + Math.random() * 5 + regional.waterLevelOffset - yearTrend;
                } else if (month >= 4 && month <= 5) { // Peak summer
                    waterLevelValue = 20 + Math.random() * 15 + regional.waterLevelOffset + yearTrend;
                } else if (month >= 6 && month <= 9) { // Monsoon recovery
                    waterLevelValue = 12 + Math.random() * 8 + regional.waterLevelOffset - (yearTrend * 0.5);
                } else { // Winter/early summer
                    waterLevelValue = 15 + Math.random() * 10 + regional.waterLevelOffset + (yearTrend * 0.7);
                }
                
                sampleHistoricalData.push({
                    regionId: regionId,
                    year: year,
                    month: month,
                    parameterType: 'water_level',
                    value: parseFloat(Math.max(1, waterLevelValue).toFixed(2)),
                    unit: 'meters',
                    createdAt: currentTimestamp,
                    updatedAt: currentTimestamp,
                });
            }

            // Quality data - annual measurement in June
            let tdsValue = regional.tdsBase + (Math.random() * 300 - 150);
            if (regional.state === 'Rajasthan') {
                tdsValue += (year - 2019) * 20; // Increasing TDS over years
            }
            
            sampleHistoricalData.push({
                regionId: regionId,
                year: year,
                month: 6,
                parameterType: 'quality',
                value: parseFloat(Math.max(200, tdsValue).toFixed(1)),
                unit: 'mg/L',
                createdAt: currentTimestamp,
                updatedAt: currentTimestamp,
            });
        }
    }

    await db.insert(historicalData).values(sampleHistoricalData);
    
    console.log('✅ Historical groundwater data seeder completed successfully');
    console.log(`📊 Generated ${sampleHistoricalData.length} historical data records`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});