import { BadRequestException, PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class ParseBigIntPipe implements PipeTransform<string, bigint> {
    transform(value: string): bigint {
        if (!/^\d+$/.test(value)) {
            throw new BadRequestException(`Invalid ID "${value}" — must be a positive integer.`);
        }
        return BigInt(value);
    }
}
