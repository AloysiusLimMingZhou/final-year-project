export class HealthResponseDto {
    id: string;
    user_id: string;
    age: number;
    sex: number;
    cp: number;
    trestbps: number;
    chol: number;
    fbs: number;
    restecg: number;
    thalach: number;
    exang: number;
    oldpeak: number;
    slope: number;
    ca: number;
    thal: number;
    recorded_at: Date | null;
}