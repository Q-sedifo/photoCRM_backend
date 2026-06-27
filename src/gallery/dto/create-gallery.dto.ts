import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateGalleryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  title!: string;
}
