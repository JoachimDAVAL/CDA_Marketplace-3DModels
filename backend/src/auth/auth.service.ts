import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existing) throw new ConflictException('Email or username already taken');

    // 10 salt rounds : bon compromis sécurité/performance (recommandation OWASP).
    // En dessous de 10, le hash est trop rapide à bruteforcer.
    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      const user = await this.prisma.user.create({
        data: { email: dto.email, username: dto.username, passwordHash },
        // omit exclut passwordHash de l'objet retourné par Prisma (feature omitApi).
        // Evite de l'exposer accidentellement dans la réponse.
        omit: { passwordHash: true },
      });
      return { user, access_token: this.signToken(user.id, user.role) };
    } catch (e) {
      if (e.code === 'P2002') throw new ConflictException('Email or username already taken');
      throw e;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { username: dto.username } });

    // Même message d'erreur que pour le mauvais mot de passe : ne pas révéler
    // si l'email existe en base (protection contre l'énumération de comptes).
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, access_token: this.signToken(user.id, user.role) };
  }

  private signToken(userId: string, role: string) {
    // sub (subject) est la convention JWT standard pour l'identifiant du porteur.
    return this.jwt.sign({ sub: userId, role });
  }
}