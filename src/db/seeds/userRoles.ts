import { db } from '@/db';
import { userRoles } from '@/db/schema';

async function main() {
    const currentTimestamp = new Date().toISOString();
    
    const sampleUserRoles = [
        // Public Users (3 users)
        {
            userId: 'public_user_1',
            role: 'Public',
            permissions: {
                "read": ["current_assessment", "historical_data"],
                "export": ["csv"],
                "regions": ["all"]
            },
            organization: null,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 'public_user_2',
            role: 'Public',
            permissions: {
                "read": ["current_assessment", "historical_data"],
                "export": ["csv"],
                "regions": ["all"]
            },
            organization: null,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 'public_user_3',
            role: 'Public',
            permissions: {
                "read": ["current_assessment", "historical_data"],
                "export": ["csv"],
                "regions": ["all"]
            },
            organization: null,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        // Researchers (3 users)
        {
            userId: 'researcher_1',
            role: 'Researcher',
            permissions: {
                "read": ["current_assessment", "historical_data", "critical_units"],
                "export": ["csv", "json"],
                "query": ["basic"],
                "regions": ["all"]
            },
            organization: 'CGWB',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 'researcher_2',
            role: 'Researcher',
            permissions: {
                "read": ["current_assessment", "historical_data", "critical_units"],
                "export": ["csv", "json"],
                "query": ["basic"],
                "regions": ["all"]
            },
            organization: 'IISc Bangalore',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 'researcher_3',
            role: 'Researcher',
            permissions: {
                "read": ["current_assessment", "historical_data", "critical_units"],
                "export": ["csv", "json"],
                "query": ["basic"],
                "regions": ["all"]
            },
            organization: 'TERI',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        // Policymakers (3 users)
        {
            userId: 'policy_1',
            role: 'Policymaker',
            permissions: {
                "read": ["all"],
                "export": ["csv", "json", "excel"],
                "query": ["advanced"],
                "compare": ["regions"],
                "regions": ["all"]
            },
            organization: 'Ministry of Water Resources',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 'policy_2',
            role: 'Policymaker',
            permissions: {
                "read": ["all"],
                "export": ["csv", "json", "excel"],
                "query": ["advanced"],
                "compare": ["regions"],
                "regions": ["all"]
            },
            organization: 'Karnataka State Groundwater Board',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 'policy_3',
            role: 'Policymaker',
            permissions: {
                "read": ["all"],
                "export": ["csv", "json", "excel"],
                "query": ["advanced"],
                "compare": ["regions"],
                "regions": ["all"]
            },
            organization: 'Central Ground Water Authority',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        // Admins (3 users)
        {
            userId: 'admin_1',
            role: 'Admin',
            permissions: {
                "read": ["all"],
                "write": ["all"],
                "export": ["all"],
                "query": ["all"],
                "admin": ["users", "data"],
                "regions": ["all"]
            },
            organization: 'CGWB Headquarters',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 'admin_2',
            role: 'Admin',
            permissions: {
                "read": ["all"],
                "write": ["all"],
                "export": ["all"],
                "query": ["all"],
                "admin": ["users", "data"],
                "regions": ["all"]
            },
            organization: 'System Administrator',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            userId: 'admin_3',
            role: 'Admin',
            permissions: {
                "read": ["all"],
                "write": ["all"],
                "export": ["all"],
                "query": ["all"],
                "admin": ["users", "data"],
                "regions": ["all"]
            },
            organization: 'Data Management Team',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        }
    ];

    await db.insert(userRoles).values(sampleUserRoles);
    
    console.log('✅ User roles seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});