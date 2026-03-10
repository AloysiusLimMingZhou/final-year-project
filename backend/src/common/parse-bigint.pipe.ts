import { BadRequestException, PipeTransform, Injectable } from '@nestjs/common';

/**
 * Safely converts a string path parameter to a BigInt.
 * Throws a 400 BadRequestException instead of crashing with a SyntaxError
 * when a non-numeric value (e.g. "abc") is passed.
 */
@Injectable()
export class ParseBigIntPipe implements PipeTransform<string, bigint> {
    transform(value: string): bigint {
        if (!/^\d+$/.test(value)) {
            throw new BadRequestException(`Invalid ID "${value}" — must be a positive integer.`);
        }
        return BigInt(value);
    }
}
