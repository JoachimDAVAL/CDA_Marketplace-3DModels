import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @UseGuards(JwtGuard)
  @Patch('me')
  update(@CurrentUser() user: { id: string }, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.id, dto);
  }

  @UseGuards(JwtGuard)
  @Patch('me/password')
  updatePassword(@CurrentUser() user: { id: string }, @Body() dto: UpdatePasswordDto) {
    return this.usersService.updatePassword(user.id, dto);
  }
}