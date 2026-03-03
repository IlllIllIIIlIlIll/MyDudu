import { OperatorChildRecord } from '../../types/operator';

// Mock data for initial development - Replace with real API call
const MOCK_CHILDREN: OperatorChildRecord[] = [
    {
        id: 101,
        parentId: 1,
        fullName: 'Budi Santoso',
        birthDate: '2022-05-15',
        gender: 'L',
        bloodType: 'O',
        parentName: 'Siti Aminah',
        lastSession: {
            id: 501,
            recordedAt: '2023-10-01T09:00:00Z',
            status: 'completed',
            weight: 12.5,
            height: 85,
            temperature: 36.6,
            nutritionCategory: 'NORMAL',
            growthAnalysis: null,
            deviceName: 'Scale-01',
            deviceUuid: 'DEV-001',
            posyanduName: 'Mawar',
            villageName: 'Sukajadi',
            districtName: 'Bandung'
        }
    },
    {
        id: 102,
        parentId: 2,
        fullName: 'Ani Lestari',
        birthDate: '2023-01-20',
        gender: 'P',
        bloodType: 'A',
        parentName: 'Rudi Hartono',
        lastSession: null
    }
];

export const MockBrokerService = {
    subscribeToQueue: (callback: (child: OperatorChildRecord) => void) => {
        // Simulate incoming data via socket
        const interval = setInterval(() => {
            const randomChild = MOCK_CHILDREN[Math.floor(Math.random() * MOCK_CHILDREN.length)];
            // Clone to avoid reference issues
            callback({ ...randomChild, id: Date.now() }); // Unique ID for queue
        }, 15000); // New kid every 15s

        return () => clearInterval(interval);
    },

    getChildList: async (): Promise<OperatorChildRecord[]> => {
        // Simulate API fetch delay
        await new Promise(resolve => setTimeout(resolve, 800));
        return MOCK_CHILDREN;
    }
};
