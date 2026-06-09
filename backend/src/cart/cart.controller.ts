import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// Toutes les routes du panier sont protégées : un visiteur non connecté
// ne peut pas avoir de panier.
@UseGuards(JwtGuard)
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: { id: string }) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  addItem(@CurrentUser() user: { id: string }, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(user.id, dto);
  }

  @Delete('items/:modelId')
  removeItem(@CurrentUser() user: { id: string }, @Param('modelId') modelId: string) {
    return this.cartService.removeItem(user.id, modelId);
  }
}