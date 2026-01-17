import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const getCurrentUserByContext = (context: ExecutionContext) => {
  return context.switchToHttp().getRequest().user;
}

export const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    return getCurrentUserByContext(context)
  }
)