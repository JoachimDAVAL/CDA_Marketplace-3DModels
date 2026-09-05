import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, avatar: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      omit: { passwordHash: true },
    });
  }

  async updateAvatar(id: string, file: Express.Multer.File) {
    const existing = await this.prisma.user.findUnique({ where: { id }, select: { avatar: true } });

    const { url } = await this.storage.upload(file.buffer, 'avatars', file.originalname, file.mimetype);

    if (existing?.avatar && existing.avatar.startsWith(this.storage.getPublicUrl())) {
      const oldKey = existing.avatar.slice(this.storage.getPublicUrl().length + 1);
      await this.storage.delete(oldKey).catch(() => {});
    }

    return this.prisma.user.update({
      where: { id },
      data: { avatar: url },
      omit: { passwordHash: true },
    });
  }

  async updatePassword(id: string, dto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });

    return { message: 'Password updated successfully' };
  }
}