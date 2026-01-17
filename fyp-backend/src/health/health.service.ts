import { Injectable, NotFoundException } from "@nestjs/common";
import { HealthResponseDto } from "./dto/health-response.dto";
import { CreateHealthDto } from "./dto/create-health.dto";
import { health } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { UsersService } from "src/users/users.service";
import { UserResponseDto } from "src/users/dto/UserResponse.dto";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { HealthPredictionDto } from "./dto/health-prediction.dto";
import { hospital } from "./interface/hospital.interface";

@Injectable()
export class HealthService {
    constructor(
        private prisma: PrismaService,
        private usersService: UsersService,
        private httpService: HttpService
    ) { }
    private toHealthDto(health: health): HealthResponseDto {
        return {
            id: health.id.toString(),
            user_id: health.user_id.toString(),
            age: health.age,
            sex: health.sex,
            cp: health.cp,
            trestbps: health.trestbps,
            chol: health.chol,
            fbs: health.fbs,
            restecg: health.restecg,
            thalach: health.thalach,
            exang: health.exang,
            oldpeak: health.oldpeak,
            slope: health.slope,
            ca: health.ca,
            thal: health.thal,
            recorded_at: health.recorded_at ?? new Date()
        }
    }

    private healthDtoToDbInput(dto: Omit<HealthResponseDto, 'id'>) {
        const { user_id, ...data } = dto;
        return {
            ...data,
            user_id: BigInt(user_id),
        }
    }

    async findMany(user_id: string) {
        const healths = await this.prisma.health.findMany({
            skip: 0,
            take: 5,
            where: { user_id: BigInt(user_id) },
            include: { health_prediction: true },
            orderBy: { recorded_at: 'desc' },
        })

        return healths.map((health) => ({
            ...health,
            id: health.id.toString(),
            user_id: health.user_id.toString(),
            risk_score: health.health_prediction?.risk_score ?? null,
            band: health.health_prediction?.band ?? null
        }));
    }

    async createHealthRecord(user_id: string, healthRecord: CreateHealthDto): Promise<HealthResponseDto> {
        const user: UserResponseDto = await this.usersService.findOneById(user_id);
        if (!user) throw new NotFoundException('User not found!');

        const dbInput = {
            ...healthRecord,
            user_id: BigInt(user_id),
            recorded_at: healthRecord.recorded_at ?? new Date()
        };

        const newHealth: health = await this.prisma.health.create({ data: dbInput });
        return this.toHealthDto(newHealth);
    }

    async predictHealth(user_id: string, healthRecord: CreateHealthDto): Promise<any> {
        const savedHealth = await this.createHealthRecord(user_id, healthRecord);

        const response = await lastValueFrom(
            this.httpService.post('http://localhost:8002/predict/heart_disease', healthRecord)
        );
        const data: HealthPredictionDto = response.data;

        await this.prisma.health_prediction.create({
            data: {
                health_id: BigInt(savedHealth.id),
                model_version: data.model_version,
                risk_score: data.probability,
                band: data.band,
                created_at: new Date()
            }
        });

        const predictionResult = {
            ...data,
            risk_score: data.probability
        }

        return { ...savedHealth, prediction: predictionResult };
    }

    async findNearestHospital(user_id: string) {
        const user = await this.prisma.users.findUnique({
            where: { id: BigInt(user_id) }
        })

        if (!user) throw new NotFoundException('User not found!');
        if (!user.latitude || !user.longitude) return [];

        const latitude = user.latitude;
        const longitude = user.longitude;
        const radius = 5000;

        const query = `
        [out:json][timeout:30];
        (
            node["amenity"~"hospital|clinic"](around: ${radius}, ${latitude}, ${longitude});
            way["amenity"~"hospital|clinic"](around: ${radius}, ${latitude}, ${longitude});
            relation["amenity"~"hospital|clinic"](around: ${radius}, ${latitude}, ${longitude});
        );
        out center tags;
        `;

        try {
            const response = await lastValueFrom(this.httpService.post('https://overpass-api.de/api/interpreter', `data=${encodeURIComponent(query)}`));
            const elements = response.data.elements;

            const hospitals: hospital[] = elements
                .filter(e => e.tags && (e.tags.name || e.tags['name:en']))
                .map(e => {
                    const elatitude = e.lat || e.center?.lat;
                    const elongitude = e.lon || e.center?.lon;
                    return {
                        name: e.tags.name || e.tags['name:en'],
                        type: e.tags.amenity,
                        latitude: elatitude,
                        longitude: elongitude,
                        distance: this.calculateHaversineDistance(latitude, longitude, elatitude, elongitude)
                    };
                });

            return hospitals.sort((a, b) => a.distance - b.distance).slice(0, 5);
        } catch (err) {
            console.error("Overpass API Error:", err);
            return [];
        }
    }

    private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
        const toRad = (value: number) => (value * Math.PI) / 180;
        const R = 6371;

        const dLatitude = toRad(lat2 - lat1);
        const dLongitude = toRad(lon2 - lon1);

        const a =
            Math.sin(dLatitude / 2) * Math.sin(dLatitude / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLongitude / 2) * Math.sin(dLongitude / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return Number((R * c).toFixed(2));
    }
}
