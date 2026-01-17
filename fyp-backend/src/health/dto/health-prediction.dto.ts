export class HealthPredictionDto {
    task: string;
    probability: number;
    band: string;
    band_thresholds: {
        low: number;
        high: number;
    };
    model_version: string;
    disclaimer: string;
}
