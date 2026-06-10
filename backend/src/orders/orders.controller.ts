import { Controller, Post, Get, Headers, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @UseGuards(JwtGuard)
  @Post()
  checkout(@CurrentUser() user: { id: string }) {
    return this.ordersService.checkout(user.id);
  }

  @UseGuards(JwtGuard)
  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.ordersService.findAll(user.id);
  }

  // Le webhook Stripe ne passe pas par JwtGuard : Stripe n'envoie pas de token JWT.
  // L'authenticité est vérifiée via la signature HMAC dans le service.
  // rawBody est nécessaire : constructEvent de Stripe requiert le body brut (non parsé),
  // car le hash est calculé sur les bytes exacts reçus.
  // req typé en any : RawBodyRequest<Request> cause TS1272 sous NodeNext + emitDecoratorMetadata.
  @Post('webhook')
  webhook(@Req() req: any, @Headers('stripe-signature') signature: string) {
    return this.ordersService.handleWebhook(req.rawBody, signature);
  }
}