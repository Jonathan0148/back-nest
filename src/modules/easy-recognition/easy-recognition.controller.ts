import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { EasyRecognitionService } from './easy-recognition.service';
import { ValidateEasyRecognitionDto } from './dto/validate-easy-recognition.dto';
import { JwtAuthGuard } from 'src/jwt/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EmotionsEasyRecognitionDto } from './dto/emotions-easy-recognition.dto';

@ApiBearerAuth()
@ApiTags('easy-recognition')
@UseGuards(JwtAuthGuard)
@Controller('api/easy-recognition')
export class EasyRecognitionController {
  constructor(private readonly easyRecognitionService: EasyRecognitionService) {}

  @HttpCode(200)
  @Post('validateAuthentication')
  validateAuthentication(@Body() validateEasyRecognitionDto: ValidateEasyRecognitionDto) {
    return this.easyRecognitionService.validateAuthentication(validateEasyRecognitionDto);
  }

  @HttpCode(200)
  @Post('emotionsEasyRecognition')
  emotionsEasyRecognition(@Body() emotionsEasyRecognitionDto: EmotionsEasyRecognitionDto) {
    return this.easyRecognitionService.emotionsEasyRecognition(emotionsEasyRecognitionDto);
  }
}