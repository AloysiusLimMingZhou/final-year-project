import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { CurrentUser } from "src/auth/decorators/user.decarator";
import { UserResponseDto } from "src/users/dto/UserResponse.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @UseGuards(JwtAuthGuard)
    @Post('ask')
    async createChat(@CurrentUser() user, @Body() body: { question: string }) {
        return this.chatService.askQuestion(user.id.toString(), body.question);
    }

    @UseGuards(JwtAuthGuard)
    @Get('history')
    async getChatHistory(@CurrentUser() user) {
        return this.chatService.loadConversationHistory(user.id.toString());
    }
}