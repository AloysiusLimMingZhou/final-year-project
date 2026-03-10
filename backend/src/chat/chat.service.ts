import { HttpService } from "@nestjs/axios";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { lastValueFrom } from "rxjs";
import { ChatResponseDto } from "./dto/chat-response.dto";
import { chat_messages, chat_sessions } from "@prisma/client";

@Injectable()
export class ChatService {
    constructor(
        private readonly httpService: HttpService,
        private prisma: PrismaService
    ) { }

    async loadConversationHistory(userId: string) {
        const user = await this.prisma.users.findUnique({ where: { id: BigInt(userId) } });

        if (!user) {
            throw new NotFoundException("User is not found!");
        }

        const messages = await this.prisma.chat_messages.findMany({
            where:
            {
                chat_sessions: {
                    user_id: BigInt(userId)
                }
            },

            orderBy: { created_at: 'asc' }
        });

        return messages;
    }

    async askQuestion(userId: string, question: string) {
        const user = await this.prisma.users.findUnique({ where: { id: BigInt(userId) } });

        if (!user) {
            throw new NotFoundException("User is not found!");
        }

        const recentMessages: chat_messages[] = await this.prisma.chat_messages.findMany({
            where:
            {
                chat_sessions: {
                    user_id: BigInt(userId)
                }
            },
            orderBy: { created_at: 'desc' },
            take: 5
        })

        let session = await this.prisma.chat_sessions.findFirst({
            where: {
                user_id: BigInt(userId)
            },
            orderBy: { created_at: 'desc' }
        })

        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

        if (!session || session.created_at < sixHoursAgo) {
            session = await this.prisma.chat_sessions.create({
                data: {
                    user_id: BigInt(userId)
                }
            })
        }

        const userMessagePerSession = await this.prisma.chat_messages.count({
            where:
            {
                session_id: BigInt(session.session_id)
            },
        })

        if (userMessagePerSession >= 999) {
            throw new BadRequestException("User has exceeded the maximum number of chats for this session! Please try again 6 hours later!");
        }

        const historyContext = recentMessages.reverse().map((rm) => ({
            "role": rm.role,
            "content": rm.content
        }))

        try {
            const response = await lastValueFrom(
                this.httpService.post('http://localhost:8001/chat',
                    {
                        "question": question,
                        "history": historyContext
                    }
                )
            );

            const answer: ChatResponseDto = response.data;

            await this.prisma.chat_messages.create({
                data: {
                    role: 'user',
                    content: question,
                    session_id: session.session_id
                }
            })

            await this.prisma.chat_messages.create({
                data: {
                    role: 'assistant',
                    content: answer.answer,
                    citations: answer.citation || [],
                    session_id: session.session_id,
                }
            })

            return answer;
        } catch (err) {
            console.error("AI Service is down!")
            throw new BadRequestException("Failed to get response from AI service!")
        }
    }
}