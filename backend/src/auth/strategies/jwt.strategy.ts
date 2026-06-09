import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      // Le token est attendu dans le header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // getOrThrow lève une erreur au démarrage si JWT_SECRET est absent du .env,
      // plutôt que de silencieusement accepter un secret undefined.
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // validate() est appelé après vérification de la signature JWT.
  // Sa valeur de retour est injectée dans req.user et accessible
  // via le décorateur @CurrentUser() dans tous les controllers.
  validate(payload: { sub: string; role: string }) {
    return { id: payload.sub, role: payload.role };
  }
}