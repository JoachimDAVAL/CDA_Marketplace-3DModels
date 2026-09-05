import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findFirst: jest.Mock; findUnique: jest.Mock; create: jest.Mock } };
  let jwt: { sign: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    jwt = { sign: jest.fn().mockReturnValue('signed-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // --- register ---------------------------------------------------------------

  describe('register', () => {
    const dto = { email: 'test@example.com', username: 'testuser', password: 'password123' };
    const createdUser = { id: 'uuid-1', email: dto.email, username: dto.username, role: 'USER' };

    beforeEach(() => {
      prisma.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue(createdUser);
    });

    it('cree un user et retourne access_token', async () => {
      const result = await service.register(dto);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { OR: [{ email: dto.email }, { username: dto.username }] },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: dto.email, username: dto.username, passwordHash: 'hashed-password' },
        select: { id: true, email: true, username: true, avatar: true, role: true, createdAt: true, updatedAt: true },
      });
      expect(result).toEqual({ user: createdUser, access_token: 'signed-token' });
    });

    it('leve ConflictException si email ou username deja pris', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'uuid-existing' });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  // --- login ------------------------------------------------------------------

  describe('login', () => {
    const dto = { username: 'testuser', password: 'password123' };
    const dbUser = {
      id: 'uuid-1',
      email: 'test@example.com',
      username: dto.username,
      role: 'USER',
      passwordHash: 'hashed-password',
    };

    it('retourne le user sans passwordHash et un access_token', async () => {
      prisma.user.findUnique.mockResolvedValue(dbUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: dto.username } });
      expect(bcrypt.compare).toHaveBeenCalledWith(dto.password, dbUser.passwordHash);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result).toEqual({
        user: { id: dbUser.id, email: dbUser.email, username: dbUser.username, role: dbUser.role },
        access_token: 'signed-token',
      });
    });

    it('leve UnauthorizedException si le user nexiste pas', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });

    it('leve UnauthorizedException si le mot de passe est incorrect', async () => {
      prisma.user.findUnique.mockResolvedValue(dbUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });

    it('retourne le meme message pour user inexistant et mauvais mdp (anti-enumeration)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const errMissingUser = await service.login(dto).catch((e) => e);

      prisma.user.findUnique.mockResolvedValue(dbUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const errWrongPassword = await service.login(dto).catch((e) => e);

      expect(errMissingUser.message).toBe(errWrongPassword.message);
    });
  });
});