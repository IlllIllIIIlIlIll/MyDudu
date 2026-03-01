import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';
import { generateEducationalArticle, ChildHealthContext } from '../telemetry/generate_article';

@Injectable()
export class ChildrenService {
  constructor(private prisma: PrismaService) { }

  async create(data: any) {
    // Basic validation
    if (!data.parentId || !data.fullName || !data.birthDate) {
      throw new Error("Missing required fields");
    }

    const userId = parseInt(data.parentId);
    if (isNaN(userId)) {
      throw new Error("Invalid parent ID");
    }

    // Find or create Parent profile
    // The frontend sends the User ID, but the Child table links to the Parent (Profile) ID.
    let parentProfile = await this.prisma.parent.findUnique({
      where: { parentId: userId }
    });

    if (!parentProfile) {
      // Ensure the user exists and get their details (e.g. villageId)
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error("User parent not found");
      }

      // Create new Parent profile
      parentProfile = await this.prisma.parent.create({
        data: {
          parentId: userId,
          villageId: user.villageId
        }
      });
    }

    return this.prisma.child.create({
      data: {
        parentId: parentProfile.id, // Use the Parent (Profile) ID
        fullName: data.fullName,
        birthDate: new Date(data.birthDate),
        // Map Gender: MALE -> M, FEMALE -> F
        gender: data.gender === 'MALE' ? 'M' : data.gender === 'FEMALE' ? 'F' : data.gender,
        bloodType: data.bloodType,
      },
      include: {
        parent: {
          include: {
            user: true
          }
        }
      }
    });
  }

  findAll() {
    return this.prisma.child.findMany({
      include: {
        parent: {
          include: { user: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  findOne(id: number) {
    return this.prisma.child.findUnique({
      where: { id },
      include: {
        parent: {
          include: { user: true }
        },
        sessions: {
          orderBy: { recordedAt: 'desc' },
          take: 5
        }
      }
    });
  }

  async getEducationForChild(childId: number) {
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      include: {
        sessions: {
          where: { measurementCompleted: true },
          orderBy: { recordedAt: 'desc' },
          take: 1,
          include: {
            nutritionStatuses: true
          }
        }
      }
    });

    if (!child) throw new Error("Child not found");

    const session = child.sessions[0];
    if (!session) {
      // Return a default generic article if no measurements yet
      return [{
        id: 1,
        title: "Selamat Datang di MyDudu!",
        description: "Ayo lakukan penimbangan pertama untuk melihat pertumbuhan si kecil.",
        link: "https://ayosehat.kemkes.go.id/",
        image: "posyandu_visit"
      }];
    }

    // Calculate age in months
    const birthDate = new Date(child.birthDate);
    const recordedAt = session.recordedAt ? new Date(session.recordedAt) : new Date();
    const ageMonths = (recordedAt.getFullYear() - birthDate.getFullYear()) * 12 + (recordedAt.getMonth() - birthDate.getMonth());

    // Determine primary category
    let primaryCategory = "NORMAL";
    let bbU = null, tbU = null, bbTb = null;

    if (session.nutritionStatuses.length > 0) {
      // Prioritize STUNTED, WASTED, OBESE over NORMAL
      const stunted = session.nutritionStatuses.find(ns => ns.category === 'STUNTED');
      const wasted = session.nutritionStatuses.find(ns => ns.category === 'WASTED');
      const obese = session.nutritionStatuses.find(ns => ns.category === 'OBESE');

      const primaryNs = stunted || wasted || obese || session.nutritionStatuses[0];
      primaryCategory = primaryNs.category || "NORMAL";

      const nsWithBbTb = session.nutritionStatuses.find(ns => ns.bbTb !== null);
      if (nsWithBbTb) bbTb = String(nsWithBbTb.bbTb);

      const nsWithTbU = session.nutritionStatuses.find(ns => ns.tbU !== null);
      if (nsWithTbU) tbU = String(nsWithTbU.tbU);

      const nsWithBbU = session.nutritionStatuses.find(ns => ns.bbU !== null);
      if (nsWithBbU) bbU = String(nsWithBbU.bbU);
    }

    const hashKey = `${ageMonths}mo_${primaryCategory}`;

    // 1. Check Caching Layer First
    const cached = await this.prisma.educationCache.findUnique({
      where: { hashKey }
    });

    if (cached) {
      // Inject pseudo-id for frontend react keys
      const article = cached.articleData as any;
      return [{ ...article, id: cached.id }];
    }

    // 2. Generate Payload if Cache Misses
    const contextPayload: ChildHealthContext = {
      childName: child.fullName,
      age: `${ageMonths} bulan`,
      gender: child.gender === 'M' ? 'Laki-laki' : 'Perempuan',
      clinicalStatus: {
        overall: primaryCategory,
        details: {
          weightKg: session.weight ? Number(session.weight) : null,
          heightCm: session.height ? Number(session.height) : null,
          bbU, tbU, bbTb,
          temperature: session.temperature ? Number(session.temperature) : null,
          heartRate: session.heartRate ? Number(session.heartRate) : null
        }
      },
      context: "Orang tua sedang melihat halaman ringkasan kesehatan anak setelah melakukan penimbangan di posyandu."
    };

    // 3. Call Generative AI
    try {
      const generatedJson = await generateEducationalArticle(contextPayload);

      // 4. Save to Cache
      const savedCache = await this.prisma.educationCache.create({
        data: {
          hashKey,
          articleData: generatedJson
        }
      });

      return [{ ...generatedJson, id: savedCache.id }];
    } catch (err) {
      console.error("AI Generation failed:", err);
      // Fallback response if API fails
      return [{
        id: 999,
        title: "Pantau Terus Tumbuh Kembang",
        description: "Pastikan asupan nutrisi seimbang untuk anak setiap hari.",
        link: "https://ayosehat.kemkes.go.id/",
        image: "healthy_food"
      }];
    }
  }

  update(id: number, updateChildDto: UpdateChildDto) {
    return `This action updates a #${id} child`;
  }

  remove(id: number) {
    return this.prisma.child.delete({ where: { id } });
  }
}
