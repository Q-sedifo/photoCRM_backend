import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { PrismaService } from '../prisma/prisma.service';
import slugify from 'slugify';

@Injectable()
export class GalleryService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(createGalleryDto: CreateGalleryDto) {
    let baseSlug = slugify(createGalleryDto.title, {
      lower: true,
      strict: true,
    });

    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.galleryCategory.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    return this.prisma.galleryCategory.create({
      data: {
        title: createGalleryDto.title,
        slug,
      },
    })
  }

  findAll() {
    return this.prisma.galleryCategory.findMany({
      include: {
        photos: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async findOne(slug: string) {
    const gallery = await this.prisma.galleryCategory.findUnique({
      where: { slug },
      include: { photos: true },
    });

    if (!gallery) {
      throw new NotFoundException('Gallery not found')
    }

    return gallery;
  }

  async update(id: number, dto: UpdateGalleryDto) {
    const gallery = await this.prisma.galleryCategory.findUnique({
      where: { id },
    });

    if (!gallery) {
      throw new NotFoundException('Gallery not found');
    }

    let data: any = {};

    if (dto.title) {
      let baseSlug = slugify(dto.title, {
        lower: true,
        strict: true,
      });

      let slug = baseSlug;
      let counter = 1;

      while (
        await this.prisma.galleryCategory.findFirst({
          where: {
            slug,
            NOT: { id },
          },
        })
      ) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      data.title = dto.title;
      data.slug = slug;
    }

    return this.prisma.galleryCategory.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    const gallery = await this.prisma.galleryCategory.findUnique({
      where: { id },
    });

    if (!gallery) {
      throw new NotFoundException('Gallery not found');
    }

    return this.prisma.galleryCategory.delete({
      where: { id },
    });
  }
}
